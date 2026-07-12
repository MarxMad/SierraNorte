import ProyectoPage, { metadata as m } from '@/paginas/proyecto';
export const metadata = m;
export const revalidate = 3600;
export default function Proyecto() { return <ProyectoPage lang="es" />; }
