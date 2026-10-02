'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// =====================================================================
// Acciones del sitio público (sin sesión).
// La única escritura que permite un visitante es apartar una reserva,
// y pasa por la función `apartar_reserva` de la base, que controla el
// precio, revisa el cupo y deja el status en 'Apartado' con vencimiento.
// =====================================================================

export type ResultadoReserva = {
  ok: boolean;
  codigo?: string;
  expiraAt?: string;
  error?: string;
};

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
  lang?: 'es' | 'en';
  origenComunidadId?: string | null;
}): Promise<ResultadoReserva> {
  const en = datos.lang === 'en';
  const msg = {
    nombre: en ? 'Please write your name.' : 'Escribe tu nombre.',
    correo: en ? 'That email does not look valid.' : 'El correo no parece válido.',
    personas: en ? 'That number of people is not valid.' : 'El número de personas no es válido.',
    ninos: en
      ? 'Children cannot exceed the total number of people.'
      : 'Los niños no pueden exceder el total de personas.',
    paquete: en ? 'That experience is no longer available.' : 'Esa experiencia ya no está disponible.',
    cupo: en ? 'No availability for that date.' : 'No hay cupo para esa fecha.',
    fecha: en ? 'Pick a start date to hold your spot.' : 'Selecciona la fecha de salida para apartar.',
    generico: en
      ? 'We could not send your request. Please write to us on WhatsApp.'
      : 'No pudimos enviar tu solicitud. Escríbenos por WhatsApp.',
  };

  if (!datos.nombre.trim()) return { ok: false, error: msg.nombre };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(datos.email.trim()))
    return { ok: false, error: msg.correo };
  if (!datos.fecha?.trim()) return { ok: false, error: msg.fecha };

  const supabase = await createClient();

  const { data, error } = await supabase.rpc('apartar_reserva', {
    p_nombre: datos.nombre,
    p_email: datos.email,
    p_telefono: datos.telefono,
    p_paquete_id: datos.paqueteId,
    p_personas: datos.personas,
    p_ninos: datos.ninos,
    p_num_ninos: datos.ninos ? datos.numNinos : 0,
    p_fecha: datos.fecha,
    p_notas: datos.notas,
    p_origen_comunidad_id: datos.origenComunidadId ?? null,
    p_horas_hold: 8,
  });

  if (error) {
    const m = error.message;
    if (m.includes('correo')) return { ok: false, error: msg.correo };
    if (m.includes('personas')) return { ok: false, error: msg.personas };
    if (m.includes('niños')) return { ok: false, error: msg.ninos };
    if (m.includes('paquete')) return { ok: false, error: msg.paquete };
    if (m.includes('cupo')) return { ok: false, error: msg.cupo };
    if (m.includes('fecha')) return { ok: false, error: msg.fecha };
    return { ok: false, error: msg.generico };
  }

  const payload = data as { codigo: string; expira_at: string };

  revalidatePath('/ventas');

  return { ok: true, codigo: payload.codigo, expiraAt: payload.expira_at };
}

export async function solicitarInformacionLead(datos: {
  nombre: string;
  email: string;
  telefono?: string;
  paqueteId?: string;
  notas?: string;
  origenComunidadId?: string;
  lang?: 'es' | 'en';
}): Promise<{ ok: boolean; error?: string }> {
  const en = datos.lang === 'en';
  if (!datos.nombre.trim()) {
    return { ok: false, error: en ? 'Please write your name.' : 'Escribe tu nombre.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.from('leads').insert({
    nombre: datos.nombre.trim(),
    email: datos.email.trim() || null,
    telefono: datos.telefono?.trim() || null,
    paquete_id: datos.paqueteId || null,
    origen_comunidad_id: datos.origenComunidadId || null,
    notas: datos.notas?.trim() || null,
    estado: 'nuevo',
  });
  if (error) return { ok: false, error: en ? 'Could not send.' : 'No se pudo enviar.' };
  revalidatePath('/ventas');
  return { ok: true };
}
