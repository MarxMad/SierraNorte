# Expediciones Sierra Norte

Un repositorio, **dos aplicaciones** que comparten la misma base de datos:

| | Quién entra | Qué es | Cómo se sirve |
|---|---|---|---|
| **El sitio** | Cualquiera, sin cuenta | Portada, región, proyecto, quiénes somos y las 33 experiencias, en español e inglés | HTML ya hecho, se regenera cada hora |
| **El dashboard** | El equipo, con login | Ventas, comunidades, liquidación, banca, calendario y usuarios | Al vuelo, según quién eres |

Next.js 16 + Supabase (Postgres). Todo el texto de la interfaz está en español
porque el equipo trabaja en español; **sólo el sitio público es bilingüe**.

---

## La arquitectura en un dibujo

```
                    VISITANTE                        EQUIPO (con sesión)
                        │                                    │
                        ▼                                    ▼
              ┌───────────────────┐              ┌───────────────────────┐
              │   SITIO PÚBLICO   │              │      DASHBOARD        │
              │  / y /en          │              │  (dash)/…             │
              │                   │              │                       │
              │  estático, 1 h    │              │  dinámico, por rol    │
              └─────────┬─────────┘              └───────────┬───────────┘
                        │                                    │
       lee catálogo, sin cookies              lee y escribe, con la sesión
                        │                                    │
                        │        ┌──────────────┐            │
                        └───────▶│   SUPABASE   │◀───────────┘
   solicitar_reserva() ─────────▶│   Postgres   │
                                 │              │
                                 │   RLS = la   │
                                 │  ley. Manda  │
                                 │    la base.  │
                                 └──────────────┘
```

Las dos aplicaciones hablan con el **mismo** Postgres y con la **misma** llave
pública. Lo que las separa no es la llave: es **si hay sesión o no**, y el RLS
de Postgres decide el resto.

### Por qué hay tres clientes de Supabase

No es duplicación. Cada uno resuelve un problema distinto:

| Archivo | Quién lo usa | Por qué |
|---|---|---|
| `lib/supabase/publico.ts` | El sitio público | **No lee cookies.** Por eso la portada se puede congelar una hora y el visitante recibe HTML ya hecho, en vez de esperar cuatro consultas a la base. |
| `lib/supabase/server.ts` | El dashboard (servidor) | Lee la cookie de sesión: la base sabe **quién** pregunta y el RLS filtra en consecuencia. |
| `lib/supabase/client.ts` | El dashboard (navegador) | Lo que necesitan los componentes `"use client"`. |

Si el sitio público usara el cliente con cookies, Next tendría que renderizar la
portada **en cada visita**. Ese es todo el motivo de que `publico.ts` exista.

---

## Las dos reglas que explican casi todo el código

### 1. La base es la que manda

Los permisos viven en dos lugares, y los dos importan:

- **`lib/permisos.ts`** decide qué se **muestra** (los botones, el menú).
- **El RLS de Postgres** decide qué se **permite**.

El segundo es el que manda. Aunque alguien burle la interfaz, la base lo frena.
`permisos.ts` es un espejo del RLS, nunca al revés: si cambias uno, cambia el otro.

### 2. La liquidación no se captura: se deriva

La vista `v_liquidacion_conceptos` la arma en vivo uniendo comedores, items del
itinerario, transporte y anfitrión. El monto de los comedores es *por persona* y
se multiplica por los pax reales de las reservas.

Consecuencia: **capturas el precio una vez y todo se recalcula solo** — el costo
de la venta, el margen, lo que se le debe a cada comunidad y los KPIs de Banca.
No hay un botón de "recalcular" porque no hace falta.

---

## Quién ve qué

La regla de la cooperativa es que **la información es de todos**: cualquier
usuario con sesión **lee** toda la operación. Lo que cambia es **quién mueve qué**.

| Rol | Lee | Escribe |
|---|---|---|
| **admin** | Todo | Todo, y es el único que administra usuarios |
| **ventas** | Toda la operación | Reservas, paquetes, itinerario, checklist |
| **finanzas** | Toda la operación | Pagos, gastos, liquidación |
| **comunidad** | Toda la operación | El checklist y los gastos de **su** pueblo, y nada más |

*Usuarios* es la única sección que no es de todos: no es información de la
operación, es el control de quién entra. Sólo el admin.

---

## El idioma vive en la URL

Español es el idioma por defecto y su URL va limpia. El inglés lleva prefijo:

```
/                       /en
/region                 /en/region
/experiencias/p09       /en/experiencias/p09
```

Para no escribir dos veces cada página, **el cuerpo de la página vive una sola vez**
en `src/paginas/` y recibe el idioma como propiedad. Las rutas de `src/app/` son
cáscaras de tres líneas que dicen "esta es la versión en inglés de esta página".

Los textos de la interfaz están en `lib/i18n/`. Los textos del catálogo (nombres,
descripciones, itinerarios) viven en la base, en columnas `_en`; cuando falta la
traducción, `t()` cae al español en vez de dejar el hueco vacío.

Cada página declara sus propios idiomas alternos con `alternos()`. Eso es lo que
le dice a Google que `/en/region` **es** la versión en inglés de `/region` — y no
otra página que casualmente se le parece.

---

