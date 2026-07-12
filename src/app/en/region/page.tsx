import RegionPage from '@/paginas/region';
export const metadata = {
  title: 'The region · Expediciones Sierra Norte',
  description:
    'Cloud forest, 2,000 plant species and over 400 birds. The Sierra Norte of Oaxaca, land of the people of the clouds.',
};
export const revalidate = 3600;
export default function RegionEn() { return <RegionPage lang="en" />; }
