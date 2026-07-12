import { exigirAcceso } from '@/lib/sesion';
import { createClient } from '@/lib/supabase/server';
import type {
  VentaLiquidacion,
  ConceptoLiquidacion,
  CobroLiquidacion,
  Comunidad,
} from '@/lib/tipos';
import LiquidacionVista from './LiquidacionVista';

export default async function LiquidacionPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string; q?: string }>;
}) {
  const perfil = await exigirAcceso('liquidacion');
  const { v = 'ventas', q = '' } = await searchParams;
  const supabase = await createClient();

  const [{ data: ventas }, { data: conceptos }, { data: cobros }, { data: cobrosKpis }, { data: comunidades }] =
    await Promise.all([
      supabase.from('v_liquidacion_por_venta').select('*').order('fecha_inicio'),
      supabase.from('v_liquidacion_programada').select('*').order('dia'),
      // Cobros en efectivo y pago en comunidad: los pendientes primero
      supabase
        .from('v_cobros_liquidacion')
        .select('*')
        .order('status')
        .order('fecha', { ascending: false }),
      supabase.from('v_cobros_kpis').select('*').single(),
      supabase.from('comunidades').select('*').order('orden'),
    ]);

  return (
    <LiquidacionVista
      perfil={perfil}
      vista={v}
      busqueda={q}
      ventas={(ventas ?? []) as VentaLiquidacion[]}
      conceptos={(conceptos ?? []) as ConceptoLiquidacion[]}
      cobros={(cobros ?? []) as CobroLiquidacion[]}
      cobrosKpis={cobrosKpis ?? { por_validar: 0, validado: 0, pendientes: 0, cobros: 0 }}
      comunidades={(comunidades ?? []) as Comunidad[]}
    />
  );
}
