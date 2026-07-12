'use client';

import { useState } from 'react';
import Encabezado from '@/components/Encabezado';
import { Icono, Pill, Avatar, Kpi, Vacio, BtnPrimario, BotonAccion, Barra } from '@/components/ui';
import PagoModal from './PagoModal';
import GastoModal from './GastoModal';
import Contabilidad from './Contabilidad';
import ComprobanteModal from '@/components/ComprobanteModal';
import VerComprobante from '@/components/VerComprobante';
import { confirmarPago } from '@/app/acciones';
import {
  type Pago,
  type Reserva,
  type Perfil,
  type Gasto,
  type Comunidad,
  type Paquete,
  type MovimientoContable,
  type ContabilidadKpis,
  COLOR_PAGO,
  COLOR_METODO,
  COLOR_PLATAFORMA,
  dinero,
} from '@/lib/tipos';
import { puedeEditarPagos, puedeCapturarGastos } from '@/lib/permisos';

const VISTAS = [
  { id: 'pagos', label: 'Pagos', icono: 'card' },
  { id: 'contabilidad', label: 'Contabilidad', icono: 'receipt' },
  { id: 'resumen', label: 'Resumen', icono: 'chart' },
  { id: 'rentabilidad', label: 'Rentabilidad', icono: 'trendUp' },
];

type Kpis = { pendiente: number; confirmado: number; vencido: number; promedio: number };
type Resumen = { ingresos: number; gastos: number; utilidad: number; margen_pct: number; por_liquidar: number };
type PorComunidad = { comunidad: string; color: string; total: number };
type Rent = { paquete: string; ingresos: number; costos: number; utilidad: number; margen_pct: number };

