'use client';

import { useEffect, useState, useTransition } from 'react';
import { Modal, Campo, inputCls, BtnPrimario, BtnGhost, Pill, Icono } from '@/components/ui';
import { guardarPaqueteCompleto, cargarPaquete } from '@/app/acciones';
import {
  type Paquete,
  type Comunidad,
  type DiaItinerario,
  type ItemItinerario,
  type ComedorPaquete,
  type TipoLiquidacion,
  type TipoComida,
  TIPOS_LIQUIDACION,
  TIPOS_COMIDA,
  COLOR_STATUS,
  COLOR_DURACION,
  COLOR_LIQ,
  dinero,
  hexA,
} from '@/lib/tipos';

const DURACIONES = ['1 día', '2 días', '3 días', '4 días', '5 días', '7 días', 'Servicios'];

// Cuántos días de itinerario implica cada duración
const DIAS_DE: Record<string, number> = {
  '1 día': 1,
  '2 días': 2,
  '3 días': 3,
  '4 días': 4,
  '5 días': 5,
  '7 días': 7,
  Servicios: 0,
};

const SECCIONES = [
  { id: 'general', label: 'General', icono: 'clipboard' },
  { id: 'comunidades', label: 'Comunidades', icono: 'mountain' },
  { id: 'itinerario', label: 'Itinerario', icono: 'route' },
  { id: 'comedores', label: 'Comedores', icono: 'utensils' },
] as const;

type Seccion = (typeof SECCIONES)[number]['id'];

