import EquipoPage, { metadata as m } from '@/paginas/equipo';
export const metadata = m;
export const revalidate = 3600;
export default function Equipo() { return <EquipoPage lang="es" />; }