export default function BancaVista({
  perfil,
  vista,
  busqueda,
  pagos,
  kpis,
  resumen,
  porComunidad,
  rentabilidad,
  reservas,
  movimientos,
  contaKpis,
  gastos,
  comunidades,
  paquetes,
}: {
  perfil: Perfil;
  vista: string;
  busqueda: string;
  pagos: Pago[];
  kpis: Kpis;
  resumen: Resumen;
  porComunidad: PorComunidad[];
  rentabilidad: Rent[];
  reservas: Pick<Reserva, 'id' | 'codigo' | 'nombre' | 'precio' | 'saldo'>[];
  movimientos: MovimientoContable[];
  contaKpis: ContabilidadKpis;
  gastos: Gasto[];
  comunidades: Comunidad[];
  paquetes: Pick<Paquete, 'id' | 'nombre'>[];
}) {
  const [editando, setEditando] = useState<Partial<Pago> | null>(null);
  const [confirmando, setConfirmando] = useState<Pago | null>(null);
  const [editandoGasto, setEditandoGasto] = useState<Partial<Gasto> | null>(null);
  const editable = puedeEditarPagos(perfil.rol);
  const puedeCapturar = puedeCapturarGastos(perfil.rol);
  const q = busqueda.toLowerCase();

  const ps = pagos.filter(
    (p) =>
      !q ||
      p.cliente.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      (p.paquete ?? '').toLowerCase().includes(q)
  );

  const maxGasto = Math.max(...porComunidad.map((c) => Number(c.total)), 1);

  return (
    <>
      <Encabezado
        titulo="Banca"
        sub="Transferencias y tarjeta · el efectivo se valida en Liquidación"
        vistas={VISTAS}
        vistaActiva={vista}
        acciones={
          <>
            {vista === 'pagos' && editable && (
              <BtnPrimario
                onClick={() =>
                  setEditando({
                    metodo_pago: 'Transfer/Tarjeta',
                    plataforma: 'WeTravel',
                    status: 'Pendiente',
                  })
                }
              >
                <Icono n="plus" s={15} c="#fff" />
                Registrar pago
              </BtnPrimario>
            )}
            {vista === 'contabilidad' && puedeCapturar && (
              <BtnPrimario
                onClick={() => setEditandoGasto({ con_factura: true, subtotal: 0, iva: 0 })}
              >
                <Icono n="plus" s={15} c="#fff" />
                Agregar factura
              </BtnPrimario>
            )}
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
        {vista === 'pagos' && (
          <>
            <div className="mb-4 flex flex-wrap gap-3">
              <Kpi icono="wallet" label="Pendiente" valor={dinero(kpis.pendiente)} color="#FB923C" />
              <Kpi icono="checkCircle" label="Confirmado" valor={dinero(kpis.confirmado)} color="#16A34A" />
              <Kpi icono="clock" label="Vencido" valor={dinero(kpis.vencido)} color="#DC2626" />
              <Kpi icono="chart" label="Promedio" valor={dinero(kpis.promedio)} color="#2563EB" />
            </div>

            {ps.length === 0 ? (
              <Vacio titulo="Sin pagos registrados" icono="card" />
            ) : (
              <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2.5">Código</th>
                      <th className="px-3 py-2.5">Cliente</th>
                      <th className="px-3 py-2.5">Paquete</th>
                      <th className="px-3 py-2.5">Monto</th>
                      <th className="px-3 py-2.5">Fecha</th>
                      <th className="px-3 py-2.5">Método</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ps.map((p) => (
                      <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2.5">
                          <span className="rounded bg-violet-50 px-2 py-0.5 font-mono text-[11px] font-bold text-[#5B21B6]">
                            {p.codigo}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar nombre={p.cliente} s={24} />
                            <span className="font-semibold text-gray-800">{p.cliente}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-600">{p.paquete}</td>
                        <td className="px-3 py-2.5 font-extrabold text-gray-900">{dinero(p.monto)}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">{p.fecha}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            <Pill texto={p.metodo_pago} color={COLOR_METODO[p.metodo_pago]} />
                            {p.plataforma && (
                              <Pill texto={p.plataforma} color={COLOR_PLATAFORMA[p.plataforma]} dot={false} />
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <Pill
                            texto={p.status}
                            color={COLOR_PAGO[p.status]}
                            solid={p.status === 'Confirmado'}
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            {p.status !== 'Confirmado' && editable && (
                              <button
                                onClick={() => setConfirmando(p)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                              >
                                <Icono n="checkCircle" s={14} c="#fff" />
                                Confirmar
                              </button>
                            )}
                            {p.status === 'Confirmado' && (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
                                <Icono n="check" s={13} c="#16A34A" />
                                Confirmado
                              </span>
                            )}
                            <VerComprobante ruta={p.comprobante_url} />
                            {editable && (
                              <BotonAccion icono="edit" titulo="Editar pago" onClick={() => setEditando(p)} />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ---------------- CONTABILIDAD ---------------- */}
        {vista === 'contabilidad' && (
          <Contabilidad
            movimientos={movimientos}
            kpis={contaKpis}
            gastos={gastos}
            comunidades={comunidades}
            perfil={perfil}
            busqueda={q}
            onEditarGasto={setEditandoGasto}
          />
        )}

        {vista === 'resumen' && (
          <>
            <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi icono="trendUp" label="Ingresos" valor={dinero(resumen.ingresos)} color="#16A34A" />
              <Kpi icono="wallet" label="Gastos" valor={dinero(resumen.gastos)} color="#FB923C" />
              <Kpi icono="chart" label="Utilidad" valor={dinero(resumen.utilidad)} color="#5B21B6" />
              <Kpi icono="percent" label="Margen" valor={`${resumen.margen_pct}%`} color="#2563EB" />
            </div>

            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              Pendiente de liquidar a comunidades y prestadores:{' '}
              <b>{dinero(resumen.por_liquidar)}</b>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 font-extrabold text-gray-900">Gastos por comunidad</h3>
              {porComunidad.filter((c) => Number(c.total) > 0).length === 0 ? (
                <p className="text-sm text-gray-400">Todavía no hay gastos registrados.</p>
              ) : (
                <div className="space-y-3">
                  {porComunidad
                    .filter((c) => Number(c.total) > 0)
                    .map((c) => (
                      <div key={c.comunidad}>
                        <div className="mb-1 flex justify-between text-xs font-semibold">
                          <span className="text-gray-600">{c.comunidad}</span>
                          <span className="font-bold text-gray-900">{dinero(c.total)}</span>
                        </div>
                        <Barra pct={(Number(c.total) / maxGasto) * 100} color={c.color} />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        )}

        {vista === 'rentabilidad' && (
          <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2.5">Paquete</th>
                  <th className="px-4 py-2.5 text-right">Ingresos</th>
                  <th className="px-4 py-2.5 text-right">Costos</th>
                  <th className="px-4 py-2.5 text-right">Utilidad</th>
                  <th className="px-4 py-2.5 text-right">Margen</th>
                </tr>
              </thead>
              <tbody>
                {rentabilidad.map((r) => (
                  <tr key={r.paquete} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-bold text-gray-800">{r.paquete}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                      {dinero(r.ingresos)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-amber-600">{dinero(r.costos)}</td>
                    <td
                      className={`px-4 py-3 text-right font-extrabold ${
                        r.utilidad >= 0 ? 'text-gray-900' : 'text-red-600'
                      }`}
                    >
                      {dinero(r.utilidad)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          r.margen_pct >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {r.margen_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editando && (
        <PagoModal pago={editando} reservas={reservas} onClose={() => setEditando(null)} />
      )}

      {confirmando && (
        <ComprobanteModal
          codigo={confirmando.codigo}
          cliente={confirmando.cliente}
          paquete={confirmando.paquete}
          metodo={confirmando.metodo_pago}
          monto={confirmando.monto}
          saldo={confirmando.saldo_reserva}
          comprobante={confirmando.comprobante_url}
          onConfirmar={({ referencia, comprobante }) =>
            confirmarPago(confirmando.id, referencia ?? undefined, comprobante)
          }
          onClose={() => setConfirmando(null)}
        />
      )}

      {editandoGasto && (
        <GastoModal
          gasto={editandoGasto}
          comunidades={comunidades}
          paquetes={paquetes}
          perfil={perfil}
          onClose={() => setEditandoGasto(null)}
        />
      )}
    </>
  );
}
