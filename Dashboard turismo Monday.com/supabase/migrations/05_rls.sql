-- =====================================================================
-- 05 · RLS (Row Level Security)
-- Modelo simple para la cooperativa: cualquier usuario autenticado
-- del equipo puede leer y escribir. El público (anon) no ve nada.
--
-- Si más adelante quieres que cada comunidad sólo vea SU operación,
-- al final de este archivo está el esqueleto para hacerlo.
-- =====================================================================

alter table comunidades          enable row level security;
alter table guias                enable row level security;
alter table paquetes             enable row level security;
alter table paquete_comunidades  enable row level security;
alter table itinerario_dias      enable row level security;
alter table itinerario_items     enable row level security;
alter table comedores            enable row level security;
alter table servicios            enable row level security;
alter table reservas             enable row level security;
alter table pagos                enable row level security;
alter table gastos               enable row level security;
alter table checklist_general    enable row level security;
alter table checklist_comunidad  enable row level security;
alter table checklist_plantilla  enable row level security;
alter table liquidacion_estado   enable row level security;

-- Acceso total para el equipo autenticado
do $$
declare t text;
begin
  foreach t in array array[
    'comunidades','guias','paquetes','paquete_comunidades','itinerario_dias',
    'itinerario_items','comedores','servicios','reservas','pagos','gastos',
    'checklist_general','checklist_comunidad','checklist_plantilla','liquidacion_estado'
  ] loop
    execute format('drop policy if exists equipo_todo on %I', t);
    execute format($f$
      create policy equipo_todo on %I
        for all
        to authenticated
        using (true)
        with check (true)
    $f$, t);
  end loop;
end $$;

-- El catálogo puede ser público de lectura (útil para la web de ventas).
-- Descomenta si lo quieres abrir:
--
-- do $$
-- declare t text;
-- begin
--   foreach t in array array['comunidades','paquetes','paquete_comunidades',
--                            'itinerario_dias','itinerario_items','servicios'] loop
--     execute format('drop policy if exists catalogo_publico on %I', t);
--     execute format('create policy catalogo_publico on %I for select to anon using (true)', t);
--   end loop;
-- end $$;

-- ---------------------------------------------------------------------
-- OPCIONAL — acceso por comunidad
-- ---------------------------------------------------------------------
-- create table if not exists usuarios_comunidad (
--   user_id      uuid primary key references auth.users(id) on delete cascade,
--   comunidad_id text not null references comunidades(id),
--   rol          text not null default 'coordinador'   -- 'admin' ve todo
-- );
--
-- Ejemplo: el coordinador de una comunidad sólo confirma SU checklist
-- drop policy if exists equipo_todo on checklist_comunidad;
-- create policy checklist_de_mi_comunidad on checklist_comunidad
--   for all to authenticated
--   using (
--     exists (select 1 from usuarios_comunidad u
--              where u.user_id = auth.uid()
--                and (u.rol = 'admin' or u.comunidad_id = checklist_comunidad.comunidad_id))
--   )
--   with check (
--     exists (select 1 from usuarios_comunidad u
--              where u.user_id = auth.uid()
--                and (u.rol = 'admin' or u.comunidad_id = checklist_comunidad.comunidad_id))
--   );
