'use client';

import { useState, useTransition } from 'react';
import { Modal, Campo, inputCls, BtnPrimario, BtnGhost, Pill } from '@/components/ui';
import { guardarPaquete } from '@/app/acciones';
import { type Paquete, STATUSES, COLOR_STATUS, COLOR_DURACION, hexA } from '@/lib/tipos';

const DURACIONES = ['1 día', '2 días', '3 días', '4 días', '5 días', '7 días', 'Servicios'];

export default function PaqueteModal({
  paquete,
  onClose,
}: {
  paquete: Partial<Paquete>;
  onClose: () => void;
}) {
  const nuevo = !paquete.id;
  const [d, setD] = useState<Partial<Paquete>>({
    duracion: '1 día',
    status: 'Planeación',
    precio: 0,
    anfitrion_monto: 0,
    transporte_monto: 0,
    transporte_tipo: 'Van',
    anfitrion_idiomas: 'Español / Inglés',
    ...paquete,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (patch: Partial<Paquete>) => setD((v) => ({ ...v, ...patch }));

  const guardar = () => {
    if (!d.nombre?.trim()) return setError('Falta el nombre del paquete.');
    setError(null);

    startTransition(async () => {
      const res = await guardarPaquete({
        id: d.id ?? `p${Date.now()}`,
        nombre: d.nombre,
        duracion: d.duracion,
        descripcion: d.descripcion || null,
        precio: d.precio ?? 0,
        fecha_inicio: d.fecha_inicio || null,
        fecha_fin: d.fecha_fin || null,
        status: d.status,
        anfitrion_nombre: d.anfitrion_nombre || null,
        anfitrion_idiomas: d.anfitrion_idiomas || null,
        anfitrion_monto: d.anfitrion_monto ?? 0,
        transporte_proveedor: d.transporte_proveedor || null,
        transporte_tipo: d.transporte_tipo || null,
        transporte_ruta: d.transporte_ruta || null,
        transporte_monto: d.transporte_monto ?? 0,
      });
      if (res.ok) onClose();
      else setError(res.error ?? 'No se pudo guardar.');
    });
  };

  return (
    <Modal
      titulo={nuevo ? 'Nuevo paquete' : (d.nombre ?? 'Paquete')}
      sub={
        nuevo
          ? 'Crea un paquete de experiencias'
          : `${d.duracion} · ${(d.comunidades ?? []).length} comunidades · ${d.pax ?? 0} pax`
      }
      icono="clipboard"
      color={COLOR_DURACION[d.duracion ?? '1 día']}
      chip={!nuevo && d.status ? <Pill texto={d.status} color={COLOR_STATUS[d.status]} solid /> : undefined}
      onClose={onClose}
      footer={
        <>
          <BtnGhost onClick={onClose}>Cancelar</BtnGhost>
          <BtnPrimario onClick={guardar} disabled={pending}>
            {pending ? 'Guardando…' : nuevo ? 'Crear paquete' : 'Guardar cambios'}
          </BtnPrimario>
        </>
      }
    >
      <div className="space-y-4">
        {d.descripcion && (
          <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[13px] leading-relaxed text-gray-600">
            {d.descripcion}
          </p>
        )}

        <Campo label="Nombre del paquete" icono="clipboard" req>
          <input
            className={inputCls}
            value={d.nombre ?? ''}
            onChange={(e) => set({ nombre: e.target.value })}
            placeholder="Ej: Cañón del Coyote"
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-1.5 block text-xs font-bold text-gray-700">Duración</span>
            <div className="flex flex-wrap gap-1.5">
              {DURACIONES.map((k) => (
                <button
                  key={k}
                  onClick={() => set({ duracion: k as Paquete['duracion'] })}
                  className="rounded-lg border-2 px-2.5 py-1.5 text-xs font-bold transition"
                  style={{
                    borderColor: d.duracion === k ? COLOR_DURACION[k] : '#E5E7EB',
                    background: d.duracion === k ? hexA(COLOR_DURACION[k], 0.1) : '#fff',
                    color: d.duracion === k ? COLOR_DURACION[k] : '#6B7280',
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-bold text-gray-700">Status</span>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((k) => (
                <button
                  key={k}
                  onClick={() => set({ status: k })}
                  className="rounded-lg border-2 px-2.5 py-1.5 text-xs font-bold transition"
                  style={{
                    borderColor: d.status === k ? COLOR_STATUS[k] : '#E5E7EB',
                    background: d.status === k ? hexA(COLOR_STATUS[k], 0.1) : '#fff',
                    color: d.status === k ? COLOR_STATUS[k] : '#6B7280',
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>

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
          <Campo label="Precio por persona" icono="wallet">
            <input
              className={inputCls}
              type="number"
              value={d.precio || ''}
              onChange={(e) => set({ precio: Number(e.target.value) || 0 })}
              placeholder="0"
            />
          </Campo>
        </div>

        {/* Anfitrión bilingüe */}
        <fieldset className="rounded-xl border border-gray-200 p-4">
          <legend className="px-2 text-xs font-bold text-gray-700">Anfitrión bilingüe</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <Campo label="Nombre">
              <input
                className={inputCls}
                value={d.anfitrion_nombre ?? ''}
                onChange={(e) => set({ anfitrion_nombre: e.target.value })}
              />
            </Campo>
            <Campo label="Idiomas">
              <select
                className={inputCls}
                value={d.anfitrion_idiomas ?? 'Español / Inglés'}
                onChange={(e) => set({ anfitrion_idiomas: e.target.value })}
              >
                {['Español / Inglés', 'Español / Francés', 'Español / Alemán', 'Español / Zapoteco'].map(
                  (i) => (
                    <option key={i}>{i}</option>
                  )
                )}
              </select>
            </Campo>
            <Campo label="Costo por día">
              <input
                className={inputCls}
                type="number"
                value={d.anfitrion_monto || ''}
                onChange={(e) => set({ anfitrion_monto: Number(e.target.value) || 0 })}
                placeholder="0"
              />
            </Campo>
          </div>
        </fieldset>

        {/* Transporte */}
        <fieldset className="rounded-xl border border-gray-200 p-4">
          <legend className="px-2 text-xs font-bold text-gray-700">Transporte</legend>
          <div className="grid gap-3 sm:grid-cols-4">
            <Campo label="Proveedor">
              <input
                className={inputCls}
                value={d.transporte_proveedor ?? ''}
                onChange={(e) => set({ transporte_proveedor: e.target.value })}
              />
            </Campo>
            <Campo label="Vehículo">
              <select
                className={inputCls}
                value={d.transporte_tipo ?? 'Van'}
                onChange={(e) => set({ transporte_tipo: e.target.value })}
              >
                {['Van', 'Camioneta', 'Autobús', 'Colectivo', 'Vehículo propio'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Campo>
            <Campo label="Ruta">
              <input
                className={inputCls}
                value={d.transporte_ruta ?? ''}
                onChange={(e) => set({ transporte_ruta: e.target.value })}
                placeholder="Oaxaca – Cuajimoloyas"
              />
            </Campo>
            <Campo label="Costo total">
              <input
                className={inputCls}
                type="number"
                value={d.transporte_monto || ''}
                onChange={(e) => set({ transporte_monto: Number(e.target.value) || 0 })}
                placeholder="0"
              />
            </Campo>
          </div>
        </fieldset>

        <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-800">
          El itinerario y los comedores de este paquete ya están cargados. Los montos que captures aquí
          alimentan la Liquidación automáticamente.
        </p>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
