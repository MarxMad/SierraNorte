'use client';

import { useState, useTransition } from 'react';
import { Modal, Campo, inputCls, BtnPrimario, BtnGhost, Pill, Icono } from '@/components/ui';
import { guardarReserva } from '@/app/acciones';
import {
  type Reserva,
  type Paquete,
  type Guia,
  METODOS,
  PLATAFORMAS,
  STATUSES,
  TRANSPORTES,
  COLOR_METODO,
  COLOR_PLATAFORMA,
  COLOR_STATUS,
  colorPagado,
  hexA,
} from '@/lib/tipos';

export default function ReservaModal({
  reserva,
  paquetes,
  guias,
  onClose,
}: {
  reserva: Partial<Reserva>;
  paquetes: Paquete[];
  guias: Guia[];
  onClose: () => void;
}) {
  const nueva = !reserva.id;
  const [d, setD] = useState<Partial<Reserva>>({
    personas: 1,
    ninos: false,
    num_ninos: 0,
    metodo_pago: 'Efectivo',
    status: 'Planeación',
    precio: 0,
    ...reserva,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (patch: Partial<Reserva>) => setD((v) => ({ ...v, ...patch }));
  const pkg = paquetes.find((p) => p.id === d.paquete_id);

  const guardar = () => {
    if (!d.nombre?.trim()) return setError('Falta el nombre del cliente.');
    if (!d.paquete_id) return setError('Selecciona un paquete.');

    setError(null);
    startTransition(async () => {
      const res = await guardarReserva({
        id: d.id,
        codigo: d.codigo,
        nombre: d.nombre,
        email: d.email || null,
        telefono: d.telefono || null,
        paquete_id: d.paquete_id,
        personas: d.personas,
        ninos: d.ninos,
        num_ninos: d.ninos ? d.num_ninos : 0,
        fecha_inicio: d.fecha_inicio || null,
        fecha_fin: d.fecha_fin || null,
        precio: d.precio ?? 0,
        metodo_pago: d.metodo_pago,
        plataforma: d.metodo_pago === 'Transfer/Tarjeta' ? (d.plataforma ?? 'WeTravel') : null,
        guia_id: d.guia_id || null,
        transporte: d.transporte || null,
        status: d.status,
        notas: d.notas || null,
      });
      if (res.ok) onClose();
      else setError(res.error ?? 'No se pudo guardar.');
    });
  };

  return (
    <Modal
      titulo={nueva ? 'Nueva reserva' : (d.nombre ?? 'Reserva')}
      sub={
        nueva
          ? 'El código de tour se genera automáticamente'
          : `${d.codigo} · ${d.personas} pax${d.ninos ? ` · ${d.num_ninos} niños` : ''}`
      }
      icono="user"
      color="#5B21B6"
      chip={!nueva && d.status ? <Pill texto={d.status} color={COLOR_STATUS[d.status]} solid /> : undefined}
      onClose={onClose}
      footer={
        <>
          <BtnGhost onClick={onClose}>Cancelar</BtnGhost>
          <BtnPrimario onClick={guardar} disabled={pending}>
            {pending ? 'Guardando…' : nueva ? 'Crear reserva' : 'Guardar cambios'}
          </BtnPrimario>
        </>
      }
    >
      <div className="space-y-4">
        {!nueva && (
          <div className="rounded-lg bg-violet-50 px-3 py-2 font-mono text-sm font-bold text-[#5B21B6]">
            {d.codigo}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nombre del cliente" icono="user" req>
            <input
              className={inputCls}
              value={d.nombre ?? ''}
              onChange={(e) => set({ nombre: e.target.value })}
              placeholder="Nombre y apellido"
            />
          </Campo>
          <Campo label="Correo" icono="note">
            <input
              className={inputCls}
              type="email"
              value={d.email ?? ''}
              onChange={(e) => set({ email: e.target.value })}
              placeholder="correo@mail.com"
            />
          </Campo>
        </div>

        <Campo label="Teléfono">
          <input
            className={inputCls}
            value={d.telefono ?? ''}
            onChange={(e) => set({ telefono: e.target.value })}
            placeholder="55-0000"
          />
        </Campo>

        {/* Personas y niños */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
          <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
            <Campo label="Nº de personas" icono="users" req>
              <input
                className={inputCls}
                type="number"
                min={1}
                value={d.personas ?? 1}
                onChange={(e) => set({ personas: Math.max(1, Number(e.target.value) || 1) })}
              />
            </Campo>
            <div>
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-700">
                <Icono n="child" s={13} c="#9CA3AF" />
                ¿Vienen niños?
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Opcion
                  activa={!d.ninos}
                  color="#6B7280"
                  onClick={() => set({ ninos: false, num_ninos: 0 })}
                >
                  No
                </Opcion>
                <Opcion
                  activa={!!d.ninos}
                  color="#B45309"
                  onClick={() => set({ ninos: true, num_ninos: d.num_ninos || 1 })}
                >
                  Sí
                </Opcion>
                {d.ninos && (
                  <input
                    type="number"
                    min={1}
                    max={d.personas}
                    value={d.num_ninos ?? 1}
                    onChange={(e) =>
                      set({
                        num_ninos: Math.max(
                          1,
                          Math.min(d.personas ?? 1, Number(e.target.value) || 1)
                        ),
                      })
                    }
                    className="w-20 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-800 outline-none"
                  />
                )}
              </div>
              {d.ninos && (
                <p className="mt-1.5 text-[11px] font-semibold text-amber-700">
                  Los niños van incluidos dentro del total de personas.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Paquete */}
        <Campo label="Paquete" icono="clipboard" req>
          <select
            className={inputCls}
            value={d.paquete_id ?? ''}
            onChange={(e) => {
              const np = paquetes.find((p) => p.id === e.target.value);
              set({
                paquete_id: e.target.value,
                fecha_inicio: np?.fecha_inicio ?? d.fecha_inicio,
                fecha_fin: np?.fecha_fin ?? d.fecha_fin,
                precio: np?.precio || d.precio,
              });
            }}
          >
            <option value="">— Selecciona un paquete —</option>
            {paquetes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.duracion} · {p.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <div className="grid gap-4 sm:grid-cols-3">
          <Campo label="Desde" icono="calendar">
            <input
              className={inputCls}
              type="date"
              value={d.fecha_inicio ?? ''}
              onChange={(e) => set({ fecha_inicio: e.target.value })}
            />
          </Campo>
          <Campo label="Hasta" icono="calendar">
            <input
              className={inputCls}
              type="date"
              value={d.fecha_fin ?? ''}
              onChange={(e) => set({ fecha_fin: e.target.value })}
            />
          </Campo>
          <Campo label="Precio" icono="wallet">
            <input
              className={inputCls}
              type="number"
              value={d.precio || ''}
              onChange={(e) => set({ precio: Number(e.target.value) || 0 })}
              placeholder="0"
            />
          </Campo>
        </div>

        {/* Método de pago */}
        <div>
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-700">
            <Icono n="card" s={13} c="#9CA3AF" />
            Método de pago<span className="text-red-600">*</span>
          </span>
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
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Plataforma
              </p>
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

          {d.metodo_pago === 'Pago en comunidad' && (
            <p className="mt-2.5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800">
              <Icono n="mountain" s={14} c="#B45309" />
              El cliente paga directamente en la comunidad al llegar.
            </p>
          )}
        </div>

        {/* Guía y transporte */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Guía asignado" icono="user">
            <select
              className={inputCls}
              value={d.guia_id ?? ''}
              onChange={(e) => set({ guia_id: e.target.value || null })}
            >
              <option value="">— Sin guía —</option>
              {guias.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}
                  {g.bilingue ? ' (bilingüe)' : ''}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Transporte" icono="bus">
            <select
              className={inputCls}
              value={d.transporte ?? ''}
              onChange={(e) => set({ transporte: e.target.value || null })}
            >
              <option value="">— Sin asignar —</option>
              {TRANSPORTES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        {/* Status */}
        <div>
          <span className="mb-1.5 block text-xs font-bold text-gray-700">Status</span>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Opcion
                key={s}
                activa={d.status === s}
                color={COLOR_STATUS[s]}
                onClick={() => set({ status: s })}
              >
                {s}
              </Opcion>
            ))}
          </div>
        </div>

        <Campo label="Notas" icono="note">
          <textarea
            className={`${inputCls} min-h-16 resize-y`}
            value={d.notas ?? ''}
            onChange={(e) => set({ notas: e.target.value })}
            placeholder="Alergias, requerimientos especiales, hora de llegada…"
          />
        </Campo>

        {!nueva && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
            <span className="text-gray-500">Pagado: </span>
            <b style={{ color: colorPagado(d.pagado_pct ?? 0) }}>{d.pagado_pct ?? 0}%</b>
            <span className="mx-2 text-gray-300">·</span>
            <span className="text-gray-500">Saldo: </span>
            <b className="text-gray-900">${(d.saldo ?? 0).toLocaleString('es-MX')}</b>
            <p className="mt-1 text-[11px] text-gray-400">
              El % se calcula desde los pagos confirmados en Banca.
            </p>
          </div>
        )}

        {pkg && (
          <div
            className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
            style={{
              background: hexA(COLOR_METODO['Transfer/Tarjeta'], 0.04),
              borderColor: '#E5E7EB',
            }}
          >
            <span className="text-xs font-semibold text-gray-600">
              {pkg.duracion} · {(pkg.comunidades ?? []).join(', ')}
            </span>
          </div>
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
