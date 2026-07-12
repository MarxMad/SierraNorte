-- =====================================================================
-- 11 · CATÁLOGO BILINGÜE (español / inglés)
--
-- Se agregan columnas _en. El español sigue siendo la fuente: si una
-- traducción falta, la web cae al texto en español (coalesce).
--
-- Los nombres propios NO se traducen: rutas (El Calvario, Yatini),
-- comunidades, comedores (Restaurante Marlen) y palabras que ya viajan
-- en inglés en turismo (temazcal, pulque, tepache).
-- =====================================================================

alter table paquetes          add column if not exists nombre_en      text;
alter table paquetes          add column if not exists descripcion_en text;
alter table itinerario_dias   add column if not exists recorrido_en   text;
alter table itinerario_items  add column if not exists texto_en       text;
alter table servicios         add column if not exists nombre_en      text;
alter table servicios         add column if not exists unidad_en      text;
alter table comunidades       add column if not exists descripcion_en text;


-- DESCRIPCIONES DE LOS PAQUETES
update paquetes p set descripcion_en = v.d from (values
  ('p01', 'A hike through pine-oak forest to the Ojito de Agua spring and the Coyote Canyon, with home cooking and community activities.'),
  ('p02', 'Hiking through forest to panoramic lookouts, with home cooking and community activities in the village.'),
  ('p03', 'Step into village life: farm work, traditional cooking with organic produce, and a hike up to the lookouts.'),
  ('p04', 'Forest trails down to the river and its swimming spots, surrounded by mountain scenery, with a meal cooked in the village.'),
  ('p05', 'A guided hike past old mine workings, ridgelines and lookouts down to the river, ending with a trout lunch in the village.'),
  ('p06', 'A more demanding hike across mountain landscapes, lookouts, rock formations and historic paths, with home cooking along the way.'),
  ('p07', 'The cultural weight of corn: a walk through the milpas, a traditional cooking workshop and time with a local family.'),
  ('p08', 'Birdwatching tour. Hiking and spotting birds in their own habitat, with home cooking in the village.'),
  ('p09', 'A mushroom foraging hike through the forest and a wild mushroom cooking workshop with the community.'),
  ('p10', 'Two days on high-mountain trails and historic paths — a demanding crossing through shifting ecosystems, with village life, traditional food and cabin lodging.'),
  ('p11', 'Historic trails and mountain scenery with panoramic lookouts, plus village life, traditional food and cabin lodging.'),
  ('p12', 'Old mines and mountain trails between villages: nature, history and local culture, with traditional food and cabin lodging.'),
  ('p13', 'Pre-Hispanic routes and colonial remains — hiking, landscape and history, with village life, traditional food and cabin lodging.'),
  ('p14', 'Mountain trails with lookouts and rock formations, mixing landscape with adventure, plus village life, traditional food and cabin lodging.'),
  ('p15', 'Hiking between villages, adventure (hanging bridges and ziplines) and the knowledge of medicinal plants, with local cooking and cabin lodging.'),
  ('p16', 'Country roads between villages, mountain scenery and shifting ecosystems, with visits to local producers, traditional food and cabin lodging.'),
  ('p17', 'Pine-oak forest and waterfalls, a sunrise hike and a traditional bread-making workshop — nature, culture and local cooking.'),
  ('p18', 'Based in Latuvi: mountain trails like Piedra del Corredor and the Molcajete waterfall, forest scenery, local food, traditional drinks and cabin lodging — with the option of a temazcal.'),
  ('p19', 'Three days of hiking between villages, panoramic lookouts and adventure — a hanging bridge and a 1 km zipline — plus village life, local cooking and cabin lodging.'),
  ('p20', 'Forest, waterfalls and mountain scenery, with bread-making and medicinal plants, cabin lodging and a finish at the lookouts.'),
  ('p21', 'Trails between Llano Grande, Cuajimoloyas and San Miguel Amatlán: the Cueva Iglesia cave, the demanding Yatini crossing and the old mines.'),
  ('p22', 'Hiking between Benito Juárez, La Nevería and Latuvi, with corn cooking workshops and traditional fermented drinks.'),
  ('p23', 'A crossing between Cuajimoloyas, Latuvi and Amatlán: pine-oak forest, the historic Camino Real, pre-Hispanic remains, old mines and former haciendas.'),
  ('p24', 'Based in Lachatao: the Camino Real, pre-Hispanic remains, and the Los Molinos circuit with its lookouts, rivers and swimming spots.'),
  ('p25', 'A crossing between Amatlán, Latuvi and Benito Juárez along the Camino Real, through high-mountain forest and one of the most biodiverse regions in Mexico.'),
  ('p26', 'Four days of hiking between Cuajimoloyas, Benito Juárez and La Nevería, with traditional cooking workshops, the knowledge of corn and ancestral medicine.'),
  ('p27', 'A crossing between Llano Grande, Cuajimoloyas, Latuvi and Benito Juárez via the Cueva Iglesia cave and the historic Camino Real. Note: either Amatlán or Lachatao is used, depending on availability.'),
  ('p28', 'Mountain trails between Llano Grande, Cuajimoloyas, Benito Juárez and La Nevería, with a bread-making workshop and a temazcal.'),
  ('p29', 'Nature, culture and adventure: hiking between forest and rivers, a temazcal, traditional cooking workshops and historic mining sites.'),
  ('p30', 'Hiking through pine-oak forest, lookouts, hanging bridges and the historic Camino Real, with a constant change of ecosystems and routes steeped in mining history.'),
  ('p31', 'Our most demanding crossing: the Cueva Iglesia cave, Yatini (26 km), the Camino Real and La Cucharilla, finishing at El Calvario.'),
  ('p32', 'A full immersion in the Sierra Norte, linking Llano Grande, Cuajimoloyas, Benito Juárez, La Nevería, Latuvi and Lachatao/Amatlán through trails, the Camino Real, hanging bridges and old mines.'),
  ('p33', 'Services you can book on their own or add to any experience: bilingual host, transport, trail guide, zipline, temazcal, traditional cooking workshops and cabin lodging.')
) as v(id, d) where p.id = v.id;

