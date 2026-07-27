'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { DetallePaquete } from '@/lib/tipos';

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
  if (msg.includes('chk_pago_factura'))
    return 'Con factura necesitas el folio del CFDI y el subtotal.';
  if (msg.includes('chk_factura')) return 'Con factura necesitas el folio.';
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

// Una reserva puede pagarse con varios métodos: 40% en efectivo y 60% por
// transferencia, por ejemplo. Cada línea del reparto se convierte en un
// cobro que se va por su canal (ver 19_pago_dividido.sql). El reparto
// tiene que cuadrar con el precio: la base lo verifica.
export async function guardarReservaConReparto(
  reserva: Record<string, unknown>,
  reparto: unknown[]
): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('guardar_reserva_con_reparto', {
    p_reserva: reserva,
    p_reparto: reparto,
  });

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

// Un paquete no es sólo la fila de `paquetes`: son sus comunidades, su
// itinerario y sus comedores. De ahí sale la Liquidación. Todo se guarda
// junto, en una transacción (ver 17_paquete_completo.sql).
export async function guardarPaqueteCompleto(
  paquete: Record<string, unknown>,
  comunidades: string[],
  dias: unknown[],
  comedores: unknown[]
): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('guardar_paquete_completo', {
    p_paquete: paquete,
    p_comunidades: comunidades,
    p_dias: dias,
    p_comedores: comedores,
  });

  if (!error && paquete.id && 'cupo_personas_salida' in paquete) {
    await supabase
      .from('paquetes')
      .update({ cupo_personas_salida: (paquete.cupo_personas_salida as number | null) ?? null })
      .eq('id', paquete.id as string);
  }

  revalidatePath('/ventas');
  revalidatePath('/liquidacion');
  revalidatePath('/calendario');
  revalidatePath('/comunidades');
  return fallo(error);
}

// El detalle completo, para poder editarlo
export async function cargarPaquete(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('v_paquete_detalle')
    .select('*')
    .eq('paquete_id', id)
    .single();

  if (error) return { error: error.message };
  return { detalle: data as DetallePaquete };
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

export async function confirmarPago(
  id: string,
  referencia?: string,
  comprobante?: string | null
): Promise<Resultado> {
  const supabase = await createClient();
  const campos: Record<string, unknown> = {
    status: 'Confirmado',
    referencia: referencia || null,
  };
  // Si no subieron comprobante, se conserva el que ya tuviera
  if (comprobante) campos.comprobante_url = comprobante;

  const { error } = await supabase.from('pagos').update(campos).eq('id', id);

  revalidatePath('/banca');
  revalidatePath('/ventas');
  revalidatePath('/liquidacion');
  return fallo(error);
}

// ---------------------------------------------------------------------
// COBROS EN LIQUIDACIÓN — efectivo y pago en comunidad
// Se valida el dinero que sí llegó: si el cliente entregó menos de lo
// esperado, se confirma por el monto real y la reserva queda con saldo.
// ---------------------------------------------------------------------
export async function validarCobro(
  id: string,
  monto?: number,
  referencia?: string,
  comprobante?: string | null
): Promise<Resultado> {
  const supabase = await createClient();
  const campos: Record<string, unknown> = { status: 'Confirmado' };
  if (monto && monto > 0) campos.monto = monto;
  if (referencia) campos.referencia = referencia;
  if (comprobante) campos.comprobante_url = comprobante;

  const { error } = await supabase.from('pagos').update(campos).eq('id', id);

  revalidatePath('/liquidacion');
  revalidatePath('/ventas');
  revalidatePath('/banca');
  return fallo(error);
}

// ---------------------------------------------------------------------
// FACTURA DE VENTA — el CFDI que se le emite al turista.
// No todos la piden; por eso el pago nace sin factura y el auxiliar
// contable la captura después. Su IVA es el "trasladado".
// ---------------------------------------------------------------------
export async function facturarPago(
  id: string,
  factura: {
    con_factura: boolean;
    folio_factura: string | null;
    subtotal: number | null;
    iva: number | null;
  }
): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from('pagos').update(factura).eq('id', id);

  revalidatePath('/banca');
  return fallo(error);
}

// ---------------------------------------------------------------------
// COMPROBANTES — el bucket es privado, así que para ver un archivo se
// firma una URL temporal. Nunca se expone la ruta pública.
// ---------------------------------------------------------------------
export async function urlComprobante(ruta: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from('comprobantes')
    .createSignedUrl(ruta, 60 * 5); // 5 minutos

  if (error) return { error: error.message };
  return { url: data.signedUrl };
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

// ---------------------------------------------------------------------
// PRECIOS — importación CSV (id, precio)
// ---------------------------------------------------------------------
export async function importarPreciosPaquetes(filas: { id: string; precio: number }[]): Promise<Resultado & { n?: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('importar_precios_paquetes', {
    p_filas: filas,
  });
  if (error) return { ok: false, error: traducir(error.message) };
  revalidatePath('/ventas');
  revalidatePath('/');
  return { ok: true, n: data as number };
}

// ---------------------------------------------------------------------
// LEADS
// ---------------------------------------------------------------------
export async function guardarLead(datos: Record<string, unknown>): Promise<Resultado> {
  const supabase = await createClient();
  const { id, ...resto } = datos as { id?: string } & Record<string, unknown>;
  const { error } = id
    ? await supabase.from('leads').update(resto).eq('id', id)
    : await supabase.from('leads').insert(resto);
  revalidatePath('/ventas');
  return fallo(error);
}

export async function convertirLead(leadId: string): Promise<Resultado & { reservaId?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('convertir_lead_a_reserva', { p_lead_id: leadId });
  if (error) return { ok: false, error: traducir(error.message) };
  revalidatePath('/ventas');
  return { ok: true, reservaId: data as string };
}

export async function marcarLeadPerdido(id: string, motivo: string): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('leads')
    .update({ estado: 'perdido', motivo_perdida: motivo })
    .eq('id', id);
  revalidatePath('/ventas');
  return fallo(error);
}

// ---------------------------------------------------------------------
// EXPEDIENTE — adjuntos de reserva
// ---------------------------------------------------------------------
export async function registrarAdjuntoReserva(datos: {
  reserva_id: string;
  nombre: string;
  storage_path: string;
  mime_type?: string;
}): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from('reserva_adjuntos').insert(datos);
  revalidatePath('/ventas');
  return fallo(error);
}

export async function borrarAdjuntoReserva(id: string): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase.from('reserva_adjuntos').delete().eq('id', id);
  revalidatePath('/ventas');
  return fallo(error);
}

export async function urlExpediente(ruta: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from('expedientes').createSignedUrl(ruta, 60 * 5);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}

export async function liberarApartadosVencidos(): Promise<Resultado & { n?: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('liberar_apartados_vencidos');
  if (error) return { ok: false, error: error.message };
  revalidatePath('/ventas');
  return { ok: true, n: data as number };
}
