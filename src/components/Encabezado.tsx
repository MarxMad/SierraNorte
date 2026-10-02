'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Icono } from './ui';

export type Vista = { id: string; label: string; icono: string };

export default function Encabezado({
  titulo,
  sub,
  vistas,
  vistaActiva,
  acciones,
}: {
  titulo: string;
  sub: string;
  vistas?: Vista[];
  vistaActiva?: string;
  acciones?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get('q') ?? '';

  const buscar = (valor: string) => {
    const p = new URLSearchParams(params.toString());
    if (valor) p.set('q', valor);
    else p.delete('q');
    router.replace(`${pathname}?${p.toString()}`);
  };

  return (
    <header className="shrink-0 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-4 px-6 pb-2.5 pt-3">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold leading-tight text-gray-900">{titulo}</h1>
          <p className="mt-0.5 text-xs text-gray-500">{sub}</p>
        </div>
        <div className="flex-1" />
        <div className="flex w-64 items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5">
          <Icono n="search" s={15} c="#9CA3AF" />
          <input
            defaultValue={q}
            onChange={(e) => buscar(e.target.value)}
            placeholder="Buscar…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {(vistas?.length || acciones) && (
        <div className="flex flex-wrap items-center gap-2.5 px-6 pb-3">
          {vistas && vistas.length > 0 && (
            <div className="flex gap-0.5 rounded-lg bg-gray-100 p-1">
              {vistas.map((v) => {
                const activa = vistaActiva === v.id;
                const p = new URLSearchParams(params.toString());
                p.set('v', v.id);
                return (
                  <Link
                    key={v.id}
                    href={`${pathname}?${p.toString()}`}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition ${
                      activa ? 'bg-white text-[#1F7D5E] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icono n={v.icono} s={14} c={activa ? '#1F7D5E' : '#9CA3AF'} />
                    {v.label}
                  </Link>
                );
              })}
            </div>
          )}
          <div className="flex-1" />
          {acciones}
        </div>
      )}
    </header>
  );
}