export default function PaqueteModal({
  paquete,
  comunidades,
  onClose,
}: {
  paquete: Partial<Paquete>;
  comunidades: Comunidad[];
  onClose: () => void;
}) {
  const nuevo = !paquete.id;

  const [sec, setSec] = useState<Seccion>('general');
  const [d, setD] = useState<Partial<Paquete>>({
    duracion: '1 día',
    precio: 0,
    anfitrion_monto: 0,
    transporte_monto: 0,
    transporte_tipo: 'Van',
    anfitrion_idiomas: 'Español / Inglés',
    ...paquete,
  });
  const [coms, setComs] = useState<string[]>([]);
  const [dias, setDias] = useState<DiaItinerario[]>([]);
  const [comedores, setComedores] = useState<ComedorPaquete[]>([]);
  const [cargando, setCargando] = useState(!nuevo);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (patch: Partial<Paquete>) => setD((v) => ({ ...v, ...patch }));

  // Al editar, se trae el itinerario y los comedores que ya existen
  useEffect(() => {
    if (nuevo || !paquete.id) return;
    let vivo = true;
    cargarPaquete(paquete.id).then((r) => {
      if (!vivo) return;
      if (r.detalle) {
        setComs(r.detalle.comunidades_ids ?? []);
        setDias(r.detalle.dias ?? []);
        setComedores(r.detalle.comedores ?? []);
      }
      setCargando(false);
    });
    return () => {
      vivo = false;
    };
  }, [nuevo, paquete.id]);

  // ---------------------------------------------------------------
  // Itinerario
  // ---------------------------------------------------------------
  const nDias = DIAS_DE[d.duracion ?? '1 día'] ?? 1;

  // Ajusta los días del itinerario a la duración elegida, sin perder lo capturado
  const sincronizarDias = () => {
    setDias((prev) => {
      const out: DiaItinerario[] = [];
      for (let n = 1; n <= nDias; n++) {
        out.push(prev.find((x) => x.dia === n) ?? { dia: n, recorrido: '', items: [] });
      }
      return out;
    });
  };

  const setDia = (dia: number, patch: Partial<DiaItinerario>) =>
    setDias((prev) => prev.map((x) => (x.dia === dia ? { ...x, ...patch } : x)));

  const addItem = (dia: number) =>
    setDia(dia, {
      items: [
        ...(dias.find((x) => x.dia === dia)?.items ?? []),
        {
          orden: (dias.find((x) => x.dia === dia)?.items.length ?? 0) + 1,
          texto: '',
          tipo: 'Sendero',
          comunidad_id: coms[0] ?? null,
          monto: 0,
          por_persona: false,
        },
      ],
    });

  const setItem = (dia: number, i: number, patch: Partial<ItemItinerario>) => {
    const day = dias.find((x) => x.dia === dia);
    if (!day) return;
    setDia(dia, { items: day.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  };

  const quitarItem = (dia: number, i: number) => {
    const day = dias.find((x) => x.dia === dia);
    if (!day) return;
    setDia(dia, { items: day.items.filter((_, j) => j !== i) });
  };

  // ---------------------------------------------------------------
  // Comedores
  // ---------------------------------------------------------------
  const addComedor = () =>
    setComedores((p) => [
      ...p,
      {
        dia: 1,
        comunidad_id: coms[0] ?? null,
        nombre: '',
        tipo: 'Comida',
        monto_por_persona: 0,
      },
    ]);

  const setComedor = (i: number, patch: Partial<ComedorPaquete>) =>
    setComedores((p) => p.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const quitarComedor = (i: number) => setComedores((p) => p.filter((_, j) => j !== i));

  // ---------------------------------------------------------------
  // Lo que este paquete le va a costar a la cooperativa
  // ---------------------------------------------------------------
  const costoItinerario = dias.reduce(
    (a, dia) => a + dia.items.reduce((b, it) => b + (it.tipo ? Number(it.monto) || 0 : 0), 0),
    0
  );
  const costoComedores = comedores.reduce((a, c) => a + (Number(c.monto_por_persona) || 0), 0);
  const sinMonto =
    dias.reduce((a, dia) => a + dia.items.filter((it) => it.tipo && !it.monto).length, 0) +
    comedores.filter((c) => !c.monto_por_persona).length;

  // ---------------------------------------------------------------
  const guardar = () => {
    if (!d.nombre?.trim()) {
      setSec('general');
      return setError('Falta el nombre del paquete.');
    }
    if (coms.length === 0) {
      setSec('comunidades');
      return setError('Elige al menos una comunidad: sin eso el paquete no aparece en Comunidades ni se le siembra el checklist.');
    }
    const itemSinTexto = dias.some((dia) => dia.items.some((it) => !it.texto.trim()));
    if (itemSinTexto) {
      setSec('itinerario');
      return setError('Hay un item del itinerario sin descripción.');
    }
    if (comedores.some((c) => !c.nombre.trim())) {
      setSec('comedores');
      return setError('Hay un comedor sin nombre.');
    }
    setError(null);

    startTransition(async () => {
      const res = await guardarPaqueteCompleto(
        {
          id: d.id ?? `p${Date.now()}`,
          nombre: d.nombre,
          duracion: d.duracion,
          descripcion: d.descripcion || null,
          precio: d.precio ?? 0,
          fecha_inicio: d.fecha_inicio || null,
          fecha_fin: d.fecha_fin || null,
          anfitrion_nombre: d.anfitrion_nombre || null,
          anfitrion_idiomas: d.anfitrion_idiomas || null,
          anfitrion_monto: d.anfitrion_monto ?? 0,
          transporte_proveedor: d.transporte_proveedor || null,
          transporte_tipo: d.transporte_tipo || null,
          transporte_ruta: d.transporte_ruta || null,
          transporte_monto: d.transporte_monto ?? 0,
        },
        coms,
        dias.map((dia) => ({
          ...dia,
          items: dia.items.map((it, i) => ({ ...it, orden: i + 1 })),
        })),
        comedores
      );
      if (res.ok) onClose();
      else setError(res.error ?? 'No se pudo guardar.');
    });
  };

  return (
    <Modal
      titulo={nuevo ? 'Nuevo paquete' : (d.nombre ?? 'Paquete')}
      sub={
        nuevo
          ? 'Todo lo que captures aquí es lo que va a liquidarse después'
          : `${d.duracion} · ${coms.length} comunidades · ${d.pax ?? 0} pax`
      }
      icono="clipboard"
      color={COLOR_DURACION[d.duracion ?? '1 día']}
      chip={!nuevo && d.status ? <Pill texto={d.status} color={COLOR_STATUS[d.status]} solid /> : undefined}
      onClose={onClose}
      footer={
        <>
          <span className="mr-auto text-xs font-bold text-gray-500">
            Costo capturado:{' '}
            <b className="text-gray-900">{dinero(costoItinerario + Number(d.transporte_monto ?? 0) + Number(d.anfitrion_monto ?? 0))}</b>
            <span className="ml-1 font-semibold text-gray-400">
              + {dinero(costoComedores)}/persona en comedores
            </span>
          </span>
          <BtnGhost onClick={onClose}>Cancelar</BtnGhost>
          <BtnPrimario onClick={guardar} disabled={pending || cargando}>
            {pending ? 'Guardando…' : nuevo ? 'Crear paquete' : 'Guardar cambios'}
          </BtnPrimario>
        </>
      }
    >
      {/* Secciones */}
      <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1">
        {SECCIONES.map((s) => {
          const activa = sec === s.id;
          const falta =
            (s.id === 'comunidades' && coms.length === 0) ||
            (s.id === 'itinerario' && d.duracion !== 'Servicios' && dias.every((x) => !x.items.length));
          return (
            <button
              key={s.id}
              onClick={() => {
                if (s.id === 'itinerario') sincronizarDias();
                setSec(s.id);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
                activa ? 'bg-white text-[#5B21B6] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icono n={s.icono} s={13} c={activa ? '#5B21B6' : '#9CA3AF'} />
              {s.label}
              {falta && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
            </button>
          );
        })}
      </div>

      {cargando ? (
        <p className="py-10 text-center text-sm font-semibold text-gray-400">Cargando el paquete…</p>
      ) : (
        <div className="space-y-4">
          {/* ================= GENERAL ================= */}
          {sec === 'general' && (
            <>
              <Campo label="Nombre del paquete" icono="clipboard" req>
                <input
                  className={inputCls}
                  value={d.nombre ?? ''}
                  onChange={(e) => set({ nombre: e.target.value })}
                  placeholder="Ej: Cañón del Coyote"
                />
              </Campo>

              <Campo label="Descripción" icono="note">
                <textarea
                  className={`${inputCls} min-h-16 resize-y`}
                  value={d.descripcion ?? ''}
                  onChange={(e) => set({ descripcion: e.target.value })}
                  placeholder="Lo que verá el turista en el sitio"
                />
              </Campo>

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

              {/* El status ya no se captura: un paquete es catálogo. El que
                  avanza de estado es el grupo que sale, no la ficha. */}
              <p className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-600">
                <Icono n="alert" s={14} c="#9CA3AF" />
                El status no se captura aquí: sale solo de las reservas. Mientras alguna siga en
                Planeación, la salida no se da por confirmada.
                {!nuevo && d.status && (
                  <span className="ml-auto shrink-0">
                    <Pill texto={d.status} color={COLOR_STATUS[d.status]} solid />
                  </span>
                )}
              </p>

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
                  <Campo label="Costo total">
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
            </>
          )}

          {/* ================= COMUNIDADES ================= */}
          {sec === 'comunidades' && (
            <>
              <p className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-800">
                Elige los pueblos por los que pasa el tour, <b>en orden de visita</b>. De aquí sale el
                tramo que ve cada comunidad y el checklist que tiene que confirmar.
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {comunidades.map((c) => {
                  const i = coms.indexOf(c.id);
                  const activa = i >= 0;
                  return (
                    <button
                      key={c.id}
                      onClick={() =>
                        setComs((prev) =>
                          activa ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                        )
                      }
                      className="flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left transition"
                      style={{
                        borderColor: activa ? c.color : '#E5E7EB',
                        background: activa ? hexA(c.color, 0.08) : '#fff',
                      }}
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold text-white"
                        style={{ background: activa ? c.color : '#D1D5DB' }}
                      >
                        {activa ? i + 1 : ''}
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: activa ? c.color : '#6B7280' }}
                      >
                        {c.nombre}
                      </span>
                    </button>
                  );
                })}
              </div>

              {coms.length === 0 && (
                <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800">
                  <Icono n="alert" s={14} c="#B45309" />
                  Sin comunidades, este paquete no le aparece a nadie en Comunidades y no se le
                  siembra ningún checklist.
                </p>
              )}
            </>
          )}

          {/* ================= ITINERARIO ================= */}
          {sec === 'itinerario' && (
            <>
              {d.duracion === 'Servicios' ? (
                <p className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-600">
                  Los paquetes de tipo «Servicios» se venden sueltos: no llevan itinerario por días.
                </p>
              ) : (
                <>
                  <p className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-800">
                    Cada item con <b>tipo</b> se convierte en un concepto de la Liquidación. Los que
                    no llevan tipo (traslados, tiempo libre) no se liquidan.
                  </p>

                  {dias.map((dia) => (
                    <div key={dia.dia} className="rounded-xl border border-gray-200 bg-white">
                      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-3 py-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5B21B6] text-xs font-extrabold text-white">
                          D{dia.dia}
                        </span>
                        <input
                          className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-[#5B21B6]"
                          value={dia.recorrido}
                          onChange={(e) => setDia(dia.dia, { recorrido: e.target.value })}
                          placeholder="Ej: Benito Juárez → La Nevería"
                        />
                        <button
                          onClick={() => addItem(dia.dia)}
                          className="flex shrink-0 items-center gap-1 rounded-lg bg-[#5B21B6] px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#4C1D95]"
                        >
                          <Icono n="plus" s={12} c="#fff" />
                          Item
                        </button>
                      </div>

                      {dia.items.length === 0 ? (
                        <p className="px-3 py-4 text-center text-xs font-semibold text-gray-400">
                          Sin actividades este día
                        </p>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {dia.items.map((it, i) => (
                            <div key={i} className="space-y-2 px-3 py-2.5">
                              <div className="flex gap-2">
                                <input
                                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#5B21B6]"
                                  value={it.texto}
                                  onChange={(e) => setItem(dia.dia, i, { texto: e.target.value })}
                                  placeholder="Ej: Sendero El Calvario · 8 km · 3 h"
                                />
                                <button
                                  onClick={() => quitarItem(dia.dia, i)}
                                  title="Quitar"
                                  className="shrink-0 rounded-lg px-2 transition hover:bg-red-50"
                                >
                                  <Icono n="trash" s={13} c="#DC2626" />
                                </button>
                              </div>

                              <div className="grid gap-2 sm:grid-cols-4">
                                <select
                                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] font-bold outline-none"
                                  style={{ color: it.tipo ? COLOR_LIQ[it.tipo] : '#9CA3AF' }}
                                  value={it.tipo ?? ''}
                                  onChange={(e) =>
                                    setItem(dia.dia, i, {
                                      tipo: (e.target.value || null) as TipoLiquidacion | null,
                                    })
                                  }
                                >
                                  <option value="">No se liquida</option>
                                  {TIPOS_LIQUIDACION.map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>

                                <select
                                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] font-semibold outline-none"
                                  value={it.comunidad_id ?? ''}
                                  onChange={(e) =>
                                    setItem(dia.dia, i, { comunidad_id: e.target.value || null })
                                  }
                                >
                                  <option value="">— Sin comunidad —</option>
                                  {comunidades
                                    .filter((c) => coms.includes(c.id))
                                    .map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.nombre}
                                      </option>
                                    ))}
                                </select>

                                <input
                                  type="number"
                                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] font-bold outline-none disabled:bg-gray-50 disabled:text-gray-300"
                                  disabled={!it.tipo}
                                  value={it.monto || ''}
                                  onChange={(e) =>
                                    setItem(dia.dia, i, { monto: Number(e.target.value) || 0 })
                                  }
                                  placeholder="Monto"
                                />

                                <button
                                  onClick={() => setItem(dia.dia, i, { por_persona: !it.por_persona })}
                                  disabled={!it.tipo}
                                  className="rounded-lg border-2 px-2 py-1.5 text-[11px] font-bold transition disabled:opacity-40"
                                  style={{
                                    borderColor: it.por_persona ? '#B45309' : '#E5E7EB',
                                    background: it.por_persona ? hexA('#B45309', 0.1) : '#fff',
                                    color: it.por_persona ? '#B45309' : '#6B7280',
                                  }}
                                >
                                  {it.por_persona ? 'Por persona' : 'Monto fijo'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {/* ================= COMEDORES ================= */}
          {sec === 'comedores' && (
            <>
              <div className="flex items-center gap-3">
                <p className="flex-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800">
                  Los comedores se liquidan <b>directo al prestador</b> y el monto es{' '}
                  <b>por persona</b>: se multiplica por los pax reales de la salida.
                </p>
                <button
                  onClick={addComedor}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#5B21B6] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#4C1D95]"
                >
                  <Icono n="plus" s={13} c="#fff" />
                  Comedor
                </button>
              </div>

              {comedores.length === 0 ? (
                <p className="py-8 text-center text-xs font-semibold text-gray-400">
                  Sin comedores. Si el tour incluye comidas, agrégalas aquí o no se le pagarán a la
                  comunidad.
                </p>
              ) : (
                <div className="space-y-2">
                  {comedores.map((c, i) => (
                    <div
                      key={i}
                      className="grid gap-2 rounded-xl border border-gray-200 bg-white p-3 sm:grid-cols-[60px_1fr_120px_1fr_110px_36px]"
                    >
                      <select
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] font-bold outline-none"
                        value={c.dia}
                        onChange={(e) => setComedor(i, { dia: Number(e.target.value) })}
                      >
                        {Array.from({ length: Math.max(nDias, 1) }, (_, n) => n + 1).map((n) => (
                          <option key={n} value={n}>
                            D{n}
                          </option>
                        ))}
                      </select>

                      <input
                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#5B21B6]"
                        value={c.nombre}
                        onChange={(e) => setComedor(i, { nombre: e.target.value })}
                        placeholder="Ej: Restaurante Marlen"
                      />

                      <select
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] font-semibold outline-none"
                        value={c.tipo}
                        onChange={(e) => setComedor(i, { tipo: e.target.value as TipoComida })}
                      >
                        {TIPOS_COMIDA.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>

                      <select
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] font-semibold outline-none"
                        value={c.comunidad_id ?? ''}
                        onChange={(e) => setComedor(i, { comunidad_id: e.target.value || null })}
                      >
                        <option value="">— Sin comunidad —</option>
                        {comunidades
                          .filter((x) => coms.includes(x.id))
                          .map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.nombre}
                            </option>
                          ))}
                      </select>

                      <input
                        type="number"
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] font-bold outline-none"
                        value={c.monto_por_persona || ''}
                        onChange={(e) =>
                          setComedor(i, { monto_por_persona: Number(e.target.value) || 0 })
                        }
                        placeholder="$/pax"
                      />

                      <button
                        onClick={() => quitarComedor(i)}
                        title="Quitar"
                        className="rounded-lg transition hover:bg-red-50"
                      >
                        <Icono n="trash" s={13} c="#DC2626" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {sinMonto > 0 && (
            <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800">
              <Icono n="alert" s={14} c="#B45309" />
              {sinMonto} concepto{sinMonto > 1 ? 's' : ''} sin monto. Aparecerá en la Liquidación en
              $0 hasta que se capture.
            </p>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
