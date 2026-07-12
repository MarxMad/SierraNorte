-- =====================================================================
-- 12 · LA RUTA DE UNA RESERVA
--
-- Al crear una reserva, el cobro nace solo y se va por su canal:
--
--   Transfer/Tarjeta  →  BANCA        (se concilia contra el banco)
--   Efectivo          →  LIQUIDACIÓN  (se valida el dinero en mano)
--   Pago en comunidad →  LIQUIDACIÓN  (nunca toca el banco)
--
-- Y en los dos casos la reserva aparece en el CALENDARIO con SUS fechas.
--
-- El canal no se captura: se deriva del método de pago (canal_pago).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Marca los cobros que generó la reserva (no los capturó una persona).
-- Sirve para poder re-sincronizarlos si la reserva cambia.
-- ---------------------------------------------------------------------
alter table pagos add column if not exists automatico boolean not null default false;

-- ---------------------------------------------------------------------
-- El canal de un pago sale de su método. Una sola definición para todos.
-- ---------------------------------------------------------------------
create or replace function canal_pago(m metodo_pago)
returns text language sql immutable as $$
  select case when m = 'Transfer/Tarjeta' then 'banca' else 'liquidacion' end;
$$;

-- =====================================================================
-- 1) NACE EL COBRO
--    Toda reserva con precio genera su cobro Pendiente por el total.
--    Va con security definer: 'ventas' puede crear reservas pero NO
--    escribir en pagos, y aun así su reserva debe generar el cobro.
--    Los valores los pone la base, no el que llama.
-- =====================================================================
create or replace function reservas_genera_cobro()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.precio > 0 then
    insert into pagos (reserva_id, monto, fecha, metodo_pago, plataforma, status, automatico, notas)
    values (
      new.id,
      new.precio,
      current_date,
      new.metodo_pago,
      new.plataforma,
      'Pendiente',
      true,
      'Cobro inicial de la reserva ' || new.codigo
    );
  end if;
  return new;
end $$;

drop trigger if exists trg_reservas_cobro on reservas;
create trigger trg_reservas_cobro after insert on reservas
  for each row execute function reservas_genera_cobro();

-- =====================================================================
-- 2) SI LA RESERVA CAMBIA, EL COBRO LA SIGUE
--    Sólo mientras siga Pendiente y sea el automático: en cuanto alguien
--    lo confirma o lo edita a mano, deja de tocarse.
-- =====================================================================
create or replace function reservas_sincroniza_cobro()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.precio is not distinct from old.precio
     and new.metodo_pago is not distinct from old.metodo_pago
     and new.plataforma is not distinct from old.plataforma then
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
    -- un pago no puede valer cero: si la reserva se queda sin precio, se retira
    delete from pagos
     where reserva_id = new.id and automatico and status = 'Pendiente';
  end if;

  return new;
end $$;

drop trigger if exists trg_reservas_sincro_cobro on reservas;
create trigger trg_reservas_sincro_cobro after update on reservas
  for each row execute function reservas_sincroniza_cobro();

-- =====================================================================
-- 3) BANCA — sólo lo que pasa por el banco
-- =====================================================================
drop view if exists v_banca_pagos;
create view v_banca_pagos as
select
  pg.id,
  pg.reserva_id,
  r.codigo,
  r.nombre           as cliente,
  r.paquete_id,
  p.nombre           as paquete,
  pg.monto,
  pg.fecha,
  pg.metodo_pago,
  pg.plataforma,
  pg.status,
  pg.referencia,
  pg.comprobante_url,
  pg.confirmado_en,
  pg.automatico,
  r.precio           as precio_reserva,
  s.pagado           as pagado_reserva,
  s.saldo            as saldo_reserva
from pagos pg
join reservas r  on r.id = pg.reserva_id
left join paquetes p on p.id = r.paquete_id
left join v_reservas_saldo s on s.reserva_id = r.id
where canal_pago(pg.metodo_pago) = 'banca';

