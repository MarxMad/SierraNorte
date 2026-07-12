-- =====================================================================
-- 19 · PAGO DIVIDIDO, Y EL DEPÓSITO CONFIRMADO LLEGA A LIQUIDACIÓN
--
--   1. Una reserva puede pagarse con VARIOS métodos: 50% en efectivo y
--      50% por transferencia, por ejemplo. No hace falta tocar el enum:
--      `pagos` ya admite varias filas por reserva. La reserva conserva
--      un método principal (el de la porción más grande) y el reparto
--      real vive en sus pagos.
--
--   2. Un depósito confirmado en Banca aparece también en Liquidación →
--      Cobros. Banca es donde se concilia contra el banco; Liquidación
--      es donde se ve TODO el dinero que ya entró, venga de donde venga.
-- =====================================================================

-- ---------------------------------------------------------------------
-- COBROS — el dinero de los clientes visto desde Liquidación:
--   · lo que no toca el banco (efectivo, pago en comunidad): en cualquier
--     estado, porque aquí es donde se valida
--   · lo del banco: SÓLO una vez confirmado — antes de eso es asunto de
--     Banca, no de Liquidación
-- ---------------------------------------------------------------------
drop view if exists v_cobros_liquidacion;
create view v_cobros_liquidacion as
select
  pg.id,
  pg.reserva_id,
  r.codigo,
  r.nombre            as cliente,
  r.paquete_id,
  p.nombre            as paquete,
  p.fecha_inicio      as salida,
  r.personas          as pax,
  pg.monto,
  pg.fecha,
  pg.metodo_pago,
  pg.plataforma,
  canal_pago(pg.metodo_pago) as canal,
  pg.status,
  pg.referencia,
  pg.comprobante_url,
  pg.confirmado_en,
  pg.automatico,
  r.precio            as precio_reserva,
  s.pagado            as pagado_reserva,
  s.saldo             as saldo_reserva
from pagos pg
join reservas r  on r.id = pg.reserva_id
left join paquetes p on p.id = r.paquete_id
left join v_reservas_saldo s on s.reserva_id = r.id
where canal_pago(pg.metodo_pago) = 'liquidacion'
   or pg.status = 'Confirmado';           -- el depósito, ya confirmado en Banca

alter view v_cobros_liquidacion set (security_invoker = on);

-- Los KPIs siguen midiendo lo que hay que validar (lo del banco ya viene validado)
create or replace view v_cobros_kpis as
select
  coalesce(sum(monto) filter (where status = 'Pendiente'
                              and canal_pago(metodo_pago) = 'liquidacion'), 0) as por_validar,
  coalesce(sum(monto) filter (where status = 'Confirmado'), 0)                 as validado,
  count(*) filter (where status = 'Pendiente'
                   and canal_pago(metodo_pago) = 'liquidacion')                as pendientes,
  count(*)                                                                     as cobros
from pagos;

-- =====================================================================
-- LA RESERVA MUESTRA SU REPARTO
-- =====================================================================
drop view if exists v_reservas;
create view v_reservas as
select
  r.id, r.codigo, r.nombre, r.email, r.telefono,
  r.paquete_id, p.nombre as paquete, p.duracion,
  r.personas, r.ninos, r.num_ninos,
  r.fecha_inicio, r.fecha_fin,
  r.precio,
  r.metodo_pago, r.plataforma,
  -- los métodos con los que de verdad se está pagando
  (select array_agg(distinct pg.metodo_pago::text)
     from pagos pg where pg.reserva_id = r.id)                       as metodos,
  (select count(distinct pg.metodo_pago) > 1
     from pagos pg where pg.reserva_id = r.id)                       as mixto,
  r.guia_id, g.nombre as guia,
  r.transporte,
  r.status, r.notas,
  s.pagado, s.saldo, s.pagado_pct,
  (select array_agg(c.nombre order by pc.orden)
     from paquete_comunidades pc
     join comunidades c on c.id = pc.comunidad_id
    where pc.paquete_id = p.id)                                      as comunidades,
  r.created_at, r.updated_at
from reservas r
left join paquetes p       on p.id = r.paquete_id
left join guias g          on g.id = r.guia_id
left join v_reservas_saldo s on s.reserva_id = r.id;

