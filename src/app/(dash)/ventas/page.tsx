import { exigirAcceso } from '@/lib/sesion';
import { createClient } from '@/lib/supabase/server';
import type { Reserva, Paquete, Guia, Comunidad } from '@/lib/tipos';
import VentasVista from './VentasVista';

export default async function VentasPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string; q?: string }>;
}) {
  const perfil = await exigirAcceso('ventas');
  const { v = 'clientes', q = '' } = await searchParams;
  const supabase = await createClient();

  const [{ data: reservas }, { data: paquetes }, { data: guias }, { data: comunidades }] =
    await Promise.all([
      supabase.from('v_reservas').select('*').order('codigo'),
      supabase.from('v_paquetes').select('*').order('duracion').order('nombre'),
      supabase.from('guias').select('*').eq('activo', true).order('nombre'),
      // El paquete necesita saber por qué pueblos pasa: de ahí sale la Liquidación
      supabase.from('comunidades').select('*').eq('activa', true).order('orden'),
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
    />
  );
}
