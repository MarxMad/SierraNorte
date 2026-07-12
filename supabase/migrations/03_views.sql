-- =====================================================================
-- 03 · VISTAS
-- La liquidación y la banca NO se capturan: se derivan de las tablas base.
-- =====================================================================

-- ---------------------------------------------------------------------
-- PAX por paquete (personas y niños confirmados en las reservas)
-- ---------------------------------------------------------------------
create or replace view v_paquete_pax as
select
  p.id                                        as paquete_id,
  count(r.id)                                 as reservas,
  coalesce(sum(r.personas), 0)::int           as pax,
  coalesce(sum(case when r.ninos then r.num_ninos else 0 end), 0)::int as ninos,
  coalesce(sum(r.precio), 0)                  as ingreso
from paquetes p
left join reservas r on r.paquete_id = p.id
group by p.id;

-- ---------------------------------------------------------------------
-- % pagado de cada reserva  (pagos confirmados / precio)
-- ---------------------------------------------------------------------
create or replace view v_reservas_saldo as
select
  r.id                                          as reserva_id,
  r.precio,
  coalesce(sum(pg.monto) filter (where pg.status = 'Confirmado'), 0) as pagado,
  coalesce(sum(pg.monto) filter (where pg.status = 'Pendiente'), 0)  as pendiente,
  coalesce(sum(pg.monto) filter (where pg.status = 'Vencido'), 0)    as vencido,
  greatest(r.precio - coalesce(sum(pg.monto) filter (where pg.status = 'Confirmado'), 0), 0) as saldo,
  case when r.precio > 0
       then least(round(coalesce(sum(pg.monto) filter (where pg.status = 'Confirmado'), 0) / r.precio * 100)::int, 100)
       else 0 end                              as pagado_pct
from reservas r
left join pagos pg on pg.reserva_id = r.id
group by r.id, r.precio;

-- ---------------------------------------------------------------------
-- RESERVAS enriquecidas — es lo que consume la tabla de Ventas > Clientes
-- ---------------------------------------------------------------------
create or replace view v_reservas as
select
  r.id, r.codigo, r.nombre, r.email, r.telefono,
  r.paquete_id, p.nombre as paquete, p.duracion,
  r.personas, r.ninos, r.num_ninos,
  r.fecha_inicio, r.fecha_fin,
  r.precio,
  r.metodo_pago, r.plataforma,
  r.guia_id, g.nombre as guia,
  r.transporte,
  r.status, r.notas,
  s.pagado, s.saldo, s.pagado_pct,
  (select array_agg(c.nombre order by pc.orden)
     from paquete_comunidades pc
     join comunidades c on c.id = pc.comunidad_id
    where pc.paquete_id = p.id)               as comunidades,
  r.created_at, r.updated_at
from reservas r
left join paquetes p       on p.id = r.paquete_id
left join guias g          on g.id = r.guia_id
left join v_reservas_saldo s on s.reserva_id = r.id;

-- ---------------------------------------------------------------------
-- PAQUETES enriquecidos — tabla de Ventas > Paquetes
-- ---------------------------------------------------------------------
create or replace view v_paquetes as
select
  p.id, p.nombre, p.duracion, p.descripcion, p.precio,
  p.fecha_inicio, p.fecha_fin, p.status,
  p.anfitrion_nombre, p.anfitrion_idiomas, p.anfitrion_monto,
  p.transporte_proveedor, p.transporte_tipo, p.transporte_ruta, p.transporte_monto,
  x.reservas, x.pax, x.ninos, x.ingreso,
  (select count(*) from comedores cm where cm.paquete_id = p.id)          as comedores,
  (select count(*) from itinerario_dias d where d.paquete_id = p.id)      as dias,
  (select array_agg(c.nombre order by pc.orden)
     from paquete_comunidades pc
     join comunidades c on c.id = pc.comunidad_id
    where pc.paquete_id = p.id)                                            as comunidades,
  -- % pagado promedio de sus reservas
  coalesce((select round(avg(s.pagado_pct))::int
              from reservas r
              join v_reservas_saldo s on s.reserva_id = r.id
             where r.paquete_id = p.id), 0)                                as pagado_pct
from paquetes p
left join v_paquete_pax x on x.paquete_id = p.id;

