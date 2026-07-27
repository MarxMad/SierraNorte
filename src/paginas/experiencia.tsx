import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { clientePublico } from '@/lib/supabase/publico';
import { Nav, Footer } from '@/components/landing/Chrome';
import DetalleExperiencia from '@/components/landing/DetalleExperiencia';
import { fotoDe } from '@/lib/fotos';
import type { Duracion } from '@/lib/tipos';
import { t, alternos, type Idioma } from '@/lib/i18n';

type Item = { id: string; orden: number; texto: string; texto_en: string | null; tipo: string | null };
export type Dia = { dia: number; recorrido: string; items: Item[] };

/**
 * Las 33 fichas se generan al desplegar, no en la primera visita. Un paquete
 * nuevo que aún no exista aquí se genera en su primera visita y se queda.
 */
export async function paramsExperiencias() {
  const { data } = await clientePublico().from('paquetes').select('id').eq('activo', true);
  return (data ?? []).map((p) => ({ id: p.id as string }));
}

/**
 * Cada ruta (/experiencias/[id] y /en/experiencias/[id]) llama a esto con SU
 * idioma. Antes era una sola función sin idioma, y la ficha en inglés salía
 * con el título y la descripción en español.
 */
export const metaExperiencia =
  (lang: Idioma) =>
  async ({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> => {
    const { id } = await params;
    const supabase = clientePublico();
    const { data } = await supabase
      .from('paquetes')
      .select('nombre, nombre_en, descripcion, descripcion_en')
      .eq('id', id)
      .single();

    if (!data) return { title: 'Experiencia · Expediciones Sierra Norte' };

    const nombre = t(data, 'nombre', lang);
    const descripcion = t(data, 'descripcion', lang) || undefined;
    const foto = fotoDe(id);

    return {
      title: `${nombre} · Expediciones Sierra Norte`,
      description: descripcion,
      alternates: alternos(lang, `/experiencias/${id}`),
      // Al compartir la experiencia por WhatsApp se ve SU foto, no la portada.
      openGraph: {
        title: nombre,
        description: descripcion,
        images: [{ url: foto, alt: nombre }],
        locale: lang === 'es' ? 'es_MX' : 'en_US',
        alternateLocale: lang === 'es' ? 'en_US' : 'es_MX',
      },
      twitter: { card: 'summary_large_image', title: nombre, description: descripcion, images: [foto] },
    };
  };

export default async function ExperienciaPage({
  params,
  lang,
  origenComunidadId,
}: {
  params: Promise<{ id: string }>;
  lang: Idioma;
  origenComunidadId?: string | null;
}) {
  const { id } = await params;
  const supabase = clientePublico();

  const [{ data: paquete }, { data: dias }, { data: rel }, { data: comunidades }] = await Promise.all([
    supabase.from('paquetes').select('*').eq('id', id).eq('activo', true).single(),
    supabase
      .from('itinerario_dias')
      .select('dia, recorrido, itinerario_items(id, orden, texto, texto_en, tipo)')
      .eq('paquete_id', id)
      .order('dia'),
    supabase.from('paquete_comunidades').select('comunidad_id, orden').eq('paquete_id', id),
    supabase.from('comunidades').select('*'),
  ]);

  if (!paquete) notFound();

  const nombreDe = new Map((comunidades ?? []).map((c) => [c.id, c]));
  const coms = (rel ?? [])
    .sort((a, b) => a.orden - b.orden)
    .map((r) => nombreDe.get(r.comunidad_id))
    .filter(Boolean) as { id: string; nombre: string; color: string }[];

  const itinerario: Dia[] = (dias ?? []).map((d) => ({
    dia: d.dia,
    recorrido: d.recorrido,
    items: ((d.itinerario_items ?? []) as Item[]).sort((a, b) => a.orden - b.orden),
  }));

  return (
    <div className="min-h-screen bg-white">
      <Nav lang={lang} aqui={`/experiencias/${id}`} />
      <DetalleExperiencia
        lang={lang}
        paquete={{
          id: paquete.id,
          nombre: t(paquete, 'nombre', lang),
          duracion: paquete.duracion as Duracion,
          descripcion: t(paquete, 'descripcion', lang),
          precio: Number(paquete.precio),
        }}
        foto={fotoDe(paquete.id)}
        comunidades={coms}
        itinerario={itinerario}
        origenComunidadId={origenComunidadId}
      />
      <Footer lang={lang} />
    </div>
  );
}
