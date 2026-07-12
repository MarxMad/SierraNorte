-- =====================================================================
-- 17 · GUARDAR UN PAQUETE COMPLETO
--
-- El formulario de paquete sólo escribía en `paquetes`. Nunca tocaba
-- `paquete_comunidades`, ni el itinerario, ni los comedores. Resultado:
-- un paquete creado desde la app no aparecía en Comunidades, no sembraba
-- checklist, y en Liquidación su costo salía casi en cero (sólo
-- transporte y anfitrión) — con un margen falso del 100%.
--
-- Esta función guarda las cuatro tablas de un golpe, en una transacción.
--
-- CLAVE: no borra y reinserta a lo tonto. Lo que ya existe se ACTUALIZA,
-- porque `liquidacion_estado` apunta al uuid del item y del comedor: si
-- se reinsertaran, se perdería lo que ya estaba marcado como liquidado.
-- Sólo se borra lo que el usuario quitó de verdad.
--
-- Corre con los permisos de quien llama (security invoker): el RLS del
-- catálogo ya deja escribir sólo a admin y ventas.
-- =====================================================================

create or replace function guardar_paquete_completo(
  p_paquete     jsonb,          -- {id, nombre, duracion, precio, ...}
  p_comunidades text[],         -- ['cuajimoloyas','latuvi'] en orden de visita
  p_dias        jsonb,          -- [{id?, dia, recorrido, items:[{id?, texto, tipo, comunidad_id, monto, por_persona}]}]
  p_comedores   jsonb           -- [{id?, dia, comunidad_id, nombre, tipo, monto_por_persona}]
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_pid       text := p_paquete->>'id';
  v_dia       jsonb;
  v_item      jsonb;
  v_com       jsonb;
  v_dia_id    uuid;
  v_nuevo_id  uuid;
  v_dia_ids   uuid[] := '{}';   -- los días que sobreviven
  v_item_ids  uuid[] := '{}';   -- los items que sobreviven (de TODO el paquete)
  v_comed_ids uuid[] := '{}';   -- los comedores que sobreviven
  i           int;
begin
  if coalesce(trim(v_pid), '') = '' then
    raise exception 'El paquete necesita un id';
  end if;
  if coalesce(trim(p_paquete->>'nombre'), '') = '' then
    raise exception 'El paquete necesita un nombre';
  end if;

  -- -------------------------------------------------------------------
  -- 1) EL PAQUETE
  -- -------------------------------------------------------------------
  insert into paquetes (
    id, nombre, duracion, descripcion, precio, fecha_inicio, fecha_fin, status,
    anfitrion_nombre, anfitrion_idiomas, anfitrion_monto,
    transporte_proveedor, transporte_tipo, transporte_ruta, transporte_monto
  ) values (
    v_pid,
    p_paquete->>'nombre',
    (p_paquete->>'duracion')::duracion_paquete,
    nullif(p_paquete->>'descripcion', ''),
    coalesce((p_paquete->>'precio')::numeric, 0),
    nullif(p_paquete->>'fecha_inicio', '')::date,
    nullif(p_paquete->>'fecha_fin', '')::date,
    coalesce((p_paquete->>'status')::status_operativo, 'Planeación'),
    nullif(p_paquete->>'anfitrion_nombre', ''),
    nullif(p_paquete->>'anfitrion_idiomas', ''),
    coalesce((p_paquete->>'anfitrion_monto')::numeric, 0),
    nullif(p_paquete->>'transporte_proveedor', ''),
    nullif(p_paquete->>'transporte_tipo', ''),
    nullif(p_paquete->>'transporte_ruta', ''),
    coalesce((p_paquete->>'transporte_monto')::numeric, 0)
  )
  on conflict (id) do update set
    nombre               = excluded.nombre,
    duracion             = excluded.duracion,
    descripcion          = excluded.descripcion,
    precio               = excluded.precio,
    fecha_inicio         = excluded.fecha_inicio,
    fecha_fin            = excluded.fecha_fin,
    status               = excluded.status,
    anfitrion_nombre     = excluded.anfitrion_nombre,
    anfitrion_idiomas    = excluded.anfitrion_idiomas,
    anfitrion_monto      = excluded.anfitrion_monto,
    transporte_proveedor = excluded.transporte_proveedor,
    transporte_tipo      = excluded.transporte_tipo,
    transporte_ruta      = excluded.transporte_ruta,
    transporte_monto     = excluded.transporte_monto;

  -- -------------------------------------------------------------------
  -- 2) COMUNIDADES INVOLUCRADAS
  --    Al ligar una comunidad, un trigger le siembra su checklist.
  -- -------------------------------------------------------------------
  delete from paquete_comunidades
   where paquete_id = v_pid
     and comunidad_id <> all (coalesce(p_comunidades, '{}'::text[]));

  for i in 1 .. coalesce(array_length(p_comunidades, 1), 0) loop
    insert into paquete_comunidades (paquete_id, comunidad_id, orden)
    values (v_pid, p_comunidades[i], i)
    on conflict (paquete_id, comunidad_id) do update set orden = excluded.orden;
  end loop;

  -- -------------------------------------------------------------------
  -- 3) ITINERARIO — días y sus items
  -- -------------------------------------------------------------------
  for v_dia in select * from jsonb_array_elements(coalesce(p_dias, '[]'::jsonb)) loop

    -- el día: se actualiza si ya existía, si no se crea
    if nullif(v_dia->>'id', '') is not null then
      v_dia_id := (v_dia->>'id')::uuid;
      update itinerario_dias
         set dia       = (v_dia->>'dia')::int,
             recorrido = coalesce(nullif(v_dia->>'recorrido', ''), 'Día ' || (v_dia->>'dia'))
       where id = v_dia_id;
    else
      insert into itinerario_dias (paquete_id, dia, recorrido)
      values (
        v_pid,
        (v_dia->>'dia')::int,
        coalesce(nullif(v_dia->>'recorrido', ''), 'Día ' || (v_dia->>'dia'))
      )
      on conflict (paquete_id, dia) do update set recorrido = excluded.recorrido
      returning id into v_dia_id;
    end if;

    v_dia_ids := v_dia_ids || v_dia_id;

    -- los items de ese día
    for v_item in select * from jsonb_array_elements(coalesce(v_dia->'items', '[]'::jsonb)) loop
      if nullif(v_item->>'id', '') is not null then
        update itinerario_items
           set dia_id       = v_dia_id,
               orden        = coalesce((v_item->>'orden')::int, 0),
               texto        = v_item->>'texto',
               tipo         = nullif(v_item->>'tipo', '')::tipo_liquidacion,
               comunidad_id = nullif(v_item->>'comunidad_id', ''),
               monto        = coalesce((v_item->>'monto')::numeric, 0),
               por_persona  = coalesce((v_item->>'por_persona')::boolean, false)
         where id = (v_item->>'id')::uuid;

        v_item_ids := v_item_ids || (v_item->>'id')::uuid;
      else
        insert into itinerario_items (dia_id, orden, texto, tipo, comunidad_id, monto, por_persona)
        values (
          v_dia_id,
          coalesce((v_item->>'orden')::int, 0),
          v_item->>'texto',
          nullif(v_item->>'tipo', '')::tipo_liquidacion,
          nullif(v_item->>'comunidad_id', ''),
          coalesce((v_item->>'monto')::numeric, 0),
          coalesce((v_item->>'por_persona')::boolean, false)
        )
        returning id into v_nuevo_id;

        v_item_ids := v_item_ids || v_nuevo_id;
      end if;
    end loop;
  end loop;

  -- lo que el usuario quitó del itinerario
  delete from itinerario_items it
   using itinerario_dias d
   where it.dia_id = d.id
     and d.paquete_id = v_pid
     and it.id <> all (v_item_ids);

  delete from itinerario_dias
   where paquete_id = v_pid
     and id <> all (v_dia_ids);

  -- -------------------------------------------------------------------
  -- 4) COMEDORES — se liquidan DIRECTO, el monto es POR PERSONA
  -- -------------------------------------------------------------------
  for v_com in select * from jsonb_array_elements(coalesce(p_comedores, '[]'::jsonb)) loop
    if nullif(v_com->>'id', '') is not null then
      update comedores
         set dia               = coalesce((v_com->>'dia')::int, 1),
             comunidad_id      = nullif(v_com->>'comunidad_id', ''),
             recorrido         = nullif(v_com->>'recorrido', ''),
             nombre            = v_com->>'nombre',
             tipo              = (v_com->>'tipo')::tipo_comida,
             monto_por_persona = coalesce((v_com->>'monto_por_persona')::numeric, 0)
       where id = (v_com->>'id')::uuid;

      v_comed_ids := v_comed_ids || (v_com->>'id')::uuid;
    else
      insert into comedores (paquete_id, dia, comunidad_id, recorrido, nombre, tipo, monto_por_persona)
      values (
        v_pid,
        coalesce((v_com->>'dia')::int, 1),
        nullif(v_com->>'comunidad_id', ''),
        nullif(v_com->>'recorrido', ''),
        v_com->>'nombre',
        (v_com->>'tipo')::tipo_comida,
        coalesce((v_com->>'monto_por_persona')::numeric, 0)
      )
      returning id into v_nuevo_id;

      v_comed_ids := v_comed_ids || v_nuevo_id;
    end if;
  end loop;

  delete from comedores
   where paquete_id = v_pid
     and id <> all (v_comed_ids);

  return v_pid;
