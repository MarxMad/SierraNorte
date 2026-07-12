// =====================================================================
// Fotos del catálogo
//
// Son las fotos del propio Expediciones Sierra Norte, recuperadas de su
// sitio actual, reorientadas y optimizadas (máx. 1800 px).
//
// Se asignan a mano donde la foto retrata algo concreto (los hongos de
// Cuajimoloyas, el maguey de Latuvi) y por reparto estable en el resto,
// para que ningún paquete quede sin imagen y no se repitan de más.
// =====================================================================

const F = (n: string) => `/fotos/${n}`;

// Portada del sitio
export const PORTADA = F('portada.jpg');

// Fotos asignadas a un paquete concreto (por lo que retratan)
const POR_PAQUETE: Record<string, string> = {
  p09: F('hongo.jpg'), // Una Mirada al Mundo Fungi
  p03: F('granja.jpg'), // Mi Experiencia Rural — Granja del Señor Elí
  p07: F('taller-1.jpg'), // Los Colores del Maíz
  p29: F('sendero-bromelias.jpg'), // Pueblos con Magia — ruta El Embudo
  p04: F('rio.jpg'), // Los Molinos — río
  p18: F('bosque-mesofilo.jpg'), // Bosques con Encanto — Latuvi
  p16: F('neveria.jpg'), // Latzi Belli — La Nevería
  p22: F('maguey-latuvi.jpg'), // Herencia de una Tierra Viva — pulque en Latuvi
  p25: F('maguey-latuvi.jpg'), // Caminos Reales — taller de pulque
  p32: F('montana-1.jpg'), // Al Corazón del Mancomún
  p31: F('montana-2.jpg'), // Sierra Extrema
  p30: F('montana-3.jpg'), // Rutas de la Naturaleza
  p33: F('taller-3.jpg'), // Servicios Individuales
};

// Reparto para el resto
const POOL = [
  F('montana-4.jpg'),
  F('paisaje-1.jpg'),
  F('comunidad-1.jpg'),
  F('montana-5.jpg'),
  F('paisaje-2.jpg'),
  F('comunidad-2.jpg'),
  F('montana-6.jpg'),
  F('paisaje-3.jpg'),
  F('comunidad-3.jpg'),
  F('hongos-2.jpg'),
  F('neveria-2.jpg'),
  F('comunidad-4.jpg'),
  F('taller-2.jpg'),
  F('hongos-3.jpg'),
  F('taller-4.jpg'),
];

/** Foto de un paquete. Siempre devuelve algo. */
export function fotoDe(paqueteId: string): string {
  if (POR_PAQUETE[paqueteId]) return POR_PAQUETE[paqueteId];
  // reparto estable: el mismo paquete siempre recibe la misma foto
  let s = 0;
  for (let i = 0; i < paqueteId.length; i++) s += paqueteId.charCodeAt(i) * (i + 1);
  return POOL[s % POOL.length];
}

/** Galería: las mejores tomas, sin repetir. */
export const GALERIA = [
  F('montana-1.jpg'),
  F('sendero-bromelias.jpg'),
  F('hongo.jpg'),
  F('maguey-latuvi.jpg'),
  F('rio.jpg'),
  F('bosque-mesofilo.jpg'),
  F('neveria.jpg'),
  F('montana-5.jpg'),
];

// Foto de cada comunidad (las que tenemos identificadas)
const POR_COMUNIDAD: Record<string, string> = {
  cuajimoloyas: F('hongo.jpg'),
  la_neveria: F('neveria.jpg'),
  latuvi: F('maguey-latuvi.jpg'),
  benito_juarez: F('granja.jpg'),
  capulalpam: F('sendero-bromelias.jpg'),
  llano_grande: F('montana-4.jpg'),
  lachatao: F('comunidad-1.jpg'),
  amatlan: F('montana-6.jpg'),
  san_miguel_del_valle: F('paisaje-1.jpg'),
  teotitlan_del_valle: F('comunidad-2.jpg'),
};

export const fotoComunidad = (id: string) => POR_COMUNIDAD[id] ?? F('bosque-mesofilo.jpg');
