// =====================================================================
// Expediciones Sierra Norte — capa de datos (Supabase)
// =====================================================================
// Uso en el dashboard:
//
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="./supabase/db.js"></script>
//   <script>DB.init('https://TU-PROYECTO.supabase.co', 'TU-ANON-KEY');</script>
//
// Todas las funciones devuelven Promesas y lanzan el error de Supabase si falla.
// =====================================================================

const DB = (() => {
  let sb = null;

  const init = (url, anonKey) => {
    sb = window.supabase.createClient(url, anonKey);
    return sb;
  };
  const client = () => {
    if (!sb) throw new Error('DB.init(url, anonKey) no ha sido llamado');
    return sb;
  };
  // Desenvuelve { data, error } y lanza si hay error
  const q = async (builder) => {
    const { data, error } = await builder;
    if (error) throw new Error(error.message);
    return data;
  };

  // -------------------------------------------------------------------
  // CATÁLOGO
  // -------------------------------------------------------------------
  const comunidades = () =>
    q(client().from('comunidades').select('*').eq('activa', true).order('orden'));

  const guias = () =>
    q(client().from('guias').select('*').eq('activo', true).order('nombre'));

  // Paquetes con pax, comunidades y % pagado ya calculados
  const paquetes = () =>
    q(client().from('v_paquetes').select('*').order('duracion').order('nombre'));

  // Un paquete con TODO: itinerario, comedores, comunidades
  const paquete = async (id) => {
    const [p, dias, coms] = await Promise.all([
      q(client().from('v_paquetes').select('*').eq('id', id).single()),
      q(client()
        .from('itinerario_dias')
        .select('id, dia, recorrido, itinerario_items(id, orden, texto, tipo, comunidad_id, monto, por_persona)')
        .eq('paquete_id', id)
        .order('dia')),
      q(client().from('comedores').select('*').eq('paquete_id', id).order('dia')),
    ]);
    return { ...p, dias, comedores: coms };
  };

  const guardarPaquete = (p) =>
    q(client().from('paquetes').upsert(p).select().single());

  const servicios = () =>
    q(client().from('servicios').select('*').eq('activo', true).order('nombre'));

  // -------------------------------------------------------------------
  // COMEDORES  (se liquidan directo; el monto es POR PERSONA)
  // -------------------------------------------------------------------
  const guardarComedor = (c) =>
    q(client().from('comedores').upsert(c).select().single());

  const borrarComedor = (id) =>
    q(client().from('comedores').delete().eq('id', id));

  // -------------------------------------------------------------------
  // VENTAS · RESERVAS
  // -------------------------------------------------------------------
  // v_reservas trae paquete, guía, comunidades, pagado y % ya resueltos
  const reservas = () =>
    q(client().from('v_reservas').select('*').order('codigo'));

  // El código se genera solo si lo mandas vacío (trigger en la BD)
  const crearReserva = (r) =>
    q(client().from('reservas').insert(r).select().single());

  const actualizarReserva = (id, patch) =>
    q(client().from('reservas').update(patch).eq('id', id).select().single());

  const borrarReserva = (id) =>
    q(client().from('reservas').delete().eq('id', id));

  // -------------------------------------------------------------------
  // BANCA · PAGOS
  // -------------------------------------------------------------------
  const pagos = () =>
    q(client().from('v_banca_pagos').select('*').order('fecha', { ascending: false }));

  const bancaKpis = () =>
    q(client().from('v_banca_kpis').select('*').single());

  const resumenFinanciero = () =>
    q(client().from('v_resumen_financiero').select('*').single());

  const gastosPorComunidad = () =>
    q(client().from('v_gastos_por_comunidad').select('*'));

  const rentabilidad = () =>
    q(client().from('v_rentabilidad_paquetes').select('*'));

  const registrarPago = (p) =>
    q(client().from('pagos').insert(p).select().single());

  const actualizarPago = (id, patch) =>
    q(client().from('pagos').update(patch).eq('id', id).select().single());

  // Confirmar un pago sella la fecha automáticamente (trigger)
  const confirmarPago = (id, referencia, comprobanteUrl) =>
    q(client()
      .from('pagos')
      .update({ status: 'Confirmado', referencia, comprobante_url: comprobanteUrl })
      .eq('id', id)
      .select()
      .single());

  // -------------------------------------------------------------------
  // GASTOS  (facturas)
  // -------------------------------------------------------------------
  const gastos = () =>
    q(client().from('gastos').select('*').order('fecha', { ascending: false }));

  // El total es una columna generada: NO lo mandes, se calcula (subtotal + iva)
  const guardarGasto = (g) => {
    const { total, ...limpio } = g;
    return q(client().from('gastos').upsert(limpio).select().single());
  };

  const borrarGasto = (id) =>
    q(client().from('gastos').delete().eq('id', id));

  // -------------------------------------------------------------------
  // LIQUIDACIÓN  (derivada — no se captura, se lee)
  // -------------------------------------------------------------------
  const liquidacionPorVenta = () =>
    q(client().from('v_liquidacion_por_venta').select('*').order('fecha_inicio'));

  const liquidacionPorConcepto = (paqueteId) => {
    let b = client().from('v_liquidacion_programada').select('*');
    if (paqueteId) b = b.eq('paquete_id', paqueteId);
    return q(b.order('dia'));
  };

  const liquidacionPorComunidad = () =>
    q(client().from('v_liquidacion_por_comunidad').select('*'));

  // Marca / desmarca un concepto. origen: 'comedor'|'item'|'transporte'|'anfitrion'
  const marcarLiquidado = (origen, origenId, liquidado = true, monto = null) =>
    q(client().rpc('marcar_liquidado', {
      p_origen: origen,
      p_origen_id: String(origenId),
      p_liquidado: liquidado,
      p_monto: monto,
    }));

  // -------------------------------------------------------------------
  // COMUNIDADES · OPERACIÓN Y CHECKLIST
  // -------------------------------------------------------------------
  const operacionComunidad = (comunidadId) =>
    q(client()
      .from('v_operacion_comunidad')
      .select('*')
      .eq('comunidad_id', comunidadId));

  const checklistGeneral = (paqueteId) =>
    q(client().from('checklist_general').select('*').eq('paquete_id', paqueteId).order('item'));

  const checklistComunidad = (paqueteId, comunidadId) => {
    let b = client().from('checklist_comunidad').select('*').eq('paquete_id', paqueteId);
    if (comunidadId) b = b.eq('comunidad_id', comunidadId);
    return q(b.order('item'));
  };

  const avanceChecklist = (paqueteId) =>
    q(client().from('v_checklist_paquete').select('*').eq('paquete_id', paqueteId).single());

  // tabla: 'checklist_general' | 'checklist_comunidad'
  const marcarCheck = (tabla, id, completado) =>
    q(client().from(tabla).update({ completado }).eq('id', id).select().single());

  // -------------------------------------------------------------------
  // TIEMPO REAL — la vista se refresca sola cuando otro del equipo edita
  // -------------------------------------------------------------------
  const escuchar = (tabla, onChange) =>
    client()
      .channel('rt-' + tabla)
      .on('postgres_changes', { event: '*', schema: 'public', table: tabla }, onChange)
      .subscribe();

  return {
    init, client,
    comunidades, guias, paquetes, paquete, guardarPaquete, servicios,
    guardarComedor, borrarComedor,
    reservas, crearReserva, actualizarReserva, borrarReserva,
    pagos, bancaKpis, resumenFinanciero, gastosPorComunidad, rentabilidad,
    registrarPago, actualizarPago, confirmarPago,
    gastos, guardarGasto, borrarGasto,
    liquidacionPorVenta, liquidacionPorConcepto, liquidacionPorComunidad, marcarLiquidado,
    operacionComunidad, checklistGeneral, checklistComunidad, avanceChecklist, marcarCheck,
    escuchar,
  };
})();

if (typeof module !== 'undefined') module.exports = DB;
