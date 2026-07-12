# Avance — Dashboard Expediciones Sierra Norte
**Sesión:** 11 julio 2026
**Archivo principal:** `Cooperativa Dashboard.dc.html` (dentro de `Dashboard turismo Monday.com/`)

---

## Qué se hizo

Se cargaron al dashboard los **32 paquetes reales** del PDF `Paquete de Experiencias.pdf` (Pueblos Mancomunados), con itinerario día por día, y se puso el **logo** en la barra lateral. El dashboard antes traía datos ficticios de demo (paquetes "Aventura Total", comunidades "Montaña/Río/Selva"); todo eso fue reemplazado.

### 1. Catálogo de paquetes (lo grande)
Nuevo método `catalogo()` en la clase `Component` (justo antes de `// ---------- helpers ----------`). Devuelve los 32 paquetes.

Distribución por duración:

| Duración | # | Paquetes |
|---|---|---|
| 1 día | 9 | Cañón del Coyote, Mirador El Calvario, Mi Experiencia Rural, Los Molinos, Las Minas, Cueva Iglesia, Los Colores del Maíz, Aves del Bosque, Una Mirada al Mundo Fungi |
| 2 días | 9 | Yatini, Yaa Cuetzi, Yaa–Gatzi, Valle Encantado, Sierra Norte Imperdible, Senderos en el Aire, Latzi Belli, El Paraíso de las Nubes, Bosques con Encanto |
| 3 días | 7 | Una Ventura de Altura, Pasos Cortos pero Firmes, Pasos con Historia, Herencia de una Tierra Viva, Entre Hojas y Ríos, Colores de Mi Tierra, Caminos Reales |
| 4 días | 4 | Tierra y Tradiciones, Senderos Zapotecas, Senderos con Encanto, Pueblos con Magia |
| 5 días | 2 | Rutas de la Naturaleza, Sierra Extrema |
| 7 días | 1 | Al Corazón del Mancomún |

Total: **81 días de itinerario, 363 actividades** cargadas.

Estructura de cada paquete:
```js
{ id, name, category, communities[], desc, days[], 
  total, dateStart, dateEnd, price, paid, status, clients[] }
// days: [{ n:1, com:'Cuajimoloyas', items:['Sendero – … · 8 km · 3 h', 'Comida: …'] }]
```
Los `items` son textuales del PDF: rutas con distancia/tiempo, liquidaciones de sendero, puente colgante, tirolesa, alimentos (desayuno/comida/cena/box lunch), hospedaje en cabañas y talleres.

### 2. Categoría = duración
`this.CAT` ahora es `{'1 día','2 días','3 días','4 días','5 días','7 días'}` con color cada una. Se actualizaron la columna de la tabla (`colDefs` → label "Duración"), el dropdown y el modal.

### 3. Comunidades reales
`this.COMM` reemplazado con las 10 reales, cada una con color:
Cuajimoloyas, Benito Juárez, Llano Grande, La Nevería, Latuvi, Lachatao, Amatlán, Capulálpam, San Miguel del Valle, Teotitlán del Valle.
Esto alimenta el kanban por comunidad, el sidebar y la gráfica "Gastos por comunidad".

### 4. Itinerario visible
Nuevo método `itinerary(d)`: al abrir un paquete, el modal muestra la descripción y el desglose D1/D2/D3… con comunidad y lista de actividades.

### 5. Logo
`sierran.png.png` se copió a **`sierran.png`** (mismo folder) y se usa en el brand del sidebar: `<img src="./sierran.png">` + textos "Expediciones Sierra Norte / Pueblos Mancomunados".

---

## Pendientes / decisiones abiertas

1. **PRECIOS: el PDF no trae montos.** Solo dice "Liquidación de…" sin cifras. Todos los paquetes quedaron en `price: 0`. Hay que capturar la tarifa real (se edita inline en la columna Precio de la tabla).

2. **Datos demo que hay que reemplazar.** Para que Timeline / Banca / Contabilidad no se vieran vacíos, se dejaron **4 salidas de ejemplo con fecha, clientes y monto INVENTADOS**:
   - Cañón del Coyote (3 Jul, $900, Confirmado)
   - Sierra Norte Imperdible (11–12 Jul, $1,800, En Curso)
   - Rutas de la Naturaleza (20–24 Jul, $1,800, Confirmado)
   - Al Corazón del Mancomún (15–22 Jul, $2,500, En Curso)
   
   También son demo: los arrays `payments` y `expenses`, los KPIs de Contabilidad ($32,500 ingresos, etc.), `contabLiq()` y la gráfica de gastos por comunidad.

3. **Falta definir QUÉ va a trackear el dashboard.** La frase del usuario quedó cortada: *"el dashboard va a llevar el seguimiento de …"*. Por ahora el seguimiento corre sobre los 4 espacios que ya traía el proyecto: **Ventas, Comunidades, Banca, Contabilidad**. → **Preguntar esto al retomar.**

4. **Paquetes mencionados pero sin itinerario en el PDF** (página 41): *Sierra Juárez (5 días)* y *Ecos de la Montaña (6 días)*. No se agregaron porque no hay contenido. Si aparece el itinerario, se cargan igual que los demás.

---

## Notas técnicas

- El PDF pesa 182 MB (puro imagen), no se puede leer con la herramienta normal. Se extrajo el texto con **PDFKit vía JXA**: `osascript -l JavaScript` + `$.PDFDocument` (no hay `pdftotext` ni `pymupdf` en esta Mac).
- Validación hecha: `node --check` sobre el bloque `<script type="text/x-dc">` (sintaxis OK) y un script que evalúa `catalogo()` para confirmar que todas las comunidades, duraciones e IDs son válidos.
- Para ver el dashboard: `open "Cooperativa Dashboard.dc.html"`.
