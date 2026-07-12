# Expediciones Sierra Norte — Resumen del proyecto

**Estado:** en producción — <https://sierra-norte.vercel.app>
**Repositorio:** <https://github.com/MarxMad/SierraNorte>
**Última actualización:** 12 de julio de 2026

---

## De dónde partimos y a dónde llegamos

Empezamos con un prototipo de dashboard en un solo archivo HTML, con datos
inventados. Terminamos con **un sitio web público bilingüe y un sistema de
operación con login y roles**, ambos corriendo sobre una base de datos real.

| | Antes | Ahora |
|---|---|---|
| **Datos** | Inventados, en memoria | PostgreSQL en Supabase |
| **Sitio público** | No existía | Bilingüe, con reserva en línea |
| **Acceso** | Abierto | Login con 4 roles |
| **Catálogo** | 4 paquetes ficticios | 33 paquetes reales del PDF |
| **Despliegue** | Archivo local | Vercel |

---

## 1. El catálogo salió del PDF

El PDF *Paquete de Experiencias* (174 MB, puro imagen) traía el catálogo real.
Como no se podía leer con herramientas normales, extraje el texto con **PDFKit
vía JXA** (`osascript`), porque este Mac no tiene `pdftotext` ni `pymupdf`.

De ahí salieron y hoy viven en la base:

- **10 comunidades** — Cuajimoloyas, Benito Juárez, Llano Grande, La Nevería, Latuvi, Lachatao, Amatlán, Capulálpam, San Miguel del Valle, Teotitlán del Valle
- **33 paquetes** — 9 de 1 día, 9 de 2, 7 de 3, 4 de 4, 2 de 5, 1 de 7 días, más Servicios Individuales
- **81 días de itinerario** con **197 actividades** clasificadas por tipo
- **195 comedores** con día, comunidad, nombre y tipo de comida
- **18 servicios** sueltos y **7 guías**

---

## 2. La liquidación no se captura: se deriva

Es la decisión de diseño más importante del sistema.

**No existe una tabla de liquidaciones.** La vista `v_liquidacion_conceptos` la
arma en vivo uniendo cuatro orígenes:

1. **Comedores** → pago directo al prestador. El monto es **por persona** y se
   multiplica por los pax reales de las reservas.
2. **Items del itinerario** — senderos, hospedajes, actividades, talleres.
3. **Transporte** de la salida.
4. **Anfitrión bilingüe.**

Lo único que se guarda es el **estado** (liquidado sí/no) en `liquidacion_estado`.

**Consecuencia práctica:** capturas el precio una vez y **todo se recalcula solo**
— el costo de la venta, el margen, lo que se le debe a cada comunidad y los KPIs
de Banca.

Verificado contra Postgres real: al poner $150/persona en un comedor de una salida
de 4 pax, la liquidación mostró $600 marcado como pago directo, y la venta
recalculó ingreso, costo, utilidad y margen sin tocar nada más.

---

## 3. El checklist tiene dos niveles

Tu equipo tenía dudas con esto y era una falla real del diseño original.

Un paquete que toca tres comunidades generaba **tres tarjetas**, cada una con su
propia copia de *todo* — incluidos transporte y seguros, que son del tour completo.
El transporte se confirmaba tres veces y nadie veía el paquete entero.

Ahora:

- **General del tour** — se confirma **una sola vez**: transporte, anfitrión,
  seguros, kits de emergencia, lista de pasajeros.
- **Por comunidad** — cada pueblo confirma lo suyo: guía, hospedaje, comedores,
  permisos.

Y el checklist **te dice qué comunidad ya está lista**. Al abrir cualquier tarjeta
ves *todas* las comunidades del paquete, la actual marcada como "ESTÁS AQUÍ" y las
terminadas con insignia verde.

---

## 4. Base de datos (Supabase)

11 migraciones en `supabase/migrations/`, **todas probadas contra PostgreSQL 16 real**
(las corrí en Docker antes de entregarlas).

| # | Archivo | Qué hace |
|---|---|---|
| 01 | `schema.sql` | 15 tablas, 7 enums, triggers |
| 02 | `seed_catalogo.sql` | El catálogo completo |
| 03 | `views.sql` | 16 vistas — liquidación y banca |
| 04 | `seed_operacion.sql` | Datos de ejemplo (borrables) |
| 05 | `rls.sql` | Seguridad base |
| 06 | `roles_rls.sql` | Los 4 roles |
| 07 | `limpiar_demo.sql` | Vacía lo operativo, conserva el catálogo |
| 08 | `catalogo_publico.sql` | Abre el catálogo a la web |
| 09 | `reservas_web.sql` | Reservas desde el sitio |
| 10 | `textos_publicos.sql` | Quita notas internas del catálogo |
| 11 | `bilingue.sql` | Columnas y textos en inglés |

**Automatismos que te ahorran trabajo:**

- El **folio de reserva se genera solo** (`ESN-2607-001`).
- El **total de un gasto** es columna generada (`subtotal + iva`).
- **Confirmar un pago sella la fecha** automáticamente.
- El **% pagado de una reserva** no se guarda: sale de sus pagos confirmados.
- El **checklist se siembra solo** al crear un paquete (trigger).

---

## 5. Seguridad: la base es la que manda

