-- =====================================================================
-- 18 · EL PAQUETE ES CATÁLOGO; EL STATUS ES DE LA OPERACIÓN
--
-- El formulario pedía capturar un status (Planeación / Confirmado / En
-- Curso / Finalizado) para el PAQUETE. Pero un paquete es catálogo: la
-- ficha de la experiencia que se consulta al reservar. El que avanza de
-- estado es el grupo que sale, no la ficha.
--
-- Así que el status deja de capturarse y se DERIVA de las reservas:
--
--   sin reservas → Planeación (nadie va todavía)
--   con reservas → el estado MENOS avanzado de sus reservas
--
-- El menos avanzado, no el más: si una reserva sigue en Planeación, la
-- salida no está lista. Es lo honesto para operar.
--
-- La columna `paquetes.status` se queda (todas las vistas la usan), pero
-- ahora la mantiene la base, no una persona.
-- =====================================================================

-- Qué tan avanzado está un estado
create or replace function orden_status(s status_operativo)
returns int language sql immutable as $$
  select case s
    when 'Planeación' then 1
    when 'Confirmado' then 2
    when 'En Curso'   then 3
    when 'Finalizado' then 4
  end;
$$;

-- El status que le toca a un paquete según sus reservas
create or replace function status_derivado(p_paquete_id text)
returns status_operativo language sql stable as $$
  select coalesce(
    (select r.status
       from reservas r
      where r.paquete_id = p_paquete_id
      order by orden_status(r.status)
      limit 1),
    'Planeación'::status_operativo
  );
$$;

-- ---------------------------------------------------------------------
-- El status del paquete NO se acepta de quien escriba: se calcula.
-- Esto vale para el formulario, para `guardar_paquete_completo` y para
-- cualquier otra cosa que toque la tabla. La columna nunca miente.
-- ---------------------------------------------------------------------
create or replace function paquetes_status_derivado()
returns trigger language plpgsql as $$
begin
  new.status := status_derivado(new.id);
  return new;
end $$;

drop trigger if exists trg_paquetes_status on paquetes;
create trigger trg_paquetes_status before insert or update on paquetes
  for each row execute function paquetes_status_derivado();

-- ---------------------------------------------------------------------
-- Y cuando cambia una reserva, su paquete se recalcula.
-- En un DELETE no existe NEW, y en un INSERT no existe OLD: por eso se
-- arma el arreglo según la operación.
-- security definer: quien mueve reservas no necesariamente puede tocar
-- la tabla de paquetes.
-- ---------------------------------------------------------------------
create or replace function reservas_actualiza_status_paquete()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_ids text[] := '{}';
begin
  if tg_op in ('INSERT', 'UPDATE') and new.paquete_id is not null then
    v_ids := v_ids || new.paquete_id;
  end if;
  if tg_op in ('UPDATE', 'DELETE') and old.paquete_id is not null then
    v_ids := v_ids || old.paquete_id;
  end if;

  if array_length(v_ids, 1) > 0 then
    -- el trigger de paquetes recalcula el status solo; esto sólo lo despierta
    update paquetes p
       set status = status_derivado(p.id)
     where p.id = any (v_ids);
  end if;

  return null;
end $$;

drop trigger if exists trg_reservas_status_paquete on reservas;
create trigger trg_reservas_status_paquete
  after insert or delete or update of status, paquete_id on reservas
  for each row execute function reservas_actualiza_status_paquete();

-- ---------------------------------------------------------------------
-- Ponerlos al día de una vez
-- ---------------------------------------------------------------------
update paquetes p set status = status_derivado(p.id)
 where p.status is distinct from status_derivado(p.id);

-- ---------------------------------------------------------------------
-- Comprobación
-- ---------------------------------------------------------------------
--   insert into reservas (...) values (...);            -- paquete → Planeación
--   update reservas set status='Confirmado' where ...;  -- paquete → Confirmado
--   insert into reservas (...) otra en Planeación;      -- paquete → Planeación
