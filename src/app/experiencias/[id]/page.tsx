import ExperienciaPage, { metaExperiencia, paramsExperiencias } from '@/paginas/experiencia';

export const revalidate = 3600;
export const generateStaticParams = paramsExperiencias;
export const generateMetadata = metaExperiencia('es');

export default async function Experiencia({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pueblo?: string }>;
}) {
  const { pueblo } = await searchParams;
  return <ExperienciaPage params={params} lang="es" origenComunidadId={pueblo ?? null} />;
}
