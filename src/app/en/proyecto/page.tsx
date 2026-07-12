import ProyectoPage from '@/paginas/proyecto';
import { alternos } from '@/lib/i18n';
export const metadata = {
  title: 'The project · Expediciones Sierra Norte',
  description:
    'Since 1994: a model for regional development run by the Zapotec communities of the Pueblos Mancomunados.',
  alternates: alternos('en', '/proyecto'),
  openGraph: { locale: 'en_US', alternateLocale: 'es_MX' },
};
export const revalidate = 3600;
export default function ProyectoEn() { return <ProyectoPage lang="en" />; }
