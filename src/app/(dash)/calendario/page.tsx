import { exigirAcceso } from '@/lib/sesion';
import { createClient } from '@/lib/supabase/server';
import type { VentaLiquidacion } from '@/lib/tipos';
import CalendarioVista from './CalendarioVista';

export default async function CalendarioPage() {
  await exigirAcceso('calendario');
  const supabase = await createClient();
  const { data } = await supabase
    .from('v_liquidacion_por_venta')
    .select('*')
    .order('fecha_inicio');

  return <CalendarioVista salidas={(data ?? []) as VentaLiquidacion[]} />;
}
