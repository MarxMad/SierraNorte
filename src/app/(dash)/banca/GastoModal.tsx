'use client';

import { useState, useTransition } from 'react';
import { Modal, Campo, inputCls, BtnPrimario, BtnGhost, Pill, Icono } from '@/components/ui';
import SubirArchivo from '@/components/SubirArchivo';
import { guardarGasto } from '@/app/acciones';
import { type Gasto, type Comunidad, type Paquete, type Perfil, dinero, hexA } from '@/lib/tipos';

const IVA = 0.16;

export default function GastoModal({
  gasto,
  comunidades,
  paquetes,
  perfil,
  onClose,
}: {
  gasto: Partial<Gasto>;
  comunidades: Comunidad[];
  paquetes: Pick<Paquete, 'id' | 'nombre'>[];
  perfil: Perfil;
  onClose: () => void;
}) {
  const nuevo = !gasto.id;
  const [d, setD] = useState<Partial<Gasto>>({
    con_factura: true,
    subtotal: 0,
    iva: 0,
    fecha: new Date().toISOString().slice(0, 10),
    // el coordinador de comunidad sólo puede capturar gastos de SU pueblo
    comunidad_id: perfil.rol === 'comunidad' ? perfil.comunidad_id : null,
    ...gasto,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (p: Partial<Gasto>) => setD((v) => ({ ...v, ...p }));
  const total = Number(d.subtotal ?? 0) + Number(d.iva ?? 0);

  const setSubtotal = (v: string) => {
    const sub = Number(v) || 0;
    const iva = d.con_factura ? Math.round(sub * IVA * 100) / 100 : 0;
    set({ subtotal: sub, iva });
  };

  const setConFactura = (con: boolean) => {
    const iva = con ? Math.round(Number(d.subtotal ?? 0) * IVA * 100) / 100 : 0;
    set({ con_factura: con, iva, folio: con ? d.folio : null });
  };

  const guardar = () => {
    if (!d.proveedor?.trim()) return setError('Falta el proveedor.');
    if (!d.concepto?.trim()) return setError('Falta el concepto.');
    if (!d.subtotal) return setError('Falta el subtotal.');
    if (d.con_factura && !d.folio?.trim()) return setError('Con factura necesitas el folio.');
    setError(null);

    startTransition(async () => {
      const res = await guardarGasto({
        id: d.id,
        fecha: d.fecha,
        proveedor: d.proveedor,
        concepto: d.concepto,
        folio: d.con_factura ? d.folio : null,
        subtotal: d.subtotal,
        iva: d.iva ?? 0,
        con_factura: d.con_factura,
        archivo_url: d.archivo_url || null,
        paquete_id: d.paquete_id || null,
        comunidad_id: d.comunidad_id || null,
      });
      if (res.ok) onClose();
      else setError(res.error ?? 'No se pudo guardar.');
    });
  };

  return (
    <Modal
      titulo={nuevo ? 'Nuevo gasto' : (d.proveedor ?? 'Gasto')}
      sub={nuevo ? 'Da de alta una factura o una nota de gasto' : d.folio ? `Folio ${d.folio}` : 'Sin factura'}
      icono="wallet"
      color="#FB923C"
      chip={
        !nuevo ? (
          <Pill
            texto={d.con_factura ? 'Con factura' : 'Sin factura'}
            color={d.con_factura ? '#16A34A' : '#9CA3AF'}
            dot={false}
          />
        ) : undefined
      }
      onClose={onClose}
      footer={
        <>
          <BtnGhost onClick={onClose}>Cancelar</BtnGhost>
          <BtnPrimario onClick={guardar} disabled={pending}>
            {pending ? 'Guardando…' : nuevo ? 'Registrar gasto' : 'Guardar cambios'}
          </BtnPrimario>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            ['Con factura', true],
            ['Sin factura (nota)', false],
          ].map(([label, val]) => (
            <button
              key={String(label)}
              onClick={() => setConFactura(val as boolean)}
              className="flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-bold transition"
              style={{
                borderColor: d.con_factura === val ? '#5B21B6' : '#E5E7EB',
                background: d.con_factura === val ? hexA('#5B21B6', 0.1) : '#fff',
                color: d.con_factura === val ? '#5B21B6' : '#6B7280',
              }}
            >
              <span
                className="h-3 w-3 rounded-full border-2"
                style={{
                  borderColor: d.con_factura === val ? '#5B21B6' : '#CBD5E1',
                  background: d.con_factura === val ? '#5B21B6' : '#fff',
                  boxShadow: d.con_factura === val ? 'inset 0 0 0 2px #fff' : 'none',
                }}
              />
              {label as string}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
          <Campo label="Fecha" icono="calendar" req>
            <input
              className={inputCls}
              type="date"
              value={d.fecha ?? ''}
              onChange={(e) => set({ fecha: e.target.value })}
            />
          </Campo>
          <Campo label="Proveedor" icono="bank" req>
            <input
              className={inputCls}
              value={d.proveedor ?? ''}
              onChange={(e) => set({ proveedor: e.target.value })}
              placeholder="Ej: Restaurante Marlen"
            />
          </Campo>
        </div>

        <Campo label="Concepto" icono="note" req>
          <input
            className={inputCls}
            value={d.concepto ?? ''}
            onChange={(e) => set({ concepto: e.target.value })}
            placeholder="Ej: Comida para grupo de 8 pax"
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Folio de factura" icono="ticket" req={d.con_factura}>
            <input
              className={`${inputCls} font-mono font-bold ${!d.con_factura ? 'bg-gray-50 text-gray-300' : 'text-[#5B21B6]'}`}
              value={d.folio ?? ''}
              disabled={!d.con_factura}
              onChange={(e) => set({ folio: e.target.value })}
              placeholder={d.con_factura ? 'A-1042' : 'Sin folio'}
            />
          </Campo>
          <Campo label="Comunidad" icono="mountain">
            <select
              className={inputCls}
              value={d.comunidad_id ?? ''}
              disabled={perfil.rol === 'comunidad'}
              onChange={(e) => set({ comunidad_id: e.target.value || null })}
            >
              <option value="">— Sin comunidad —</option>
              {comunidades.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            {perfil.rol === 'comunidad' && (
              <span className="mt-1 block text-[11px] text-gray-400">
                Sólo puedes registrar gastos de tu comunidad.
              </span>
            )}
          </Campo>
        </div>

        <Campo label="Paquete / salida" icono="clipboard">
          <select
            className={inputCls}
            value={d.paquete_id ?? ''}
            onChange={(e) => set({ paquete_id: e.target.value || null })}
          >
            <option value="">— Sin paquete —</option>
            {paquetes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </Campo>

        {/* Importes */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-wide text-gray-400">Importes</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Campo label="Subtotal" req>
              <input
                className={`${inputCls} font-bold`}
                type="number"
                step="0.01"
                value={d.subtotal || ''}
                onChange={(e) => setSubtotal(e.target.value)}
                placeholder="0.00"
              />
            </Campo>
            <Campo label={d.con_factura ? 'IVA (16%)' : 'IVA'}>
              <input
                className={`${inputCls} font-bold ${!d.con_factura ? 'bg-gray-100 text-gray-300' : ''}`}
                type="number"
                step="0.01"
                disabled={!d.con_factura}
                value={d.iva || ''}
                onChange={(e) => set({ iva: Number(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </Campo>
            <div>
              <span className="mb-1.5 block text-xs font-bold text-gray-700">Total</span>
              <div className="rounded-lg border-2 border-violet-200 bg-violet-50 px-3 py-2.5 text-right text-base font-extrabold text-[#5B21B6]">
                {dinero(total)}
              </div>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
            <Icono n="alert" s={11} c="#9CA3AF" />
            El total lo calcula la base de datos: subtotal + IVA.
          </p>
        </div>

        {/* El archivo del CFDI: es lo que sustenta el IVA acreditable */}
        <div>
          <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-700">
            <Icono n="paperclip" s={13} c="#9CA3AF" />
            {d.con_factura ? 'Archivo de la factura (PDF / XML)' : 'Foto de la nota'}
          </span>
          <SubirArchivo
            carpeta="gastos"
            valor={d.archivo_url ?? null}
            onSubido={(ruta) => set({ archivo_url: ruta })}
            etiqueta={
              d.con_factura ? 'Sube el PDF o el XML del CFDI' : 'Sube la foto del ticket o la nota'
            }
          />
          {d.con_factura && !d.archivo_url && (
            <p className="mt-1.5 text-[11px] font-semibold text-gray-400">
              Sin el archivo, el IVA de esta factura no tiene con qué sustentarse ante el SAT.
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
