'use client';

import { Pill, Vacio } from '@/components/ui';
import { dinero, rango, COLOR_STATUS, type TransporteSalida } from '@/lib/tipos';

export default function VentasTransportes({ filas }: { filas: TransporteSalida[] }) {
  if (!filas.length) return <Vacio titulo="Sin transportes programados" icono="route" />;

  return (
    <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase text-gray-500">
          <tr>
            <th className="px-3 py-2.5">Salida</th>
            <th className="px-3 py-2.5">Cliente</th>
            <th className="px-3 py-2.5">Paquete</th>
            <th className="px-3 py-2.5">Pax</th>
            <th className="px-3 py-2.5">Transporte</th>
            <th className="px-3 py-2.5">Proveedor / Ruta</th>
            <th className="px-3 py-2.5">Monto</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((t) => (
            <tr key={t.reserva_id} className="border-t border-gray-100">
              <td className="px-3 py-2.5 text-xs font-semibold text-gray-600">
                {rango(t.fecha_inicio, t.fecha_fin)}
                <Pill texto={t.status} color={COLOR_STATUS[t.status]} />
              </td>
              <td className="px-3 py-2.5">
                <p className="font-bold text-gray-900">{t.cliente}</p>
                <p className="font-mono text-[10px] text-gray-400">{t.codigo}</p>
              </td>
              <td className="px-3 py-2.5 text-xs font-semibold text-gray-600">{t.paquete}</td>
              <td className="px-3 py-2.5 font-bold">{t.pax}</td>
              <td className="px-3 py-2.5 text-xs">{t.transporte ?? '—'}</td>
              <td className="px-3 py-2.5 text-xs text-gray-500">
                {t.transporte_proveedor ?? '—'}
                {t.transporte_ruta ? ` · ${t.transporte_ruta}` : ''}
              </td>
              <td className="px-3 py-2.5 font-bold">{dinero(t.transporte_monto)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
