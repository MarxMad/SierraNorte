import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Expediciones Sierra Norte · Pueblos Mancomunados',
  description:
    'Turismo comunitario en la Sierra Norte de Oaxaca. Caminatas entre bosques de pino-encino, ' +
    'cabañas y cocina de los pueblos zapotecos de los Pueblos Mancomunados.',
  // Le dice a Google que el sitio existe en dos idiomas y cuál es cada uno.
  alternates: {
    languages: {
      es: '/',
      en: '/en',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased text-gray-900">{children}</body>
    </html>
  );
}
