'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// =====================================================================
// Server Actions — todas las escrituras pasan por aquí.
// El RLS de Supabase valida los permisos: si el rol no puede, falla.
// =====================================================================

export type Resultado = { ok: boolean; error?: string };

const fallo = (e: { message: string } | null): Resultado =>
  e ? { ok: false, error: traducir(e.message) } : { ok: true };

function traducir(msg: string) {
  if (msg.includes('row-level security') || msg.includes('violates row-level'))
    return 'Tu rol no tiene permiso para hacer esto.';
  if (msg.includes('chk_ninos')) return 'Los niños no pueden ser más que el total de personas.';
  if (msg.includes('chk_plataforma') || msg.includes('chk_pago_plataforma'))
    return 'La plataforma sólo aplica a pagos con transferencia o tarjeta.';
  if (msg.includes('duplicate key') && msg.includes('codigo'))
    return 'Ya existe una reserva con ese código.';
  return msg;
}

// ---------------------------------------------------------------------
// RESERVAS
// ---------------------------------------------------------------------
// Al guardar una reserva, la base genera sola su cobro Pendiente y lo manda
// a Banca (Transfer/Tarjeta) o a Liquidación (efectivo / pago en comunidad),
// y la reserva entra al calendario con sus fechas. Ver 12_ruta_reserva.sql.
export async function guardarReserva(datos: Record<string, unknown>): Promise<Resultado> {
  const supabase = await createClient();
  const { id, ...resto } = datos as { id?: string } & Record<string, unknown>;
  const campos: Record<string, unknown> = { ...resto };

  // El código lo genera un trigger si va vacío
  if (!campos.codigo) delete campos.codigo;
  if (campos.metodo_pago !== 'Transfer/Tarjeta') campos.plataforma = null;
  if (!campos.ninos) campos.num_ninos = 0;

  const { error } = id
    ? await supabase.from('reservas').update(campos).eq('id', id)
    : await supabase.from('reservas').insert(campos);

  revalidarReserva();
  return fallo(error);
}

export async function borrarReserva(id: string): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from('reservas').delete().eq('id', id);
  revalidarReserva();
  return fallo(error);
}

// Una reserva toca las cuatro pantallas: ventas, su cobro (banca o
// liquidación) y el calendario.
function revalidarReserva() {
  revalidatePath('/ventas');
  revalidatePath('/banca');
  revalidatePath('/liquidacion');
  revalidatePath('/calendario');
}

// ---------------------------------------------------------------------
// PAQUETES
// ---------------------------------------------------------------------
export async function guardarPaquete(datos: Record<string, unknown>): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from('paquetes').upsert(datos);
  revalidatePath('/ventas');
  revalidatePath('/liquidacion');
  revalidatePath('/calendario');
  return fallo(error);
}

export async function guardarComedor(datos: Record<string, unknown>): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from('comedores').upsert(datos);
  revalidatePath('/ventas');
  revalidatePath('/liquidacion');
  return fallo(error);
}

export async function borrarComedor(id: string): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from('comedores').delete().eq('id', id);
  revalidatePath('/ventas');
  revalidatePath('/liquidacion');
  return fallo(error);
}

// ---------------------------------------------------------------------
// PAGOS (Banca)
// ---------------------------------------------------------------------
export async function guardarPago(datos: Record<string, unknown>): Promise<Resultado> {
  const supabase = await createClient();
  const { id, ...resto } = datos as { id?: string } & Record<string, unknown>;
  const campos: Record<string, unknown> = { ...resto };
  if (campos.metodo_pago !== 'Transfer/Tarjeta') campos.plataforma = null;

  const { error } = id
    ? await supabase.from('pagos').update(campos).eq('id', id)
    : await supabase.from('pagos').insert(campos);

  revalidatePath('/banca');
  revalidatePath('/ventas');
  return fallo(error);
}

export async function confirmarPago(id: string, referencia?: string): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('pagos')
    .update({ status: 'Confirmado', referencia: referencia || null })
    .eq('id', id);

  revalidatePath('/banca');
  revalidatePath('/ventas');
  return fallo(error);
}

// ---------------------------------------------------------------------
// COBROS EN LIQUIDACIÓN — efectivo y pago en comunidad
// Se valida el dinero que sí llegó: si el cliente entregó menos de lo
// esperado, se confirma por el monto real y la reserva queda con saldo.
// ---------------------------------------------------------------------
export async function validarCobro(id: string, monto?: number): Promise<Resultado> {
  const supabase = await createClient();
  const campos: Record<string, unknown> = { status: 'Confirmado' };
  if (monto && monto > 0) campos.monto = monto;

  const { error } = await supabase.from('pagos').update(campos).eq('id', id);

  revalidatePath('/liquidacion');
  revalidatePath('/ventas');
  revalidatePath('/banca');
  return fallo(error);
}

export async function borrarPago(id: string): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from('pagos').delete().eq('id', id);
  revalidatePath('/banca');
  revalidatePath('/liquidacion');
  return fallo(error);
}

// ---------------------------------------------------------------------
// GASTOS (facturas)
// ---------------------------------------------------------------------
export async function guardarGasto(datos: Record<string, unknown>): Promise<Resultado> {
  const supabase = await createClient();
  const { id, total, ...resto } = datos as { id?: string; total?: number } & Record<string, unknown>;
  void total; // el total es columna generada: subtotal + iva
  const campos: Record<string, unknown> = { ...resto };

  const { error } = id
    ? await supabase.from('gastos').update(campos).eq('id', id)
    : await supabase.from('gastos').insert(campos);

  revalidatePath('/liquidacion');
  revalidatePath('/banca');
  return fallo(error);
}

export async function borrarGasto(id: string): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from('gastos').delete().eq('id', id);
  revalidatePath('/liquidacion');
  revalidatePath('/banca');
  return fallo(error);
}

// ---------------------------------------------------------------------
// LIQUIDACIÓN — marca un concepto como liquidado
// ---------------------------------------------------------------------
export async function marcarLiquidado(
  origen: string,
  origenId: string,
  liquidado: boolean,
  monto?: number | null
): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('marcar_liquidado', {
    p_origen: origen,
    p_origen_id: String(origenId),
    p_liquidado: liquidado,
    p_monto: monto ?? null,
  });

  revalidatePath('/liquidacion');
  revalidatePath('/comunidades');
  return fallo(error);
}

// ---------------------------------------------------------------------
// CHECKLIST
// ---------------------------------------------------------------------
export async function marcarCheck(
  tabla: 'checklist_general' | 'checklist_comunidad',
  id: string,
  completado: boolean
): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from(tabla).update({ completado }).eq('id', id);

  revalidatePath('/comunidades');
  revalidatePath('/ventas');
  return fallo(error);
}

// ---------------------------------------------------------------------
// USUARIOS (sólo admin — el RLS lo verifica)
// ---------------------------------------------------------------------
export async function actualizarPerfil(
  userId: string,
  cambios: { rol?: string; comunidad_id?: string | null; activo?: boolean }
): Promise<Resultado> {
  const supabase = await createClient();
  const patch = { ...cambios };
  if (patch.rol !== 'comunidad') patch.comunidad_id = null;

  const { error } = await supabase.from('perfiles').update(patch).eq('user_id', userId);
  revalidatePath('/admin');
  return fallo(error);
}
