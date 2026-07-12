import EquipoPage from '@/paginas/equipo';
import { alternos } from '@/lib/i18n';
export const metadata = {
  title: 'Who we are · Expediciones Sierra Norte',
  description:
    'A company owned and operated by the Pueblos Mancomunados of Oaxaca. Here, the assembly decides.',
  alternates: alternos('en', '/equipo'),
  openGraph: { locale: 'en_US', alternateLocale: 'es_MX' },
};
export const revalidate = 3600;
export default function EquipoEn() { return <EquipoPage lang="en" />; }
