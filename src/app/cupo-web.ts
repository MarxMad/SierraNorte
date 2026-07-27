'use server';

import { createClient } from '@/lib/supabase/server';

// Visitante: consulta cupo restante para una salida (sin sesión).
export async function cupoRestantePublico(
  paqueteId: string,
  fecha: string
): Promise<{ restante: number | null }> {
  if (!fecha) return { restante: null };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('cupo_restante_publico', {
    p_paquete_id: paqueteId,
    p_fecha: fecha,
  });
  if (error) return { restante: null };
  return { restante: data as number | null };
}
