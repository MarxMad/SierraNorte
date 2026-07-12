'use client';

import { useState } from 'react';
import { Icono } from './ui';
import { urlComprobante } from '@/app/acciones';

// El bucket es privado: el archivo se abre con una URL firmada que se
// pide en el momento del clic y caduca a los 5 minutos.
export default function VerComprobante({ ruta }: { ruta: string | null }) {
  const [abriendo, setAbriendo] = useState(false);

  if (!ruta)
    return (
      <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400">
        Sin comprobante
      </span>
    );

  const abrir = async () => {
    setAbriendo(true);
    const r = await urlComprobante(ruta);
    setAbriendo(false);
    if (r.url) window.open(r.url, '_blank', 'noopener');
    else alert(r.error ?? 'No se pudo abrir el comprobante.');
  };

  return (
    <button
      onClick={abrir}
      disabled={abriendo}
      className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
    >
      <Icono n="paperclip" s={11} c="#047857" />
      {abriendo ? 'Abriendo…' : 'Ver'}
    </button>
  );
}
