-- =====================================================================
-- 08 · CATÁLOGO PÚBLICO
--
-- Abre a lectura ANÓNIMA sólo lo que la landing necesita mostrar:
-- comunidades, paquetes, itinerarios y servicios.
--
-- NO se abre nada sensible: reservas, pagos, gastos, checklist y
-- liquidación siguen exigiendo sesión con rol.
-- =====================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'comunidades','paquetes','paquete_comunidades',
    'itinerario_dias','itinerario_items','servicios'
  ] loop
    execute format('drop policy if exists catalogo_publico on %I', t);
    execute format('create policy catalogo_publico on %I for select to anon using (true)', t);
  end loop;
end $$;

-- Los comedores llevan el nombre del prestador y su tarifa: no se exponen.
-- Si algún día quieres mostrarlos en la web, descomenta:
-- create policy comedores_publico on comedores for select to anon using (true);

-- ---------------------------------------------------------------------
-- Verifica qué puede ver un visitante sin cuenta
-- ---------------------------------------------------------------------
-- set role anon;
-- select count(*) from paquetes;   -- 33
-- select count(*) from reservas;   -- 0  (bloqueado, correcto)
-- reset role;