-- ITEMS DEL ITINERARIO (se traducen por texto, aplica a los 197)
update itinerario_items it set texto_en = v.en from (values
  ('Acceso al Mirador y Puente Colgante de Benito Juárez', 'Access to the lookout and hanging bridge in Benito Juárez'),
  ('Acceso al Puente Colgante', 'Access to the hanging bridge'),
  ('Acceso al mirador y puente colgante', 'Access to the lookout and hanging bridge'),
  ('Acceso al museo de Amatlán', 'Visit to the museum in Amatlán'),
  ('Acceso al puente colgante de Benito', 'Access to the hanging bridge in Benito'),
  ('Acceso al puente colgante de Cuaji', 'Access to the hanging bridge in Cuaji'),
  ('Accesos a Mirador y Puente colgante Benito Juárez', 'Access to the lookout and hanging bridge in Benito Juárez'),
  ('Accesos al puente colgante y pases para línea de 3 tirolesas', 'Access to the hanging bridge and passes for the 3-zipline course'),
  ('Box Lunch – Mirador', 'Box lunch – Mirador'),
  ('Box lunch – Mirador', 'Box lunch – Mirador'),
  ('Caminata en el bosque (Señora Martha) · 3 h', 'Forest hike (Señora Martha) · 3 h'),
  ('Cena: Comedor el Mirador', 'Dinner: Comedor el Mirador'),
  ('Cena: El Mirador', 'Dinner: El Mirador'),
  ('Cena: Mirador', 'Dinner: Mirador'),
  ('Cena: Restaurante Mirador', 'Dinner: Restaurante Mirador'),
  ('Cena: Restaurante el Mirador', 'Dinner: Restaurante el Mirador'),
  ('Cena: el Mirador', 'Dinner: el Mirador'),
  ('Desayuno: Comedor el Mirador', 'Breakfast: Comedor el Mirador'),
  ('Desayuno: Mirador', 'Breakfast: Mirador'),
  ('Desayuno: Restaurante Mirador', 'Breakfast: Restaurante Mirador'),
  ('Desayuno: Restaurante el Mirador', 'Breakfast: Restaurante el Mirador'),
  ('Hospedaje en cabaña', 'Cabin lodging'),
  ('Hospedaje en cabaña Amatlán', 'Cabin lodging in Amatlán'),
  ('Hospedaje en cabañas', 'Cabin lodging'),
  ('Hospedaje en cabañas Amatlán', 'Cabin lodging in Amatlán'),
  ('Hospedaje en cabañas Benito Juárez', 'Cabin lodging in Benito Juárez'),
  ('Hospedaje en cabañas Cuajimoloyas', 'Cabin lodging in Cuajimoloyas'),
  ('Hospedaje en cabañas Lachatao', 'Cabin lodging in Lachatao'),
  ('Hospedaje en cabañas Latuvi', 'Cabin lodging in Latuvi'),
  ('Hospedaje en cabañas Nevería', 'Cabin lodging in Nevería'),
  ('Hospedaje en cabañas de Amatlán/Lachatao', 'Cabin lodging in Amatlán/Lachatao'),
  ('Hospedaje en cabañas de Benito Juárez', 'Cabin lodging in Benito Juárez'),
  ('Hospedaje en cabañas de Capulálpam', 'Cabin lodging in Capulálpam'),
  ('Hospedaje en cabañas de Cuajimoloyas', 'Cabin lodging in Cuajimoloyas'),
  ('Hospedaje en cabañas de Latuvi', 'Cabin lodging in Latuvi'),
  ('Hospedaje en cabañas de Nevería', 'Cabin lodging in Nevería'),
  ('Los Colores del Maíz: taller gastronómico y cena en casa de familia', 'The Colors of Corn: cooking workshop and dinner at a family home'),
  ('Mirador y Puente Colgante', 'Lookout and hanging bridge'),
  ('Mirador y puente colgante', 'Lookout and hanging bridge'),
  ('Observación de aves', 'Birdwatching'),
  ('Plantas medicinales con degustación de té – Esther', 'Medicinal plants and tea tasting – Esther'),
  ('Puente colgante', 'Hanging bridge'),
  ('Puente colgante Cuaji', 'Hanging bridge – Cuaji'),
  ('Puente colgante y línea de 3 tirolesas en el Mirador', 'Hanging bridge and 3-zipline course at the lookout'),
  ('Puente colgante y pase para tirolesa de 1 km', 'Hanging bridge and pass for the 1 km zipline'),
  ('Recorrido Los Colores del Maíz · 2 h', 'The Colors of Corn tour · 2 h'),
  ('Recorrido – Los Colores del Maíz', 'The Colors of Corn tour'),
  ('Sendero – Amatlán/Lachatao por la ruta Yatini · 23 km · 6-7 h', 'Trail – Amatlán/Lachatao via Yatini · 23 km · 6-7 h'),
  ('Sendero – Benito Juárez a Cuaji · 8 km · 3 h', 'Trail – Benito Juárez to Cuaji · 8 km · 3 h'),
  ('Sendero – Benito Juárez a Cuajimoloyas · 8 km · 3 h', 'Trail – Benito Juárez to Cuajimoloyas · 8 km · 3 h'),
  ('Sendero – Benito Juárez a La Nevería · 8 km · 3 h', 'Trail – Benito Juárez to La Nevería · 8 km · 3 h'),
  ('Sendero – Benito Juárez a Nevería · 8 km · 3 h', 'Trail – Benito Juárez to Nevería · 8 km · 3 h'),
  ('Sendero – Caminata a Latuvi por la ruta Cucharilla · 16 km · 5-6 h', 'Trail – Hike to Latuvi via Cucharilla · 16 km · 5-6 h'),
  ('Sendero – Caminata a los Molinos · 8 km · 3 h', 'Trail – Hike to Los Molinos · 8 km · 3 h'),
  ('Sendero – Caminata al Mirador · 5 km · 3 h', 'Trail – Hike to the lookout · 5 km · 3 h'),
  ('Sendero – Caminata hacia la zona de Mirador', 'Trail – Hike toward the lookout area'),
  ('Sendero – Camino Real de Lachatao a Latuvi · 16 km · 5-6 h', 'Trail – Camino Real from Lachatao to Latuvi · 16 km · 5-6 h'),
  ('Sendero – Camino Real hasta el punto “La Virgen” · 12 km · 4.5 h', 'Trail – Camino Real to “La Virgen” · 12 km · 4.5 h'),
  ('Sendero – Cañón del Coyote · 5 km · 3 h', 'Trail – Cañón del Coyote · 5 km · 3 h'),
  ('Sendero – Cuajimoloyas a Benito Juárez pasando por el puente colgante · 8 km · 3 h', 'Trail – Cuajimoloyas to Benito Juárez crossing the hanging bridge · 8 km · 3 h'),
  ('Sendero – Cuajimoloyas a Benito Juárez · 8 km · 3 h', 'Trail – Cuajimoloyas to Benito Juárez · 8 km · 3 h'),
  ('Sendero – Cueva Iglesia · 12 km · 5 h', 'Trail – Cueva Iglesia · 12 km · 5 h'),
  ('Sendero – La Nevería a Latuvi · 12 km · 4 h', 'Trail – La Nevería to Latuvi · 12 km · 4 h'),
  ('Sendero – Lachatao a Latuvi Camino Real · 16 km · 5-6 h', 'Trail – Lachatao to Latuvi Camino Real · 16 km · 5-6 h'),
  ('Sendero – Lachatao a Latuvi por Camino Real · 16 km · 5-6 h', 'Trail – Lachatao to Latuvi via the Camino Real · 16 km · 5-6 h'),
  ('Sendero – Lachatao a Latuvi por el Camino Real · 16 km · 5-6 h', 'Trail – Lachatao to Latuvi via the Camino Real · 16 km · 5-6 h'),
  ('Sendero – Las Minas · 8 km · 3 h', 'Trail – Las Minas · 8 km · 3 h'),
  ('Sendero – Latuvi a Amatlán por el Camino Real · 16 km · 5-6 h', 'Trail – Latuvi to Amatlán via the Camino Real · 16 km · 5-6 h'),
  ('Sendero – Latuvi a Benito Juárez · 12 km · 4 h', 'Trail – Latuvi to Benito Juárez · 12 km · 4 h'),
  ('Sendero – Latuvi a Benito Juárez · 12 km · 4.5 h', 'Trail – Latuvi to Benito Juárez · 12 km · 4.5 h'),
  ('Sendero – Latuvi a Lachatao por Camino Real · 16 km · 5-6 h', 'Trail – Latuvi to Lachatao via the Camino Real · 16 km · 5-6 h'),
  ('Sendero – Latuvi a Lachatao por el Camino Real', 'Trail – Latuvi to Lachatao via the Camino Real'),
  ('Sendero – Llano Grande a Cuaji · 8 km · 3 h', 'Trail – Llano Grande to Cuaji · 8 km · 3 h'),
  ('Sendero – Llano Grande a Cuajimoloyas por la ruta Cueva Iglesia · 12 km · 4-5 h', 'Trail – Llano Grande to Cuajimoloyas via Cueva Iglesia · 12 km · 4-5 h'),
  ('Sendero – Llano Grande a Cuajimoloyas · 8 km · 3 h', 'Trail – Llano Grande to Cuajimoloyas · 8 km · 3 h'),
  ('Sendero – Los Molinos · 8 km · 3 h', 'Trail – Los Molinos · 8 km · 3 h'),
  ('Sendero – Mirador El Calvario · 8 km · 3 h', 'Trail – Mirador El Calvario · 8 km · 3 h'),
  ('Sendero – Nevería a Latuvi · 12 km · 4 h', 'Trail – Nevería to Latuvi · 12 km · 4 h'),
  ('Sendero – Ruta 5 Señores · 14 km · 4-5 h', 'Trail – 5 Señores · 14 km · 4-5 h'),
  ('Sendero – Ruta 5 Señores · 14 km · 5 h', 'Trail – 5 Señores · 14 km · 5 h'),
  ('Sendero – Ruta Cañón del Coyote · 5 km · 3 h', 'Trail – Cañón del Coyote · 5 km · 3 h'),
  ('Sendero – Ruta Cerro del Jaguar', 'Trail – Cerro del Jaguar'),
  ('Sendero – Ruta Cueva Iglesia · 12 km · 4-5 h', 'Trail – Cueva Iglesia · 12 km · 4-5 h'),
  ('Sendero – Ruta El Calvario · 6 km · 3 h', 'Trail – El Calvario · 6 km · 3 h'),
  ('Sendero – Ruta El Calvario · 8 km · 3 h', 'Trail – El Calvario · 8 km · 3 h'),
  ('Sendero – Ruta El Mirador · 5 km · 3 h', 'Trail – El Mirador · 5 km · 3 h'),
  ('Sendero – Ruta El Molcajete · 11 km · 4 h', 'Trail – El Molcajete · 11 km · 4 h'),
  ('Sendero – Ruta El Pinovete · 8 km · 3 h', 'Trail – El Pinovete · 8 km · 3 h'),
  ('Sendero – Ruta El Pinovete · 8 km · 4 h', 'Trail – El Pinovete · 8 km · 4 h'),
  ('Sendero – Ruta La Cucharilla · 16 km · 5-6 h', 'Trail – La Cucharilla · 16 km · 5-6 h'),
  ('Sendero – Ruta La Sepultura · 12 km · 4 h', 'Trail – La Sepultura · 12 km · 4 h'),
  ('Sendero – Ruta La Virgen · 12 km · 4-5 h', 'Trail – La Virgen · 12 km · 4-5 h'),
  ('Sendero – Ruta Las Minas · 12 km · 4 h', 'Trail – Las Minas · 12 km · 4 h'),
  ('Sendero – Ruta Las Minas · 14 km · 3-4 h', 'Trail – Las Minas · 14 km · 3-4 h'),
  ('Sendero – Ruta Las Minas · 14 km · 4 h', 'Trail – Las Minas · 14 km · 4 h'),
  ('Sendero – Ruta Las Minas · 14 km · 4-5 h', 'Trail – Las Minas · 14 km · 4-5 h'),
  ('Sendero – Ruta Los Molinos · 8 km · 3 h', 'Trail – Los Molinos · 8 km · 3 h'),
  ('Sendero – Ruta Piedra del Corredor · 16 km · 4-5 h', 'Trail – Piedra del Corredor · 16 km · 4-5 h'),
  ('Sendero – Ruta Xinudaa · 17 km · 5-6 h', 'Trail – Xinudaa · 17 km · 5-6 h'),
  ('Sendero – Ruta Yatini · 23 km · 6-7 h', 'Trail – Yatini · 23 km · 6-7 h'),
  ('Sendero – Ruta Yatini · 26 km · 6-7 h', 'Trail – Yatini · 26 km · 6-7 h'),
  ('Sendero – Ruta ex hacienda 5 Señores · 14 km · 4 h', 'Trail – former hacienda 5 Señores · 14 km · 4 h'),
  ('Sendero – Ruta “Embudo” · 18 km · 5-6 h', 'Trail – “Embudo” · 18 km · 5-6 h'),
  ('Sendero – Tierra Caliente de Amatlán a Capulálpam · 12 km · 4 h', 'Trail – Tierra Caliente, Amatlán to Capulálpam · 12 km · 4 h'),
  ('Sendero: caminata y visita al Mirador', 'Trail: hike and visit to the lookout'),
  ('Taller Los Colores del Maíz (nixtamalización, tortillas)', 'The Colors of Corn workshop (nixtamalization, tortillas)'),
  ('Taller de Pulque y Tepache', 'Pulque and tepache workshop'),
  ('Taller de Pulque y tepache', 'Pulque and tepache workshop'),
  ('Taller de pan', 'Bread-making workshop'),
  ('Taller de pan serrano', 'Mountain bread-making workshop'),
  ('Taller gastronómico a base de hongos – Señora Martha', 'Wild mushroom cooking workshop – Señora Martha'),
  ('Taller gastronómico a base de maíz con familia local', 'Corn cooking workshop with a local family'),
  ('Taller gastronómico de Chichilo', 'Chichilo mole cooking workshop'),
  ('Taller gastronómico en la Granja del Señor Elí', 'Cooking workshop at Señor Elí’s farm'),
  ('Taller gastronómico y cena con una familia local', 'Cooking workshop and dinner with a local family'),
  ('Taller gastronómico y comida – Sra. Martha', 'Cooking workshop and lunch – Sra. Martha'),
  ('Temazcal o baño de asiento – Ing. Gaudencio', 'Temazcal (sweat lodge) or herbal sitz bath – Gaudencio'),
  ('Temazcal – Manos que Curan', 'Temazcal (sweat lodge) – Manos que Curan'),
  ('Temazcal – Soledad', 'Temazcal (sweat lodge) – Soledad'),
  ('Visita a Cueva de arroyos', 'Visit to the Cueva de Arroyos cave'),
  ('Visita a los Invernaderos', 'Visit to the greenhouses'),
  ('Visita a los invernaderos', 'Visit to the greenhouses'),
  ('Visita al museo de Amatlán', 'Visit to the museum in Amatlán')
) as v(es, en) where it.texto = v.es;

