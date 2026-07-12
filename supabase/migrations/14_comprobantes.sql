-- =====================================================================
-- 14 · COMPROBANTES Y CONTABILIDAD
--
--   · Un bucket privado donde viven los comprobantes de pago y los
--     archivos de las facturas (PDF / XML / foto del ticket).
--   · La vista que alimenta Banca → Contabilidad: los pagos que YA
--     entraron, de cualquier canal (banco y efectivo).
--
-- El bucket es PRIVADO a propósito: los comprobantes traen datos
-- bancarios. No se sirven por URL pública, se abren con una URL firmada
-- que caduca (ver `urlComprobante` en src/app/acciones.ts).
-- =====================================================================

-- ---------------------------------------------------------------------
-- BUCKET
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprobantes',
  'comprobantes',
  false,
  10485760,                            -- 10 MB por archivo
  array[
    'image/jpeg','image/png','image/webp','image/heic',
    'application/pdf','text/xml','application/xml'
  ]
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------
-- Quién puede subir y ver
--   ver    → cualquiera con sesión (la info es de todos, migración 13)
--   subir  → admin y finanzas (comprobantes y facturas)
--            comunidad (los archivos de las facturas de SU pueblo)
--   borrar → sólo admin y finanzas
-- ---------------------------------------------------------------------
drop policy if exists comprobantes_lee on storage.objects;
create policy comprobantes_lee on storage.objects
  for select to authenticated
  using (bucket_id = 'comprobantes');

drop policy if exists comprobantes_sube on storage.objects;
create policy comprobantes_sube on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'comprobantes'
    and mi_rol() in ('admin', 'finanzas', 'comunidad')
  );

drop policy if exists comprobantes_actualiza on storage.objects;
create policy comprobantes_actualiza on storage.objects
  for update to authenticated
  using (bucket_id = 'comprobantes' and mi_rol() in ('admin', 'finanzas', 'comunidad'))
  with check (bucket_id = 'comprobantes' and mi_rol() in ('admin', 'finanzas', 'comunidad'));

drop policy if exists comprobantes_borra on storage.objects;
create policy comprobantes_borra on storage.objects
  for delete to authenticated
  using (bucket_id = 'comprobantes' and mi_rol() in ('admin', 'finanzas'));

-- =====================================================================
-- El cobro en efectivo también carga su comprobante (foto del recibo).
-- v_banca_pagos ya lo traía; v_cobros_liquidacion no.
-- (Cambia la forma de la vista, así que se rehace: `create or replace`
--  no puede meter una columna en medio.)
-- =====================================================================
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
where canal_pago(pg.metodo_pago) = 'liquidacion';

-- La contabilidad (movimientos, balance y cotejo de facturas) vive en la
-- migración 15: necesita las columnas de factura de venta que se agregan ahí.

alter view v_cobros_liquidacion set (security_invoker = on);
