import { exigirAcceso } from '@/lib/sesion';
import { createClient } from '@/lib/supabase/server';
import type { VentaLiquidacion, ConceptoLiquidacion, Gasto, Comunidad, Paquete } from '@/lib/tipos';
import LiquidacionVista from './LiquidacionVista';

export default async function LiquidacionPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string; q?: string }>;
}) {
  const perfil = await exigirAcceso('liquidacion');
  const { v = 'ventas', q = '' } = await searchParams;
  const supabase = await createClient();

  const [{ data: ventas }, { data: conceptos }, { data: gastos }, { data: comunidades }, { data: paquetes }] =
    await Promise.all([
      supabase.from('v_liquidacion_por_venta').select('*').order('fecha_inicio'),
      supabase.from('v_liquidacion_programada').select('*').order('dia'),
      supabase.from('gastos').select('*').order('fecha', { ascending: false }),
      supabase.from('comunidades').select('*').order('orden'),
      supabase.from('paquetes').select('id, nombre').neq('duracion', 'Servicios').order('nombre'),
    ]);

  return (
    <LiquidacionVista
      perfil={perfil}
      vista={v}
      busqueda={q}
      ventas={(ventas ?? []) as VentaLiquidacion[]}
      conceptos={(conceptos ?? []) as ConceptoLiquidacion[]}
      gastos={(gastos ?? []) as Gasto[]}
      comunidades={(comunidades ?? []) as Comunidad[]}
      paquetes={(paquetes ?? []) as Pick<Paquete, 'id' | 'nombre'>[]}
    />
  );
}
