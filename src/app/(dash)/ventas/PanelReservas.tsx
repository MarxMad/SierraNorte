'use client';

import { Icono, Pill, Barra, Avatar, Kpi, Vacio } from '@/components/ui';
import {
  type Reserva,
  STATUSES,
  COLOR_STATUS,
  COLOR_METODO,
  dinero,
  rango,
  colorPagado,
  hexA,
} from '@/lib/tipos';

// =====================================================================
// El tablero de reservas: en qué estado está cada grupo y cuánto ha
// pagado. Es la foto que antes había que armar leyendo la tabla fila
// por fila.
// =====================================================================
export default function PanelReservas({
  reservas,
  onAbrir,
}: {
  reservas: Reserva[];
  onAbrir: (r: Reserva) => void;
}) {
  const total = reservas.length;
  const pax = reservas.reduce((a, r) => a + r.personas, 0);
  const vendido = reservas.reduce((a, r) => a + Number(r.precio), 0);
  const cobrado = reservas.reduce((a, r) => a + Number(r.pagado ?? 0), 0);
  const porCobrar = vendido - cobrado;

  // Las que ya salieron no estorban: lo que importa es lo que falta cobrar
  const debiendo = reservas
    .filter((r) => Number(r.saldo ?? 0) > 0)
    .sort((a, b) => Number(b.saldo) - Number(a.saldo))
    .slice(0, 5);

  if (!total) return <Vacio titulo="Sin reservas todavía" icono="users" />;

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-3">
        <Kpi icono="users" label="Reservas" valor={`${total} · ${pax} pax`} color="#1F7D5E" />
        <Kpi icono="clipboard" label="Vendido" valor={dinero(vendido)} color="#6B7280" />
        <Kpi icono="wallet" label="Cobrado" valor={dinero(cobrado)} color="#16A34A" />
        <Kpi
          icono="clock"
          label="Por cobrar"
          valor={dinero(porCobrar)}
          color={porCobrar > 0 ? '#FB923C' : '#16A34A'}
        />
      </div>

      {/* ---------- El tablero, columna por estado ---------- */}
      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {STATUSES.map((s) => {
          const list = reservas.filter((r) => r.status === s);
          const paxCol = list.reduce((a, r) => a + r.personas, 0);
          const montoCol = list.reduce((a, r) => a + Number(r.precio), 0);
          const color = COLOR_STATUS[s];

          return (
            <div key={s} className="rounded-xl border border-gray-200 bg-gray-50">
              <div
                className="flex items-center gap-2 rounded-t-xl border-b border-gray-200 px-3 py-2.5"
                style={{ background: hexA(color, 0.08) }}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                <span className="text-sm font-extrabold" style={{ color }}>
                  {s}
                </span>
                <span className="flex-1" />
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold text-gray-500">
                  {list.length}
                </span>
              </div>

              <div className="px-3 py-2">
                <p className="text-[11px] font-bold text-gray-500">
                  {paxCol} pax · {dinero(montoCol)}
                </p>
              </div>

              <div className="max-h-[420px] space-y-2 overflow-y-auto px-2 pb-2">
                {list.length === 0 ? (
                  <p className="py-6 text-center text-[11px] font-semibold text-gray-400">
                    Sin reservas
                  </p>
                ) : (
                  list.map((r) => {
                    const pct = r.pagado_pct ?? 0;
                    return (
                      <button
                        key={r.id}
                        onClick={() => onAbrir(r)}
                        className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-left transition hover:shadow-md"
                        style={{ borderLeft: `4px solid ${color}` }}
                      >
                        <div className="mb-1.5 flex items-center gap-2">
                          <Avatar nombre={r.nombre} s={22} />
                          <span className="min-w-0 flex-1 truncate text-xs font-bold text-gray-900">
                            {r.nombre}
                          </span>
                          <span className="shrink-0 font-mono text-[9px] font-bold text-gray-400">
                            {r.codigo}
                          </span>
                        </div>

                        <p className="mb-1.5 truncate text-[11px] font-semibold text-gray-500">
                          {r.paquete ?? 'Sin paquete'}
                        </p>

                        <div className="mb-1.5 flex flex-wrap items-center gap-1">
                          {r.mixto ? (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold text-[#1F7D5E]">
                              MIXTO
                            </span>
                          ) : (
                            <Pill texto={r.metodo_pago} color={COLOR_METODO[r.metodo_pago]} />
                          )}
                          <span className="text-[10px] font-semibold text-gray-400">
                            {r.personas} pax
                          </span>
                          <span className="flex-1" />
                          <span className="text-[10px] font-bold text-gray-500">
                            {rango(r.fecha_inicio, r.fecha_fin)}
                          </span>
                        </div>

                        <div className="mb-1 flex items-center justify-between text-[10px] font-bold">
                          <span style={{ color: colorPagado(pct) }}>{pct}% pagado</span>
                          <span className="text-gray-900">{dinero(r.precio)}</span>
                        </div>
                        <Barra pct={pct} color={colorPagado(pct)} />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------- Lo que más urge cobrar ---------- */}
      {debiendo.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-2 border-b border-gray-100 bg-amber-50 px-4 py-2.5">
            <Icono n="alert" s={14} c="#B45309" />
            <span className="text-xs font-extrabold uppercase tracking-wide text-amber-800">
              Lo que más urge cobrar
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {debiendo.map((r) => (
              <button
                key={r.id}
                onClick={() => onAbrir(r)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-gray-50"
              >
                <Avatar nombre={r.nombre} s={24} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-gray-900">{r.nombre}</span>
                  <span className="block truncate text-[11px] text-gray-500">
                    {r.codigo} · {r.paquete ?? 'Sin paquete'}
                  </span>
                </span>
                <Pill texto={r.status} color={COLOR_STATUS[r.status]} />
                <span className="w-20 shrink-0 text-right">
                  <span className="block text-[10px] font-bold text-gray-400">Saldo</span>
                  <span className="block text-sm font-extrabold text-amber-600">
                    {dinero(r.saldo)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
