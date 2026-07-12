import RegionPage, { metadata as m } from '@/paginas/region';
export const metadata = m;
export const revalidate = 3600;
export default function Region() { return <RegionPage lang="es" />; }
