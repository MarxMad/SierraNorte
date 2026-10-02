// =====================================================================
// Bilingüe — español (por defecto) e inglés
//
// El idioma vive en la URL: / es español, /en es inglés.
// El dashboard interno NO se traduce: el equipo trabaja en español.
// =====================================================================

export const IDIOMAS = ['es', 'en'] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const IDIOMA_POR_DEFECTO: Idioma = 'es';

export const esIdioma = (v: string | undefined): v is Idioma =>
  !!v && (IDIOMAS as readonly string[]).includes(v);

/** Antepone /en cuando toca. En español la URL queda limpia. */
export const ruta = (lang: Idioma, path: string) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return lang === 'es' ? p : `/en${p === '/' ? '' : p}`;
};

/** La misma página en el otro idioma. */
export const otroIdioma = (lang: Idioma): Idioma => (lang === 'es' ? 'en' : 'es');

/**
 * Le dice a Google que esta página existe en dos idiomas y cuál es cuál.
 * Va en el `metadata` de CADA página: si sólo se declara en el layout raíz,
 * todas las páginas acaban diciendo que su versión en inglés es la portada.
 */
export const alternos = (lang: Idioma, path: string) => ({
  canonical: ruta(lang, path),
  languages: {
    es: ruta('es', path),
    en: ruta('en', path),
    // A quien busca desde un idioma que no tenemos, mándalo al español.
    'x-default': ruta('es', path),
  },
});

/** Elige la columna traducida y cae al español si falta. */
export const t = <T extends Record<string, unknown>>(
  fila: T,
  campo: string,
  lang: Idioma
): string => {
  const es = (fila[campo] ?? '') as string;
  if (lang === 'es') return es;
  const en = fila[`${campo}_en`] as string | null | undefined;
  return en || es;
};

