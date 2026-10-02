-- ---------------------------------------------------------------------
-- El apartado desde la web baja de 72 h a 8 h.
--
-- La ventana de 72 horas dejaba la fecha bloqueada tres días esperando un
-- anticipo que muchas veces no llegaba. Con 8 horas el viajero alcanza a
-- hacer la transferencia el mismo día y, si no la hace, los lugares
-- vuelven a quedar libres para otro.
--
-- Sólo cambia el valor por omisión: el cuerpo de las funciones es idéntico
-- al de 21_plan_producto.sql. Las reservas ya apartadas conservan el
-- vencimiento con que se crearon — esto aplica de aquí en adelante.
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
  p_horas_hold          int default 8
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

-- Compatibilidad: solicitar_reserva también aparta con 8 h.
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
    p_ninos, p_num_ninos, p_fecha, p_notas, null, 8
  );
  return v->>'codigo';
end $$;
