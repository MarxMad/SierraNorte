'use client';

import { useState, useTransition } from 'react';
import { BtnPrimario, Pill, Vacio } from '@/components/ui';
import { convertirLead, guardarLead, marcarLeadPerdido } from '@/app/acciones';
import type { Lead, Paquete } from '@/lib/tipos';

const COLOR_LEAD: Record<string, string> = {
  nuevo: '#2563EB',
  contactado: '#F59E0B',
  calificado: '#7C3AED',
  convertido: '#16A34A',
  perdido: '#9CA3AF',
};

export default function VentasLeads({
  leads,
  paquetes,
  editable,
}: {
  leads: Lead[];
  paquetes: Paquete[];
  editable: boolean;
}) {
  const [, startTransition] = useTransition();
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', paquete_id: '', notas: '' });

  const crear = () => {
    if (!form.nombre.trim()) return alert('Falta el nombre');
    startTransition(async () => {
      const res = await guardarLead({ ...form, paquete_id: form.paquete_id || null, estado: 'nuevo' });
      if (!res.ok) alert(res.error);
      else setForm({ nombre: '', email: '', telefono: '', paquete_id: '', notas: '' });
    });
  };

  const convertir = (id: string) => {
    startTransition(async () => {
      const res = await convertirLead(id);
      if (!res.ok) alert(res.error);
    });
  };

  const perder = (id: string) => {
    const motivo = prompt('Motivo de la venta perdida:');
    if (!motivo?.trim()) return;
    startTransition(async () => {
      const res = await marcarLeadPerdido(id, motivo);
      if (!res.ok) alert(res.error);
    });
  };

  if (!leads.length && !editable) return <Vacio titulo="Sin leads" icono="users" />;

  return (
    <div className="space-y-4">
      {editable && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-3 text-sm font-extrabold text-gray-900">Nuevo prospecto</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            />
            <input
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Correo"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <select
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={form.paquete_id}
              onChange={(e) => setForm((f) => ({ ...f, paquete_id: e.target.value }))}
            >
              <option value="">Paquete (opcional)</option>
              {paquetes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <BtnPrimario onClick={crear}>Agregar lead</BtnPrimario>
          </div>
        </div>
      )}

      <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Contacto</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Paquete</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-t border-gray-100">
                <td className="px-3 py-2.5">
                  <p className="font-bold text-gray-900">{l.nombre}</p>
                  <p className="text-xs text-gray-500">{l.email ?? l.telefono ?? '—'}</p>
                </td>
                <td className="px-3 py-2.5">
                  <Pill texto={l.estado} color={COLOR_LEAD[l.estado]} solid />
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-600">
                  {paquetes.find((p) => p.id === l.paquete_id)?.nombre ?? '—'}
                </td>
                <td className="px-3 py-2.5">
                  {editable && l.estado !== 'convertido' && l.estado !== 'perdido' && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => convertir(l.id)}
                        className="rounded-lg bg-[#5B21B6] px-2.5 py-1 text-[11px] font-bold text-white"
                      >
                        → Reserva
                      </button>
                      <button
                        type="button"
                        onClick={() => perder(l.id)}
                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-bold text-gray-600"
                      >
                        Perdida
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!leads.length && <p className="py-8 text-center text-sm text-gray-400">Sin leads todavía</p>}
      </div>
    </div>
  );
}
