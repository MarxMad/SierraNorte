-- =====================================================================
-- 15 · CONTABILIDAD Y COTEJO
--
-- El negocio: el turista nos paga a nosotros, nosotros le pagamos a las
-- comunidades, y nosotros gestionamos los impuestos de todos. Por eso
-- hacen falta las DOS caras de la factura en un solo lugar:
--
--   · lo que ENTRÓ  → pagos confirmados (los que llevan factura de venta)
--   · lo que SALIÓ  → gastos (los que llevan factura de proveedor)
--
-- De ahí sale el balance a favor / en contra, al día.
--
-- Y se cierra un hueco: hasta ahora, confirmar un pago en Banca no se
-- reflejaba en Liquidación. `v_liquidacion_por_venta` mostraba `ingreso`
-- (lo VENDIDO, suma de reservas.precio) pero nunca lo COBRADO.
-- =====================================================================

-- ---------------------------------------------------------------------
-- FACTURA DE VENTA — no todos los clientes la piden.
-- Cuando la piden, el auxiliar contable captura el CFDI que se emitió.
-- ---------------------------------------------------------------------
alter table pagos add column if not exists con_factura   boolean not null default false;
alter table pagos add column if not exists folio_factura text;
alter table pagos add column if not exists subtotal      numeric(12,2);
alter table pagos add column if not exists iva           numeric(12,2);

do $$ begin
  alter table pagos add constraint chk_pago_factura check (
    (con_factura and folio_factura is not null and subtotal is not null)
    or (not con_factura)
  );
exception when duplicate_object then null; end $$;

-- =====================================================================
-- LIQUIDACIÓN POR VENTA — ahora sí trae lo COBRADO
-- (cambian las columnas, así que hay que rehacer la vista y la que
--  cuelga de ella; `create or replace` no puede alterar la forma)
-- =====================================================================
drop view if exists v_rentabilidad_paquetes;
drop view if exists v_liquidacion_por_venta;

create view v_liquidacion_por_venta as
with cobrado as (
  select
    r.paquete_id,
    coalesce(sum(pg.monto) filter (where pg.status = 'Confirmado'), 0) as cobrado,
    coalesce(sum(pg.monto) filter (where pg.status = 'Pendiente'), 0)  as por_cobrar
  from reservas r
  left join pagos pg on pg.reserva_id = r.id
  group by r.paquete_id
)
select
  p.id                                      as paquete_id,
  p.nombre                                  as paquete,
  p.duracion,
  p.fecha_inicio,
  p.fecha_fin,
  p.status,
  x.reservas,
  x.pax,
  x.ninos,
  x.ingreso,                                                            -- lo VENDIDO
  coalesce(c.cobrado, 0)                                                as cobrado,
  coalesce(c.por_cobrar, 0)                                             as por_cobrar,
  case when x.ingreso > 0
       then least(round(coalesce(c.cobrado, 0) / x.ingreso * 100)::int, 100)
       else 0 end                                                       as cobrado_pct,
  coalesce(sum(l.monto), 0)                                             as costo,
  coalesce(sum(l.monto) filter (where l.liquidado), 0)                  as liquidado,
  coalesce(sum(l.monto) filter (where not l.liquidado), 0)              as pendiente,
  count(l.*)                                                            as conceptos,
  count(l.*) filter (where l.liquidado)                                 as conceptos_liquidados,
  count(l.*) filter (where l.pago_directo)                              as conceptos_directos,
  x.ingreso - coalesce(sum(l.monto), 0)                                 as utilidad,
  case when x.ingreso > 0
       then round((x.ingreso - coalesce(sum(l.monto),0)) / x.ingreso * 100)::int
       else 0 end                                                       as margen_pct,
  case when count(l.*) > 0
       then round(count(l.*) filter (where l.liquidado)::numeric / count(l.*) * 100)::int
       else 0 end                                                       as avance_pct
from paquetes p
join v_paquete_pax x        on x.paquete_id = p.id
left join cobrado c         on c.paquete_id = p.id
left join v_liquidacion_conceptos l on l.paquete_id = p.id
where p.fecha_inicio is not null
  and p.duracion <> 'Servicios'
group by p.id, p.nombre, p.duracion, p.fecha_inicio, p.fecha_fin, p.status,
         x.reservas, x.pax, x.ninos, x.ingreso, c.cobrado, c.por_cobrar;

