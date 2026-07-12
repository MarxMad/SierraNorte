-- =====================================================================
-- 09 · SOLICITUDES DE RESERVA DESDE LA WEB
--
-- El visitante NO tiene acceso a la tabla `reservas`: no puede leerla,
-- ni editarla, ni borrar nada. Sólo puede llamar a esta función, que
-- inserta una solicitud con valores controlados por la base:
--
--     status  = 'Planeación'   (nunca 'Confirmado')
--     precio  = el del catálogo × personas   (no el que mande el navegador)
--     código  = generado por el trigger
--
-- Así el formulario público no puede inventar precios ni confirmar nada.
-- =====================================================================

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
returns text                       -- devuelve el código de la reserva
language plpgsql
security definer                   -- corre con permisos elevados, controlados aquí
set search_path = public
as $$
declare
  v_precio  numeric;
  v_dias    int;
  v_fin     date;
  v_codigo  text;
begin
  -- Validaciones
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

  -- El precio SIEMPRE sale del catálogo, nunca del navegador
  select precio,
         (select count(*) from itinerario_dias d where d.paquete_id = p.id)
    into v_precio, v_dias
    from paquetes p
   where p.id = p_paquete_id and p.activo;

  if not found then
    raise exception 'El paquete no existe';
  end if;

  -- Fecha de fin estimada según los días del itinerario
  v_fin := case
             when p_fecha is null then null
             when v_dias > 1 then p_fecha + (v_dias - 1)
             else p_fecha
           end;

  insert into reservas (
    codigo, nombre, email, telefono, paquete_id,
    personas, ninos, num_ninos,
    fecha_inicio, fecha_fin, precio,
    metodo_pago, status, notas
  ) values (
    null,                                  -- lo genera el trigger
    trim(p_nombre), lower(trim(p_email)), nullif(trim(p_telefono), ''), p_paquete_id,
    p_personas, coalesce(p_ninos, false), case when p_ninos then p_num_ninos else 0 end,
    p_fecha, v_fin, coalesce(v_precio, 0) * p_personas,
    'Efectivo',                            -- se define al cobrar
    'Planeación',                          -- SIEMPRE entra sin confirmar
    coalesce(nullif(trim(p_notas), ''), '') || ' [Solicitud desde la web]'
  )
  returning codigo into v_codigo;

  return v_codigo;
end $$;

-- El visitante anónimo sólo puede llamar a esta función. Nada más.
revoke all on function solicitar_reserva(text, text, text, text, int, boolean, int, date, text) from public;
grant execute on function solicitar_reserva(text, text, text, text, int, boolean, int, date, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Comprobación: el anónimo NO puede leer ni escribir reservas
-- ---------------------------------------------------------------------
-- set role anon;
-- select solicitar_reserva('Prueba','prueba@mail.com','55-0000','p01',2);  -- OK
-- select count(*) from reservas;                                            -- 0 filas (bloqueado)
-- insert into reservas (nombre, personas) values ('Hacker', 1);             -- ERROR
-- reset role;
