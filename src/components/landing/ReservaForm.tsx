'use client';

import { useState, useTransition, useEffect } from 'react';
import { Icono } from '@/components/ui';
import { solicitarReserva } from '@/app/acciones-web';
import { cupoRestantePublico } from '@/app/cupo-web';
import { hexA } from '@/lib/tipos';
import { dict, type Idioma } from '@/lib/i18n';

export default function ReservaForm({
  lang,
  paqueteId,
  paqueteNombre,
  precio,
  color,
  origenComunidadId,
  onClose,
}: {
  lang: Idioma;
  paqueteId: string;
  paqueteNombre: string;
  precio: number;
  color: string;
  origenComunidadId?: string | null;
  onClose: () => void;
}) {
  const d = dict(lang);
  const [datos, setDatos] = useState({
    nombre: '',
    email: '',
    telefono: '',
    personas: 2,
    ninos: false,
    numNinos: 0,
    fecha: '',
    notas: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [expiraAt, setExpiraAt] = useState<string | null>(null);
  const [cupoRestante, setCupoRestante] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!datos.fecha) {
      setCupoRestante(null);
      return;
    }
    cupoRestantePublico(paqueteId, datos.fecha).then((r) => setCupoRestante(r.restante));
  }, [paqueteId, datos.fecha]);

  const set = (p: Partial<typeof datos>) => setDatos((v) => ({ ...v, ...p }));
  const total = precio * datos.personas;

  const enviar = () => {
    setError(null);
    startTransition(async () => {
      const res = await solicitarReserva({ ...datos, paqueteId, lang, origenComunidadId });
      if (res.ok && res.codigo) {
        setCodigo(res.codigo);
        setExpiraAt(res.expiraAt ?? null);
      } else setError(res.error ?? 'No se pudo enviar la solicitud.');
    });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/60 p-4 py-10 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="h-1.5" style={{ background: color }} />

        {/* ---------- Confirmación ---------- */}
        {codigo ? (
          <div className="px-8 py-12 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
              <Icono n="checkCircle" s={32} c="#16A34A" />
            </span>
            <h2 className="mt-5 text-2xl font-extrabold text-gray-900">{d.formOkTitulo}</h2>
            <p className="mt-2 text-gray-500">{d.formOkSub(datos.email)}</p>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                {d.formCodigo}
              </p>
              <p className="mt-1 font-mono text-2xl font-extrabold text-[#5B21B6]">{codigo}</p>
            </div>

            {expiraAt && (
              <p className="mt-4 text-sm font-semibold text-amber-800">
                {d.formApartadoExpira(new Date(expiraAt).toLocaleString(lang === 'en' ? 'en-US' : 'es-MX'))}
              </p>
            )}

            <button
              onClick={onClose}
              className="mt-7 w-full rounded-xl px-5 py-3.5 text-sm font-bold text-white"
              style={{ background: color }}
            >
              {d.formListo}
            </button>
          </div>
        ) : (
          <>
            {/* ---------- Formulario ---------- */}
            <div className="flex items-start gap-3 border-b border-gray-100 px-6 py-5">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-extrabold text-gray-900">{d.formTitulo}</h2>
                <p className="mt-0.5 truncate text-sm text-gray-500">{paqueteNombre}</p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 transition hover:bg-gray-200"
              >
                <Icono n="close" s={16} c="#6B7280" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <Campo label={d.formNombre} req>
                <input
                  className={input}
                  value={datos.nombre}
                  onChange={(e) => set({ nombre: e.target.value })}
                  placeholder={d.formNombrePh}
                />
              </Campo>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label={d.formCorreo} req>
                  <input
                    className={input}
                    type="email"
                    value={datos.email}
                    onChange={(e) => set({ email: e.target.value })}
                    placeholder="tu@correo.com"
                  />
                </Campo>
                <Campo label={d.formTel}>
                  <input
                    className={input}
                    value={datos.telefono}
                    onChange={(e) => set({ telefono: e.target.value })}
                    placeholder="951 000 0000"
                  />
                </Campo>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label={d.formPersonas} req>
                  <input
                    className={input}
                    type="number"
                    min={1}
                    max={30}
                    value={datos.personas}
                    onChange={(e) =>
                      set({ personas: Math.max(1, Math.min(30, Number(e.target.value) || 1)) })
                    }
                  />
                </Campo>
                <Campo label={d.formFecha} req>
                  <input
                    className={input}
                    type="date"
                    required
                    value={datos.fecha}
                    onChange={(e) => set({ fecha: e.target.value })}
                  />
                  {cupoRestante !== null && datos.fecha && (
                    <p className="mt-1 text-[11px] font-semibold text-gray-500">
                      {d.formCupoRestante(cupoRestante)}
                    </p>
                  )}
                </Campo>
              </div>

              {/* Niños */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <p className="mb-2.5 text-xs font-bold text-gray-700">{d.formNinos}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Opcion
                    activa={!datos.ninos}
                    color="#6B7280"
                    onClick={() => set({ ninos: false, numNinos: 0 })}
                  >
                    {d.formNo}
                  </Opcion>
                  <Opcion
                    activa={datos.ninos}
                    color="#B45309"
                    onClick={() => set({ ninos: true, numNinos: datos.numNinos || 1 })}
                  >
                    {d.formSi}
                  </Opcion>
                  {datos.ninos && (
                    <input
                      type="number"
                      min={1}
                      max={datos.personas}
                      value={datos.numNinos}
                      onChange={(e) =>
                        set({
                          numNinos: Math.max(1, Math.min(datos.personas, Number(e.target.value) || 1)),
                        })
                      }
                      className="w-20 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800 outline-none"
                    />
                  )}
                </div>
                {datos.ninos && (
                  <p className="mt-2 text-[11px] font-semibold text-amber-700">
                    {d.formNinosNota}
                  </p>
                )}
              </div>

              <Campo label={d.formNotas}>
                <textarea
                  className={`${input} min-h-20 resize-y`}
                  value={datos.notas}
                  onChange={(e) => set({ notas: e.target.value })}
                  placeholder={d.formNotasPh}
                />
              </Campo>

              {precio > 0 && (
                <div className="flex items-center justify-between rounded-xl border px-4 py-3.5"
                  style={{ background: hexA(color, 0.06), borderColor: hexA(color, 0.25) }}
                >
                  <span className="text-sm font-semibold text-gray-600">
                    {datos.personas} × ${precio.toLocaleString('es-MX')}
                  </span>
                  <span className="text-lg font-extrabold" style={{ color }}>
                    ${total.toLocaleString('es-MX')}
                  </span>
                </div>
              )}

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <button
                onClick={enviar}
                disabled={pending}
                className="w-full rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
                style={{ background: color }}
              >
                {pending ? d.formEnviando : d.formEnviar}
              </button>

              <p className="text-center text-[11px] leading-relaxed text-gray-400">
                {d.formLegal}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const input =
  'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#1F7D5E] focus:ring-2 focus:ring-[#1F7D5E]/15';

function Campo({
  label,
  req,
  children,
}: {
  label: string;
  req?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-gray-700">
        {label}
        {req && <span className="ml-0.5 text-red-600">*</span>}
      </span>
      {children}
    </label>
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
      className="flex items-center gap-2 rounded-lg border-2 px-3.5 py-2 text-xs font-bold transition"
      style={{
        borderColor: activa ? color : '#E5E7EB',
        background: activa ? hexA(color, 0.1) : '#fff',
        color: activa ? color : '#6B7280',
      }}
    >
      <span
        className="h-3 w-3 rounded-full border-2"
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
