'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// =====================================================================
// Acciones del sitio público (sin sesión).
// La única escritura que permite un visitante es solicitar una reserva,
// y pasa por la función `solicitar_reserva` de la base, que controla el
// precio y fuerza el status a 'Planeación'.
// =====================================================================

export type ResultadoReserva = { ok: boolean; codigo?: string; error?: string };

export async function solicitarReserva(datos: {
  nombre: string;
  email: string;
  telefono: string;
  paqueteId: string;
  personas: number;
  ninos: boolean;
  numNinos: number;
  fecha: string;
  notas: string;
}): Promise<ResultadoReserva> {
  if (!datos.nombre.trim()) return { ok: false, error: 'Escribe tu nombre.' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(datos.email.trim()))
    return { ok: false, error: 'El correo no parece válido.' };

  const supabase = await createClient();

  const { data, error } = await supabase.rpc('solicitar_reserva', {
    p_nombre: datos.nombre,
    p_email: datos.email,
    p_telefono: datos.telefono,
    p_paquete_id: datos.paqueteId,
    p_personas: datos.personas,
    p_ninos: datos.ninos,
    p_num_ninos: datos.ninos ? datos.numNinos : 0,
    p_fecha: datos.fecha || null,
    p_notas: datos.notas,
  });

  if (error) {
    const m = error.message;
    if (m.includes('correo')) return { ok: false, error: 'El correo no es válido.' };
    if (m.includes('personas')) return { ok: false, error: 'El número de personas no es válido.' };
    if (m.includes('niños')) return { ok: false, error: 'Los niños no pueden exceder el total de personas.' };
    if (m.includes('paquete')) return { ok: false, error: 'Esa experiencia ya no está disponible.' };
    return { ok: false, error: 'No pudimos enviar tu solicitud. Escríbenos por WhatsApp.' };
  }

  // La reserva ya aparece en el dashboard del equipo
  revalidatePath('/ventas');

  return { ok: true, codigo: data as string };
}
