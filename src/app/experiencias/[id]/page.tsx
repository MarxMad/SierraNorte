import ExperienciaPage, { metaExperiencia, paramsExperiencias } from '@/paginas/experiencia';

export const revalidate = 3600;
export const generateStaticParams = paramsExperiencias;
export const generateMetadata = metaExperiencia('es');

export default function Experiencia({ params }: { params: Promise<{ id: string }> }) {
  return <ExperienciaPage params={params} lang="es" />;
}
