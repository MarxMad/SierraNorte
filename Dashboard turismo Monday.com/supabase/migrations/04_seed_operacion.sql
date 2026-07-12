-- =====================================================================
-- 04 · SEED OPERATIVO  (reservas, pagos y gastos)
-- Son las 5 reservas de ejemplo del dashboard. Bórralas cuando entren
-- las reservas reales:  delete from reservas;  (los pagos caen en cascada)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Fechas de las salidas programadas
-- ---------------------------------------------------------------------
update paquetes set fecha_inicio = date '2026-07-03', fecha_fin = date '2026-07-03', status = 'Confirmado' where id = 'p01';
update paquetes set fecha_inicio = date '2026-07-11', fecha_fin = date '2026-07-12', status = 'En Curso'   where id = 'p14';
update paquetes set fecha_inicio = date '2026-07-20', fecha_fin = date '2026-07-24', status = 'Confirmado' where id = 'p30';
update paquetes set fecha_inicio = date '2026-07-15', fecha_fin = date '2026-07-22', status = 'En Curso'   where id = 'p32';

-- ---------------------------------------------------------------------
-- RESERVAS
-- ---------------------------------------------------------------------
insert into reservas
  (codigo, nombre, email, telefono, paquete_id, personas, ninos, num_ninos,
   fecha_inicio, fecha_fin, precio, metodo_pago, plataforma, transporte, status,
   guia_id)
values
  ('ESN-2607-001','Juan Morales','juan@mail.com','55-1204','p32', 3, true, 1,
   '2026-07-15','2026-07-22', 2500, 'Transfer/Tarjeta','WeTravel','Van (Expediciones)','En Curso',
   (select id from guias where nombre = 'Carlos Ruiz')),

  ('ESN-2607-002','María Cifuentes','maria@mail.com','55-3391','p30', 2, false, 0,
   '2026-07-20','2026-07-24', 1800, 'Transfer/Tarjeta','BBVA Transfer','Camioneta (Expediciones)','Confirmado',
   (select id from guias where nombre = 'Ana Pérez')),

  ('ESN-2607-003','Luis Peña','luis@mail.com','55-2277','p14', 4, true, 2,
   '2026-07-11','2026-07-12', 1800, 'Transfer/Tarjeta','PayPal','Van (Expediciones)','En Curso',
   (select id from guias where nombre = 'Miguel Cruz')),

  ('ESN-2607-004','Sandra Ortiz','sandra@mail.com','55-9930','p01', 2, false, 0,
   '2026-07-03','2026-07-03', 900, 'Pago en comunidad', null,'Vehículo propio','Confirmado',
   (select id from guias where nombre = 'Rosa Méndez')),

  ('ESN-2607-005','Ana Robles','ana@mail.com','55-8810','p14', 2, false, 0,
   '2026-07-11','2026-07-12', 1800, 'Efectivo', null,'Colectivo','Planeación',
   (select id from guias where nombre = 'Diego Ávila'))
on conflict (codigo) do nothing;

-- ---------------------------------------------------------------------
-- PAGOS  (se enlazan a la reserva por su código)
-- ---------------------------------------------------------------------
insert into pagos (reserva_id, monto, fecha, metodo_pago, plataforma, status, referencia)
select r.id, v.monto, v.fecha::date, v.metodo::metodo_pago, v.plataforma::plataforma_pago,
       v.status::status_pago, v.referencia
from (values
  ('ESN-2607-001', 1250, '2026-07-10', 'Transfer/Tarjeta', 'WeTravel',      'Pendiente',  'WT-88120'),
  ('ESN-2607-001',  625, '2026-07-01', 'Transfer/Tarjeta', 'WeTravel',      'Confirmado', 'WT-87004'),
  ('ESN-2607-002',  800, '2026-07-12', 'Transfer/Tarjeta', 'BBVA Transfer', 'Confirmado', 'BBVA-4471'),
  ('ESN-2607-002', 1000, '2026-07-02', 'Transfer/Tarjeta', 'BBVA Transfer', 'Confirmado', 'BBVA-4102'),
  ('ESN-2607-003',  900, '2026-07-11', 'Transfer/Tarjeta', 'PayPal',        'Confirmado', 'PP-99231'),
  ('ESN-2607-003',  900, '2026-07-05', 'Transfer/Tarjeta', 'PayPal',        'Confirmado', 'PP-98770'),
  ('ESN-2607-004',  450, '2026-07-02', 'Pago en comunidad', null,           'Vencido',    null),
  ('ESN-2607-005',  900, '2026-07-08', 'Efectivo',          null,           'Pendiente',  null)
) as v(codigo, monto, fecha, metodo, plataforma, status, referencia)
join reservas r on r.codigo = v.codigo;

-- ---------------------------------------------------------------------
-- GASTOS  (facturas)
-- ---------------------------------------------------------------------
insert into gastos (fecha, proveedor, concepto, folio, subtotal, iva, con_factura, paquete_id, comunidad_id)
values
  ('2026-07-08','Comedor La Sepultura','Liquidación de sendero – La Sepultura','A-1042', 300, 48.00, true,  'p32','llano_grande'),
  ('2026-07-09','Cabañas Cuajimoloyas','Hospedaje en cabañas',                 'B-0231', 200, 32.00, true,  'p32','cuajimoloyas'),
  ('2026-07-10','Granja del Señor Elí','Comida – Granja del Señor Elí',         null,    450,  0.00, false, 'p30','benito_juarez'),
  ('2026-07-11','Ecoturismo Cuajimoloyas','Liquidación de puente colgante',    'C-5590', 180, 28.80, true,  'p14','cuajimoloyas'),
  ('2026-07-03','Restaurante Marlen','Comida – Restaurante Marlen',            'D-0087', 120, 19.20, true,  'p01','cuajimoloyas'),
  ('2026-07-05','Truchas el Rescate','Comida/Truchas en el Rescate',            null,    160,  0.00, false, 'p05','amatlan');

-- ---------------------------------------------------------------------
-- Estado inicial del CHECKLIST de las salidas programadas
-- (el resto se sembró solo con los triggers de la plantilla)
-- ---------------------------------------------------------------------
update checklist_general
   set completado = true
 where paquete_id in ('p01','p14')
   and item in ('Transporte confirmado','Seguros vigentes','Kits de emergencia');

update checklist_comunidad
   set completado = true
 where paquete_id = 'p01'
   and comunidad_id = 'cuajimoloyas';

update checklist_comunidad
   set completado = true
 where paquete_id = 'p14'
   and comunidad_id = 'cuajimoloyas'
   and item in ('Guía de la comunidad confirmado','Hospedaje confirmado');

-- ---------------------------------------------------------------------
-- Algunos conceptos ya liquidados (para ver el flujo completo)
-- ---------------------------------------------------------------------
select marcar_liquidado('comedor', cm.id::text, true)
from comedores cm
where cm.paquete_id = 'p01';

select marcar_liquidado('item', it.id::text, true)
from itinerario_items it
join itinerario_dias d on d.id = it.dia_id
where d.paquete_id = 'p01' and it.tipo = 'Sendero';