## El mapa del código

```
src/
  proxy.ts                    Refresca la sesión y bloquea el dashboard sin login
                              (en Next 16 esto se llama proxy, antes middleware)
  lib/
    supabase/publico.ts       Cliente sin cookies  → sitio público (cacheable)
    supabase/server.ts        Cliente con sesión   → dashboard
    supabase/client.ts        Cliente del navegador
    sesion.ts                 perfilActual() y exigirAcceso()
    permisos.ts               Qué ve y qué mueve cada rol (espejo del RLS)
    i18n/                     Textos de la interfaz, rutas y alternos por idioma
    contenido.ts              Textos fijos del sitio (contacto, equipo)
    fotos.ts                  Qué foto le toca a cada paquete y comunidad
    sitio.ts                  La URL pública (sitemap, canonical, compartir)
    tipos.ts                  Tipos del dominio y paleta

  paginas/                    EL CUERPO de cada página pública, una sola vez,
                              en los dos idiomas (landing, region, proyecto,
                              equipo, experiencia)

  app/
    page.tsx  region/  proyecto/  equipo/  experiencias/[id]/     ← español
    en/…                                                          ← inglés
    en/layout.tsx             Marca el subárbol como inglés (lang="en")
    sitemap.ts  robots.ts     Lo que lee Google
    acciones-web.ts           La ÚNICA escritura que puede hacer un visitante
    login/                    Acceso y registro
    acciones.ts               Server Actions del dashboard (todas las escrituras)
    (dash)/
      ventas/                 Reservas y paquetes
      comunidades/[id]/       Operación y checklist de dos niveles
      liquidacion/            Por venta, por concepto, por comunidad, gastos
      banca/                  Pagos, contabilidad, rentabilidad
      calendario/             Salidas del mes
      admin/                  Roles de usuarios
```

---

## La vida de una reserva

```
  Visitante llena el formulario
            │
            ▼
  solicitar_reserva()  ← función de Postgres, NO una tabla abierta
            │            (ella pone el precio y fuerza el status inicial;
            │             el visitante no puede elegir ninguno de los dos)
            ▼
     Planeación  ──▶  Confirmado  ──▶  En Curso  ──▶  Finalizado
            │
            └─ aparece en Ventas, y de ahí en Calendario, Liquidación y Banca
```

Un visitante **no escribe en la base**. Sólo puede llamar a `solicitar_reserva`,
que es la única puerta y la controla Postgres. Por eso el sitio público puede ser
estático sin ser inseguro.

---

## Puesta en marcha

### 1. La base de datos

En [supabase.com](https://supabase.com) → **New project**. Luego, en el
**SQL Editor**, corre `supabase/migrations/` **en orden, del 01 al 19**.

El orden importa: cada archivo asume lo que hizo el anterior.

| # | Qué hace |
|---|---|
| `01`–`03` | Esquema, catálogo (10 comunidades, 33 paquetes) y vistas |
| `04` | Reservas de ejemplo — **`07` las borra** |
| `05`–`06` | Seguridad: RLS y roles |
| `07`–`10` | Limpieza del demo, catálogo público y reservas desde la web |
| `11` | El catálogo se vuelve bilingüe |
| `12`–`13` | La ruta de una reserva; todos leen, cada quien mueve lo suyo |
| `14`–`15` | Comprobantes y contabilidad |
| `16`–`19` | Operación real, paquetes, pago dividido |
| `20`–`21` | Apartado 72 h, micrositios, leads, expediente, cupos |

### 2. Variables de entorno

Copia `.env.local.example` a `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

La llave pública es pública **por diseño** (viaja al navegador de todos modos).
Lo que protege los datos es el RLS, no la llave. La que **nunca** va aquí es la
`secret` / `service_role`: esa se salta el RLS.

### 3. Correr

```bash
npm install
npm run dev
```

### 4. El primer administrador

1. Entra a `/login` → **Crear una cuenta**.
2. En el SQL Editor de Supabase:

```sql
update perfiles set rol = 'admin' where email = 'tu-correo@ejemplo.com';
```

3. Vuelve a entrar. Ya puedes repartir roles desde **Usuarios**.

---

## Desplegar

```bash
npx vercel
```

Agrega en el panel de Vercel las dos variables de Supabase. Cuando compres el
dominio, agrega también:

```bash
NEXT_PUBLIC_SITIO=https://tu-dominio.mx
```

Sin ella, el sitemap y las tarjetas de WhatsApp apuntan a la URL de Vercel —
funcionan, pero llevan el dominio equivocado.

---

## Pendiente

**Los precios están en cero.** El PDF del catálogo no traía tarifas. Hay que
capturar el precio de venta de cada paquete y el costo de comedores, senderos y
hospedajes. En cuanto lo hagas, la Liquidación empieza a dar totales reales
(ver "la liquidación se deriva", arriba: no hay que tocar nada más).

**El editor de comedores** (la tabla con el monto por persona) todavía no está
en el modal de paquete. Por ahora esos montos se capturan por SQL.

**Las traducciones al inglés del catálogo** están a medias: donde falta la
columna `_en`, el sitio muestra el español.

**`public/Sierra Norte*.html`** son copias del sitio viejo que se están
publicando junto con la app. Convendría borrarlas.
