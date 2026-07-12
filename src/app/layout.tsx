import type { Metadata } from 'next';
import './globals.css';
import { SITIO, LOGO, FOTO_COMPARTIR } from '@/lib/sitio';

const TITULO = 'Expediciones Sierra Norte · Pueblos Mancomunados';
const DESCRIPCION =
  'Turismo comunitario en la Sierra Norte de Oaxaca. Caminatas entre bosques de pino-encino, ' +
  'cabañas y cocina de los pueblos zapotecos de los Pueblos Mancomunados.';

export const metadata: Metadata = {
  // Sin esto las rutas de abajo no se vuelven absolutas y la tarjeta de
  // WhatsApp sale sin foto.
  metadataBase: new URL(SITIO),
  title: TITULO,
  description: DESCRIPCION,
  icons: {
    icon: [{ url: LOGO, type: 'image/png' }],
    apple: [{ url: LOGO, type: 'image/png' }],
  },
  // Los idiomas alternos NO van aquí: cada página declara los suyos con
  // alternos() (ver lib/i18n). Puestos aquí, /region diría que su versión
  // en inglés es la portada.
  openGraph: {
    type: 'website',
    siteName: 'Expediciones Sierra Norte',
    title: TITULO,
    description: DESCRIPCION,
    locale: 'es_MX',
    alternateLocale: 'en_US',
    images: [
      {
        url: FOTO_COMPARTIR,
        width: 770,
        height: 891,
        alt: 'Expediciones Sierra Norte · Oaxaca',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITULO,
    description: DESCRIPCION,
    images: [FOTO_COMPARTIR],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // El sitio es español por defecto. El subárbol /en se marca como inglés en
  // su propio layout (app/en/layout.tsx).
  return (
    <html lang="es">
      <body className="antialiased text-gray-900">{children}</body>
    </html>
  );
}
