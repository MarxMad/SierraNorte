# Expediciones Sierra Norte

Sitio web y sistema de operación de **Expediciones Sierra Norte**, la empresa
comunitaria de los **Pueblos Mancomunados** de la Sierra Norte de Oaxaca.

## Qué hay aquí

| Carpeta | Qué es |
|---|---|
| `esn-dashboard/` | La aplicación: sitio público + dashboard interno (Next.js 16 + Supabase) |
| `Dashboard turismo Monday.com/supabase/` | Las migraciones SQL de la base de datos |
| `Dashboard turismo Monday.com/` | Prototipo original en HTML (histórico) |

## La aplicación

**Sitio público** — landing con las experiencias, página por cada paquete con su
itinerario día a día, la región, el proyecto, quiénes somos y un formulario de
reserva que cae directo en la base.

**Dashboard interno** — con login y cuatro roles:

| Rol | Ve |
|---|---|
| `admin` | Todo, incluidos los usuarios |
| `ventas` | Reservas, paquetes, calendario |
| `comunidad` | Sólo su comunidad: checklist y liquidación |
| `finanzas` | Banca, gastos, liquidación |

Los permisos se aplican con **Row Level Security de Postgres**: la base es la que
manda, no la interfaz.

## Puesta en marcha

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Corre las migraciones de `Dashboard turismo Monday.com/supabase/migrations/`
   **en orden numérico** (del `01` al `10`).
3. Copia `esn-dashboard/.env.local.example` a `.env.local` y llénalo con tus
   credenciales de Supabase.
4. ```bash
   cd esn-dashboard
   npm install
   npm run dev
   ```
5. Crea tu cuenta en `/login` y vuélvete admin:
   ```sql
   update perfiles set rol = 'admin' where email = 'tu-correo@ejemplo.com';
   ```

Más detalle en [`esn-dashboard/README.md`](esn-dashboard/README.md) y
[`Dashboard turismo Monday.com/supabase/README.md`](Dashboard%20turismo%20Monday.com/supabase/README.md).

## Cómo funciona la liquidación

No se captura: **se deriva**. Una vista de Postgres la arma en vivo uniendo
comedores, itinerario, transporte y anfitrión, y multiplica por los pax reales de
las reservas. Capturas el precio una vez y se recalculan solos el costo de la
venta, el margen y lo que se le debe a cada comunidad.
