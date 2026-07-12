import EquipoPage, { metadata as m } from '@/paginas/equipo';
import { alternos } from '@/lib/i18n';
export const metadata = { ...m, alternates: alternos('es', '/equipo') };
export const revalidate = 3600;
export default function Equipo() { return <EquipoPage lang="es" />; }
