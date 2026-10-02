// =====================================================================
// Tipografía de display
//
// El prototipo cinematográfico venía con Ogg Medium servida desde un
// CloudFront ajeno. Ogg es de licencia comercial (Sharp Type) y el sitio
// no la tiene, así que se usa Instrument Serif: serif de display, alto
// contraste, la misma familia de gesto, y next/font la auto-hospeda —
// sin petición a un tercero y sin salto de layout.
//
// Si ESN compra la licencia de Ogg, esto se cambia por next/font/local
// apuntando al .woff2 y nada más se mueve: el resto lee la variable.
// =====================================================================

import { Instrument_Serif } from 'next/font/google';

export const display = Instrument_Serif({
  subsets: ['latin', 'latin-ext'], // latin-ext trae los acentos y la ñ
  weight: '400',
  display: 'swap',
  variable: '--fuente-display',
});
