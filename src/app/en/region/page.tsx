import RegionPage from '@/paginas/region';
import { alternos } from '@/lib/i18n';
export const metadata = {
  title: 'The region · Expediciones Sierra Norte',
  description:
    'Cloud forest, 2,000 plant species and over 400 birds. The Sierra Norte of Oaxaca, land of the people of the clouds.',
  alternates: alternos('en', '/region'),
  openGraph: { locale: 'en_US', alternateLocale: 'es_MX' },
};
export const revalidate = 3600;
export default function RegionEn() { return <RegionPage lang="en" />; }