-- =====================================================================
-- LIQUIDACIÓN — POR CONCEPTO
-- Se arma con UNION de 4 orígenes. El estado sale de liquidacion_estado.
-- El monto de los comedores es POR PERSONA → se multiplica por los pax.
-- =====================================================================
create or replace view v_liquidacion_conceptos as

-- 1) COMEDORES — pago DIRECTO al prestador
select
  'comedor'::text                              as origen,
  cm.id::text                                  as origen_id,
  cm.paquete_id,
  p.nombre                                     as paquete,
  p.fecha_inicio,
  'Comedor'::tipo_liquidacion                  as tipo,
  cm.tipo::text || ' — ' || cm.nombre          as concepto,
  cm.comunidad_id,
  c.nombre                                     as comunidad,
  cm.dia,
  cm.monto_por_persona                         as monto_unitario,
  true                                         as por_persona,
  coalesce(x.pax, 1)                           as pax,
  coalesce(le.monto_override, cm.monto_por_persona * greatest(coalesce(x.pax,1),1)) as monto,
  true                                         as pago_directo,
  coalesce(le.liquidado, false)                as liquidado,
  le.fecha_liquidacion
from comedores cm
join paquetes p       on p.id = cm.paquete_id
left join comunidades c on c.id = cm.comunidad_id
left join v_paquete_pax x on x.paquete_id = cm.paquete_id
left join liquidacion_estado le on le.origen = 'comedor' and le.origen_id = cm.id::text

union all

-- 2) SENDEROS, HOSPEDAJE, ACTIVIDADES Y TALLERES (del itinerario)
select
  'item'::text,
  it.id::text,
  d.paquete_id,
  p.nombre,
  p.fecha_inicio,
  it.tipo,
  it.texto,
  it.comunidad_id,
  c.nombre,
  d.dia,
  it.monto,
  it.por_persona,
  coalesce(x.pax, 1),
  coalesce(le.monto_override,
           case when it.por_persona
                then it.monto * greatest(coalesce(x.pax,1),1)
                else it.monto end),
  false,
  coalesce(le.liquidado, false),
  le.fecha_liquidacion
from itinerario_items it
join itinerario_dias d on d.id = it.dia_id
join paquetes p        on p.id = d.paquete_id
left join comunidades c  on c.id = it.comunidad_id
left join v_paquete_pax x on x.paquete_id = d.paquete_id
left join liquidacion_estado le on le.origen = 'item' and le.origen_id = it.id::text
where it.tipo is not null

union all

-- 3) TRANSPORTE de la salida
select
  'transporte'::text,
  p.id,
  p.id,
  p.nombre,
  p.fecha_inicio,
  'Transporte'::tipo_liquidacion,
  coalesce(p.transporte_tipo,'Transporte')
    || coalesce(' — ' || p.transporte_proveedor, '')
    || coalesce(' (' || p.transporte_ruta || ')', ''),
  null, null, 0,
  p.transporte_monto,
  false,
  coalesce(x.pax, 1),
  coalesce(le.monto_override, p.transporte_monto),
  false,
  coalesce(le.liquidado, false),
  le.fecha_liquidacion
from paquetes p
left join v_paquete_pax x on x.paquete_id = p.id
left join liquidacion_estado le on le.origen = 'transporte' and le.origen_id = p.id
where p.transporte_monto > 0 or p.transporte_proveedor is not null

union all

-- 4) ANFITRIÓN BILINGÜE
select
  'anfitrion'::text,
  p.id,
  p.id,
  p.nombre,
  p.fecha_inicio,
  'Anfitrión'::tipo_liquidacion,
  'Anfitrión bilingüe'
    || coalesce(' — ' || p.anfitrion_nombre, '')
    || coalesce(' (' || p.anfitrion_idiomas || ')', ''),
  null, null, 0,
  p.anfitrion_monto,
  false,
  coalesce(x.pax, 1),
  coalesce(le.monto_override, p.anfitrion_monto),
  false,
  coalesce(le.liquidado, false),
  le.fecha_liquidacion
from paquetes p
left join v_paquete_pax x on x.paquete_id = p.id
left join liquidacion_estado le on le.origen = 'anfitrion' and le.origen_id = p.id
where p.anfitrion_monto > 0 or p.anfitrion_nombre is not null;

-- Sólo las salidas programadas (con fecha) — es lo que realmente se liquida
create or replace view v_liquidacion_programada as
select * from v_liquidacion_conceptos where fecha_inicio is not null;

