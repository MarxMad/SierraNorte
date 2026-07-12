-- =====================================================================
-- 16 · LA OPERACIÓN ES LA QUE TIENE GENTE
--
-- `v_operacion_comunidad` se armaba desde `paquete_comunidades`, que es
-- CATÁLOGO: cada paquete dado de alta le pintaba una tarjeta con su
-- checklist a cada comunidad que toca, aunque nadie hubiera reservado
-- nunca ese tour. El coordinador de Benito Juárez veía decenas de
-- tramos que no existen y podía "confirmar comedores" de un grupo que
-- no va a llegar.
--
-- Un tramo es real cuando hay al menos UNA reserva en ese paquete.
-- El checklist se sigue sembrando por trigger (la fila está lista para
-- cuando llegue la primera reserva), pero no se MUESTRA hasta entonces.
--
-- Además: si el paquete no tiene fecha propia, la salida se toma de las
-- reservas — igual que en el calendario (12_ruta_reserva.sql).
-- =====================================================================

drop view if exists v_operacion_comunidad;

create view v_operacion_comunidad as
select
  pc.paquete_id,
  pc.comunidad_id,
  c.nombre                as comunidad,
  c.color,
  p.nombre                as paquete,
  p.duracion,
  -- la fecha de la salida: la del paquete o, si no tiene, la de sus reservas
  coalesce(p.fecha_inicio, r.primera_fecha)                                     as fecha_inicio,
  p.status,
  x.reservas,
  x.pax,
  vc.total                as checks_total,
  vc.completados          as checks_ok,
  vc.lista,
  vc.pct,
  vp.comunidades_listas,
  vp.comunidades          as comunidades_del_tour,
  vp.pct                  as avance_tour,
  (select coalesce(sum(l.monto),0) from v_liquidacion_conceptos l
    where l.paquete_id = pc.paquete_id and l.comunidad_id = pc.comunidad_id)    as presupuesto,
  (select coalesce(sum(l.monto),0) from v_liquidacion_conceptos l
    where l.paquete_id = pc.paquete_id and l.comunidad_id = pc.comunidad_id
      and l.liquidado)                                                          as gastado
from paquete_comunidades pc
join comunidades c on c.id = pc.comunidad_id
join paquetes p    on p.id = pc.paquete_id
join v_paquete_pax x on x.paquete_id = p.id
left join (
  select paquete_id, min(fecha_inicio) as primera_fecha
    from reservas
   where fecha_inicio is not null
   group by paquete_id
) r on r.paquete_id = p.id
left join v_checklist_comunidad vc on vc.paquete_id = pc.paquete_id and vc.comunidad_id = pc.comunidad_id
left join v_checklist_paquete vp   on vp.paquete_id = pc.paquete_id
-- AQUÍ está el filtro: sin reservas, no hay tramo que operar
where x.reservas > 0;

alter view v_operacion_comunidad set (security_invoker = on);

-- ---------------------------------------------------------------------
-- Comprobación
-- ---------------------------------------------------------------------
--   select count(*) from paquete_comunidades;      -- todo el catálogo
--   select count(*) from v_operacion_comunidad;    -- sólo lo que tiene gente
