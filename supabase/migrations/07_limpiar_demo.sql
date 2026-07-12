-- =====================================================================
-- 07 · LIMPIAR DATOS DE PRUEBA
--
-- Deja la base lista para probar el flujo completo desde cero.
--
--   SE BORRA:  reservas, pagos, gastos, estado de liquidación,
--              el checklist marcado y las fechas de las salidas.
--
--   SE CONSERVA: TODO el catálogo — las 10 comunidades, los 33 paquetes
--              con sus 81 días de itinerario, los 197 items liquidables,
--              los 195 comedores, los 18 servicios y los 7 guías.
--              También los usuarios y sus roles.
--
-- Es seguro correrlo varias veces.
-- =====================================================================

begin;

-- 1) Reservas y pagos (los pagos caen en cascada, pero somos explícitos)
delete from pagos;
delete from reservas;

-- 2) Gastos / facturas
delete from gastos;

-- 3) Estado de liquidación (los conceptos NO se borran: son derivados,
--    viven en comedores e itinerario_items y siguen intactos)
delete from liquidacion_estado;

-- 4) Checklist: se conservan los items, pero todos vuelven a "sin confirmar"
update checklist_general    set completado = false, completado_en = null;
update checklist_comunidad  set completado = false, completado_en = null;

-- 5) Las salidas vuelven a ser catálogo: sin fecha y en Planeación
update paquetes
   set fecha_inicio = null,
       fecha_fin    = null,
       status       = 'Planeación';

-- 6) Reinicia el folio de reservas (la próxima será ESN-AAMM-001)
--    No hace falta hacer nada: siguiente_codigo_reserva() cuenta las
--    reservas existentes, y ya no hay ninguna.

commit;

-- ---------------------------------------------------------------------
-- Verifica que quedó como esperas
-- ---------------------------------------------------------------------
select
  (select count(*) from comunidades)        as comunidades,     -- 10
  (select count(*) from paquetes)           as paquetes,        -- 33
  (select count(*) from itinerario_dias)    as dias,            -- 81
  (select count(*) from itinerario_items)   as items,           -- 197
  (select count(*) from comedores)          as comedores,       -- 195
  (select count(*) from servicios)          as servicios,       -- 18
  (select count(*) from guias)              as guias,           -- 7
  (select count(*) from reservas)           as reservas,        -- 0
  (select count(*) from pagos)              as pagos,           -- 0
  (select count(*) from gastos)             as gastos,          -- 0
  (select count(*) from liquidacion_estado) as liquidaciones,   -- 0
  (select count(*) from perfiles)           as usuarios;        -- los tuyos
