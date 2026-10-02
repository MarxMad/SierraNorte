import { clientePublico } from '@/lib/supabase/publico';
import { notFound } from 'next/navigation';
import type { Comunidad } from '@/lib/tipos';
import PuebloLanding from '@/components/landing/PuebloLanding';
import type { PaqueteWeb } from '@/paginas/landing';
import { escenaDe } from '@/lib/escenas';
import { t, type Idioma } from '@/lib/i18n';

export default async function PuebloPage({ lang, id }: { lang: Idioma; id: string }) {
  const supabase = clientePublico();

  const { data: comunidad } = await supabase.from('comunidades').select('*').eq('id', id).eq('activa', true).single();
  if (!comunidad) notFound();

  const [{ data: relaciones }, { data: paquetes }, { data: dias }] = await Promise.all([
    supabase.from('paquete_comunidades').select('paquete_id, orden').eq('comunidad_id', id),
    supabase
      .from('paquetes')
      .select('id, nombre, nombre_en, duracion, descripcion, descripcion_en, precio')
      .eq('activo', true)
      .neq('duracion', 'Servicios')
      .order('duracion')
      .order('nombre'),
    supabase.from('itinerario_dias').select('paquete_id'),
  ]);

  const ids = new Set((relaciones ?? []).map((r) => r.paquete_id));
  const diasPorPaquete = new Map<string, number>();
  (dias ?? []).forEach((d) => diasPorPaquete.set(d.paquete_id, (diasPorPaquete.get(d.paquete_id) ?? 0) + 1));

  const lista: PaqueteWeb[] = (paquetes ?? [])
    .filter((p) => ids.has(p.id))
    .map((p) => ({
      id: p.id,
      nombre: t(p, 'nombre', lang),
      duracion: p.duracion as PaqueteWeb['duracion'],
      descripcion: t(p, 'descripcion', lang),
      precio: Number(p.precio),
      comunidades: [(comunidad as Comunidad).nombre],
      dias: diasPorPaquete.get(p.id) ?? 0,
    }));

  const c = comunidad as Comunidad & { descripcion?: string | null; descripcion_en?: string | null };
  const descripcion =
    lang === 'en' ? c.descripcion_en || c.descripcion || null : c.descripcion || null;

  return (
    <PuebloLanding
      lang={lang}
      comunidad={c}
      escena={escenaDe(c.id)}
      descripcion={descripcion}
      paquetes={lista}
    />
  );
}
