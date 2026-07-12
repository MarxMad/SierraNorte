-- =====================================================================
-- 06 · ROLES Y SEGURIDAD
-- Sustituye la política abierta de 05_rls.sql por permisos por rol.
--
--   admin      → todo
--   ventas     → Ventas, Paquetes, Calendario (lee finanzas, no las toca)
--   comunidad  → SOLO su comunidad: checklist, liquidación y sus gastos
--   finanzas   → Banca, Gastos, Liquidación
-- =====================================================================

-- ---------------------------------------------------------------------
-- PERFILES  (extiende auth.users)
-- ---------------------------------------------------------------------
do $$ begin
  create type rol_usuario as enum ('admin','ventas','comunidad','finanzas');
exception when duplicate_object then null; end $$;

create table if not exists perfiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  nombre       text not null,
  email        text not null,
  rol          rol_usuario not null default 'ventas',
  comunidad_id text references comunidades(id) on delete set null,
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- el rol 'comunidad' obliga a tener comunidad asignada
  constraint chk_comunidad_asignada check (rol <> 'comunidad' or comunidad_id is not null)
);
drop trigger if exists trg_perfiles_updated on perfiles;
create trigger trg_perfiles_updated before update on perfiles
  for each row execute function set_updated_at();

-- Al registrarse un usuario, se crea su perfil automáticamente.
-- El rol y la comunidad los define después un admin.
create or replace function crear_perfil_nuevo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (user_id, nombre, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'rol')::rol_usuario, 'ventas')
  )
  on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists trg_nuevo_usuario on auth.users;
create trigger trg_nuevo_usuario after insert on auth.users
  for each row execute function crear_perfil_nuevo_usuario();

-- ---------------------------------------------------------------------
-- HELPERS  (security definer: leen perfiles sin caer en recursión de RLS)
-- ---------------------------------------------------------------------
create or replace function mi_rol()
returns rol_usuario language sql stable security definer set search_path = public as $$
  select rol from perfiles where user_id = auth.uid() and activo;
$$;

create or replace function mi_comunidad()
returns text language sql stable security definer set search_path = public as $$
  select comunidad_id from perfiles where user_id = auth.uid() and activo;
$$;

create or replace function es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(mi_rol() = 'admin', false);
$$;

-- ¿puede este usuario tocar la operación de esta comunidad?
create or replace function puede_comunidad(p_comunidad text)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when mi_rol() in ('admin','ventas') then true
    when mi_rol() = 'comunidad' then mi_comunidad() = p_comunidad
    else false
  end;
$$;

-- ---------------------------------------------------------------------
-- Las vistas deben respetar RLS (por defecto corren como su dueño y
-- lo saltarían). Esto es CRÍTICO para que 'comunidad' no vea de más.
-- ---------------------------------------------------------------------
do $$
declare v text;
begin
  foreach v in array array[
    'v_paquete_pax','v_reservas_saldo','v_reservas','v_paquetes',
    'v_liquidacion_conceptos','v_liquidacion_programada','v_liquidacion_por_venta',
    'v_liquidacion_por_comunidad','v_banca_pagos','v_banca_kpis','v_resumen_financiero',
    'v_gastos_por_comunidad','v_rentabilidad_paquetes','v_checklist_comunidad',
    'v_checklist_paquete','v_operacion_comunidad'
  ] loop
    execute format('alter view %I set (security_invoker = on)', v);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Fuera la política abierta de 05_rls.sql
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'comunidades','guias','paquetes','paquete_comunidades','itinerario_dias',
    'itinerario_items','comedores','servicios','reservas','pagos','gastos',
    'checklist_general','checklist_comunidad','checklist_plantilla','liquidacion_estado'
  ] loop
    execute format('drop policy if exists equipo_todo on %I', t);
  end loop;
end $$;

alter table perfiles enable row level security;

-- ---------------------------------------------------------------------
-- PERFILES
-- ---------------------------------------------------------------------
drop policy if exists perfil_propio_lee on perfiles;
create policy perfil_propio_lee on perfiles
  for select to authenticated
  using (user_id = auth.uid() or es_admin());

drop policy if exists perfil_admin_escribe on perfiles;
create policy perfil_admin_escribe on perfiles
  for all to authenticated
  using (es_admin()) with check (es_admin());

