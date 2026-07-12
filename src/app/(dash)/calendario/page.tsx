import { exigirAcceso } from '@/lib/sesion';
import { createClient } from '@/lib/supabase/server';
import type { EventoCalendario } from '@/lib/tipos';
import CalendarioVista from './CalendarioVista';

export default async function CalendarioPage() {
  await exigirAcceso('calendario');
  const supabase = await createClient();

  // v_calendario trae las salidas del paquete Y las reservas con fecha propia
  const { data } = await supabase.from('v_calendario').select('*').order('fecha_inicio');

  return <CalendarioVista eventos={(data ?? []) as EventoCalendario[]} />;
}
