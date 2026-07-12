# Base de datos — Expediciones Sierra Norte (Supabase)

Todo el SQL fue probado corriendo contra PostgreSQL 16 real: las 5 migraciones
aplican limpio y las vistas devuelven los números correctos.

## Cómo instalarlo

En Supabase → **SQL Editor**, corre los archivos **en este orden**:

| # | Archivo | Qué hace |
|---|---------|----------|
| 1 | `migrations/01_schema.sql` | Tipos, tablas, índices, triggers y funciones |
| 2 | `migrations/02_seed_catalogo.sql` | Las 10 comunidades y los **33 paquetes** con itinerarios y comedores |
| 3 | `migrations/03_views.sql` | Vistas de liquidación y banca (lo que se calcula solo) |
| 4 | `migrations/04_seed_operacion.sql` | Reservas, pagos y gastos de ejemplo — **borrar en producción** |
| 5 | `migrations/05_rls.sql` | Seguridad por fila (RLS) |

O con la CLI:

```bash
supabase db push
```

## Lo que quedó cargado

- **10 comunidades** con su color
- **33 paquetes**: 9 de 1 día, 9 de 2, 7 de 3, 4 de 4, 2 de 5, 1 de 7 días + Servicios Individuales
- **81 días de itinerario** con **197 items liquidables** ya clasificados (Sendero, Hospedaje, Actividad, Taller)
- **195 comedores** con día, comunidad, nombre y tipo de comida
- **18 servicios individuales**
- **7 guías**
- El **checklist se siembra solo**: 165 items generales y 372 por comunidad, generados por trigger

## La idea clave: la liquidación NO se captura, se deriva

No existe una tabla de "liquidaciones". La vista `v_liquidacion_conceptos` la arma
en vivo con la unión de cuatro orígenes:

1. **Comedores** → pago directo al prestador. El monto es **por persona** y se
   multiplica por los pax reales de la salida (que salen de las reservas).
2. **Items del itinerario** con tipo (senderos, hospedaje, actividades, talleres).
3. **Transporte** del paquete.
4. **Anfitrión bilingüe** del paquete.

Lo único que se guarda es el **estado** en `liquidacion_estado` (liquidado sí/no,
fecha, y un `monto_override` por si se pagó distinto a lo presupuestado).

Consecuencia práctica: **capturas el precio una vez y todo se recalcula solo** —
la venta, el margen, lo que se le debe a cada comunidad y los KPIs de Banca.

```sql
-- Al capturar el precio del comedor…
update comedores set monto_por_persona = 180 where paquete_id = 'p01';

-- …la liquidación ya trae 180 × 2 pax = 360, marcado como pago directo
select tipo, concepto, monto, pago_directo from v_liquidacion_programada where paquete_id = 'p01';
```

## Vistas disponibles

**Ventas**
- `v_reservas` — reservas con paquete, guía, transporte, comunidades, pagado y % (calculado desde los pagos)
- `v_paquetes` — paquetes con pax, reservas, comedores, comunidades y % pagado promedio
- `v_paquete_pax` — personas y niños por paquete

**Liquidación**
- `v_liquidacion_conceptos` — todos los conceptos derivados
- `v_liquidacion_programada` — sólo las salidas con fecha (lo que de verdad se liquida)
- `v_liquidacion_por_venta` — una fila por salida: ingreso, costo, pendiente, utilidad, margen, avance
- `v_liquidacion_por_comunidad` — lo que se le debe a cada pueblo

**Banca** (absorbió Contabilidad)
- `v_banca_pagos` — pagos con su reserva y paquete
- `v_banca_kpis` — pendiente, confirmado, vencido, promedio
- `v_resumen_financiero` — ingresos, gastos, utilidad, margen
- `v_gastos_por_comunidad`, `v_rentabilidad_paquetes`

**Comunidades**
- `v_operacion_comunidad` — el tramo de cada paquete en cada comunidad, con su checklist
- `v_checklist_comunidad` / `v_checklist_paquete` — avance y cuáles comunidades ya están listas

## Detalles que te van a importar

- **El folio de reserva se genera solo** (`ESN-2607-001`). Manda `codigo` vacío y el trigger lo asigna.
- **El total del gasto es una columna generada** (`subtotal + iva`): no lo mandes, se calcula.
- **Confirmar un pago sella la fecha** automáticamente.
- El **% pagado de una reserva** no se guarda: sale de sus pagos confirmados.
- Restricciones que te protegen: los niños no pueden exceder el total de personas, y
  la plataforma (WeTravel/PayPal/BBVA) sólo se permite si el método es Transfer/Tarjeta.

## Conectar el dashboard

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="./supabase/db.js"></script>
<script>DB.init('https://TU-PROYECTO.supabase.co', 'TU-ANON-KEY');</script>
```

`db.js` ya trae todas las funciones: `DB.reservas()`, `DB.crearReserva()`,
`DB.liquidacionPorVenta()`, `DB.marcarLiquidado()`, `DB.confirmarPago()`,
`DB.guardarGasto()`, `DB.marcarCheck()`, y `DB.escuchar()` para tiempo real.

**Pendiente:** el dashboard todavía lee de su estado local en memoria. El siguiente
paso es reemplazar `this.state.packages` / `reservas` / `payments` / `expenses` por
llamadas a `DB.*` en un `componentDidMount`. Avísame y lo hago.

## Precios

**Todos los montos están en 0** porque el PDF del catálogo no traía tarifas. Hay que capturar:

```sql
update comedores          set monto_por_persona = ? where id = ?;  -- por persona
update itinerario_items   set monto = ?, por_persona = ? where id = ?;
update paquetes           set precio = ?, transporte_monto = ?, anfitrion_monto = ? where id = ?;
```
