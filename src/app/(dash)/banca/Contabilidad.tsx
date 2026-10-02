'use client';

import { useState, useTransition } from 'react';
import { Icono, Pill, Kpi, Vacio, BotonAccion } from '@/components/ui';
import VerComprobante from '@/components/VerComprobante';
import FacturaVentaModal from './FacturaVentaModal';
import { borrarGasto } from '@/app/acciones';
import {
  type MovimientoContable,
  type ContabilidadKpis,
  type Gasto,
  type Comunidad,
  type Perfil,
  dinero,
} from '@/lib/tipos';
import { puedeEditarGasto, puedeEditarPagos } from '@/lib/permisos';

// =====================================================================
// CONTABILIDAD
//
// El negocio: el turista nos paga a nosotros, nosotros le pagamos a las
// comunidades, y nosotros gestionamos los impuestos. Por eso las dos
// caras de la factura tienen que verse en un solo lugar y cotejarse:
//
//   entró (pagos confirmados)  vs  salió (gastos)          → la caja
//   IVA trasladado             vs  IVA acreditable         → el SAT
// =====================================================================

const SUBVISTAS = [
  { id: 'movimientos', label: 'Movimientos' },
  { id: 'facturas', label: 'Facturas de gasto' },
] as const;

export default function Contabilidad({
  movimientos,
  kpis,
  gastos,
  comunidades,
  perfil,
  busqueda,
  onEditarGasto,
}: {
  movimientos: MovimientoContable[];
  kpis: ContabilidadKpis;
  gastos: Gasto[];
  comunidades: Comunidad[];
  perfil: Perfil;
  busqueda: string;
  onEditarGasto: (g: Partial<Gasto>) => void;
}) {
  const [sub, setSub] = useState<'movimientos' | 'facturas'>('movimientos');
  const [facturando, setFacturando] = useState<MovimientoContable | null>(null);
  const [, startTransition] = useTransition();

  const puedeFacturar = puedeEditarPagos(perfil.rol);
  const q = busqueda;

  const movs = movimientos.filter(
    (m) =>
      !q ||
      m.contraparte.toLowerCase().includes(q) ||
      m.concepto.toLowerCase().includes(q) ||
      (m.folio ?? '').toLowerCase().includes(q) ||
      m.referencia_interna.toLowerCase().includes(q)
  );

  const gs = gastos.filter(
    (g) =>
      !q ||
      g.proveedor.toLowerCase().includes(q) ||
      g.concepto.toLowerCase().includes(q) ||
      (g.folio ?? '').toLowerCase().includes(q)
  );

  const eliminar = (g: Gasto) => {
    if (!confirm(`¿Eliminar la factura de ${g.proveedor}?`)) return;
    startTransition(async () => {
      const r = await borrarGasto(g.id);
      if (!r.ok) alert(r.error);
    });
  };

  const aCargo = kpis.iva_saldo >= 0;

  return (
    <>
      {/* ---------- LA CAJA: entró vs salió ---------- */}
      <div className="mb-4 flex flex-wrap gap-3">
        <Kpi icono="trendUp" label="Entró" valor={dinero(kpis.entro)} color="#16A34A" />
        <Kpi icono="wallet" label="Salió" valor={dinero(kpis.salio)} color="#FB923C" />
        <Kpi
          icono="chart"
          label="Saldo"
          valor={dinero(kpis.saldo)}
          color={kpis.saldo >= 0 ? '#1F7D5E' : '#DC2626'}
        />
      </div>

      {/* ---------- EL SAT: IVA trasladado vs acreditable ---------- */}
      <div className="mb-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
          <Icono n="percent" s={14} c="#6B7280" />
          <span className="text-xs font-extrabold uppercase tracking-wide text-gray-600">
            Cotejo de IVA
          </span>
          <span className="flex-1" />
          <span className="text-[11px] font-semibold text-gray-400">
            Sólo entra lo que lleva factura
          </span>
        </div>

        <div className="grid gap-px bg-gray-100 sm:grid-cols-3">
          <Lado
            titulo="IVA trasladado"
            sub="El que cobraste en tus facturas de venta"
            monto={kpis.iva_trasladado}
            base={kpis.facturado_ventas}
            color="#16A34A"
          />
          <Lado
            titulo="IVA acreditable"
            sub="El que pagaste en las facturas de gasto"
            monto={kpis.iva_acreditable}
            base={kpis.facturado_gastos}
            color="#FB923C"
          />
          <div
            className="flex flex-col justify-center bg-white px-4 py-3.5"
            style={{ background: aCargo ? '#FEF2F2' : '#F0FDF4' }}
          >
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-gray-500">
              {aCargo ? 'Saldo a cargo' : 'Saldo a favor'}
            </p>
            <p
              className="mt-0.5 text-xl font-extrabold"
              style={{ color: aCargo ? '#DC2626' : '#16A34A' }}
            >
              {dinero(Math.abs(kpis.iva_saldo))}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-gray-500">
              {aCargo
                ? 'Es lo que se le debe al SAT este corte.'
                : 'El SAT te debe: pagaste más IVA del que cobraste.'}
            </p>
          </div>
        </div>

        {(kpis.ingresos_sin_factura > 0 || kpis.gastos_sin_factura > 0) && (
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 bg-amber-50 px-4 py-2.5 text-[11px] font-semibold text-amber-800">
            <Icono n="alert" s={13} c="#B45309" />
            Fuera del cotejo: {kpis.ingresos_sin_factura} cobros sin factura de venta y{' '}
            {kpis.gastos_sin_factura} gastos sin factura. No suman IVA por ningún lado.
          </div>
        )}
      </div>

      {/* ---------- Sub-pestañas ---------- */}
      <div className="mb-4 inline-flex gap-1 rounded-xl bg-gray-100 p-1">
        {SUBVISTAS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSub(s.id)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              sub === s.id ? 'bg-white text-[#1F7D5E] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ---------- LA BASE CONCENTRADA ---------- */}
      {sub === 'movimientos' &&
        (movs.length === 0 ? (
          <Vacio
            titulo="Sin movimientos"
            sub="Aquí caen los pagos confirmados y las facturas de gasto, juntos."
            icono="receipt"
          />
        ) : (
          <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2.5">Fecha</th>
                  <th className="px-3 py-2.5">Flujo</th>
                  <th className="px-3 py-2.5">Contraparte</th>
                  <th className="px-3 py-2.5">Concepto</th>
                  <th className="px-3 py-2.5">Factura</th>
                  <th className="px-3 py-2.5 text-right">Subtotal</th>
                  <th className="px-3 py-2.5 text-right">IVA</th>
                  <th className="px-3 py-2.5 text-right">Total</th>
                  <th className="px-3 py-2.5">Archivo</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {movs.map((m) => {
                  const entra = m.flujo === 'ingreso';
                  return (
                    <tr key={m.flujo + m.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-xs font-semibold text-gray-600">{m.fecha}</td>
                      <td className="px-3 py-2.5">
                        <Pill
                          texto={entra ? 'Entró' : 'Salió'}
                          color={entra ? '#16A34A' : '#FB923C'}
                        />
                      </td>
                      <td className="px-3 py-2.5 font-bold text-gray-800">{m.contraparte}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-600">{m.concepto}</td>
                      <td className="px-3 py-2.5">
                        {m.con_factura && m.folio ? (
                          <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold text-[#1F7D5E]">
                            {m.folio}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-gray-400">
                            Sin factura
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{dinero(m.subtotal)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-blue-600">
                        {m.iva > 0 ? dinero(m.iva) : '—'}
                      </td>
                      <td
                        className="px-3 py-2.5 text-right font-extrabold"
                        style={{ color: entra ? '#16A34A' : '#B45309' }}
                      >
                        {entra ? '+' : '−'}
                        {dinero(m.total)}
                      </td>
                      <td className="px-3 py-2.5">
                        <VerComprobante ruta={m.archivo_url} />
                      </td>
                      <td className="px-3 py-2.5">
                        {entra && puedeFacturar && (
                          <button
                            onClick={() => setFacturando(m)}
                            className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-bold text-gray-600 transition hover:bg-gray-100"
                          >
                            {m.con_factura ? 'Editar factura' : 'Facturar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

      {/* ---------- FACTURAS DE GASTO ---------- */}
      {sub === 'facturas' &&
        (gs.length === 0 ? (
          <Vacio
            titulo="Sin facturas de gasto"
            sub="Da de alta una con «Agregar factura»."
            icono="wallet"
          />
        ) : (
          <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2.5">Fecha</th>
                  <th className="px-3 py-2.5">Proveedor</th>
                  <th className="px-3 py-2.5">Concepto</th>
                  <th className="px-3 py-2.5">Folio</th>
                  <th className="px-3 py-2.5">Comunidad</th>
                  <th className="px-3 py-2.5 text-right">Subtotal</th>
                  <th className="px-3 py-2.5 text-right">IVA</th>
                  <th className="px-3 py-2.5 text-right">Total</th>
                  <th className="px-3 py-2.5">Archivo</th>
                  <th className="px-3 py-2.5">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {gs.map((g) => {
                  const com = comunidades.find((c) => c.id === g.comunidad_id);
                  const editable = puedeEditarGasto(perfil.rol, perfil.comunidad_id, g.comunidad_id);
                  return (
                    <tr key={g.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-xs font-semibold text-gray-600">{g.fecha}</td>
                      <td className="px-3 py-2.5 font-bold text-gray-800">{g.proveedor}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-600">{g.concepto}</td>
                      <td className="px-3 py-2.5">
                        {g.con_factura && g.folio ? (
                          <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold text-[#1F7D5E]">
                            {g.folio}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Sin factura</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {com ? (
                          <Pill texto={com.nombre} color={com.color} />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{dinero(g.subtotal)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-blue-600">
                        {dinero(g.iva)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-extrabold text-gray-900">
                        {dinero(g.total)}
                      </td>
                      <td className="px-3 py-2.5">
                        <VerComprobante ruta={g.archivo_url} />
                      </td>
                      <td className="px-3 py-2.5">
                        {editable ? (
                          <div className="flex gap-1">
                            <BotonAccion icono="edit" titulo="Editar" onClick={() => onEditarGasto(g)} />
                            <BotonAccion
                              icono="trash"
                              titulo="Eliminar"
                              color="#DC2626"
                              onClick={() => eliminar(g)}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

      {facturando && (
        <FacturaVentaModal mov={facturando} onClose={() => setFacturando(null)} />
      )}
    </>
  );
}

function Lado({
  titulo,
  sub,
  monto,
  base,
  color,
}: {
  titulo: string;
  sub: string;
  monto: number;
  base: number;
  color: string;
}) {
  return (
    <div className="bg-white px-4 py-3.5">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-gray-500">{titulo}</p>
      <p className="mt-0.5 text-xl font-extrabold" style={{ color }}>
        {dinero(monto)}
      </p>
      <p className="mt-1 text-[11px] font-semibold text-gray-400">{sub}</p>
      <p className="mt-1 text-[11px] font-bold text-gray-600">
        Facturado: {dinero(base)}
      </p>
    </div>
  );
}
