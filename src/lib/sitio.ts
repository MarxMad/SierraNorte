// =====================================================================
// La URL pública del sitio.
//
// El sitemap, el canonical y las etiquetas de compartir (WhatsApp,
// Facebook, Google) sólo funcionan con URLs absolutas: una ruta como
// "/fotos/portada.jpg" no significa nada fuera del sitio.
//
// Cuando compres el dominio, ponlo en NEXT_PUBLIC_SITIO y ya. Mientras
// tanto Vercel nos da la URL de producción del proyecto.
// =====================================================================
export const SITIO =
  process.env.NEXT_PUBLIC_SITIO ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

/** Logo de la marca (favicon, cabecera, tarjetas de compartir). */
export const LOGO = '/sierran.png';

/** Imagen de previsualización al compartir el sitio (WhatsApp, redes). */
export const FOTO_COMPARTIR = LOGO;
