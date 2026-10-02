'use client';

import { useState, useTransition } from 'react';
import Encabezado from '@/components/Encabezado';
import { Icono, Pill, Kpi, Vacio, Barra } from '@/components/ui';
import ComprobanteModal from '@/components/ComprobanteModal';
import VerComprobante from '@/components/VerComprobante';
import { marcarLiquidado, validarCobro } from '@/app/acciones';
import {
  type VentaLiquidacion,
  type ConceptoLiquidacion,
  type CobroLiquidacion,
  type Comunidad,
  type Perfil,
  COLOR_LIQ,
  COLOR_DURACION,
  COLOR_PAGO,
  COLOR_METODO,
  dinero,
  fecha as fmtFecha,
  rango,
  hexA,
} from '@/lib/tipos';
import { puedeLiquidar } from '@/lib/permisos';

type CobrosKpis = { por_validar: number; validado: number; pendientes: number; cobros: number };

export default function LiquidacionVista({
  perfil,
  vista,
  busqueda,
  ventas,
  conceptos,
  cobros,
  cobrosKpis,
  comunidades,
}: {
  perfil: Perfil;
  vista: string;
  busqueda: string;
  ventas: VentaLiquidacion[];
  conceptos: ConceptoLiquidacion[];
  cobros: CobroLiquidacion[];
  cobrosKpis: CobrosKpis;
  comunidades: Comunidad[];
}) {
  const [abierto, setAbierto] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();

  const liquidable = puedeLiquidar(perfil.rol);
  const q = busqueda.toLowerCase();

  // Todos entran a todas las pestañas. Quién puede MOVER cada cosa se
  // decide adentro, botón por botón.
  // Las facturas se fueron a Banca → Contabilidad: es donde vive el
  // auxiliar contable, y así no se capturan en dos lugares distintos.
  // «Por concepto» se fue: era la misma lista que ya se ve al desplegar
  // cada salida, sólo que aplanada. Tres pestañas, tres preguntas:
  // qué entró (Cobros), qué sale por salida, y qué le toca a cada pueblo.
  const VISTAS = [
    {
      id: 'cobros',
      label: `Cobros${cobrosKpis.pendientes ? ` (${cobrosKpis.pendientes})` : ''}`,
      icono: 'card',
    },
    { id: 'ventas', label: 'Por salida', icono: 'receipt' },
    { id: 'comunidad', label: 'Por comunidad', icono: 'mountain' },
  ];

  const toggle = (c: ConceptoLiquidacion) => {
    if (!liquidable) return;
    startTransition(async () => {
      const res = await marcarLiquidado(c.origen, c.origen_id, !c.liquidado);
      if (!res.ok) alert(res.error);
    });
  };

  const totalCosto = ventas.reduce((a, v) => a + v.costo, 0);
  const totalPend = ventas.reduce((a, v) => a + v.pendiente, 0);
  const totalIngreso = ventas.reduce((a, v) => a + v.ingreso, 0);
  const totalCobrado = ventas.reduce((a, v) => a + v.cobrado, 0);

  return (
    <>
      <Encabezado
        titulo="Liquidación"
        sub="Pagos directos a comedores, comunidades y prestadores"
        vistas={VISTAS}
        vistaActiva={vista}
      />

      <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
        {/* ---------------- POR VENTA ---------------- */}
        {vista === 'ventas' && (
          <>
            <div className="mb-4 flex flex-wrap gap-3">
              <Kpi icono="clipboard" label="Vendido" valor={dinero(totalIngreso)} color="#6B7280" />
              <Kpi icono="wallet" label="Cobrado" valor={dinero(totalCobrado)} color="#16A34A" />
              <Kpi icono="receipt" label="Costo a liquidar" valor={dinero(totalCosto)} color="#1F7D5E" />
              <Kpi icono="clock" label="Pendiente de pago" valor={dinero(totalPend)} color="#FB923C" />
              <Kpi
                icono="trendUp"
                label="Margen"
                valor={totalIngreso ? `${Math.round(((totalIngreso - totalCosto) / totalIngreso) * 100)}%` : '—'}
                color="#2563EB"
              />
            </div>

            {ventas.length === 0 ? (
              <Vacio titulo="Sin ventas por liquidar" sub="Asigna fechas a un paquete para verlo aquí." />
            ) : (
              <div className="space-y-3">
                {ventas.map((v) => {
                  const items = conceptos.filter((c) => c.paquete_id === v.paquete_id);
                  const porTipo = items.reduce<Record<string, ConceptoLiquidacion[]>>((acc, c) => {
                    (acc[c.tipo] ||= []).push(c);
                    return acc;
                  }, {});
                  const open = abierto[v.paquete_id];

                  return (
                    <div
                      key={v.paquete_id}
                      className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                    >
                      <div
                        className="flex flex-wrap items-center gap-4 border-l-4 px-4 py-3.5"
                        style={{ borderLeftColor: COLOR_DURACION[v.duracion] }}
                      >
                        <button
                          onClick={() => setAbierto((a) => ({ ...a, [v.paquete_id]: !a[v.paquete_id] }))}
                          className={`transition-transform ${open ? 'rotate-90' : ''}`}
                          title={open ? 'Ocultar detalle' : 'Ver detalle'}
                        >
                          <Icono n="chevron" s={14} c="#9CA3AF" />
                        </button>

                        <div className="min-w-[180px] flex-1">
                          <p className="font-extrabold text-gray-900">{v.paquete}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-gray-400">
                            <Pill texto={v.duracion} color={COLOR_DURACION[v.duracion]} dot={false} />
                            <span>{rango(v.fecha_inicio, v.fecha_fin)}</span>
                            <span>· {v.pax} pax</span>
                          </p>
                        </div>

                        <Cifra label="Vendido" valor={dinero(v.ingreso)} color="#6B7280" />
                        <Cifra
                          label="Cobrado"
                          valor={dinero(v.cobrado)}
                          color={v.cobrado_pct === 100 ? '#16A34A' : '#FB923C'}
                        />
                        <Cifra label="A liquidar" valor={dinero(v.costo)} color="#111827" />
                        <div className="w-24">
                          <p className="mb-1 text-[10px] font-bold uppercase text-gray-400">
                            {v.conceptos_liquidados}/{v.conceptos} listos
                          </p>
                          <Barra pct={v.avance_pct} color={v.avance_pct === 100 ? '#16A34A' : '#FB923C'} />
                        </div>
                      </div>

                      {open && (
                        <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3">
                          {Object.entries(porTipo).map(([tipo, list]) => (
                            <div key={tipo} className="mb-3">
                              <div className="mb-1.5 flex items-center gap-2">
                                <span
                                  className="h-2 w-2 rounded-sm"
                                  style={{ background: COLOR_LIQ[tipo] }}
                                />
                                <span className="text-[11px] font-extrabold uppercase tracking-wide text-gray-600">
                                  {tipo}
                                </span>
                                {tipo === 'Comedor' && (
                                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-800">
                                    PAGO DIRECTO
                                  </span>
                                )}
                                <span className="flex-1" />
                                <span className="text-xs font-extrabold text-gray-900">
                                  {dinero(list.reduce((a, c) => a + c.monto, 0))}
                                </span>
                              </div>
                              <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
                                {list.map((c) => (
                                  <div
                                    key={c.origen_id}
                                    className="flex items-center gap-3 border-b border-gray-50 px-3 py-2 last:border-0"
                                  >
                                    <button
                                      onClick={() => toggle(c)}
                                      disabled={!liquidable}
                                      title={liquidable ? 'Marcar liquidado' : 'Tu rol no puede liquidar'}
                                      className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border-2 disabled:cursor-not-allowed"
                                      style={{
                                        width: 18,
                                        height: 18,
                                        borderColor: c.liquidado ? '#16A34A' : '#D1D5DB',
                                        background: c.liquidado ? '#16A34A' : '#fff',
                                      }}
                                    >
                                      {c.liquidado && <Icono n="check" s={11} c="#fff" />}
                                    </button>
                                    <span className="w-6 shrink-0 text-[11px] font-extrabold text-gray-400">
                                      {c.dia ? `D${c.dia}` : '—'}
                                    </span>
                                    <span
                                      className={`min-w-0 flex-1 truncate text-xs font-semibold ${
                                        c.liquidado ? 'text-gray-400 line-through' : 'text-gray-800'
                                      }`}
                                    >
                                      {c.concepto}
                                    </span>
                                    {c.comunidad && (
                                      <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">
                                        {c.comunidad}
                                      </span>
                                    )}
                                    {c.por_persona && c.monto_unitario > 0 && (
                                      <span className="shrink-0 text-[10px] font-semibold text-gray-400">
                                        {dinero(c.monto_unitario)} × {c.pax}
                                      </span>
                                    )}
                                    <span className="w-20 shrink-0 text-right text-xs font-extrabold text-gray-900">
                                      {dinero(c.monto)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          <div className="flex flex-wrap items-center justify-end gap-4 rounded-lg bg-white px-4 py-2.5 text-xs font-bold">
                            {v.por_cobrar > 0 && (
                              <span className="mr-auto text-gray-500">
                                Falta cobrar:{' '}
                                <b className="text-amber-600">{dinero(v.por_cobrar)}</b>
                              </span>
                            )}
                            <span className="text-gray-500">
                              Liquidado: <b className="text-emerald-600">{dinero(v.liquidado)}</b>
                            </span>
                            <span className="text-gray-500">
                              Pendiente: <b className="text-amber-600">{dinero(v.pendiente)}</b>
                            </span>
                            <span className="text-gray-500">
                              Utilidad:{' '}
                              <b className={v.utilidad >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                {dinero(v.utilidad)}
                              </b>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ---------------- POR COMUNIDAD ---------------- */}
        {vista === 'comunidad' && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {comunidades.map((com) => {
              const list = conceptos.filter((c) => c.comunidad_id === com.id);
              if (!list.length) return null;
              const total = list.reduce((a, c) => a + c.monto, 0);
              const pend = list.filter((c) => !c.liquidado).length;

              return (
                <div
                  key={com.id}
                  className="w-80 shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: com.color }} />
                    <span className="flex-1 text-sm font-bold text-gray-700">{com.nombre}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-gray-500">
                      {pend}/{list.length}
                    </span>
                  </div>
                  <p className="mb-2.5 px-1 text-xs font-bold text-gray-500">Total: {dinero(total)}</p>
                  <div className="space-y-2">
                    {list.map((c) => (
                      <button
                        key={c.origen + c.origen_id}
                        onClick={() => toggle(c)}
                        disabled={!liquidable}
                        className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-left transition hover:shadow-sm disabled:cursor-not-allowed"
                        style={{
                          borderLeft: `4px solid ${COLOR_LIQ[c.tipo]}`,
                          opacity: c.liquidado ? 0.65 : 1,
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className="mt-0.5 flex shrink-0 items-center justify-center rounded border-2"
                            style={{
                              width: 16,
                              height: 16,
                              borderColor: c.liquidado ? '#16A34A' : '#D1D5DB',
                              background: c.liquidado ? '#16A34A' : '#fff',
                            }}
                          >
                            {c.liquidado && <Icono n="check" s={10} c="#fff" />}
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              c.liquidado ? 'text-gray-400 line-through' : 'text-gray-800'
                            }`}
                          >
                            {c.concepto}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="truncate text-[10px] font-bold text-gray-400">{c.paquete}</span>
                          <span className="text-xs font-extrabold text-gray-900">{dinero(c.monto)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ---------------- COBROS (efectivo y pago en comunidad) ---------------- */}
        {vista === 'cobros' && (
          <CobrosTabla
            cobros={cobros.filter(
              (c) =>
                !q ||
                c.cliente.toLowerCase().includes(q) ||
                c.codigo.toLowerCase().includes(q) ||
                (c.paquete ?? '').toLowerCase().includes(q)
            )}
            kpis={cobrosKpis}
            validable={liquidable}
          />
        )}

      </div>
    </>
  );
}

// =====================================================================
// COBROS — el dinero que no pasa por el banco.
// Efectivo y pago en comunidad entran aquí en cuanto se crea la reserva,
// y se validan por el monto que REALMENTE llegó.
// =====================================================================
function CobrosTabla({
  cobros,
  kpis,
  validable,
}: {
  cobros: CobroLiquidacion[];
  kpis: CobrosKpis;
  validable: boolean;
}) {
  const [validando, setValidando] = useState<CobroLiquidacion | null>(null);

  if (!cobros.length)
    return (
      <Vacio
        titulo="Sin cobros por validar"
        sub="Las reservas en efectivo o con pago en comunidad aparecen aquí en cuanto se crean."
        icono="card"
      />
    );

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-3">
        <Kpi icono="clock" label="Por validar" valor={dinero(kpis.por_validar)} color="#FB923C" />
        <Kpi icono="checkCircle" label="Validado" valor={dinero(kpis.validado)} color="#16A34A" />
        <Kpi icono="card" label="Cobros pendientes" valor={String(kpis.pendientes)} color="#B45309" />
      </div>

      <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2.5">Código</th>
              <th className="px-3 py-2.5">Cliente</th>
              <th className="px-3 py-2.5">Salida</th>
              <th className="px-3 py-2.5">Método</th>
              <th className="px-3 py-2.5">Monto</th>
              <th className="px-3 py-2.5">Comprobante</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Acción</th>
            </tr>
          </thead>
          <tbody>
            {cobros.map((c) => {
              const porValidar = c.status === 'Pendiente';
              return (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2.5">
                    <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold text-[#1F7D5E]">
                      {c.codigo}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-bold text-gray-800">{c.cliente}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-600">
                    {c.paquete ?? '—'}
                    <span className="ml-1 text-gray-400">
                      {c.salida ? `· ${fmtFecha(c.salida)}` : ''}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <Pill texto={c.metodo_pago} color={COLOR_METODO[c.metodo_pago]} />
                  </td>
                  <td className="px-3 py-2.5 font-extrabold text-gray-900">{dinero(c.monto)}</td>
                  <td className="px-3 py-2.5">
                    <VerComprobante ruta={c.comprobante_url} />
                  </td>
                  <td className="px-3 py-2.5">
                    <Pill texto={c.status} color={COLOR_PAGO[c.status]} solid={c.status === 'Confirmado'} />
                  </td>
                  <td className="px-3 py-2.5">
                    {porValidar ? (
                      validable ? (
                        <button
                          onClick={() => setValidando(c)}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                        >
                          <Icono n="check" s={12} c="#fff" />
                          Validar
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Sólo finanzas</span>
                      )
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600">Validado</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {validando && (
        <ComprobanteModal
          codigo={validando.codigo}
          cliente={validando.cliente}
          paquete={validando.paquete}
          metodo={validando.metodo_pago}
          monto={validando.monto}
          saldo={validando.saldo_reserva}
          montoEditable
          comprobante={validando.comprobante_url}
          onConfirmar={({ monto, referencia, comprobante }) =>
            validarCobro(validando.id, monto, referencia ?? undefined, comprobante)
          }
          onClose={() => setValidando(null)}
        />
      )}
    </>
  );
}

function Cifra({ label, valor, color }: { label: string; valor: string; color: string }) {
  return (
    <div className="text-right">
      <p className="text-[10px] font-bold uppercase text-gray-400">{label}</p>
      <p className="text-sm font-extrabold" style={{ color }}>
        {valor}
      </p>
    </div>
  );
}

export { hexA };
