import { exigirAcceso } from '@/lib/sesion';
import { createClient } from '@/lib/supabase/server';
import type { Reserva, Paquete, Guia, Comunidad, Lead, TransporteSalida, Perfil } from '@/lib/tipos';
import VentasVista from './VentasVista';

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string; q?: string }>;
}) {
  const perfil = await exigirAcceso('ventas');
  const { v = 'panel', q = '' } = await searchParams;
  const supabase = await createClient();

  const [{ data: reservas }, { data: paquetes }, { data: guias }, { data: comunidades }, { data: leads }, { data: transportes }, { data: agentes }] =
    await Promise.all([
      supabase.from('v_reservas').select('*').order('created_at', { ascending: false }),
      supabase.from('v_paquetes').select('*').order('duracion').order('nombre'),
      supabase.from('guias').select('*').eq('activo', true).order('nombre'),
      supabase.from('comunidades').select('*').eq('activa', true).order('orden'),
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('v_transportes_salidas').select('*').order('fecha_inicio'),
      supabase.from('perfiles').select('*').eq('activo', true).in('rol', ['admin', 'ventas']),
    ]);

  return (
    <VentasVista
      perfil={perfil}
      vista={v}
      busqueda={q}
      reservas={(reservas ?? []) as Reserva[]}
      paquetes={(paquetes ?? []) as Paquete[]}
      guias={(guias ?? []) as Guia[]}
      comunidades={(comunidades ?? []) as Comunidad[]}
      leads={(leads ?? []) as Lead[]}
      transportes={(transportes ?? []) as TransporteSalida[]}
      agentes={(agentes ?? []) as Perfil[]}
    />
  );
}