// ---------------------------------------------------------------------
// Textos de la interfaz
// ---------------------------------------------------------------------
export const DICT = {
  es: {
    // nav
    experiencias: 'Experiencias',
    laRegion: 'La región',
    elProyecto: 'El proyecto',
    quienesSomos: 'Quiénes somos',
    contacto: 'Contacto',
    entrar: 'Entrar',
    accesoEquipo: 'Acceso del equipo',

    // hero
    heroBadge: 'Turismo comunitario · Sierra Norte de Oaxaca',
    heroTitulo1: 'Camina la sierra.',
    heroTitulo2: 'Duerme en el pueblo.',
    heroSub: (n: number, c: number) =>
      `${n} experiencias entre bosques de pino-encino, caminos reales y miradores a 3,200 metros. Operadas por las ${c} comunidades zapotecas de los Pueblos Mancomunados.`,
    verExperiencias: 'Ver las experiencias',
    reservarWhats: 'Reservar por WhatsApp',
    comunidades: 'Comunidades',
    diasDeRuta: 'Días de ruta',
    comunitario: 'Comunitario',

    // experiencias
    paquetesEyebrow: 'Paquetes de experiencias',
    paquetesTitulo: 'Elige cuántos días quieres perderte',
    paquetesSub:
      'Desde una caminata de un día hasta la travesía de siete que atraviesa seis pueblos. Todas incluyen guía local, alimentos y hospedaje en cabañas.',
    todas: 'Todas',
    desde: 'desde',
    porPersona: '/ persona',
    cotizacion: 'Cotización a medida',
    verItinerario: 'Ver itinerario',
    diaRuta: (n: number) => `${n} ${n === 1 ? 'día de ruta' : 'días de ruta'}`,
    experiencia: (n: number) => `${n} ${n === 1 ? 'experiencia' : 'experiencias'}`,

    // a la carta
    alaCarta: 'A la carta',
    alaCartaTitulo: '¿Sólo quieres una pieza?',
    alaCartaSub:
      'Anfitrión bilingüe, transporte, guía de sendero, tirolesa, temazcal, talleres de cocina tradicional o una noche en cabaña. Se venden por separado o se agregan a cualquier ruta.',
    cotizarServicios: 'Cotizar servicios',

    // comunidades
    pueblosEyebrow: 'Pueblos Mancomunados',
    pueblosTitulo: (n: number) => `${n} pueblos, un solo territorio`,
    pueblosSub:
      'Son comunidades zapotecas que administran en común un territorio de bosque de niebla y pino-encino. No hay intermediarios: las cabañas, los comedores y los guías son de los pueblos.',

    // nosotros
    porQueEyebrow: 'Por qué existimos',
    porQueTitulo: 'El turismo, bien hecho, cuida lo que toca',
    porQueTexto:
      'Lo que dejas en la sierra se queda en la sierra: en quien te guía, en quien te da de comer y en quien mantiene el sendero abierto. No somos una agencia que trae gente a los pueblos: somos los pueblos.',
    pilar1t: 'Senderos con historia',
    pilar1d:
      'Caminos reales prehispánicos, antiguas minas y ex haciendas. No son rutas inventadas para el turista.',
    pilar2t: 'Cocina de la comunidad',
    pilar2d:
      'Comes lo que se cocina en el pueblo: trucha, hongos de temporada, tortillas hechas a mano.',
    pilar3t: 'Cabañas comunitarias',
    pilar3d:
      'Hospedaje operado por las propias comunidades, a 3,200 metros sobre el nivel del mar.',
    pilar4t: 'Anfitrión bilingüe',
    pilar4d: 'Guías locales que hablan español e inglés y conocen el monte de memoria.',

    // contacto
    contactoTitulo: '¿Nos vemos en la sierra?',
    contactoSub:
      'Escríbenos y armamos la ruta contigo: cuántos son, cuántos días tienen y qué tan fuerte le quieren dar.',
    enviarCorreo: 'Enviar correo',
    correo: 'Correo',
    telefono: 'Teléfono',
    oficina: 'Oficina',

    // detalle
    todasExperiencias: 'Todas las experiencias',
    dias: 'días',
    dia: 'día',
    kmSendero: 'km de sendero',
    comunidad: 'comunidad',
    itinerarioTitulo: 'Itinerario día por día',
    itinerarioSub: 'Esto es exactamente lo que vas a caminar, comer y dónde vas a dormir.',
    incluye: 'Guía local, alimentos y hospedaje en cabañas de la comunidad.',
    solicitarReserva: 'Solicitar reserva',
    preguntarWhats: 'Preguntar por WhatsApp',
    inc1: 'Guía de la comunidad',
    inc2: 'Alimentos en comedores locales',
    inc3: 'Hospedaje en cabañas',
    inc3b: 'Actividades incluidas',
    inc4: 'Anfitrión bilingüe disponible',
    cierreDetalle:
      'Guías, cocineras y anfitriones son de las comunidades por las que vas a pasar. Al viajar con nosotros, el turismo se queda en la sierra.',
    tipoCaminata: 'Caminata',
    tipoHospedaje: 'Hospedaje',
    tipoActividad: 'Actividad',
    tipoTaller: 'Taller',

    // formulario
    formTitulo: 'Apartar lugar',
    formNombre: 'Tu nombre',
    formNombrePh: 'Nombre y apellido',
    formCorreo: 'Correo',
    formTel: 'Teléfono / WhatsApp',
    formPersonas: '¿Cuántas personas?',
    formFecha: '¿Qué día quieren salir?',
    formNinos: '¿Vienen niños?',
    formSi: 'Sí',
    formNo: 'No',
    formNinosNota: 'Los niños van incluidos dentro del total de personas.',
    formNotas: '¿Algo que debamos saber?',
    formNotasPh: 'Alergias, condición física, idioma, hora de llegada…',
    formEnviar: 'Apartar ahora',
    formEnviando: 'Apartando…',
    formLegal:
      'Tu lugar queda apartado 8 horas. Te contactamos para confirmar el depósito y forma de pago.',
    formOkTitulo: 'Lugar apartado',
    formOkSub: (mail: string) =>
      `Te escribimos a ${mail} para confirmar el depósito. Si no pagas a tiempo, el cupo se libera.`,
    formCodigo: 'Tu código de apartado',
    formApartadoExpira: (fecha: string) => `Este apartado vence el ${fecha}.`,
    formCupoRestante: (n: number) =>
      n === 0 ? 'Sin cupo para esta fecha.' : `Quedan ${n} lugares (personas) para esta salida.`,
    formListo: 'Listo',
    errNombre: 'Escribe tu nombre.',
    errCorreo: 'El correo no parece válido.',

    puebloExperiencias: 'Experiencias en',
    puebloVerTodas: 'Ver todas en Expediciones Sierra Norte',
    puebloContactoLead: 'Solicitar información',
    puebloLeadOk: 'Gracias. Te contactaremos pronto.',
  },

  en: {
    experiencias: 'Experiences',
    laRegion: 'The region',
    elProyecto: 'The project',
    quienesSomos: 'Who we are',
    contacto: 'Contact',
    entrar: 'Sign in',
    accesoEquipo: 'Team access',

    heroBadge: 'Community tourism · Sierra Norte, Oaxaca',
    heroTitulo1: 'Walk the mountains.',
    heroTitulo2: 'Sleep in the village.',
    heroSub: (n: number, c: number) =>
      `${n} experiences through pine-oak forest, ancient royal roads and lookouts at 3,200 metres. Run by the ${c} Zapotec villages of the Pueblos Mancomunados.`,
    verExperiencias: 'See the experiences',
    reservarWhats: 'Book on WhatsApp',
    comunidades: 'Villages',
    diasDeRuta: 'Days on the trail',
    comunitario: 'Community-run',

    paquetesEyebrow: 'Experience packages',
    paquetesTitulo: 'Choose how long you want to disappear',
    paquetesSub:
      'From a one-day hike to a seven-day crossing through six villages. All include a local guide, meals and cabin lodging.',
    todas: 'All',
    desde: 'from',
    porPersona: '/ person',
    cotizacion: 'Custom quote',
    verItinerario: 'See itinerary',
    diaRuta: (n: number) => `${n} ${n === 1 ? 'day on the trail' : 'days on the trail'}`,
    experiencia: (n: number) => `${n} ${n === 1 ? 'experience' : 'experiences'}`,

    alaCarta: 'À la carte',
    alaCartaTitulo: 'Just want one piece?',
    alaCartaSub:
      'Bilingual host, transport, trail guide, zipline, temazcal, traditional cooking workshops or a night in a cabin. Book them on their own or add them to any route.',
    cotizarServicios: 'Request a quote',

    pueblosEyebrow: 'Pueblos Mancomunados',
    pueblosTitulo: (n: number) => `${n} villages, one shared territory`,
    pueblosSub:
      'Zapotec communities that hold and manage a cloud forest territory in common. There are no middlemen: the cabins, the kitchens and the guides belong to the villages.',

    porQueEyebrow: 'Why we exist',
    porQueTitulo: 'Tourism, done right, protects what it touches',
    porQueTexto:
      'What you spend in the mountains stays in the mountains: with the person who guides you, the person who feeds you and the person who keeps the trail open. We are not an agency bringing people to the villages — we are the villages.',
    pilar1t: 'Trails with history',
    pilar1d:
      'Pre-Hispanic royal roads, old mines and former haciendas. These are not routes invented for tourists.',
    pilar2t: 'Village cooking',
    pilar2d:
      'You eat what the village cooks: trout, seasonal wild mushrooms, tortillas made by hand.',
    pilar3t: 'Community cabins',
    pilar3d: 'Lodging run by the communities themselves, at 3,200 metres above sea level.',
    pilar4t: 'Bilingual host',
    pilar4d: 'Local guides who speak Spanish and English and know the mountain by heart.',

    contactoTitulo: 'See you up in the mountains?',
    contactoSub:
      'Write to us and we will build the route with you: how many of you, how many days, and how hard you want to push.',
    enviarCorreo: 'Send an email',
    correo: 'Email',
    telefono: 'Phone',
    oficina: 'Office',

    todasExperiencias: 'All experiences',
    dias: 'days',
    dia: 'day',
    kmSendero: 'km of trail',
    comunidad: 'village',
    itinerarioTitulo: 'Day-by-day itinerary',
    itinerarioSub: 'This is exactly what you will walk, what you will eat and where you will sleep.',
    incluye: 'Local guide, meals and lodging in community cabins.',
    solicitarReserva: 'Request a booking',
    preguntarWhats: 'Ask on WhatsApp',
    inc1: 'Guide from the village',
    inc2: 'Meals in local kitchens',
    inc3: 'Cabin lodging',
    inc3b: 'Activities included',
    inc4: 'Bilingual host available',
    cierreDetalle:
      'Guides, cooks and hosts are from the villages you will walk through. When you travel with us, tourism stays in the mountains.',
    tipoCaminata: 'Hike',
    tipoHospedaje: 'Lodging',
    tipoActividad: 'Activity',
    tipoTaller: 'Workshop',

    formTitulo: 'Hold your spot',
    formNombre: 'Your name',
    formNombrePh: 'First and last name',
    formCorreo: 'Email',
    formTel: 'Phone / WhatsApp',
    formPersonas: 'How many people?',
    formFecha: 'What day would you like to start?',
    formNinos: 'Any children?',
    formSi: 'Yes',
    formNo: 'No',
    formNinosNota: 'Children are counted within the total number of people.',
    formNotas: 'Anything we should know?',
    formNotasPh: 'Allergies, fitness level, language, arrival time…',
    formEnviar: 'Hold spot',
    formEnviando: 'Holding…',
    formLegal:
      'Your spot is held for 8 hours. We will contact you to confirm deposit and payment.',
    formOkTitulo: 'Spot held',
    formOkSub: (mail: string) =>
      `We will email ${mail} to confirm your deposit. Unpaid holds are released automatically.`,
    formCodigo: 'Your hold code',
    formApartadoExpira: (fecha: string) => `This hold expires on ${fecha}.`,
    formCupoRestante: (n: number) =>
      n === 0 ? 'No availability on this date.' : `${n} spots (people) left for this departure.`,
    formListo: 'Done',
    errNombre: 'Please write your name.',
    errCorreo: 'That email does not look valid.',

    puebloExperiencias: 'Experiences in',
    puebloVerTodas: 'See all on Expediciones Sierra Norte',
    puebloContactoLead: 'Request information',
    puebloLeadOk: 'Thank you. We will be in touch soon.',
  },
} as const;

export type Dict = (typeof DICT)['es'];
export const dict = (lang: Idioma): Dict => DICT[lang] as Dict;
