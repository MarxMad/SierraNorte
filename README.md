# Expediciones Sierra Norte — Dashboard

App de Next.js 16 con Supabase: reservas, comunidades, liquidación y banca, con
login y **cuatro roles** que deciden quién ve qué.

## Puesta en marcha

### 1. Crear el proyecto en Supabase

En [supabase.com](https://supabase.com) → **New project**. Guarda la contraseña de la base.

### 2. Cargar la base de datos

En Supabase → **SQL Editor**, corre los archivos de
`../Dashboard turismo Monday.com/supabase/migrations/` **en orden**:

```
01_schema.sql          → tablas, tipos, triggers
02_seed_catalogo.sql   → 10 comunidades y 33 paquetes con itinerarios y comedores
03_views.sql           → vistas de liquidación y banca
04_seed_operacion.sql  → reservas/pagos/gastos de ejemplo (BORRAR en producción)
05_rls.sql             → seguridad base
06_roles_rls.sql       → roles y permisos  ← IMPORTANTE, va al final
```

### 3. Variables de entorno

Copia `.env.local.example` a `.env.local` y llénalo con lo que ves en
Supabase → **Project Settings → API**:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

La `anon key` es pública por diseño (viaja al navegador de todos modos). Lo que
protege los datos es el RLS de Postgres, no la llave.

### 4. Correr

```bash
npm install
npm run dev
```

### 5. Crear el primer administrador

1. Entra a `/login` → **Crear una cuenta**.
2. En Supabase → SQL Editor:

```sql
update perfiles set rol = 'admin' where email = 'tu-correo@ejemplo.com';
```

3. Vuelve a entrar. Ya puedes asignar roles al resto desde **Usuarios**.

## Los cuatro roles

| Rol | Ve | Puede escribir |
|---|---|---|
| **admin** | Todo | Todo, incluidos los usuarios |
| **ventas** | Ventas, Comunidades, Calendario | Reservas, paquetes, checklist |
| **comunidad** | Sólo SU comunidad y Liquidación | El checklist de su pueblo y sus gastos |
| **finanzas** | Banca, Liquidación, Ventas, Calendario | Pagos, gastos, marcar liquidado |

El coordinador de comunidad **no ve los pagos de los clientes** y **no puede marcar
el checklist de otro pueblo**. Está verificado contra un Postgres real.

Los permisos viven en dos lugares y los dos importan:

- `src/lib/permisos.ts` decide **qué se muestra** en la interfaz.
- El **RLS de Postgres** decide **qué se permite**. Es el que manda: aunque alguien
  burle la interfaz, la base lo frena.

## Estructura

```
src/
  proxy.ts                    Refresca la sesión y bloquea rutas sin login
  lib/
    supabase/{client,server}  Clientes de Supabase (navegador / servidor)
    sesion.ts                 perfilActual() y exigirAcceso()
    permisos.ts               Qué ve cada rol
    tipos.ts                  Tipos del dominio y paleta
  app/
    login/                    Acceso y registro
    acciones.ts               Server Actions (todas las escrituras)
    (dash)/
      ventas/                 Clientes y paquetes
      comunidades/[id]/       Operación y checklist de dos niveles
      liquidacion/            Por venta, por concepto, por comunidad, gastos
      banca/                  Pagos, resumen financiero, rentabilidad
      calendario/             Salidas del mes
      admin/                  Roles de usuarios
```

## Cómo funciona la liquidación

No se captura: **se deriva**. La vista `v_liquidacion_conceptos` la arma en vivo
uniendo comedores, items del itinerario, transporte y anfitrión. El monto de los
comedores es *por persona* y se multiplica por los pax reales de las reservas.

Consecuencia: **capturas el precio una vez y todo se recalcula solo** — el costo de
la venta, el margen, lo que se le debe a cada comunidad y los KPIs de Banca.

## Desplegar en Vercel

```bash
npx vercel
```

Agrega las dos variables de entorno en el panel de Vercel. Listo.

## Pendiente

**Los precios están en cero.** El PDF del catálogo no traía tarifas. Hay que capturar
el precio de venta de cada paquete y el costo de comedores, senderos y hospedajes.
En cuanto lo hagas, la Liquidación empieza a dar totales reales.

**El editor de comedores** (la tabla editable con el monto por persona) todavía no
está portado al modal de paquete. Por ahora esos montos se capturan por SQL.