-- Vuelve a colgarse de la vista recién hecha
create view v_rentabilidad_paquetes as
select
  v.paquete_id,
  v.paquete,
  v.ingreso                                   as ingresos,
  v.cobrado,
  v.costo                                     as costos,
  coalesce((select sum(g.total) from gastos g where g.paquete_id = v.paquete_id), 0) as gastos_facturados,
  v.utilidad,
  v.margen_pct
from v_liquidacion_por_venta v
order by v.utilidad desc;

-- =====================================================================
-- LA BASE CONCENTRADA — ingresos y egresos en una sola tabla.
-- Es lo que el auxiliar contable cotejaba a mano en Excel.
-- =====================================================================
create or replace view v_contabilidad_movimientos as

-- ENTRA: pagos confirmados
select
  'ingreso'::text                          as flujo,
  pg.id::text                              as id,
  pg.fecha,
  r.codigo                                 as referencia_interna,
  r.nombre                                 as contraparte,          -- el cliente
  coalesce(p.nombre, 'Sin paquete')        as concepto,
  pg.metodo_pago::text                     as metodo,
  canal_pago(pg.metodo_pago)               as canal,
  pg.con_factura,
  pg.folio_factura                         as folio,
  -- si no capturaron el desglose, el subtotal es el monto y no hay IVA
  coalesce(pg.subtotal, pg.monto)          as subtotal,
  coalesce(pg.iva, 0)                      as iva,
  pg.monto                                 as total,
  pg.comprobante_url                       as archivo_url,
  null::text                               as comunidad_id
from pagos pg
join reservas r  on r.id = pg.reserva_id
left join paquetes p on p.id = r.paquete_id
where pg.status = 'Confirmado'

union all

-- SALE: gastos
select
  'egreso',
  g.id::text,
  g.fecha,
  coalesce(g.folio, 'Sin folio'),
  g.proveedor,
  g.concepto,
  case when g.con_factura then 'Factura' else 'Nota' end,
  'gasto',
  g.con_factura,
  g.folio,
  g.subtotal,
  g.iva,
  g.total,
  g.archivo_url,
  g.comunidad_id
from gastos g;

-- =====================================================================
-- EL BALANCE — a favor y en contra, al día.
--   Flujo   : lo que entró contra lo que salió (la caja)
--   Fiscal  : IVA que cobramos contra IVA que pagamos (lo del SAT)
-- =====================================================================
drop view if exists v_contabilidad_kpis;
create view v_contabilidad_kpis as
select
  coalesce(sum(total) filter (where flujo = 'ingreso'), 0)                        as entro,
  coalesce(sum(total) filter (where flujo = 'egreso'), 0)                         as salio,
  coalesce(sum(total) filter (where flujo = 'ingreso'), 0)
    - coalesce(sum(total) filter (where flujo = 'egreso'), 0)                     as saldo,

  -- Sólo lo que lleva factura entra al cotejo fiscal
  coalesce(sum(total) filter (where flujo = 'ingreso' and con_factura), 0)        as facturado_ventas,
  coalesce(sum(total) filter (where flujo = 'egreso'  and con_factura), 0)        as facturado_gastos,
  coalesce(sum(iva)   filter (where flujo = 'ingreso' and con_factura), 0)        as iva_trasladado,
  coalesce(sum(iva)   filter (where flujo = 'egreso'  and con_factura), 0)        as iva_acreditable,
  -- positivo = se le debe al SAT; negativo = saldo a favor
  coalesce(sum(iva)   filter (where flujo = 'ingreso' and con_factura), 0)
    - coalesce(sum(iva) filter (where flujo = 'egreso' and con_factura), 0)       as iva_saldo,

  count(*) filter (where flujo = 'ingreso' and not con_factura)                   as ingresos_sin_factura,
  count(*) filter (where flujo = 'egreso'  and not con_factura)                   as gastos_sin_factura,
  count(*) filter (where archivo_url is null)                                     as sin_archivo
from v_contabilidad_movimientos;

do $$
declare v text;
begin
  foreach v in array array[
    'v_liquidacion_por_venta','v_rentabilidad_paquetes',
    'v_contabilidad_movimientos','v_contabilidad_kpis'
  ] loop
    execute format('alter view %I set (security_invoker = on)', v);
  end loop;
end $$;