end $$;

revoke all on function guardar_paquete_completo(jsonb, text[], jsonb, jsonb) from public;
grant execute on function guardar_paquete_completo(jsonb, text[], jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- Leer un paquete con TODO su detalle, para poder editarlo
-- ---------------------------------------------------------------------
create or replace view v_paquete_detalle as
select
  p.id as paquete_id,
  (select coalesce(array_agg(pc.comunidad_id order by pc.orden), '{}')
     from paquete_comunidades pc where pc.paquete_id = p.id)          as comunidades_ids,
  coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', d.id, 'dia', d.dia, 'recorrido', d.recorrido,
             'items', coalesce((
               select jsonb_agg(jsonb_build_object(
                        'id', it.id, 'orden', it.orden, 'texto', it.texto,
                        'tipo', it.tipo, 'comunidad_id', it.comunidad_id,
                        'monto', it.monto, 'por_persona', it.por_persona
                      ) order by it.orden)
                 from itinerario_items it where it.dia_id = d.id), '[]'::jsonb)
           ) order by d.dia)
      from itinerario_dias d where d.paquete_id = p.id), '[]'::jsonb) as dias,
  coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', cm.id, 'dia', cm.dia, 'comunidad_id', cm.comunidad_id,
             'recorrido', cm.recorrido, 'nombre', cm.nombre,
             'tipo', cm.tipo, 'monto_por_persona', cm.monto_por_persona
           ) order by cm.dia)
      from comedores cm where cm.paquete_id = p.id), '[]'::jsonb)     as comedores
from paquetes p;

alter view v_paquete_detalle set (security_invoker = on);
