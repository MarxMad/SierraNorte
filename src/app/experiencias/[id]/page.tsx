import ExperienciaPage, { metaExperiencia, paramsExperiencias } from '@/paginas/experiencia';

export const revalidate = 3600;
export const generateStaticParams = paramsExperiencias;
export const generateMetadata = metaExperiencia('es');

// El `?pueblo=` que manda el micrositio NO se lee aquí: esta ficha se
// prerenderiza y leer searchParams en el servidor la vuelve dinámica.
// Lo lee ReservaForm en el cliente, que es donde hace falta.
export default async function Experiencia({ params }: { params: Promise<{ id: string }> }) {
  return <ExperienciaPage params={params} lang="es" />;
}
