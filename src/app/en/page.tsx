import LandingPage from '@/paginas/landing';
import { alternos } from '@/lib/i18n';

export const metadata = {
  title: 'Expediciones Sierra Norte · Pueblos Mancomunados',
  description:
    'Community-run tourism in the Sierra Norte of Oaxaca. Hikes through pine-oak forest, ' +
    'cabins and the cooking of the Zapotec Pueblos Mancomunados.',
  alternates: alternos('en', '/'),
  openGraph: { locale: 'en_US', alternateLocale: 'es_MX' },
};
export const revalidate = 3600;

export default function HomeEn() {
  return <LandingPage lang="en" />;
}
