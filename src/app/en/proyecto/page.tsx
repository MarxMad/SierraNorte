import ProyectoPage from '@/paginas/proyecto';
export const metadata = {
  title: 'The project · Expediciones Sierra Norte',
  description:
    'Since 1994: a model for regional development run by the Zapotec communities of the Pueblos Mancomunados.',
};
export const revalidate = 3600;
export default function ProyectoEn() { return <ProyectoPage lang="en" />; }
