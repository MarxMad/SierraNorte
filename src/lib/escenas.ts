// =====================================================================
// Escenario cinematográfico de cada micrositio
//
// El acto de scroll de un pueblo se arma con siete capas. Cuando ESN
// entregue el material propio de cada comunidad (está en la lista de
// responsabilidades de la propuesta), cada capa lleva su propia foto.
//
// OJO CON LOS NOMBRES DE ARCHIVO: no describen el contenido. Se pusieron
// por reparto, no por lo que retratan. `paisaje-2.jpg` son manzanas en
// el árbol, `montana-5.jpg` es un temazcal y `granja.jpg` es el retrato
// de estudio de una persona del equipo. La asignación de abajo se hizo
// mirando cada foto, no leyendo su nombre.
//
// El TEXTO de cada pueblo NO vive aquí: sale de `comunidades.descripcion`
// en Supabase, para que ESN lo edite desde el panel sin tocar código.
// =====================================================================

const F = (n: string) => `/fotos/${n}`;

/** Las siete capas del escenario, del fondo al frente. */
export interface Capas {
  cielo: string;
  niebla: string;
  pueblo: string;
  izq: string;
  der: string;
  sendero: string;
  naturaleza: string;
}

export interface Escena {
  capas: Capas;
  /**
   * La seña del pueblo — el sobretítulo del hero. Sólo se llena donde
   * el repo ya documenta algo concreto de esa comunidad; en el resto
   * queda null y sale el sobretítulo genérico de los Mancomunados.
   * Lo confirma ESN pueblo por pueblo.
   */
  sena: { es: string; en: string } | null;
}

/**
 * Expande cinco tomas a las siete capas del escenario.
 *
 * Cada hueco pide un tipo de foto distinto y por eso van explícitos:
 *
 *   fondo      toma ancha con cielo y profundidad. Es el fotograma de
 *              apertura y vuelve como sendero, ya desenfocada detrás de
 *              su propia copia: así el zoom lee como entrar en la imagen.
 *   atmosfera  niebla o bosque cerrado. Sostiene los dos planos medios.
 *   a, b       detalle vertical u horizontal para los marcos laterales.
 *   cierre     toma ancha para el último plano del acto.
 */
const capas = (
  fondo: string,
  atmosfera: string,
  a: string,
  b: string,
  cierre: string
): Capas => ({
  cielo: F(fondo),
  niebla: F(atmosfera),
  pueblo: F(atmosfera),
  izq: F(a),
  der: F(b),
  sendero: F(fondo),
  naturaleza: F(cierre),
});

// Cada pueblo abre con una toma de paisaje distinta y de centro tranquilo:
// el título cae justo en medio y casi todas las fotos de grupo del acervo
// tienen una cara ahí. Sólo hay ocho tomas así, de modo que las dos
// comunidades aliadas repiten la de algún mancomunado.
const ESCENAS: Record<string, Escena> = {
  cuajimoloyas: {
    // Los hongos sí son de Cuajimoloyas: ya venían asignados así en fotos.ts.
    capas: capas('taller-3.jpg', 'montana-2.jpg', 'hongo.jpg', 'hongos-2.jpg', 'hongos-3.jpg'),
    sena: { es: 'Hongos y niebla', en: 'Mushrooms and mist' },
  },
  benito_juarez: {
    capas: capas('portada.jpg', 'taller-2.jpg', 'neveria.jpg', 'neveria-2.jpg', 'montana-4.jpg'),
    sena: { es: 'Donde empezó todo, 1994', en: 'Where it all began, 1994' },
  },
  llano_grande: {
    capas: capas(
      'paisaje-1.jpg',
      'montana-2.jpg',
      'comunidad-3.jpg',
      'sendero-bromelias.jpg',
      'paisaje-3.jpg'
    ),
    sena: null,
  },
  la_neveria: {
    capas: capas('montana-3.jpg', 'taller-2.jpg', 'neveria-2.jpg', 'montana-6.jpg', 'portada.jpg'),
    sena: null,
  },
  latuvi: {
    capas: capas(
      'montana-2.jpg',
      'bosque-mesofilo.jpg',
      'maguey-latuvi.jpg',
      'rio.jpg',
      'montana-4.jpg'
    ),
    sena: { es: 'Maguey, pulque y bosque mesófilo', en: 'Maguey, pulque and cloud forest' },
  },
  lachatao: {
    // El túnel de mina de comunidad-1.jpg encaja con el pasado minero de
    // Lachatao, pero la foto no viene etiquetada: que lo confirme ESN.
    capas: capas(
      'paisaje-3.jpg',
      'bosque-mesofilo.jpg',
      'comunidad-1.jpg',
      'comunidad-4.jpg',
      'paisaje-1.jpg'
    ),
    sena: null,
  },
  amatlan: {
    capas: capas(
      'taller-2.jpg',
      'montana-2.jpg',
      'comunidad-2.jpg',
      'sendero-bromelias.jpg',
      'taller-3.jpg'
    ),
    sena: null,
  },
  capulalpam: {
    capas: capas('rio.jpg', 'taller-2.jpg', 'comunidad-3.jpg', 'comunidad-4.jpg', 'paisaje-1.jpg'),
    sena: null,
  },
  san_miguel_del_valle: {
    capas: capas(
      'paisaje-1.jpg',
      'bosque-mesofilo.jpg',
      'montana-6.jpg',
      'taller-1.jpg',
      'taller-4.jpg'
    ),
    sena: null,
  },
  teotitlan_del_valle: {
    capas: capas('portada.jpg', 'taller-2.jpg', 'montana-6.jpg', 'neveria-2.jpg', 'paisaje-1.jpg'),
    sena: null,
  },
};

/** Escena de un pueblo. Un pueblo nuevo en la base nunca se queda sin escenario. */
export const escenaDe = (comunidadId: string): Escena =>
  ESCENAS[comunidadId] ?? {
    capas: capas(
      'portada.jpg',
      'bosque-mesofilo.jpg',
      'sendero-bromelias.jpg',
      'comunidad-3.jpg',
      'paisaje-1.jpg'
    ),
    sena: null,
  };
