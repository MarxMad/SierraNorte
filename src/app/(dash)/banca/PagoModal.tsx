'use client';

import { useState, useTransition } from 'react';
import { Modal, Campo, inputCls, BtnPrimario, BtnGhost } from '@/components/ui';
import { guardarPago } from '@/app/acciones';
import {
  type Pago,
  type Reserva,
  METODOS,
  PLATAFORMAS,
  COLOR_METODO,
  COLOR_PLATAFORMA,
  COLOR_PAGO,
  dinero,
  hexA,
} from '@/lib/tipos';

const STATUS_PAGO = ['Pendiente', 'Confirmado', 'Vencido', 'Devuelto'] as const;

export default function PagoModal({
  pago,
  reservas,
  onClose,
}: {
  pago: Partial<Pago>;
  reservas: Pick<Reserva, 'id' | 'codigo' | 'nombre' | 'precio' | 'saldo'>[];
  onClose: () => void;
}) {
  const nuevo = !pago.id;
  const [d, setD] = useState<Partial<Pago>>({
    metodo_pago: 'Efectivo',
    status: 'Pendiente',
    fecha: new Date().toISOString().slice(0, 10),
    monto: 0,
    ...pago,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (p: Partial<Pago>) => setD((v) => ({ ...v, ...p }));
  const reserva = reservas.find((r) => r.id === d.reserva_id);

  const guardar = () => {
    if (!d.reserva_id) return setError('Selecciona la reserva a la que pertenece este pago.');
    if (!d.monto || d.monto <= 0) return setError('El monto debe ser mayor a cero.');
    setError(null);

    startTransition(async () => {
      const res = await guardarPago({
        id: d.id,
        reserva_id: d.reserva_id,
        monto: d.monto,
        fecha: d.fecha,
        metodo_pago: d.metodo_pago,
        plataforma: d.metodo_pago === 'Transfer/Tarjeta' ? (d.plataforma ?? 'WeTravel') : null,
        status: d.status,
        referencia: d.referencia || null,
      });
      if (res.ok) onClose();
      else setError(res.error ?? 'No se pudo guardar.');
    });
  };

  return (
    <Modal
      titulo={nuevo ? 'Registrar pago' : 'Editar pago'}
      sub={nuevo ? 'Un pago siempre pertenece a una reserva' : `${d.codigo} · ${d.cliente}`}
      icono="card"
      color="#2563EB"
      onClose={onClose}
      footer={
        <>
          <BtnGhost onClick={onClose}>Cancelar</BtnGhost>
          <BtnPrimario onClick={guardar} disabled={pending}>
            {pending ? 'Guardando…' : nuevo ? 'Registrar pago' : 'Guardar cambios'}
          </BtnPrimario>
        </>
      }
    >
      <div className="space-y-4">
        <Campo label="Reserva" icono="ticket" req>
          <select
            className={inputCls}
            value={d.reserva_id ?? ''}
            disabled={!nuevo}
            onChange={(e) => set({ reserva_id: e.target.value })}
          >
            <option value="">— Selecciona la reserva —</option>
            {reservas.map((r) => (
              <option key={r.id} value={r.id}>
                {r.codigo} · {r.nombre} (saldo {dinero(r.saldo)})
              </option>
            ))}
          </select>
        </Campo>

        {reserva && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
            <span className="text-gray-500">Precio: </span>
            <b className="text-gray-900">{dinero(reserva.precio)}</b>
            <span className="mx-2 text-gray-300">·</span>
            <span className="text-gray-500">Saldo por cobrar: </span>
            <b className="text-amber-600">{dinero(reserva.saldo)}</b>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Monto" icono="wallet" req>
            <input
              className={`${inputCls} font-bold`}
              type="number"
              step="0.01"
              value={d.monto || ''}
              onChange={(e) => set({ monto: Number(e.target.value) || 0 })}
              placeholder="0.00"
            />
          </Campo>
          <Campo label="Fecha del pago" icono="calendar" req>
            <input
              className={inputCls}
              type="date"
              value={d.fecha ?? ''}
              onChange={(e) => set({ fecha: e.target.value })}
            />
          </Campo>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-bold text-gray-700">Método de pago</span>
          <div className="flex flex-wrap gap-2">
            {METODOS.map((m) => (
              <Opcion
                key={m}
                activa={d.metodo_pago === m}
                color={COLOR_METODO[m]}
                onClick={() =>
                  set({
                    metodo_pago: m,
                    plataforma: m === 'Transfer/Tarjeta' ? (d.plataforma ?? 'WeTravel') : null,
                  })
                }
              >
                {m}
              </Opcion>
            ))}
          </div>

          {d.metodo_pago === 'Transfer/Tarjeta' && (
            <div className="mt-2.5 rounded-xl border border-blue-200 bg-blue-50/50 p-3">
              <p className="mb-2 text-[11px] font-bold uppercase text-gray-500">Plataforma</p>
              <div className="flex flex-wrap gap-2">
                {PLATAFORMAS.map((p) => (
                  <Opcion
                    key={p}
                    activa={d.plataforma === p}
                    color={COLOR_PLATAFORMA[p]}
                    onClick={() => set({ plataforma: p })}
                  >
                    {p}
                  </Opcion>
                ))}
              </div>
            </div>
          )}
        </div>

        <Campo label="Referencia / n° de transacción" icono="note">
          <input
            className={inputCls}
            value={d.referencia ?? ''}
            onChange={(e) => set({ referencia: e.target.value })}
            placeholder="Ej: WT-88120"
          />
        </Campo>

        <div>
          <span className="mb-1.5 block text-xs font-bold text-gray-700">Status del pago</span>
          <div className="flex flex-wrap gap-2">
            {STATUS_PAGO.map((s) => (
              <Opcion
                key={s}
                activa={d.status === s}
                color={COLOR_PAGO[s]}
                onClick={() => set({ status: s })}
              >
                {s}
              </Opcion>
            ))}
          </div>
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

function Opcion({
  activa,
  color,
  onClick,
  children,
}: {
  activa: boolean;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-bold transition"
      style={{
        borderColor: activa ? color : '#E5E7EB',
        background: activa ? hexA(color, 0.1) : '#fff',
        color: activa ? color : '#6B7280',
      }}
    >
      <span
        className="h-3 w-3 shrink-0 rounded-full border-2"
        style={{
          borderColor: activa ? color : '#CBD5E1',
          background: activa ? color : '#fff',
          boxShadow: activa ? 'inset 0 0 0 2px #fff' : 'none',
        }}
      />
      {children}
    </button>
  );
}
