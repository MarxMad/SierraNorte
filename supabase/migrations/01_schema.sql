-- =====================================================================
-- Expediciones Sierra Norte — Pueblos Mancomunados
-- 01 · ESQUEMA
-- =====================================================================
-- Modelo:
--   comunidades ─┬─ paquete_comunidades ─ paquetes ─┬─ itinerario_dias ─ itinerario_items
--                │                                   ├─ comedores        (se liquidan DIRECTO)
--                │                                   ├─ servicios        (venta individual)
--                │                                   └─ reservas ─ pagos
--                └─ gastos (facturas)
--
--   La LIQUIDACIÓN no se captura: se DERIVA (ver 03_views.sql) de comedores,
--   itinerario_items, transporte y anfitrión. Sólo se guarda su ESTADO
--   (liquidado / monto override) en `liquidacion_estado`.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- TIPOS
-- ---------------------------------------------------------------------
do $$ begin
  create type duracion_paquete as enum ('1 día','2 días','3 días','4 días','5 días','7 días','Servicios');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_operativo as enum ('Planeación','Confirmado','En Curso','Finalizado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type metodo_pago as enum ('Efectivo','Transfer/Tarjeta','Pago en comunidad');
exception when duplicate_object then null; end $$;

do $$ begin
  create type plataforma_pago as enum ('WeTravel','PayPal','BBVA Transfer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_pago as enum ('Pendiente','Confirmado','Vencido','Devuelto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_comida as enum ('Desayuno','Comida','Cena','Box lunch');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_liquidacion as enum ('Comedor','Sendero','Hospedaje','Actividad','Taller','Transporte','Anfitrión');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- COMUNIDADES
-- ---------------------------------------------------------------------
create table if not exists comunidades (
  id          text primary key,              -- 'cuajimoloyas'
  nombre      text not null unique,          -- 'Cuajimoloyas'
  color       text not null,                 -- '#1F7D5E'
  orden       int  not null default 0,
  activa      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- GUÍAS
-- ---------------------------------------------------------------------
create table if not exists guias (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null unique,
  telefono    text,
  comunidad_id text references comunidades(id) on delete set null,
  bilingue    boolean not null default false,
  idiomas     text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- PAQUETES  (catálogo de experiencias)
-- ---------------------------------------------------------------------
create table if not exists paquetes (
  id            text primary key,            -- 'p01' … 'p33'
  nombre        text not null,
  duracion      duracion_paquete not null,
  descripcion   text,
  precio        numeric(12,2) not null default 0,   -- precio de venta por persona
  fecha_inicio  date,
  fecha_fin     date,
  status        status_operativo not null default 'Planeación',

  -- anfitrión bilingüe (uno por salida)
  anfitrion_nombre   text,
  anfitrion_idiomas  text default 'Español / Inglés',
  anfitrion_telefono text,
  anfitrion_monto    numeric(12,2) not null default 0,

  -- transporte de la salida
  transporte_proveedor text,
  transporte_tipo      text default 'Van',
  transporte_ruta      text,
  transporte_monto     numeric(12,2) not null default 0,

  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_paquetes_updated on paquetes;
create trigger trg_paquetes_updated before update on paquetes
  for each row execute function set_updated_at();

-- Comunidades que participan en cada paquete (N:N)
create table if not exists paquete_comunidades (
  paquete_id    text not null references paquetes(id) on delete cascade,
  comunidad_id  text not null references comunidades(id) on delete cascade,
  orden         int  not null default 0,
  primary key (paquete_id, comunidad_id)
);
create index if not exists idx_paqcom_comunidad on paquete_comunidades(comunidad_id);

-- ---------------------------------------------------------------------
-- ITINERARIO
-- ---------------------------------------------------------------------
create table if not exists itinerario_dias (
  id          uuid primary key default gen_random_uuid(),
  paquete_id  text not null references paquetes(id) on delete cascade,
  dia         int  not null check (dia > 0),
  recorrido   text not null,                 -- 'Benito Juárez → La Nevería'
  unique (paquete_id, dia)
);
create index if not exists idx_dias_paquete on itinerario_dias(paquete_id);

create table if not exists itinerario_items (
  id            uuid primary key default gen_random_uuid(),
  dia_id        uuid not null references itinerario_dias(id) on delete cascade,
  orden         int  not null default 0,
  texto         text not null,               -- 'Sendero – Ruta El Calvario · 8 km · 3 h'
  tipo          tipo_liquidacion,            -- NULL = no se liquida
  comunidad_id  text references comunidades(id) on delete set null,
  monto         numeric(12,2) not null default 0,   -- costo unitario (0 = por capturar)
  por_persona   boolean not null default false      -- si true, el costo se multiplica por pax
);
create index if not exists idx_items_dia on itinerario_items(dia_id);
create index if not exists idx_items_tipo on itinerario_items(tipo);

-- ---------------------------------------------------------------------
-- COMEDORES  — se liquidan DIRECTO al prestador, monto POR PERSONA
-- ---------------------------------------------------------------------
create table if not exists comedores (
  id                uuid primary key default gen_random_uuid(),
  paquete_id        text not null references paquetes(id) on delete cascade,
  dia               int  not null default 1,
  comunidad_id      text references comunidades(id) on delete set null,
  recorrido         text,                    -- texto libre del día
  nombre            text not null,           -- 'Restaurante Marlen'
  tipo              tipo_comida not null,
  monto_por_persona numeric(12,2) not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
drop trigger if exists trg_comedores_updated on comedores;
create trigger trg_comedores_updated before update on comedores
  for each row execute function set_updated_at();
create index if not exists idx_comedores_paquete on comedores(paquete_id);
create index if not exists idx_comedores_comunidad on comedores(comunidad_id);

-- ---------------------------------------------------------------------
-- SERVICIOS INDIVIDUALES  (venta suelta / à la carte)
-- ---------------------------------------------------------------------
create table if not exists servicios (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  unidad        text not null default 'por persona',   -- 'por día','por viaje'…
  comunidad_id  text references comunidades(id) on delete set null,
  precio        numeric(12,2) not null default 0,
  activo        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RESERVAS  (clientes)
-- ---------------------------------------------------------------------
create table if not exists reservas (
  id            uuid primary key default gen_random_uuid(),
  codigo        text not null unique,        -- 'ESN-2607-001'
  nombre        text not null,
  email         text,
  telefono      text,

  paquete_id    text references paquetes(id) on delete restrict,
  personas      int  not null default 1 check (personas > 0),
  ninos         boolean not null default false,
  num_ninos     int  not null default 0 check (num_ninos >= 0),

  fecha_inicio  date,
  fecha_fin     date,
  precio        numeric(12,2) not null default 0,   -- precio total de la reserva

  metodo_pago   metodo_pago not null default 'Efectivo',
  plataforma    plataforma_pago,                    -- sólo si metodo = Transfer/Tarjeta

  guia_id       uuid references guias(id) on delete set null,
  transporte    text,

  status        status_operativo not null default 'Planeación',
  notas         text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint chk_ninos      check (num_ninos <= personas),
  constraint chk_ninos_flag check ((ninos and num_ninos > 0) or (not ninos and num_ninos = 0)),
  -- la plataforma sólo aplica a transferencia/tarjeta
  constraint chk_plataforma check (
    (metodo_pago = 'Transfer/Tarjeta' and plataforma is not null)
    or (metodo_pago <> 'Transfer/Tarjeta' and plataforma is null)
  )
);
drop trigger if exists trg_reservas_updated on reservas;
create trigger trg_reservas_updated before update on reservas
  for each row execute function set_updated_at();
create index if not exists idx_reservas_paquete on reservas(paquete_id);
create index if not exists idx_reservas_status  on reservas(status);
create index if not exists idx_reservas_fecha   on reservas(fecha_inicio);

-- Folio automático: ESN-AAMM-NNN
create or replace function siguiente_codigo_reserva()
returns text language plpgsql as $$
declare
  pref text := 'ESN-' || to_char(now(),'YYMM') || '-';
  n    int;
begin
  select coalesce(max(substring(codigo from '\d+$')::int), 0) + 1
    into n
    from reservas
   where codigo like pref || '%';
  return pref || lpad(n::text, 3, '0');
end $$;

create or replace function reservas_codigo_default()
returns trigger language plpgsql as $$
begin
  if new.codigo is null or new.codigo = '' then
    new.codigo := siguiente_codigo_reserva();
  end if;
  return new;
end $$;
drop trigger if exists trg_reservas_codigo on reservas;
create trigger trg_reservas_codigo before insert on reservas
  for each row execute function reservas_codigo_default();

-- ---------------------------------------------------------------------
-- PAGOS  (Banca) — un pago pertenece a una reserva
-- ---------------------------------------------------------------------
create table if not exists pagos (
  id            uuid primary key default gen_random_uuid(),
  reserva_id    uuid not null references reservas(id) on delete cascade,
  monto         numeric(12,2) not null check (monto > 0),
  fecha         date not null default current_date,
  metodo_pago   metodo_pago not null default 'Efectivo',
  plataforma    plataforma_pago,
  status        status_pago not null default 'Pendiente',
  referencia    text,                        -- n° de transacción
  comprobante_url text,
  notas         text,
  confirmado_en timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint chk_pago_plataforma check (
    (metodo_pago = 'Transfer/Tarjeta' and plataforma is not null)
    or (metodo_pago <> 'Transfer/Tarjeta' and plataforma is null)
  )
);
drop trigger if exists trg_pagos_updated on pagos;
create trigger trg_pagos_updated before update on pagos
  for each row execute function set_updated_at();
create index if not exists idx_pagos_reserva on pagos(reserva_id);
create index if not exists idx_pagos_status  on pagos(status);

-- sella la fecha de confirmación
create or replace function pagos_sella_confirmacion()
returns trigger language plpgsql as $$
begin
  if new.status = 'Confirmado' and (old.status is distinct from 'Confirmado') then
    new.confirmado_en := now();
  end if;
  return new;
end $$;
drop trigger if exists trg_pagos_confirm on pagos;
create trigger trg_pagos_confirm before update on pagos
  for each row execute function pagos_sella_confirmacion();

-- ---------------------------------------------------------------------
-- GASTOS  (facturas)
-- ---------------------------------------------------------------------
create table if not exists gastos (
  id            uuid primary key default gen_random_uuid(),
  fecha         date not null default current_date,
  proveedor     text not null,
  concepto      text not null,
  folio         text,                                  -- NULL = sin factura
  subtotal      numeric(12,2) not null default 0 check (subtotal >= 0),
  iva           numeric(12,2) not null default 0 check (iva >= 0),
  total         numeric(12,2) generated always as (subtotal + iva) stored,
  con_factura   boolean not null default true,
  archivo_url   text,
  paquete_id    text references paquetes(id) on delete set null,
  comunidad_id  text references comunidades(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint chk_factura check (
    (con_factura and folio is not null) or (not con_factura)
  )
);
drop trigger if exists trg_gastos_updated on gastos;
create trigger trg_gastos_updated before update on gastos
  for each row execute function set_updated_at();
create index if not exists idx_gastos_paquete   on gastos(paquete_id);
create index if not exists idx_gastos_comunidad on gastos(comunidad_id);
create index if not exists idx_gastos_fecha     on gastos(fecha);

-- ---------------------------------------------------------------------
-- CHECKLIST DE OPERACIÓN (dos niveles)
--   general    → una vez por paquete
--   comunidad  → una vez por (paquete, comunidad)
-- ---------------------------------------------------------------------
create table if not exists checklist_general (
  id          uuid primary key default gen_random_uuid(),
  paquete_id  text not null references paquetes(id) on delete cascade,
  item        text not null,
  completado  boolean not null default false,
  completado_en timestamptz,
  unique (paquete_id, item)
);

create table if not exists checklist_comunidad (
  id            uuid primary key default gen_random_uuid(),
  paquete_id    text not null references paquetes(id) on delete cascade,
  comunidad_id  text not null references comunidades(id) on delete cascade,
  item          text not null,
  completado    boolean not null default false,
  completado_en timestamptz,
  unique (paquete_id, comunidad_id, item)
);
create index if not exists idx_chkcom_paquete on checklist_comunidad(paquete_id);

-- sella cuándo se completó
create or replace function checklist_sella()
returns trigger language plpgsql as $$
begin
  if new.completado and not coalesce(old.completado,false) then
    new.completado_en := now();
  elsif not new.completado then
    new.completado_en := null;
  end if;
  return new;
end $$;
drop trigger if exists trg_chkgen_sella on checklist_general;
create trigger trg_chkgen_sella before update on checklist_general
  for each row execute function checklist_sella();
drop trigger if exists trg_chkcom_sella on checklist_comunidad;
create trigger trg_chkcom_sella before update on checklist_comunidad
  for each row execute function checklist_sella();

-- Items estándar (se siembran a cada paquete nuevo)
create table if not exists checklist_plantilla (
  id      serial primary key,
  ambito  text not null check (ambito in ('general','comunidad')),
  item    text not null,
  orden   int  not null default 0,
  unique (ambito, item)
);

-- Al crear un paquete, se genera su checklist a partir de la plantilla
create or replace function sembrar_checklist_paquete()
returns trigger language plpgsql as $$
begin
  insert into checklist_general (paquete_id, item)
  select new.id, p.item from checklist_plantilla p where p.ambito = 'general'
  on conflict do nothing;
  return new;
end $$;
drop trigger if exists trg_paquete_checklist on paquetes;
create trigger trg_paquete_checklist after insert on paquetes
  for each row execute function sembrar_checklist_paquete();

-- Al ligar una comunidad a un paquete, se genera su checklist de comunidad
create or replace function sembrar_checklist_comunidad()
returns trigger language plpgsql as $$
begin
  insert into checklist_comunidad (paquete_id, comunidad_id, item)
  select new.paquete_id, new.comunidad_id, p.item
    from checklist_plantilla p where p.ambito = 'comunidad'
  on conflict do nothing;
  return new;
end $$;
drop trigger if exists trg_paqcom_checklist on paquete_comunidades;
create trigger trg_paqcom_checklist after insert on paquete_comunidades
  for each row execute function sembrar_checklist_comunidad();

-- ---------------------------------------------------------------------
-- ESTADO DE LIQUIDACIÓN
--   Los conceptos NO se guardan: se derivan (ver 03_views.sql).
--   Aquí sólo vive su estado y, si hace falta, un monto que sobreescribe
--   al del catálogo.
-- ---------------------------------------------------------------------
create table if not exists liquidacion_estado (
  origen          text not null check (origen in ('comedor','item','transporte','anfitrion')),
  origen_id       text not null,             -- uuid del comedor/item, o paquete_id
  liquidado       boolean not null default false,
  fecha_liquidacion date,
  monto_override  numeric(12,2),             -- si se pagó distinto a lo presupuestado
  pagado_por      text,
  notas           text,
  updated_at      timestamptz not null default now(),
  primary key (origen, origen_id)
);
drop trigger if exists trg_liqestado_updated on liquidacion_estado;
create trigger trg_liqestado_updated before update on liquidacion_estado
  for each row execute function set_updated_at();

-- Marca / desmarca un concepto como liquidado (idempotente)
create or replace function marcar_liquidado(
  p_origen text, p_origen_id text, p_liquidado boolean default true, p_monto numeric default null
) returns void language sql as $$
  insert into liquidacion_estado (origen, origen_id, liquidado, fecha_liquidacion, monto_override)
  values (p_origen, p_origen_id, p_liquidado,
          case when p_liquidado then current_date else null end, p_monto)
  on conflict (origen, origen_id) do update
    set liquidado = excluded.liquidado,
        fecha_liquidacion = excluded.fecha_liquidacion,
        monto_override = coalesce(excluded.monto_override, liquidacion_estado.monto_override),
        updated_at = now();
$$;
