'use client';

import { useState, useTransition } from 'react';
import { Modal, Campo, inputCls, BtnPrimario, BtnGhost, Pill, Icono } from '@/components/ui';
import SubirArchivo from '@/components/SubirArchivo';
import { type MetodoPago, COLOR_METODO, dinero } from '@/lib/tipos';
import type { Resultado } from '@/app/acciones';

// El pop-up que se abre al confirmar un pago (Banca) o validar un cobro
// en efectivo (Liquidación). El comprobante es opcional: si no lo suben,
// el pago se confirma igual pero queda marcado como "sin comprobante".
export default function ComprobanteModal({
  codigo,
  cliente,
  paquete,
  metodo,
  monto,
  saldo,
  montoEditable = false,
  comprobante,
  onConfirmar,
  onClose,
}: {
  codigo: string;
  cliente: string;
  paquete?: string | null;
  metodo: MetodoPago;
  monto: number;
  saldo?: number;
  montoEditable?: boolean;
  comprobante: string | null;
  onConfirmar: (datos: {
    monto: number;
    referencia: string | null;
    comprobante: string | null;
  }) => Promise<Resultado>;
  onClose: () => void;
}) {
  const [importe, setImporte] = useState(String(monto));
  const [referencia, setReferencia] = useState('');
  const [archivo, setArchivo] = useState<string | null>(comprobante);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const recibido = Number(importe) || 0;
  const efectivo = metodo !== 'Transfer/Tarjeta';
  const diferencia = monto - recibido;

  const confirmar = () => {
    if (recibido <= 0) return setError('El monto debe ser mayor a cero.');
    setError(null);

    startTransition(async () => {
      const r = await onConfirmar({
        monto: recibido,
        referencia: referencia.trim() || null,
        comprobante: archivo,
      });
      if (r.ok) onClose();
      else setError(r.error ?? 'No se pudo confirmar.');
    });
  };

  return (
    <Modal
      titulo={efectivo ? 'Validar cobro' : 'Confirmar pago'}
      sub={`${codigo} · ${cliente}`}
      icono={efectivo ? 'cash' : 'card'}
      color={COLOR_METODO[metodo]}
      chip={<Pill texto={metodo} color={COLOR_METODO[metodo]} solid />}
      onClose={onClose}
      footer={
        <>
          <BtnGhost onClick={onClose}>Cancelar</BtnGhost>
          <BtnPrimario onClick={confirmar} disabled={pending}>
            {pending ? 'Confirmando…' : efectivo ? 'Validar cobro' : 'Confirmar pago'}
          </BtnPrimario>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
          <span className="text-gray-500">Esperado: </span>
          <b className="text-gray-900">{dinero(monto)}</b>
          {paquete && (
            <>
              <span className="mx-2 text-gray-300">·</span>
              <span className="text-xs text-gray-500">{paquete}</span>
            </>
          )}
          {saldo !== undefined && saldo > 0 && (
            <>
              <span className="mx-2 text-gray-300">·</span>
              <span className="text-gray-500">Saldo de la reserva: </span>
              <b className="text-amber-600">{dinero(saldo)}</b>
            </>
          )}
        </div>

        <Campo label={montoEditable ? 'Monto que realmente llegó' : 'Monto'} icono="wallet" req>
          <input
            className={`${inputCls} font-bold`}
            type="number"
            step="0.01"
            value={importe}
            disabled={!montoEditable}
            onChange={(e) => setImporte(e.target.value)}
          />
        </Campo>

        {montoEditable && diferencia > 0 && recibido > 0 && (
          <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800">
            <Icono n="alert" s={14} c="#B45309" />
            Llegaron {dinero(diferencia)} menos de lo esperado. La reserva se queda con ese
            saldo por cobrar.
          </p>
        )}

        <Campo
          label={efectivo ? 'Referencia o folio del recibo' : 'Referencia / n° de transacción'}
          icono="note"
        >
          <input
            className={inputCls}
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder={efectivo ? 'Ej: Recibo 042' : 'Ej: WT-88120'}
          />
        </Campo>

        <div>
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-700">
            <Icono n="paperclip" s={13} c="#9CA3AF" />
            Comprobante
          </span>
          <SubirArchivo
            carpeta="pagos"
            valor={archivo}
            onSubido={setArchivo}
            etiqueta={
              efectivo
                ? 'Sube la foto del recibo firmado'
                : 'Sube el comprobante de la transferencia'
            }
          />
          {!archivo && (
            <p className="mt-1.5 text-[11px] font-semibold text-gray-400">
              Puedes confirmar sin comprobante, pero el pago va a quedar marcado como
              &laquo;sin comprobante&raquo; en Contabilidad.
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
