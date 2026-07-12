'use client';

import { useState, useTransition } from 'react';
import { Modal, Campo, inputCls, BtnPrimario, BtnGhost, Icono } from '@/components/ui';
import { facturarPago } from '@/app/acciones';
import { type MovimientoContable, dinero, hexA } from '@/lib/tipos';

const IVA = 0.16;

// La factura que se le emite al turista. No todos la piden: por eso el
// pago nace sin factura y aquí el auxiliar contable captura el CFDI.
export default function FacturaVentaModal({
  mov,
  onClose,
}: {
  mov: MovimientoContable;
  onClose: () => void;
}) {
  const [conFactura, setConFactura] = useState(mov.con_factura);
  const [folio, setFolio] = useState(mov.folio ?? '');
  // El precio de venta ya trae el IVA dentro: se desglosa hacia atrás.
  const [subtotal, setSubtotal] = useState(
    String(mov.con_factura ? mov.subtotal : Math.round((mov.total / (1 + IVA)) * 100) / 100)
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sub = Number(subtotal) || 0;
  const iva = Math.round((mov.total - sub) * 100) / 100;

  const guardar = () => {
    if (conFactura && !folio.trim()) return setError('Con factura necesitas el folio del CFDI.');
    if (conFactura && sub <= 0) return setError('El subtotal debe ser mayor a cero.');
    if (conFactura && iva < 0) return setError('El subtotal no puede ser mayor que el total cobrado.');
    setError(null);

    startTransition(async () => {
      const r = await facturarPago(mov.id, {
        con_factura: conFactura,
        folio_factura: conFactura ? folio.trim() : null,
        subtotal: conFactura ? sub : null,
        iva: conFactura ? iva : null,
      });
      if (r.ok) onClose();
      else setError(r.error ?? 'No se pudo guardar.');
    });
  };

  return (
    <Modal
      titulo="Factura de venta"
      sub={`${mov.referencia_interna} · ${mov.contraparte}`}
      icono="receipt"
      color="#16A34A"
      onClose={onClose}
      footer={
        <>
          <BtnGhost onClick={onClose}>Cancelar</BtnGhost>
          <BtnPrimario onClick={guardar} disabled={pending}>
            {pending ? 'Guardando…' : 'Guardar'}
          </BtnPrimario>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
          <span className="text-gray-500">Cobrado: </span>
          <b className="text-gray-900">{dinero(mov.total)}</b>
          <span className="mx-2 text-gray-300">·</span>
          <span className="text-xs text-gray-500">{mov.concepto}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ['El cliente pidió factura', true],
            ['No pidió factura', false],
          ].map(([label, val]) => {
            const activa = conFactura === val;
            return (
              <button
                key={String(label)}
                onClick={() => setConFactura(val as boolean)}
                className="flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-bold transition"
                style={{
                  borderColor: activa ? '#16A34A' : '#E5E7EB',
                  background: activa ? hexA('#16A34A', 0.1) : '#fff',
                  color: activa ? '#16A34A' : '#6B7280',
                }}
              >
                <span
                  className="h-3 w-3 rounded-full border-2"
                  style={{
                    borderColor: activa ? '#16A34A' : '#CBD5E1',
                    background: activa ? '#16A34A' : '#fff',
                    boxShadow: activa ? 'inset 0 0 0 2px #fff' : 'none',
                  }}
                />
                {label as string}
              </button>
            );
          })}
        </div>

        {conFactura ? (
          <>
            <Campo label="Folio del CFDI" icono="ticket" req>
              <input
                className={`${inputCls} font-mono font-bold text-[#16A34A]`}
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                placeholder="Ej: F-2026-104"
              />
            </Campo>

            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <p className="mb-3 text-[11px] font-extrabold uppercase tracking-wide text-gray-400">
                Desglose
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Campo label="Subtotal" req>
                  <input
                    className={`${inputCls} font-bold`}
                    type="number"
                    step="0.01"
                    value={subtotal}
                    onChange={(e) => setSubtotal(e.target.value)}
                  />
                </Campo>
                <div>
                  <span className="mb-1.5 block text-xs font-bold text-gray-700">IVA</span>
                  <div className="rounded-lg border-2 border-blue-200 bg-blue-50 px-3 py-2.5 text-right text-sm font-extrabold text-blue-700">
                    {dinero(iva)}
                  </div>
                </div>
                <div>
                  <span className="mb-1.5 block text-xs font-bold text-gray-700">Total</span>
                  <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 px-3 py-2.5 text-right text-sm font-extrabold text-emerald-700">
                    {dinero(mov.total)}
                  </div>
                </div>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
                <Icono n="alert" s={11} c="#9CA3AF" />
                El precio de venta ya trae el IVA dentro: el total es lo que cobraste, y el IVA
                es la diferencia contra el subtotal.
              </p>
            </div>

            <p className="rounded-xl border border-blue-200 bg-blue-50/60 px-3 py-2.5 text-xs font-semibold text-blue-800">
              Este IVA se suma al <b>trasladado</b> y se cruza contra el IVA de las facturas de
              gasto para sacar el saldo del SAT.
            </p>
          </>
        ) : (
          <p className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-600">
            El pago sigue contando como ingreso en la caja, pero no entra al cotejo de IVA.
          </p>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