-- ---------------------------------------------------------------------
-- LIQUIDACIÓN — POR VENTA (una fila por salida)
-- ---------------------------------------------------------------------
create or replace view v_liquidacion_por_venta as
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
  x.ingreso,
  coalesce(sum(l.monto), 0)                                          as costo,
  coalesce(sum(l.monto) filter (where l.liquidado), 0)               as liquidado,
  coalesce(sum(l.monto) filter (where not l.liquidado), 0)           as pendiente,
  count(l.*)                                                          as conceptos,
  count(l.*) filter (where l.liquidado)                               as conceptos_liquidados,
  count(l.*) filter (where l.pago_directo)                            as conceptos_directos,
  x.ingreso - coalesce(sum(l.monto), 0)                               as utilidad,
  case when x.ingreso > 0
       then round((x.ingreso - coalesce(sum(l.monto),0)) / x.ingreso * 100)::int
       else 0 end                                                     as margen_pct,
  case when count(l.*) > 0
       then round(count(l.*) filter (where l.liquidado)::numeric / count(l.*) * 100)::int
       else 0 end                                                     as avance_pct
from paquetes p
join v_paquete_pax x        on x.paquete_id = p.id
left join v_liquidacion_conceptos l on l.paquete_id = p.id
where p.fecha_inicio is not null
  and p.duracion <> 'Servicios'
group by p.id, p.nombre, p.duracion, p.fecha_inicio, p.fecha_fin, p.status,
         x.reservas, x.pax, x.ninos, x.ingreso;

-- ---------------------------------------------------------------------
-- LIQUIDACIÓN — POR COMUNIDAD (lo que se le debe a cada pueblo)
-- ---------------------------------------------------------------------
create or replace view v_liquidacion_por_comunidad as
select
  l.comunidad_id,
  l.comunidad,
  count(*)                                          as conceptos,
  count(*) filter (where not l.liquidado)           as pendientes,
  sum(l.monto)                                      as total,
  sum(l.monto) filter (where l.liquidado)           as liquidado,
  sum(l.monto) filter (where not l.liquidado)       as por_pagar,
  sum(l.monto) filter (where l.pago_directo)        as pago_directo
from v_liquidacion_programada l
where l.comunidad_id is not null
group by l.comunidad_id, l.comunidad;

-- =====================================================================
-- BANCA  (absorbió Contabilidad)
-- =====================================================================

-- Pagos enlazados con su reserva y su paquete
create or replace view v_banca_pagos as
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
  r.precio           as precio_reserva,
  s.pagado           as pagado_reserva,
  s.saldo            as saldo_reserva
from pagos pg
join reservas r  on r.id = pg.reserva_id
left join paquetes p on p.id = r.paquete_id
left join v_reservas_saldo s on s.reserva_id = r.id;

-- KPIs de Banca
create or replace view v_banca_kpis as
select
  coalesce(sum(monto) filter (where status = 'Pendiente'), 0)  as pendiente,
  coalesce(sum(monto) filter (where status = 'Confirmado'), 0) as confirmado,
  coalesce(sum(monto) filter (where status = 'Vencido'), 0)    as vencido,
  coalesce(sum(monto) filter (where status = 'Devuelto'), 0)   as devuelto,
  count(*)                                                     as pagos,
  coalesce(round(avg(monto)), 0)                               as promedio
from pagos;

-- Resumen financiero (antes Contabilidad > Resumen)
create or replace view v_resumen_financiero as
select
  (select coalesce(sum(monto),0) from pagos where status = 'Confirmado')     as ingresos,
  (select coalesce(sum(total),0) from gastos)                                as gastos,
  (select coalesce(sum(monto),0) from v_liquidacion_programada
     where not liquidado)                                                    as por_liquidar,
  (select coalesce(sum(monto),0) from pagos where status = 'Confirmado')
    - (select coalesce(sum(total),0) from gastos)                            as utilidad,
  case when (select coalesce(sum(monto),0) from pagos where status='Confirmado') > 0
       then round((
              (select coalesce(sum(monto),0) from pagos where status='Confirmado')
              - (select coalesce(sum(total),0) from gastos)
            ) / (select sum(monto) from pagos where status='Confirmado') * 100)::int
       else 0 end                                                            as margen_pct;