-- SERVICIOS INDIVIDUALES
update servicios s set nombre_en = v.en from (values
  ('Anfitrión bilingüe (ES/EN)', 'Bilingual host (ES/EN)'),
  ('Transporte Oaxaca – Sierra (van)', 'Transport Oaxaca – Sierra (van)'),
  ('Transporte entre comunidades', 'Transport between villages'),
  ('Guía de sendero', 'Trail guide'),
  ('Puente colgante', 'Hanging bridge'),
  ('Tirolesa (línea de 3)', 'Zipline (3-line course)'),
  ('Tirolesa 1 km', '1 km zipline'),
  ('Temazcal', 'Temazcal (sweat lodge)'),
  ('Hospedaje en cabaña', 'Cabin lodging'),
  ('Comedor (desayuno/comida/cena)', 'Village meal (breakfast/lunch/dinner)'),
  ('Box lunch', 'Box lunch'),
  ('Taller de pan serrano', 'Mountain bread-making workshop'),
  ('Taller Los Colores del Maíz', 'The Colors of Corn workshop'),
  ('Taller de hongos', 'Wild mushroom workshop'),
  ('Taller de Pulque y Tepache', 'Pulque and tepache workshop'),
  ('Plantas medicinales con degustación de té', 'Medicinal plants and tea tasting'),
  ('Observación de aves', 'Birdwatching'),
  ('Acceso al museo de Amatlán', 'Visit to the museum in Amatlán')
) as v(es, en) where s.nombre = v.es;

update servicios s set unidad_en = v.en from (values
  ('por persona', 'per person'),
  ('por día', 'per day'),
  ('por viaje', 'per trip'),
  ('por traslado', 'per transfer'),
  ('por noche', 'per night')
) as v(es, en) where s.unidad = v.es;

-- RECORRIDOS DE CADA DÍA
-- Son nombres de comunidades unidos por flechas: se conservan tal cual.
update itinerario_dias set recorrido_en = recorrido where recorrido_en is null;

-- ---------------------------------------------------------------------
-- Comprobación
-- ---------------------------------------------------------------------
select
  (select count(*) from paquetes         where descripcion_en is not null) as paquetes_en,
  (select count(*) from itinerario_items where texto_en is not null)       as items_en,
  (select count(*) from itinerario_items where texto_en is null)           as items_sin_traducir,
  (select count(*) from servicios        where nombre_en is not null)      as servicios_en;

