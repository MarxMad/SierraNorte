import { createClient } from '@/lib/supabase/server';
import type { Comunidad, Duracion } from '@/lib/tipos';
import Landing from '@/components/landing/Landing';
import { t, type Idioma } from '@/lib/i18n';

export type PaqueteWeb = {
  id: string;
  nombre: string;
  duracion: Duracion;
  descripcion: string | null;
  precio: number;
  comunidades: string[];
  dias: number;
};

export default async function LandingPage({ lang }: { lang: Idioma }) {
  const supabase = await createClient();

  const [{ data: paquetes }, { data: comunidades }, { data: relaciones }, { data: dias }] =
    await Promise.all([
      supabase
        .from('paquetes')
        .select('id, nombre, nombre_en, duracion, descripcion, descripcion_en, precio')
        .eq('activo', true)
        .order('duracion')
        .order('nombre'),
      supabase.from('comunidades').select('*').eq('activa', true).order('orden'),
      supabase.from('paquete_comunidades').select('paquete_id, comunidad_id, orden'),
      supabase.from('itinerario_dias').select('paquete_id'),
    ]);

  const coms = (comunidades ?? []) as Comunidad[];
  const nombreDe = new Map(coms.map((c) => [c.id, c.nombre]));

  // Comunidades de cada paquete, en orden
  const porPaquete = new Map<string, string[]>();
  (relaciones ?? [])
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .forEach((r) => {
      const arr = porPaquete.get(r.paquete_id) ?? [];
      const n = nombreDe.get(r.comunidad_id);
      if (n) arr.push(n);
      porPaquete.set(r.paquete_id, arr);
    });

  // Nº de días del itinerario
  const diasPorPaquete = new Map<string, number>();
  (dias ?? []).forEach((d) => {
    diasPorPaquete.set(d.paquete_id, (diasPorPaquete.get(d.paquete_id) ?? 0) + 1);
  });

  const lista: PaqueteWeb[] = (paquetes ?? []).map((p) => ({
    id: p.id,
    nombre: t(p, 'nombre', lang),
    duracion: p.duracion as Duracion,
    // La ficha de Servicios trae notas de operación interna: no viaja al navegador.
    descripcion: p.duracion === 'Servicios' ? null : t(p, 'descripcion', lang),
    precio: Number(p.precio),
    comunidades: porPaquete.get(p.id) ?? [],
    dias: diasPorPaquete.get(p.id) ?? 0,
  }));

  return <Landing lang={lang} paquetes={lista} comunidades={coms} />;
}
