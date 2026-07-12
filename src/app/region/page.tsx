import RegionPage, { metadata as m } from '@/paginas/region';
import { alternos } from '@/lib/i18n';
export const metadata = { ...m, alternates: alternos('es', '/region') };
export const revalidate = 3600;
export default function Region() { return <RegionPage lang="es" />; }