-- ---------------------------------------------------------------------
-- CATÁLOGO — todos leen; sólo admin y ventas escriben
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'comunidades','guias','paquetes','paquete_comunidades','itinerario_dias',
    'itinerario_items','comedores','servicios','checklist_plantilla'
  ] loop
    execute format('drop policy if exists %I_lee on %I', t, t);
    execute format('create policy %I_lee on %I for select to authenticated using (true)', t, t);

    execute format('drop policy if exists %I_escribe on %I', t, t);
    execute format($f$
      create policy %I_escribe on %I for all to authenticated
        using (mi_rol() in ('admin','ventas'))
        with check (mi_rol() in ('admin','ventas'))
    $f$, t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- RESERVAS
--   admin/ventas   → todo
--   finanzas       → lectura (necesita el precio para cobrar)
--   comunidad      → lectura SÓLO de las salidas que pasan por su pueblo
--                    (necesita la lista de pasajeros que va a recibir)
-- ---------------------------------------------------------------------
drop policy if exists reservas_lee on reservas;
create policy reservas_lee on reservas
  for select to authenticated
  using (
    mi_rol() in ('admin','ventas','finanzas')
    or (
      mi_rol() = 'comunidad'
      and exists (
        select 1 from paquete_comunidades pc
        where pc.paquete_id = reservas.paquete_id
          and pc.comunidad_id = mi_comunidad()
      )
    )
  );

drop policy if exists reservas_escribe on reservas;
create policy reservas_escribe on reservas
  for all to authenticated
  using (mi_rol() in ('admin','ventas'))
  with check (mi_rol() in ('admin','ventas'));

-- ---------------------------------------------------------------------
-- PAGOS — sólo admin y finanzas. Ventas puede leer para ver el % pagado.
-- ---------------------------------------------------------------------
drop policy if exists pagos_lee on pagos;
create policy pagos_lee on pagos
  for select to authenticated
  using (mi_rol() in ('admin','finanzas','ventas'));

drop policy if exists pagos_escribe on pagos;
create policy pagos_escribe on pagos
  for all to authenticated
  using (mi_rol() in ('admin','finanzas'))
  with check (mi_rol() in ('admin','finanzas'));

-- ---------------------------------------------------------------------
-- GASTOS
--   admin/finanzas → todo
--   comunidad      → sólo los gastos de SU comunidad (los captura y los ve)
--   ventas         → lectura
-- ---------------------------------------------------------------------
drop policy if exists gastos_lee on gastos;
create policy gastos_lee on gastos
  for select to authenticated
  using (
    mi_rol() in ('admin','finanzas','ventas')
    or (mi_rol() = 'comunidad' and comunidad_id = mi_comunidad())
  );

drop policy if exists gastos_escribe on gastos;
create policy gastos_escribe on gastos
  for all to authenticated
  using (
    mi_rol() in ('admin','finanzas')
    or (mi_rol() = 'comunidad' and comunidad_id = mi_comunidad())
  )
  with check (
    mi_rol() in ('admin','finanzas')
    or (mi_rol() = 'comunidad' and comunidad_id = mi_comunidad())
  );

-- ---------------------------------------------------------------------
-- CHECKLIST
--   general   → admin y ventas (es del tour completo)
--   comunidad → cada quien confirma lo de SU pueblo; admin/ventas todo
-- ---------------------------------------------------------------------
drop policy if exists chkgen_lee on checklist_general;
create policy chkgen_lee on checklist_general
  for select to authenticated using (true);

drop policy if exists chkgen_escribe on checklist_general;
create policy chkgen_escribe on checklist_general
  for all to authenticated
  using (mi_rol() in ('admin','ventas'))
  with check (mi_rol() in ('admin','ventas'));

drop policy if exists chkcom_lee on checklist_comunidad;
create policy chkcom_lee on checklist_comunidad
  for select to authenticated using (true);

drop policy if exists chkcom_escribe on checklist_comunidad;
create policy chkcom_escribe on checklist_comunidad
  for all to authenticated
  using (puede_comunidad(comunidad_id))
  with check (puede_comunidad(comunidad_id));

-- ---------------------------------------------------------------------
-- LIQUIDACIÓN — todos la leen; sólo admin y finanzas marcan pagado
-- ---------------------------------------------------------------------
drop policy if exists liq_lee on liquidacion_estado;
create policy liq_lee on liquidacion_estado
  for select to authenticated using (true);

drop policy if exists liq_escribe on liquidacion_estado;
create policy liq_escribe on liquidacion_estado
  for all to authenticated
  using (mi_rol() in ('admin','finanzas'))
  with check (mi_rol() in ('admin','finanzas'));

-- marcar_liquidado corre con los permisos del que llama (respeta RLS)
alter function marcar_liquidado(text, text, boolean, numeric) security invoker;

-- ---------------------------------------------------------------------
-- Cómo nombrar al primer admin
-- ---------------------------------------------------------------------
-- 1) Crea el usuario desde la app (/login → Crear cuenta) o en
--    Supabase → Authentication → Users → Add user.
-- 2) Luego corre aquí:
--
--    update perfiles set rol = 'admin' where email = 'tu-correo@ejemplo.com';
--
-- 3) Para un coordinador de comunidad:
--
--    update perfiles
--       set rol = 'comunidad', comunidad_id = 'cuajimoloyas'
--     where email = 'coordinador@ejemplo.com';
