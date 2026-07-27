-- =====================================================================
-- 20 · PLAN DE PRODUCTO
-- Apartado con hold, micrositios (origen), ventas CRM, leads, expediente,
-- cupos, importación de precios, transportes.
-- =====================================================================

-- Requiere 20_enum_apartado.sql aplicada antes.

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
do $$ begin
  create type fuente_reserva as enum (
    'web_global', 'web_micrositio', 'manual', 'lead'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_lead as enum (
    'nuevo', 'contactado', 'calificado', 'convertido', 'perdido'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- CONFIGURACIÓN DE CUPO (por paquete; null = sin límite de personas)
-- ---------------------------------------------------------------------
alter table paquetes
  add column if not exists cupo_personas_salida int check (cupo_personas_salida is null or cupo_personas_salida > 0);

comment on column paquetes.cupo_personas_salida is
  'Máximo de personas (pax) por fecha de salida. Null = sin tope.';

-- ---------------------------------------------------------------------
-- RESERVAS — CRM y apartado
-- ---------------------------------------------------------------------
alter table reservas
  add column if not exists apartado_expira_at timestamptz,
  add column if not exists origen_comunidad_id text references comunidades(id) on delete set null,
  add column if not exists agente_id uuid references perfiles(user_id) on delete set null,
  add column if not exists nacionalidad text,
  add column if not exists fuente fuente_reserva not null default 'manual';

create index if not exists idx_reservas_apartado_expira on reservas(apartado_expira_at)
  where status = 'Apartado';

-- ---------------------------------------------------------------------
-- LEADS
-- ---------------------------------------------------------------------
create table if not exists leads (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  email         text,
  telefono      text,
  paquete_id    text references paquetes(id) on delete set null,
  origen_comunidad_id text references comunidades(id) on delete set null,
  agente_id     uuid references perfiles(user_id) on delete set null,
  estado        estado_lead not null default 'nuevo',
  motivo_perdida text,
  notas         text,
  reserva_id    uuid references reservas(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
drop trigger if exists trg_leads_updated on leads;
create trigger trg_leads_updated before update on leads
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- EXPEDIENTE DE VENTA (adjuntos por reserva)
-- ---------------------------------------------------------------------
create table if not exists reserva_adjuntos (
  id          uuid primary key default gen_random_uuid(),
  reserva_id  uuid not null references reservas(id) on delete cascade,
  nombre      text not null,
  storage_path text not null,
  mime_type   text,
  subido_por  uuid references perfiles(user_id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_reserva_adjuntos_reserva on reserva_adjuntos(reserva_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expedientes',
  'expedientes',
  false,
  15728640,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists expedientes_lee on storage.objects;
create policy expedientes_lee on storage.objects
  for select to authenticated using (bucket_id = 'expedientes');

drop policy if exists expedientes_sube on storage.objects;
create policy expedientes_sube on storage.objects
  for insert to authenticated
  with check (bucket_id = 'expedientes' and mi_rol() in ('admin', 'ventas', 'finanzas'));

drop policy if exists expedientes_borra on storage.objects;
create policy expedientes_borra on storage.objects
  for delete to authenticated
  using (bucket_id = 'expedientes' and mi_rol() in ('admin', 'ventas', 'finanzas'));

-- ---------------------------------------------------------------------
-- CUPO OCUPADO para una salida
-- ---------------------------------------------------------------------
create or replace function pax_ocupado_salida(p_paquete_id text, p_fecha date)
returns int language sql stable as $$
  select coalesce(sum(r.personas), 0)::int
    from reservas r
   where r.paquete_id = p_paquete_id
     and r.fecha_inicio = p_fecha
     and r.status in ('Apartado', 'Planeación', 'Confirmado', 'En Curso');
$$;

create or replace function cupo_disponible(p_paquete_id text, p_fecha date, p_personas int)
returns boolean language plpgsql stable as $$
declare
  v_cupo int;
  v_ocupado int;
begin
  if p_fecha is null then
    return true;
  end if;

  select cupo_personas_salida into v_cupo from paquetes where id = p_paquete_id;
  if v_cupo is null then
    return true;
  end if;

  v_ocupado := pax_ocupado_salida(p_paquete_id, p_fecha);
  return (v_ocupado + p_personas) <= v_cupo;
end $$;

-- ---------------------------------------------------------------------
-- APARTAR DESDE LA WEB (hold 72 h por defecto)
-- ---------------------------------------------------------------------
create or replace function apartar_reserva(
  p_nombre              text,
  p_email               text,
  p_telefono            text,
  p_paquete_id          text,
  p_personas            int,
  p_ninos               boolean default false,
  p_num_ninos           int default 0,
  p_fecha               date default null,
  p_notas               text default null,
  p_origen_comunidad_id text default null,
  p_horas_hold          int default 72
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_precio  numeric;
  v_dias    int;
  v_fin     date;
  v_codigo  text;
  v_id      uuid;
  v_expira  timestamptz;
  v_fuente  fuente_reserva;
begin
  if coalesce(trim(p_nombre), '') = '' then
    raise exception 'Falta el nombre';
  end if;
  if coalesce(trim(p_email), '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'El correo no es válido';
  end if;
  if p_personas is null or p_personas < 1 or p_personas > 30 then
    raise exception 'El número de personas debe estar entre 1 y 30';
  end if;
  if p_ninos and (p_num_ninos < 1 or p_num_ninos > p_personas) then
    raise exception 'Los niños no pueden exceder el total de personas';
  end if;
  if p_fecha is null then
    raise exception 'Selecciona la fecha de salida para apartar';
  end if;

  select precio,
         (select count(*) from itinerario_dias d where d.paquete_id = p.id)
    into v_precio, v_dias
    from paquetes p
   where p.id = p_paquete_id and p.activo;

  if not found then
    raise exception 'El paquete no existe';
  end if;

  if not cupo_disponible(p_paquete_id, p_fecha, p_personas) then
    raise exception 'No hay cupo para esa fecha';
  end if;

  v_fin := case when v_dias > 1 then p_fecha + (v_dias - 1) else p_fecha end;
  v_expira := now() + make_interval(hours => greatest(p_horas_hold, 1));
  v_fuente := case
    when p_origen_comunidad_id is not null then 'web_micrositio'::fuente_reserva
    else 'web_global'::fuente_reserva
  end;

  insert into reservas (
    codigo, nombre, email, telefono, paquete_id,
    personas, ninos, num_ninos,
    fecha_inicio, fecha_fin, precio,
    metodo_pago, status, notas,
    apartado_expira_at, origen_comunidad_id, fuente
  ) values (
    null,
    trim(p_nombre), lower(trim(p_email)), nullif(trim(p_telefono), ''), p_paquete_id,
    p_personas, coalesce(p_ninos, false), case when p_ninos then p_num_ninos else 0 end,
    p_fecha, v_fin, coalesce(v_precio, 0) * p_personas,
    'Efectivo',
    'Apartado',
    coalesce(nullif(trim(p_notas), ''), '') || ' [Apartado desde la web]',
    v_expira,
    nullif(trim(p_origen_comunidad_id), ''),
    v_fuente
  )
  returning id, codigo into v_id, v_codigo;

  return jsonb_build_object(
    'codigo', v_codigo,
    'expira_at', v_expira,
    'reserva_id', v_id
  );
end $$;

revoke all on function apartar_reserva(text, text, text, text, int, boolean, int, date, text, text, int) from public;
grant execute on function apartar_reserva(text, text, text, text, int, boolean, int, date, text, text, int) to anon, authenticated;

-- Mantener compatibilidad: solicitar_reserva ahora aparta con hold
create or replace function solicitar_reserva(
  p_nombre     text,
  p_email      text,
  p_telefono   text,
  p_paquete_id text,
  p_personas   int,
  p_ninos      boolean default false,
  p_num_ninos  int default 0,
  p_fecha      date default null,
  p_notas      text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  v := apartar_reserva(
    p_nombre, p_email, p_telefono, p_paquete_id, p_personas,
    p_ninos, p_num_ninos, p_fecha, p_notas, null, 72
  );
  return v->>'codigo';
end $$;

-- ---------------------------------------------------------------------
-- Liberar apartados vencidos (cron)
-- ---------------------------------------------------------------------
create or replace function liberar_apartados_vencidos()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n int;
begin
  with liberadas as (
    update reservas
       set status = 'Planeación',
           apartado_expira_at = null,
           notas = coalesce(notas, '') || ' [Apartado vencido — liberado automáticamente]'
     where status = 'Apartado'
       and apartado_expira_at is not null
       and apartado_expira_at < now()
     returning id
  )
  select count(*) into v_n from liberadas;

  return v_n;
end $$;

revoke all on function liberar_apartados_vencidos() from public;
grant execute on function liberar_apartados_vencidos() to authenticated;

-- Al confirmar un pago, si la reserva estaba Apartada pasa a Confirmado
create or replace function pagos_confirma_apartado()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'Confirmado' and (old.status is distinct from 'Confirmado') then
    update reservas
       set status = 'Confirmado',
           apartado_expira_at = null
     where id = new.reserva_id
       and status = 'Apartado';
  end if;
  return new;
end $$;

drop trigger if exists trg_pagos_confirma_apartado on pagos;
create trigger trg_pagos_confirma_apartado after update of status on pagos
  for each row execute function pagos_confirma_apartado();

-- ---------------------------------------------------------------------
-- Importación masiva de precios de venta (admin / ventas)
-- ---------------------------------------------------------------------
create or replace function importar_precios_paquetes(p_filas jsonb)
returns int
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row jsonb;
  v_n int := 0;
begin
  if mi_rol() not in ('admin', 'ventas') then
    raise exception 'Tu rol no puede importar precios';
  end if;

  for v_row in select * from jsonb_array_elements(p_filas) loop
    update paquetes
       set precio = (v_row->>'precio')::numeric
     where id = v_row->>'id';
    if found then
      v_n := v_n + 1;
    end if;
  end loop;

  return v_n;
end $$;

grant execute on function importar_precios_paquetes(jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- Convertir lead → reserva en Planeación
-- ---------------------------------------------------------------------
create or replace function convertir_lead_a_reserva(p_lead_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead leads%rowtype;
  v_id uuid;
begin
  if mi_rol() not in ('admin', 'ventas') then
    raise exception 'Tu rol no puede convertir leads';
  end if;

  select * into v_lead from leads where id = p_lead_id for update;
  if not found then
    raise exception 'Lead no encontrado';
  end if;

  insert into reservas (
    codigo, nombre, email, telefono, paquete_id, personas,
    precio, metodo_pago, status, notas,
    origen_comunidad_id, agente_id, fuente
  ) values (
    null,
    v_lead.nombre,
    v_lead.email,
    v_lead.telefono,
    v_lead.paquete_id,
    1,
    coalesce((select precio from paquetes where id = v_lead.paquete_id), 0),
    'Efectivo',
    'Planeación',
    coalesce(v_lead.notas, ''),
    v_lead.origen_comunidad_id,
    v_lead.agente_id,
    'lead'
  )
  returning id into v_id;

  update leads
     set estado = 'convertido',
         reserva_id = v_id
   where id = p_lead_id;

  return v_id;
end $$;

grant execute on function convertir_lead_a_reserva(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- STATUS DERIVADO — incluir Apartado
-- ---------------------------------------------------------------------
create or replace function orden_status(s status_operativo)
returns int language sql immutable as $$
  select case s
    when 'Apartado'   then 0
    when 'Planeación' then 1
    when 'Confirmado' then 2
    when 'En Curso'   then 3
    when 'Finalizado' then 4
  end;
$$;

-- ---------------------------------------------------------------------
-- VISTA v_reservas ampliada
-- ---------------------------------------------------------------------
drop view if exists v_reservas;
create view v_reservas as
select
  r.id, r.codigo, r.nombre, r.email, r.telefono,
  r.paquete_id, p.nombre as paquete, p.duracion,
  r.personas, r.ninos, r.num_ninos,
  r.fecha_inicio, r.fecha_fin,
  r.precio,
  r.metodo_pago, r.plataforma,
  (select array_agg(distinct pg.metodo_pago::text)
     from pagos pg where pg.reserva_id = r.id)                       as metodos,
  (select count(distinct pg.metodo_pago) > 1
     from pagos pg where pg.reserva_id = r.id)                       as mixto,
  r.guia_id, g.nombre as guia,
  r.transporte,
  r.status, r.notas,
  r.apartado_expira_at,
  r.origen_comunidad_id,
  oc.nombre as origen_comunidad,
  r.agente_id,
  ap.nombre as agente,
  r.nacionalidad,
  r.fuente::text as fuente,
  s.pagado, s.saldo, s.pagado_pct,
  (select array_agg(c.nombre order by pc.orden)
     from paquete_comunidades pc
     join comunidades c on c.id = pc.comunidad_id
    where pc.paquete_id = p.id)                                      as comunidades,
  r.created_at, r.updated_at
from reservas r
left join paquetes p       on p.id = r.paquete_id
left join guias g          on g.id = r.guia_id
left join v_reservas_saldo s on s.reserva_id = r.id
left join comunidades oc   on oc.id = r.origen_comunidad_id
left join perfiles ap      on ap.user_id = r.agente_id;

alter view v_reservas set (security_invoker = on);

-- ---------------------------------------------------------------------
-- Transportes — salidas con transporte asignado
-- ---------------------------------------------------------------------
create or replace view v_transportes_salidas as
select
  r.id as reserva_id,
  r.codigo,
  r.nombre as cliente,
  r.paquete_id,
  p.nombre as paquete,
  r.fecha_inicio,
  r.fecha_fin,
  r.personas as pax,
  r.status,
  coalesce(r.transporte, p.transporte_tipo) as transporte,
  p.transporte_proveedor,
  p.transporte_ruta,
  p.transporte_monto
from reservas r
join paquetes p on p.id = r.paquete_id
where r.status in ('Apartado', 'Planeación', 'Confirmado', 'En Curso')
  and (r.transporte is not null or p.transporte_monto > 0 or p.transporte_proveedor is not null);

alter view v_transportes_salidas set (security_invoker = on);

-- Cobros por comunidad / mes (reporte)
create or replace view v_cobros_por_comunidad_mes as
select
  date_trunc('month', pg.confirmado_en)::date as mes,
  pc.comunidad_id,
  c.nombre as comunidad,
  sum(pg.monto) as monto,
  count(distinct pg.reserva_id) as reservas
from pagos pg
join reservas r on r.id = pg.reserva_id
join paquete_comunidades pc on pc.paquete_id = r.paquete_id and pc.orden = 1
join comunidades c on c.id = pc.comunidad_id
where pg.status = 'Confirmado'
  and pg.metodo_pago = 'Pago en comunidad'
group by 1, 2, 3;

alter view v_cobros_por_comunidad_mes set (security_invoker = on);

-- ---------------------------------------------------------------------
-- guardar_reserva_con_reparto — campos CRM
-- ---------------------------------------------------------------------
create or replace function guardar_reserva_con_reparto(
  p_reserva jsonb,
  p_reparto jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id     uuid := nullif(p_reserva->>'id', '')::uuid;
  v_linea  jsonb;
  v_suma   numeric := 0;
  v_precio numeric := coalesce((p_reserva->>'precio')::numeric, 0);
begin
  if mi_rol() not in ('admin', 'ventas') then
    raise exception 'Tu rol no tiene permiso para crear o editar reservas';
  end if;

  if p_reparto is not null and jsonb_array_length(p_reparto) > 0 then
    select coalesce(sum((x->>'monto')::numeric), 0) into v_suma
      from jsonb_array_elements(p_reparto) x;
    if round(v_suma, 2) <> round(v_precio, 2) then
      raise exception 'El reparto suma % y el precio es %: tienen que cuadrar', v_suma, v_precio;
    end if;
  end if;

  if v_id is null then
    insert into reservas (
      codigo, nombre, email, telefono, paquete_id, personas, ninos, num_ninos,
      fecha_inicio, fecha_fin, precio, metodo_pago, plataforma,
      guia_id, transporte, status, notas,
      apartado_expira_at, origen_comunidad_id, agente_id, nacionalidad, fuente
    ) values (
      nullif(p_reserva->>'codigo', ''),
      p_reserva->>'nombre',
      nullif(p_reserva->>'email', ''),
      nullif(p_reserva->>'telefono', ''),
      nullif(p_reserva->>'paquete_id', ''),
      coalesce((p_reserva->>'personas')::int, 1),
      coalesce((p_reserva->>'ninos')::boolean, false),
      coalesce((p_reserva->>'num_ninos')::int, 0),
      nullif(p_reserva->>'fecha_inicio', '')::date,
      nullif(p_reserva->>'fecha_fin', '')::date,
      v_precio,
      (p_reserva->>'metodo_pago')::metodo_pago,
      nullif(p_reserva->>'plataforma', '')::plataforma_pago,
      nullif(p_reserva->>'guia_id', '')::uuid,
      nullif(p_reserva->>'transporte', ''),
      coalesce((p_reserva->>'status')::status_operativo, 'Planeación'),
      nullif(p_reserva->>'notas', ''),
      nullif(p_reserva->>'apartado_expira_at', '')::timestamptz,
      nullif(p_reserva->>'origen_comunidad_id', ''),
      nullif(p_reserva->>'agente_id', '')::uuid,
      nullif(p_reserva->>'nacionalidad', ''),
      coalesce((p_reserva->>'fuente')::fuente_reserva, 'manual')
    )
    returning id into v_id;
  else
    update reservas set
      nombre       = p_reserva->>'nombre',
      email        = nullif(p_reserva->>'email', ''),
      telefono     = nullif(p_reserva->>'telefono', ''),
      paquete_id   = nullif(p_reserva->>'paquete_id', ''),
      personas     = coalesce((p_reserva->>'personas')::int, 1),
      ninos        = coalesce((p_reserva->>'ninos')::boolean, false),
      num_ninos    = coalesce((p_reserva->>'num_ninos')::int, 0),
      fecha_inicio = nullif(p_reserva->>'fecha_inicio', '')::date,
      fecha_fin    = nullif(p_reserva->>'fecha_fin', '')::date,
      precio       = v_precio,
      metodo_pago  = (p_reserva->>'metodo_pago')::metodo_pago,
      plataforma   = nullif(p_reserva->>'plataforma', '')::plataforma_pago,
      guia_id      = nullif(p_reserva->>'guia_id', '')::uuid,
      transporte   = nullif(p_reserva->>'transporte', ''),
      status       = coalesce((p_reserva->>'status')::status_operativo, 'Planeación'),
      notas        = nullif(p_reserva->>'notas', ''),
      apartado_expira_at = nullif(p_reserva->>'apartado_expira_at', '')::timestamptz,
      origen_comunidad_id = nullif(p_reserva->>'origen_comunidad_id', ''),
      agente_id    = nullif(p_reserva->>'agente_id', '')::uuid,
      nacionalidad = nullif(p_reserva->>'nacionalidad', ''),
      fuente       = coalesce((p_reserva->>'fuente')::fuente_reserva, fuente)
    where id = v_id;
  end if;

  if p_reparto is not null and jsonb_array_length(p_reparto) > 0 then
    delete from pagos
     where reserva_id = v_id and automatico and status = 'Pendiente';

    for v_linea in select * from jsonb_array_elements(p_reparto) loop
      if (v_linea->>'monto')::numeric > 0 then
        insert into pagos (reserva_id, monto, fecha, metodo_pago, plataforma,
                           status, automatico, notas)
        values (
          v_id,
          (v_linea->>'monto')::numeric,
          current_date,
          (v_linea->>'metodo_pago')::metodo_pago,
          nullif(v_linea->>'plataforma', '')::plataforma_pago,
          'Pendiente',
          true,
          'Parte del pago dividido'
        );
      end if;
    end loop;
  end if;

  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- RLS leads y adjuntos
-- ---------------------------------------------------------------------
alter table leads enable row level security;
alter table reserva_adjuntos enable row level security;

drop policy if exists leads_lee on leads;
create policy leads_lee on leads for select to authenticated using (true);

drop policy if exists leads_escribe on leads;
create policy leads_escribe on leads for all to authenticated
  using (mi_rol() in ('admin', 'ventas'))
  with check (mi_rol() in ('admin', 'ventas'));

drop policy if exists adjuntos_lee on reserva_adjuntos;
create policy adjuntos_lee on reserva_adjuntos for select to authenticated using (true);

drop policy if exists adjuntos_escribe on reserva_adjuntos;
create policy adjuntos_escribe on reserva_adjuntos for all to authenticated
  using (mi_rol() in ('admin', 'ventas', 'finanzas'))
  with check (mi_rol() in ('admin', 'ventas', 'finanzas'));

-- Disponibilidad pública (solo lectura de cupo restante)
create or replace function cupo_restante_publico(p_paquete_id text, p_fecha date)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_fecha is null then null
    when (select cupo_personas_salida from paquetes where id = p_paquete_id) is null then null
    else greatest(
      0,
      (select cupo_personas_salida from paquetes where id = p_paquete_id)
        - pax_ocupado_salida(p_paquete_id, p_fecha)
    )
  end;
$$;

grant execute on function cupo_restante_publico(text, date) to anon, authenticated;

-- Formulario público "solicitar información" → lead nuevo
drop policy if exists leads_insert_anon on leads;
create policy leads_insert_anon on leads
  for insert to anon
  with check (estado = 'nuevo');

grant insert on leads to anon;
