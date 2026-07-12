import ProyectoPage, { metadata as m } from '@/paginas/proyecto';
import { alternos } from '@/lib/i18n';
export const metadata = { ...m, alternates: alternos('es', '/proyecto') };
export const revalidate = 3600;
export default function Proyecto() { return <ProyectoPage lang="es" />; }
