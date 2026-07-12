import EquipoPage from '@/paginas/equipo';
export const metadata = {
  title: 'Who we are · Expediciones Sierra Norte',
  description:
    'A company owned and operated by the Pueblos Mancomunados of Oaxaca. Here, the assembly decides.',
};
export const revalidate = 3600;
export default function EquipoEn() { return <EquipoPage lang="en" />; }
