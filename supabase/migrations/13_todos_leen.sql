-- =====================================================================
-- 13 · TODOS VEN, CADA QUIEN MUEVE LO SUYO
--
-- Regla de la cooperativa: la información es de todos. Cualquier usuario
-- con sesión LEE toda la operación (reservas, pagos, gastos, liquidación,
-- calendario). Lo que NO cambia es quién puede MODIFICAR:
--
--   ventas     → reservas, paquetes, itinerario, checklist general
--   finanzas   → pagos, gastos, liquidación
--   comunidad  → el checklist y los gastos de SU pueblo
--   admin      → todo, y es el único que administra usuarios
--
-- Las políticas de escritura de 06_roles_rls.sql siguen intactas: aquí
-- sólo se abren las de lectura.
-- =====================================================================

-- ---------------------------------------------------------------------
-- RESERVAS — antes: comunidad sólo veía las salidas de su pueblo.
-- Ahora todos ven todas (incluye precio y datos de contacto del cliente).
-- ---------------------------------------------------------------------
drop policy if exists reservas_lee on reservas;
create policy reservas_lee on reservas
  for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- PAGOS — antes: comunidad no veía ninguno.
-- Ahora todos ven los cobros; sólo admin y finanzas los tocan.
-- ---------------------------------------------------------------------
drop policy if exists pagos_lee on pagos;
create policy pagos_lee on pagos
  for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- GASTOS — antes: comunidad sólo veía las facturas de su pueblo.
-- Ahora todos ven todas. Escribir, sólo las suyas (política intacta).
-- ---------------------------------------------------------------------
drop policy if exists gastos_lee on gastos;
create policy gastos_lee on gastos
  for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- El catálogo, los checklists y liquidacion_estado ya se leían completos
-- desde 06_roles_rls.sql. No hace falta tocarlos.
--
-- PERFILES tampoco se toca: quién entra y con qué rol NO es info de la
-- operación, es el control de acceso. Sigue siendo cosa del admin.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- Comprobación
-- ---------------------------------------------------------------------
--   set local role authenticated;
--   set local request.jwt.claim.sub = '<uuid de un usuario comunidad>';
--   select count(*) from v_banca_pagos;        -- ahora sí devuelve filas
--   update pagos set status='Confirmado';      -- ERROR: RLS lo frena
--   select count(*) from perfiles;             -- sólo se ve a sí mismo
