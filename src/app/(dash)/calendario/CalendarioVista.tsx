'use client';

import { useState } from 'react';
import Encabezado from '@/components/Encabezado';
import { Icono, Vacio } from '@/components/ui';
import { type VentaLiquidacion, COLOR_DURACION, hexA } from '@/lib/tipos';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function CalendarioVista({ salidas }: { salidas: VentaLiquidacion[] }) {
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());

  const primero = new Date(anio, mes, 1);
  const nDias = new Date(anio, mes + 1, 0).getDate();
  const inicioDow = (primero.getDay() + 6) % 7; // lunes = 0

  // Salidas que tocan este mes
  const delMes = salidas.filter((s) => {
    const ini = new Date(s.fecha_inicio + 'T12:00:00');
    const fin = new Date((s.fecha_fin ?? s.fecha_inicio) + 'T12:00:00');
    return (
      (ini.getFullYear() === anio && ini.getMonth() === mes) ||
      (fin.getFullYear() === anio && fin.getMonth() === mes)
    );
  });

  // Índice por día
  const porDia: Record<number, { s: VentaLiquidacion; ini: boolean }[]> = {};
  delMes.forEach((s) => {
    const ini = new Date(s.fecha_inicio + 'T12:00:00');
    const fin = new Date((s.fecha_fin ?? s.fecha_inicio) + 'T12:00:00');
    const desde = ini.getMonth() === mes ? ini.getDate() : 1;
    const hasta = fin.getMonth() === mes ? fin.getDate() : nDias;
    for (let d = desde; d <= hasta; d++) {
      (porDia[d] ||= []).push({ s, ini: d === desde && ini.getMonth() === mes });
    }
  });

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

  const totalPax = delMes.reduce((a, s) => a + s.pax, 0);

  return (
    <>
      <Encabezado titulo="Calendario" sub="Salidas programadas" />

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
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-[#5B21B6] transition hover:bg-gray-50"
          >
            Hoy
          </button>
          <span className="text-xs font-bold text-gray-500">
            {delMes.length} salidas · {totalPax} pax
          </span>
          <div className="flex-1" />
          <div className="flex flex-wrap gap-2">
            {Object.entries(COLOR_DURACION).map(([k, c]) => (
              <span key={k} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                <span className="h-2 w-2 rounded-sm" style={{ background: c }} />
                {k}
              </span>
            ))}
          </div>
        </div>

        {delMes.length === 0 ? (
          <Vacio
            titulo={`Sin salidas en ${MESES[mes]}`}
            sub="Asigna fechas a un paquete para verlo aquí."
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
                              ? 'bg-[#5B21B6] text-white'
                              : finde
                                ? 'text-gray-300'
                                : 'text-gray-600'
                          }`}
                        >
                          {d}
                        </span>
                        {evs.length > 0 && (
                          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-extrabold text-gray-500">
                            {evs.reduce((a, e) => a + e.s.pax, 0)} pax
                          </span>
                        )}
                      </div>
                    )}
                    <div className="space-y-1">
                      {evs.slice(0, 3).map((e, j) => {
                        const c = COLOR_DURACION[e.s.duracion];
                        return (
                          <div
                            key={j}
                            title={`${e.s.paquete} · ${e.s.pax} pax`}
                            className="truncate rounded px-1.5 py-0.5 text-[10px] font-bold"
                            style={{
                              background: e.ini ? c : hexA(c, 0.16),
                              color: e.ini ? '#fff' : c,
                              borderLeft: e.ini ? 'none' : `3px solid ${c}`,
                            }}
                          >
                            {e.ini ? e.s.paquete : `↳ ${e.s.paquete}`}
                          </div>
                        );
                      })}
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
