'use client';

import { Pill, Avatar } from '@/components/ui';
import { dinero, rango, COLOR_STATUS, COLOR_METODO, type Reserva } from '@/lib/tipos';

export default function TablaReservas({
  reservas,
  onAbrir,
}: {
  reservas: Reserva[];
  onAbrir: (r: Reserva) => void;
}) {
  return (
    <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[1100px] text-sm">
        <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase text-gray-500">
          <tr>
            <th className="px-3 py-2.5">Cliente</th>
            <th className="px-3 py-2.5">Estado</th>
            <th className="px-3 py-2.5">Agente</th>
            <th className="px-3 py-2.5">Pax</th>
            <th className="px-3 py-2.5">Nacionalidad</th>
            <th className="px-3 py-2.5">Paquete</th>
            <th className="px-3 py-2.5">Fecha</th>
            <th className="px-3 py-2.5">Fuente</th>
            <th className="px-3 py-2.5">Total</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map((r) => (
            <tr
              key={r.id}
              onClick={() => onAbrir(r)}
              className="cursor-pointer border-t border-gray-100 transition hover:bg-violet-50/40"
            >
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Avatar nombre={r.nombre} s={24} />
                  <div>
                    <p className="font-bold text-gray-900">{r.nombre}</p>
                    <p className="font-mono text-[10px] text-gray-400">{r.codigo}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2.5">
                <Pill texto={r.status} color={COLOR_STATUS[r.status]} solid />
              </td>
              <td className="px-3 py-2.5 text-xs font-semibold text-gray-600">{r.agente ?? '—'}</td>
              <td className="px-3 py-2.5 font-bold text-gray-800">{r.personas}</td>
              <td className="px-3 py-2.5 text-xs text-gray-600">{r.nacionalidad ?? '—'}</td>
              <td className="px-3 py-2.5 max-w-[180px] truncate text-xs font-semibold text-gray-600">
                {r.paquete ?? '—'}
              </td>
              <td className="px-3 py-2.5 text-xs text-gray-600">{rango(r.fecha_inicio, r.fecha_fin)}</td>
              <td className="px-3 py-2.5 text-[10px] font-bold uppercase text-gray-400">{r.fuente ?? '—'}</td>
              <td className="px-3 py-2.5">
                <span className="font-bold text-gray-900">{dinero(r.precio)}</span>
                <Pill texto={r.metodo_pago} color={COLOR_METODO[r.metodo_pago]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!reservas.length && (
        <p className="py-10 text-center text-sm font-semibold text-gray-400">Sin reservas</p>
      )}
    </div>
  );
}

export function exportarReservasCsv(reservas: Reserva[]) {
  const head = ['codigo', 'nombre', 'status', 'agente', 'personas', 'nacionalidad', 'paquete', 'fecha_inicio', 'precio', 'fuente'];
  const rows = reservas.map((r) =>
    [
      r.codigo,
      r.nombre,
      r.status,
      r.agente ?? '',
      r.personas,
      r.nacionalidad ?? '',
      r.paquete ?? '',
      r.fecha_inicio ?? '',
      r.precio,
      r.fuente ?? '',
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(',')
  );
  const blob = new Blob([[head.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ventas-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
