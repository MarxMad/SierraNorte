'use client';

import { useRef, useState, useTransition, useEffect } from 'react';
import { Icono } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { borrarAdjuntoReserva, registrarAdjuntoReserva, urlExpediente } from '@/app/acciones';
import type { ReservaAdjunto } from '@/lib/tipos';

export default function ReservaExpediente({
  reservaId,
  editable,
}: {
  reservaId: string;
  editable: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  const [lista, setLista] = useState<ReservaAdjunto[]>([]);
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('reserva_adjuntos')
      .select('*')
      .eq('reserva_id', reservaId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setLista((data ?? []) as ReservaAdjunto[]));
  }, [reservaId]);

  const subir = async (file: File) => {
    setSubiendo(true);
    const supabase = createClient();
    const path = `reservas/${reservaId}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const { error } = await supabase.storage.from('expedientes').upload(path, file);
    setSubiendo(false);
    if (error) return alert(error.message);

    startTransition(async () => {
      const res = await registrarAdjuntoReserva({
        reserva_id: reservaId,
        nombre: file.name,
        storage_path: path,
        mime_type: file.type,
      });
      if (!res.ok) alert(res.error);
      else
        setLista((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            reserva_id: reservaId,
            nombre: file.name,
            storage_path: path,
            mime_type: file.type,
            created_at: new Date().toISOString(),
          },
        ]);
    });
  };

  const abrir = async (path: string) => {
    const res = await urlExpediente(path);
    if (res.url) window.open(res.url, '_blank');
    else alert(res.error);
  };

  const quitar = (id: string) => {
    if (!confirm('¿Quitar este archivo del expediente?')) return;
    startTransition(async () => {
      const res = await borrarAdjuntoReserva(id);
      if (res.ok) setLista((prev) => prev.filter((a) => a.id !== id));
      else alert(res.error);
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-gray-500">Expediente</p>
      {editable && (
        <>
          <input
            ref={input}
            type="file"
            className="hidden"
            accept="application/pdf,image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) subir(f);
            }}
          />
          <button
            type="button"
            disabled={subiendo}
            onClick={() => input.current?.click()}
            className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
          >
            {subiendo ? 'Subiendo…' : 'Adjuntar PDF o imagen'}
          </button>
        </>
      )}
      <ul className="mt-3 space-y-2">
        {lista.map((a) => (
          <li key={a.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
            <Icono n="receipt" s={16} c="#6B7280" />
            <button
              type="button"
              onClick={() => abrir(a.storage_path)}
              className="flex-1 truncate text-left text-xs font-semibold text-[#5B21B6] hover:underline"
            >
              {a.nombre}
            </button>
            {editable && (
              <button type="button" onClick={() => quitar(a.id)} className="text-xs text-red-600">
                Quitar
              </button>
            )}
          </li>
        ))}
        {!lista.length && (
          <p className="text-xs font-semibold text-gray-400">Sin archivos (itinerario PDF, contrato…)</p>
        )}
      </ul>
    </div>
  );
}
