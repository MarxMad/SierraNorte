import ExperienciaPage, { generateMetadata as meta } from '@/paginas/experiencia';

export const revalidate = 3600;
export const generateMetadata = meta;

export default function ExperienciaEn({ params }: { params: Promise<{ id: string }> }) {
  return <ExperienciaPage params={params} lang="en" />;
}