-- Los KPIs de Banca miden el canal de Banca, no la caja de la sierra
create or replace view v_banca_kpis as
select
  coalesce(sum(monto) filter (where status = 'Pendiente'), 0)  as pendiente,
  coalesce(sum(monto) filter (where status = 'Confirmado'), 0) as confirmado,
  coalesce(sum(monto) filter (where status = 'Vencido'), 0)    as vencido,
  coalesce(sum(monto) filter (where status = 'Devuelto'), 0)   as devuelto,
  count(*)                                                     as pagos,
  coalesce(round(avg(monto)), 0)                               as promedio
from pagos
where canal_pago(metodo_pago) = 'banca';

-- =====================================================================
-- 4) LIQUIDACIÓN — el dinero que no toca el banco y hay que validar
-- =====================================================================
create or replace view v_cobros_liquidacion as
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
  pg.status,
  pg.referencia,
  pg.confirmado_en,
  pg.automatico,
  r.precio            as precio_reserva,
  s.pagado            as pagado_reserva,
  s.saldo             as saldo_reserva
from pagos pg
join reservas r  on r.id = pg.reserva_id
left join paquetes p on p.id = r.paquete_id
left join v_reservas_saldo s on s.reserva_id = r.id
where canal_pago(pg.metodo_pago) = 'liquidacion';

create or replace view v_cobros_kpis as
select
  coalesce(sum(monto) filter (where status = 'Pendiente'), 0)   as por_validar,
  coalesce(sum(monto) filter (where status = 'Confirmado'), 0)  as validado,
  count(*) filter (where status = 'Pendiente')                  as pendientes,
  count(*)                                                      as cobros
from pagos
where canal_pago(metodo_pago) = 'liquidacion';

-- =====================================================================
-- 5) CALENDARIO — salidas del paquete + reservas con fecha propia
--    Antes sólo se veían los paquetes con fecha: una reserva con fechas
--    de un paquete sin fecha no aparecía en ningún lado.
-- =====================================================================
create or replace view v_calendario as
select
  'salida'::text                          as tipo,
  p.id                                    as id,
  p.nombre                                as titulo,
  p.duracion,
  p.fecha_inicio,
  coalesce(p.fecha_fin, p.fecha_inicio)   as fecha_fin,
  p.status,
  coalesce(x.pax, 0)::int                 as pax,
  null::text                              as codigo,
  null::metodo_pago                       as metodo_pago,
  p.id                                    as paquete_id,
  p.nombre                                as paquete
from paquetes p
left join v_paquete_pax x on x.paquete_id = p.id
where p.fecha_inicio is not null
  and p.duracion <> 'Servicios'

union all

select
  'reserva'::text,
  r.id::text,
  r.nombre,
  coalesce(p.duracion, 'Servicios'::duracion_paquete),
  r.fecha_inicio,
  coalesce(r.fecha_fin, r.fecha_inicio),
  r.status,
  r.personas,
  r.codigo,
  r.metodo_pago,
  r.paquete_id,
  p.nombre
from reservas r
left join paquetes p on p.id = r.paquete_id
where r.fecha_inicio is not null;

-- ---------------------------------------------------------------------
-- Las vistas nuevas también respetan RLS (si no, corren como su dueño
-- y el rol 'comunidad' vería los cobros de todos los clientes).
-- ---------------------------------------------------------------------
do $$
declare v text;
begin
  foreach v in array array[
    'v_banca_pagos','v_banca_kpis','v_cobros_liquidacion','v_cobros_kpis','v_calendario'
  ] loop
    execute format('alter view %I set (security_invoker = on)', v);
  end loop;
end $$;

-- =====================================================================
-- 6) LAS RESERVAS QUE YA EXISTÍAN
--    Las que se crearon antes de este trigger no tienen cobro: se les
--    genera ahora, para que no queden fuera de Banca ni de Liquidación.
-- =====================================================================
insert into pagos (reserva_id, monto, fecha, metodo_pago, plataforma, status, automatico, notas)
select r.id, r.precio, current_date, r.metodo_pago, r.plataforma, 'Pendiente', true,
       'Cobro inicial de la reserva ' || r.codigo
  from reservas r
 where r.precio > 0
   and not exists (select 1 from pagos pg where pg.reserva_id = r.id);
