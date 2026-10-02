'use client';

import { useState } from 'react';
import Encabezado from '@/components/Encabezado';
import { Icono, Vacio } from '@/components/ui';
import { type EventoCalendario, COLOR_DURACION, hexA } from '@/lib/tipos';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const dia = (f: string) => new Date(f + 'T12:00:00');

export default function CalendarioVista({ eventos }: { eventos: EventoCalendario[] }) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [soloReservas, setSoloReservas] = useState(false);

  const primero = new Date(anio, mes, 1);
  const nDias = new Date(anio, mes + 1, 0).getDate();
  const inicioDow = (primero.getDay() + 6) % 7; // lunes = 0

  const visibles = soloReservas ? eventos.filter((e) => e.tipo === 'reserva') : eventos;

  // Eventos que tocan este mes
  const delMes = visibles.filter((e) => {
    const ini = dia(e.fecha_inicio);
    const fin = dia(e.fecha_fin ?? e.fecha_inicio);
    return (
      (ini.getFullYear() === anio && ini.getMonth() === mes) ||
      (fin.getFullYear() === anio && fin.getMonth() === mes)
    );
  });

  // Índice por día del mes
  const porDia: Record<number, { e: EventoCalendario; ini: boolean }[]> = {};
  delMes.forEach((e) => {
    const ini = dia(e.fecha_inicio);
    const fin = dia(e.fecha_fin ?? e.fecha_inicio);
    const desde = ini.getMonth() === mes ? ini.getDate() : 1;
    const hasta = fin.getMonth() === mes ? fin.getDate() : nDias;
    for (let d = desde; d <= hasta; d++) {
      (porDia[d] ||= []).push({ e, ini: d === desde && ini.getMonth() === mes });
    }
  });
  // Primero la salida, luego las reservas que cuelgan de ella
  const peso = (e: EventoCalendario) => (e.tipo === 'salida' ? 0 : 1);
  Object.values(porDia).forEach((l) => l.sort((a, b) => peso(a.e) - peso(b.e)));

  const celdas: (number | null)[] = [
    ...Array(inicioDow).fill(null),
    ...Array.from({ length: nDias }, (_, i) => i + 1),
  ];
  while (celdas.length % 7) celdas.push(null);

  const navegar = (delta: number) => {
    let m = mes + delta;
    let a = anio;
    if (m > 11) { m = 0; a++; }
    if (m < 0) { m = 11; a--; }
    setMes(m);
    setAnio(a);
  };

  const esHoy = (d: number) =>
    d === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear();

  const salidas = delMes.filter((e) => e.tipo === 'salida').length;
  const reservas = delMes.filter((e) => e.tipo === 'reserva');
  const paxReservas = reservas.reduce((a, e) => a + e.pax, 0);

  return (
    <>
      <Encabezado titulo="Calendario" sub="Salidas programadas y reservas" />

      <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => navegar(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white transition hover:bg-gray-50"
          >
            <span className="rotate-180">
              <Icono n="chevron" s={14} c="#4B5563" />
            </span>
          </button>
          <span className="min-w-40 text-lg font-extrabold text-gray-900">
            {MESES[mes]} {anio}
          </span>
          <button
            onClick={() => navegar(1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white transition hover:bg-gray-50"
          >
            <Icono n="chevron" s={14} c="#4B5563" />
          </button>
          <button
            onClick={() => { setMes(hoy.getMonth()); setAnio(hoy.getFullYear()); }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-[#1F7D5E] transition hover:bg-gray-50"
          >
            Hoy
          </button>

          <button
            onClick={() => setSoloReservas((v) => !v)}
            className="rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition"
            style={{
              borderColor: soloReservas ? '#1F7D5E' : '#E5E7EB',
              background: soloReservas ? hexA('#1F7D5E', 0.1) : '#fff',
              color: soloReservas ? '#1F7D5E' : '#6B7280',
            }}
          >
            Sólo reservas
          </button>

          <span className="text-xs font-bold text-gray-500">
            {salidas} salidas · {reservas.length} reservas · {paxReservas} pax
          </span>

          <div className="flex-1" />
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(COLOR_DURACION).map(([k, c]) => (
              <span key={k} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                <span className="h-2 w-2 rounded-sm" style={{ background: c }} />
                {k}
              </span>
            ))}
            <span className="ml-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
              <span
                className="h-2 w-2 rounded-sm border-2 border-dashed"
                style={{ borderColor: '#1F7D5E' }}
              />
              Reserva
            </span>
          </div>
        </div>

        {delMes.length === 0 ? (
          <Vacio
            titulo={`Sin nada agendado en ${MESES[mes]}`}
            sub="Las reservas aparecen aquí con sus propias fechas en cuanto se crean."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {DIAS.map((d, i) => (
                <div
                  key={d}
                  className={`px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide ${
                    i > 4 ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {celdas.map((d, i) => {
                const evs = d ? (porDia[d] ?? []) : [];
                const finde = i % 7 > 4;
                const pax = evs.filter((x) => x.e.tipo === 'reserva').reduce((a, x) => a + x.e.pax, 0);

                return (
                  <div
                    key={i}
                    className={`min-h-28 border-b border-r border-gray-100 p-2 ${
                      !d ? 'bg-gray-50/60' : finde ? 'bg-gray-50/30' : 'bg-white'
                    }`}
                  >
                    {d && (
                      <div className="mb-1.5 flex items-center justify-between">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            esHoy(d)
                              ? 'bg-[#1F7D5E] text-white'
                              : finde
                                ? 'text-gray-300'
                                : 'text-gray-600'
                          }`}
                        >
                          {d}
                        </span>
                        {pax > 0 && (
                          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-extrabold text-gray-500">
                            {pax} pax
                          </span>
                        )}
                      </div>
                    )}
                    <div className="space-y-1">
                      {evs.slice(0, 3).map(({ e, ini }, j) => (
                        <Evento key={j} e={e} ini={ini} />
                      ))}
                      {evs.length > 3 && (
                        <span className="pl-1 text-[10px] font-bold text-gray-400">
                          +{evs.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// La salida se pinta sólida; la reserva cuelga de ella, con línea punteada
// y el nombre del cliente.
function Evento({ e, ini }: { e: EventoCalendario; ini: boolean }) {
  const c = COLOR_DURACION[e.duracion] ?? '#6B7280';

  if (e.tipo === 'reserva') {
    return (
      <div
        title={`${e.codigo} · ${e.titulo} · ${e.pax} pax · ${e.paquete ?? 'Sin paquete'}${
          e.metodo_pago ? ` · ${e.metodo_pago}` : ''
        }`}
        className="truncate rounded border border-dashed px-1.5 py-0.5 text-[10px] font-bold"
        style={{ borderColor: c, background: hexA(c, 0.06), color: c }}
      >
        {ini ? `${e.titulo} · ${e.pax}p` : `↳ ${e.titulo}`}
      </div>
    );
  }

  return (
    <div
      title={`${e.titulo} · ${e.pax} pax`}
      className="truncate rounded px-1.5 py-0.5 text-[10px] font-bold"
      style={{
        background: ini ? c : hexA(c, 0.16),
        color: ini ? '#fff' : c,
        borderLeft: ini ? 'none' : `3px solid ${c}`,
      }}
    >
      {ini ? e.titulo : `↳ ${e.titulo}`}
    </div>
  );
}