alter view v_reservas set (security_invoker = on);

-- =====================================================================
-- GUARDAR UNA RESERVA CON SU REPARTO DE PAGO
--
-- Sin reparto: el trigger de 12_ruta_reserva.sql genera un solo cobro
-- por el total, como siempre.
--
-- Con reparto: se reemplazan los cobros AUTOMÁTICOS que sigan Pendientes
-- por las líneas del reparto. Los pagos ya confirmados no se tocan nunca,
-- y los que alguien capturó a mano en Banca tampoco.
-- =====================================================================
-- security definer PORQUE hace falta: `ventas` puede crear reservas pero
-- NO escribir en `pagos` (ver 06_roles_rls.sql), y aquí tiene que hacer
-- ambas cosas. Por eso el permiso se verifica a mano, aquí adentro.
create or replace function guardar_reserva_con_reparto(
  p_reserva jsonb,      -- {id?, nombre, paquete_id, precio, metodo_pago, plataforma, ...}
  p_reparto jsonb       -- [{metodo_pago, plataforma, monto}]  (vacío = un solo cobro)
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
  -- El RLS queda desactivado por el security definer: aquí se repone.
  if mi_rol() not in ('admin', 'ventas') then
    raise exception 'Tu rol no tiene permiso para crear o editar reservas';
  end if;

  -- El reparto tiene que cuadrar con el precio: si no, alguien va a
  -- quedar debiendo o pagando de más sin que nadie se entere.
  if p_reparto is not null and jsonb_array_length(p_reparto) > 0 then
    select coalesce(sum((x->>'monto')::numeric), 0) into v_suma
      from jsonb_array_elements(p_reparto) x;

    if round(v_suma, 2) <> round(v_precio, 2) then
      raise exception 'El reparto suma % y el precio es %: tienen que cuadrar', v_suma, v_precio;
    end if;
  end if;

  -- ---------------- la reserva ----------------
  if v_id is null then
    insert into reservas (
      codigo, nombre, email, telefono, paquete_id, personas, ninos, num_ninos,
      fecha_inicio, fecha_fin, precio, metodo_pago, plataforma,
      guia_id, transporte, status, notas
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
      nullif(p_reserva->>'notas', '')
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
      notas        = nullif(p_reserva->>'notas', '')
    where id = v_id;
  end if;

  -- ---------------- el reparto ----------------
  if p_reparto is not null and jsonb_array_length(p_reparto) > 0 then
    -- fuera los cobros automáticos que nadie ha tocado
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

revoke all on function guardar_reserva_con_reparto(jsonb, jsonb) from public;
grant execute on function guardar_reserva_con_reparto(jsonb, jsonb) to authenticated;

-- =====================================================================
-- EL TRIGGER DE SINCRONIZACIÓN NO DEBE PISAR EL REPARTO
--
-- `reservas_sincroniza_cobro` (12_ruta_reserva.sql) ponía el precio
-- completo en CADA cobro automático pendiente. Con un solo cobro está
-- bien; con un reparto de dos líneas, ambas se irían al precio total y
-- la reserva quedaría cobrada al doble.
--
-- Ahora sólo sigue a la reserva cuando hay UN único cobro automático
-- pendiente. Si hay reparto, no se toca: lo maneja la función de arriba.
-- =====================================================================
create or replace function reservas_sincroniza_cobro()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_autos int;
begin
  if new.precio is not distinct from old.precio
     and new.metodo_pago is not distinct from old.metodo_pago
     and new.plataforma is not distinct from old.plataforma then
    return new;
  end if;

  select count(*) into v_autos
    from pagos
   where reserva_id = new.id and automatico and status = 'Pendiente';

  -- Hay reparto: no es asunto de este trigger
  if v_autos > 1 then
    return new;
  end if;

  if new.precio > 0 then
    update pagos
       set monto       = new.precio,
           metodo_pago = new.metodo_pago,
           plataforma  = new.plataforma
     where reserva_id = new.id
       and automatico
       and status = 'Pendiente';
  else
    delete from pagos
     where reserva_id = new.id and automatico and status = 'Pendiente';
  end if;

  return new;
end $$;
