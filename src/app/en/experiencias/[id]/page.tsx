import ExperienciaPage, { metaExperiencia, paramsExperiencias } from '@/paginas/experiencia';

export const revalidate = 3600;
export const generateStaticParams = paramsExperiencias;
export const generateMetadata = metaExperiencia('en');

// Ver la nota de /experiencias/[id]: el `?pueblo=` se lee en el cliente.
export default async function ExperienciaEn({ params }: { params: Promise<{ id: string }> }) {
  return <ExperienciaPage params={params} lang="en" />;
}
