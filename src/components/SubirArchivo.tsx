'use client';

import { useRef, useState } from 'react';
import { Icono } from './ui';
import { createClient } from '@/lib/supabase/client';
import { urlComprobante } from '@/app/acciones';

const MAX_MB = 10;

// El bucket es privado: guardamos la RUTA, no una URL pública.
// Para verlo, se pide una URL firmada que caduca a los 5 minutos.
export default function SubirArchivo({
  carpeta,
  valor,
  onSubido,
  etiqueta = 'Arrastra el archivo o haz clic para subirlo',
  ayuda = 'Foto, PDF o XML · máximo 10 MB',
}: {
  carpeta: string; // 'pagos' | 'gastos'
  valor: string | null;
  onSubido: (ruta: string | null) => void;
  etiqueta?: string;
  ayuda?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [arrastra, setArrastra] = useState(false);

  const subir = async (file: File) => {
    setError(null);

    if (file.size > MAX_MB * 1024 * 1024) {
      return setError(`El archivo pesa más de ${MAX_MB} MB.`);
    }

    setSubiendo(true);
    const supabase = createClient();

    // Nombre único y sin acentos ni espacios: el path va en una URL
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
    const ruta = `${carpeta}/${crypto.randomUUID()}.${ext}`;

    const { error: e } = await supabase.storage
      .from('comprobantes')
      .upload(ruta, file, { contentType: file.type, upsert: false });

    setSubiendo(false);

    if (e) {
      setError(
        e.message.includes('mime') || e.message.includes('type')
          ? 'Ese tipo de archivo no se acepta. Usa foto, PDF o XML.'
          : e.message.includes('row-level') || e.message.includes('policy')
            ? 'Tu rol no puede subir comprobantes.'
            : e.message
      );
      return;
    }

    onSubido(ruta);
  };

  const abrir = async () => {
    if (!valor) return;
    const r = await urlComprobante(valor);
    if (r.url) window.open(r.url, '_blank', 'noopener');
    else setError(r.error ?? 'No se pudo abrir el archivo.');
  };

  // ---- Ya hay archivo ----
  if (valor && !subiendo) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <Icono n="checkCircle" s={18} c="#16A34A" />
          <span className="min-w-0 flex-1 truncate text-xs font-bold text-emerald-800">
            {valor.split('/').pop()}
          </span>
          <button
            onClick={abrir}
            className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100"
          >
            Ver
          </button>
          <button
            onClick={() => {
              onSubido(null);
              setError(null);
            }}
            title="Quitar"
            className="shrink-0 rounded-lg px-1.5 py-1 transition hover:bg-emerald-100"
          >
            <Icono n="close" s={13} c="#047857" />
          </button>
        </div>
        {error && <p className="text-[11px] font-semibold text-red-600">{error}</p>}
      </div>
    );
  }

  // ---- Zona de subida ----
  return (
    <div className="space-y-1.5">
      <button
        onClick={() => input.current?.click()}
        disabled={subiendo}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastra(true);
        }}
        onDragLeave={() => setArrastra(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastra(false);
          const f = e.dataTransfer.files?.[0];
          if (f) subir(f);
        }}
        className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 transition disabled:cursor-wait"
        style={{
          borderColor: arrastra ? '#5B21B6' : '#D1D5DB',
          background: arrastra ? '#F5F3FF' : '#fff',
        }}
      >
        <Icono n={subiendo ? 'clock' : 'upload'} s={22} c={arrastra ? '#5B21B6' : '#9CA3AF'} />
        <span className="text-xs font-bold text-gray-600">
          {subiendo ? 'Subiendo…' : etiqueta}
        </span>
        <span className="text-[11px] font-semibold text-gray-400">{ayuda}</span>
      </button>

      <input
        ref={input}
        type="file"
        className="hidden"
        accept="image/*,application/pdf,.xml,text/xml"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) subir(f);
          e.target.value = '';
        }}
      />

      {error && <p className="text-[11px] font-semibold text-red-600">{error}</p>}
    </div>
  );
}