Los permisos viven en dos capas. `src/lib/permisos.ts` decide **qué se muestra**;
el **RLS de Postgres** decide **qué se permite**. Aunque alguien burle la interfaz,
la base lo frena.

| Rol | Ve | Escribe |
|---|---|---|
| `admin` | Todo | Todo, incluidos usuarios |
| `ventas` | Ventas, Comunidades, Calendario | Reservas, paquetes, checklist |
| `comunidad` | **Sólo su pueblo** y Liquidación | El checklist de su comunidad y sus gastos |
| `finanzas` | Banca, Liquidación, Ventas | Pagos, gastos, marcar liquidado |

**Probado con usuarios reales en Postgres:**

- El coordinador de Cuajimoloyas **ve 0 pagos** de clientes.
- Puede marcar **sus 76 items** de checklist; al intentar tocar los 296 de otros
  pueblos, la base afectó **0 filas**.
- Al intentar liquidar: *"new row violates row-level security policy"*.
- Un visitante anónimo **no puede leer reservas ni pagos**, y **no puede inventar
  el precio**: la función `solicitar_reserva()` lo toma del catálogo e ignora lo
  que mande el navegador.

Un detalle técnico que importa: las vistas de Postgres, por defecto, corren con los
permisos de su dueño y **se saltarían el RLS**. Les puse `security_invoker = on`.

---

## 6. El sitio público

Bilingüe: español en `/`, inglés en `/en`, con selector en el nav y `hreflang`
para Google.

- **Landing** — las 32 experiencias leídas de la base, filtrables por duración
- **Página por experiencia** — con el **itinerario día por día**. El sitio actual
  de Sierra Norte no muestra esto en ningún lado: es tu mayor ventaja
- **La región, El proyecto, Quiénes somos**
- **Formulario de reserva** — cae directo en tu tabla y devuelve el código

**Las fotos son suyas.** Encontré la API que alimenta su sitio actual y rescaté 28
fotos: el bosque, la laguna, el hongo naranja, el señor del maguey en Latuvi. Varias
venían giradas 90° en los píxeles; las reorienté, redimensioné y comprimí (de 34 MB
a 15 MB).

**La traducción al inglés:** los 197 items del itinerario, las 33 descripciones y
los 18 servicios. Los nombres propios se conservan —rutas, comunidades, comedores,
personas— y palabras como *temazcal*, *pulque* o *tepache* se dejan con glosa. Los
textos de región y proyecto **no los traduje yo**: son la versión en inglés que
Expediciones Sierra Norte ya tenía publicada, recuperada de su API.

---

## 7. Despliegue

Next.js 16 + React 19 + Tailwind 4, en Vercel.

El despliegue costó tres intentos por tres problemas encadenados, todos resueltos:

1. La app vivía en un subdirectorio; Vercel busca el `package.json` en la raíz.
2. El dominio no estaba enganchado a ningún despliegue.
3. **El Framework Preset estaba en "Other"**: Vercel corría el build —y el log se
   veía impecable— pero publicaba solo `public/` y **descartaba las funciones del
   servidor**. Por eso las fotos cargaban y todas las rutas daban 404.

---

## Lo que falta

### Editor de costos (lo único que bloquea la liquidación)

Desde el dashboard **hoy puedes editar**: el precio de venta, el costo del anfitrión
y el del transporte.

**No puedes editar**: los **195 comedores** (monto por persona) ni los **197
conceptos del itinerario** (senderos, hospedajes, actividades, talleres). No hay
pantalla para eso; hay que hacerlo por SQL.

Como esos son los que mueven el costo, **si abres Liquidación ahora el costo sale
casi en cero** y el margen te aparece inflado. Las acciones de servidor ya existen
(`guardarComedor`); falta la interfaz: dos tablas dentro del paquete para capturar
montos y ver el costo armarse en vivo.

### Capturar los precios reales

El PDF nunca trajo tarifas. Todo está en $0 y por eso la web dice "Cotización a
medida" en lugar de un precio.

### Menores

- Los checks del checklist arrancan con valores de ejemplo generados. Si los quieres
  todos vacíos, es un cambio de un minuto.
- El dashboard interno está sólo en español (a propósito).
- Página 41 del PDF menciona *Sierra Juárez* (5 días) y *Ecos de la Montaña* (6 días),
  sin itinerario. No se cargaron.

---

## Cómo levantarlo

```bash
npm install
npm run dev
```

Variables en `.env.local` (ver `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

La `publishable key` es pública por diseño. Lo que protege los datos es el RLS,
no la llave. **Nunca** pongas la `secret key` en una variable `NEXT_PUBLIC_`.

Para nombrar al primer admin:

```sql
update perfiles set rol = 'admin' where email = 'tu-correo@ejemplo.com';
```

---

## Estructura

```
src/
  app/            Rutas: sitio público (/, /en) y dashboard (protegido)
  paginas/        Páginas del sitio, parametrizadas por idioma
  components/     UI, landing, sidebar
  lib/
    supabase/     Clientes (navegador / servidor)
    i18n/         Diccionarios ES/EN
    permisos.ts   Qué ve cada rol
    tipos.ts      Tipos y paleta
  proxy.ts        Sesión y protección de rutas
supabase/migrations/   Las 11 migraciones
public/fotos/          28 fotos de la sierra
prototipo/             El dashboard original en HTML (histórico)
```
