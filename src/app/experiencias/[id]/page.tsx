import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Nav, Footer } from '@/components/landing/Chrome';
import DetalleExperiencia from './DetalleExperiencia';
import { fotoDe } from '@/lib/fotos';
import type { Duracion } from '@/lib/tipos';

export const revalidate = 3600;

type Item = { id: string; orden: number; texto: string; tipo: string | null };
export type Dia = { dia: number; recorrido: string; items: Item[] };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('paquetes').select('nombre, descripcion').eq('id', id).single();
  if (!data) return { title: 'Experiencia · Expediciones Sierra Norte' };
  return {
    title: `${data.nombre} · Expediciones Sierra Norte`,
    description: data.descripcion ?? undefined,
  };
}

export default async function ExperienciaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: paquete }, { data: dias }, { data: rel }, { data: comunidades }] = await Promise.all([
    supabase.from('paquetes').select('*').eq('id', id).eq('activo', true).single(),
    supabase
      .from('itinerario_dias')
      .select('dia, recorrido, itinerario_items(id, orden, texto, tipo)')
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
      <Nav />
      <DetalleExperiencia
        paquete={{
          id: paquete.id,
          nombre: paquete.nombre,
          duracion: paquete.duracion as Duracion,
          descripcion: paquete.descripcion,
          precio: Number(paquete.precio),
        }}
        foto={fotoDe(paquete.id)}
        comunidades={coms}
        itinerario={itinerario}
      />
      <Footer />
    </div>
  );
}
