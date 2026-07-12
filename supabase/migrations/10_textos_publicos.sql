-- =====================================================================
-- 10 · LIMPIAR TEXTOS INTERNOS DEL CATÁLOGO
--
-- El catálogo es público (lo lee la web). La descripción del paquete de
-- Servicios Individuales traía una nota de operación interna sobre cómo
-- se liquida a los prestadores. Eso es del dashboard, no del visitante.
-- =====================================================================

update paquetes
   set descripcion = 'Servicios que se pueden contratar por separado o sumar a cualquier '
                     || 'experiencia: anfitrión bilingüe, transporte, guía de sendero, '
                     || 'tirolesa, temazcal, talleres de cocina tradicional y hospedaje en cabaña.'
 where id = 'p33';

-- Verifica que ninguna descripción pública mencione la operación interna
select id, nombre
  from paquetes
 where descripcion ~* 'liquida|liquidación|pago directo|prestador';
-- No debe devolver ninguna fila.