-- Gastos por comunidad (para la gráfica)
create or replace view v_gastos_por_comunidad as
select
  c.id     as comunidad_id,
  c.nombre as comunidad,
  c.color,
  coalesce(sum(g.subtotal), 0) as subtotal,
  coalesce(sum(g.iva), 0)      as iva,
  coalesce(sum(g.total), 0)    as total,
  count(g.*)                   as facturas
from comunidades c
left join gastos g on g.comunidad_id = c.id
group by c.id, c.nombre, c.color
order by coalesce(sum(g.total),0) desc;

-- Top paquetes por rentabilidad
create or replace view v_rentabilidad_paquetes as
select
  v.paquete_id,
  v.paquete,
  v.ingreso                                   as ingresos,
  v.costo                                     as costos,
  coalesce((select sum(g.total) from gastos g where g.paquete_id = v.paquete_id), 0) as gastos_facturados,
  v.utilidad,
  v.margen_pct
from v_liquidacion_por_venta v
order by v.utilidad desc;

-- ---------------------------------------------------------------------
-- CHECKLIST — avance por paquete y por comunidad
-- ---------------------------------------------------------------------
create or replace view v_checklist_comunidad as
select
  cc.paquete_id,
  cc.comunidad_id,
  c.nombre                                          as comunidad,
  count(*)                                          as total,
  count(*) filter (where cc.completado)             as completados,
  bool_and(cc.completado)                           as lista,
  round(count(*) filter (where cc.completado)::numeric / nullif(count(*),0) * 100)::int as pct
from checklist_comunidad cc
join comunidades c on c.id = cc.comunidad_id
group by cc.paquete_id, cc.comunidad_id, c.nombre;

create or replace view v_checklist_paquete as
select
  p.id                                      as paquete_id,
  p.nombre                                  as paquete,
  (select count(*) from checklist_general g where g.paquete_id = p.id)                       as general_total,
  (select count(*) from checklist_general g where g.paquete_id = p.id and g.completado)      as general_ok,
  (select count(*) from checklist_comunidad c where c.paquete_id = p.id)                     as com_total,
  (select count(*) from checklist_comunidad c where c.paquete_id = p.id and c.completado)    as com_ok,
  (select count(*) from v_checklist_comunidad v where v.paquete_id = p.id)                   as comunidades,
  (select count(*) from v_checklist_comunidad v where v.paquete_id = p.id and v.lista)       as comunidades_listas,
  round(
    ((select count(*) from checklist_general g where g.paquete_id = p.id and g.completado)
     + (select count(*) from checklist_comunidad c where c.paquete_id = p.id and c.completado))::numeric
    / nullif(
        (select count(*) from checklist_general g where g.paquete_id = p.id)
        + (select count(*) from checklist_comunidad c where c.paquete_id = p.id), 0) * 100
  )::int                                                                                      as pct
from paquetes p;

-- ---------------------------------------------------------------------
-- COMUNIDADES > Kanban: el tramo de cada paquete en cada comunidad
-- ---------------------------------------------------------------------
create or replace view v_operacion_comunidad as
select
  pc.paquete_id,
  pc.comunidad_id,
  c.nombre                as comunidad,
  c.color,
  p.nombre                as paquete,
  p.duracion,
  p.fecha_inicio,
  p.status,
  x.pax,
  vc.total                as checks_total,
  vc.completados          as checks_ok,
  vc.lista,
  vc.pct,
  vp.comunidades_listas,
  vp.comunidades          as comunidades_del_tour,
  vp.pct                  as avance_tour,
  (select coalesce(sum(l.monto),0) from v_liquidacion_conceptos l
    where l.paquete_id = pc.paquete_id and l.comunidad_id = pc.comunidad_id)      as presupuesto,
  (select coalesce(sum(l.monto),0) from v_liquidacion_conceptos l
    where l.paquete_id = pc.paquete_id and l.comunidad_id = pc.comunidad_id
      and l.liquidado)                                                            as gastado
from paquete_comunidades pc
join comunidades c on c.id = pc.comunidad_id
join paquetes p    on p.id = pc.paquete_id
left join v_paquete_pax x on x.paquete_id = p.id
left join v_checklist_comunidad vc on vc.paquete_id = pc.paquete_id and vc.comunidad_id = pc.comunidad_id
left join v_checklist_paquete vp   on vp.paquete_id = pc.paquete_id;
