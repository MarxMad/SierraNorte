'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Icono, Avatar } from './ui';
import { seccionesDe, ETIQUETA_ROL, type Seccion } from '@/lib/permisos';
import type { Perfil, Comunidad } from '@/lib/tipos';
import { salir } from '@/app/login/acciones';

const NAV: Record<Seccion, { href: string; label: string; icono: string }> = {
  ventas: { href: '/ventas', label: 'Ventas', icono: 'clipboard' },
  comunidades: { href: '/comunidades', label: 'Comunidades', icono: 'mountain' },
  liquidacion: { href: '/liquidacion', label: 'Liquidación', icono: 'receipt' },
  banca: { href: '/banca', label: 'Banca', icono: 'bank' },
  calendario: { href: '/calendario', label: 'Calendario', icono: 'calendar' },
  admin: { href: '/admin', label: 'Usuarios', icono: 'cog' },
};

export default function Sidebar({
  perfil,
  comunidades,
}: {
  perfil: Perfil;
  comunidades: Comunidad[];
}) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(true);
  const secciones = seccionesDe(perfil.rol);

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50">
      {/* Marca */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <Image
          src="/sierran.png"
          alt=""
          width={36}
          height={36}
          className="shrink-0 rounded-lg bg-white p-0.5 shadow-sm"
        />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-extrabold text-gray-900">Expediciones Sierra Norte</p>
          <p className="text-[10px] font-medium text-gray-500">Pueblos Mancomunados</p>
        </div>
      </div>

      <p className="px-5 pb-1 pt-2 text-[10px] font-bold tracking-wider text-gray-400">
        ESPACIOS DE TRABAJO
      </p>

      <nav className="flex-1 overflow-y-auto pb-2">
        {secciones.map((s) => {
          const item = NAV[s];
          const activo = pathname.startsWith(item.href);

          if (s === 'comunidades') {
            return (
              <div key={s}>
                <button
                  onClick={() => setAbierto((v) => !v)}
                  className={`mx-2 my-0.5 flex w-[calc(100%-1rem)] items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition ${
                    activo ? 'bg-[#5B21B6] text-white' : 'text-gray-700 hover:bg-gray-200/70'
                  }`}
                >
                  <Icono n={item.icono} s={17} c={activo ? '#fff' : '#6B7280'} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <span className={`transition-transform ${abierto ? 'rotate-90' : ''}`}>
                    <Icono n="chevron" s={11} c={activo ? '#fff' : '#9CA3AF'} />
                  </span>
                </button>
                {abierto &&
                  comunidades.map((c) => {
                    const act = pathname === `/comunidades/${c.id}`;
                    // Todos ven todos los pueblos; el coordinador sólo
                    // confirma el checklist del suyo, y aquí se le marca.
                    const mio = perfil.comunidad_id === c.id;
                    return (
                      <Link
                        key={c.id}
                        href={`/comunidades/${c.id}`}
                        className={`mx-2 my-0.5 flex items-center gap-2.5 rounded-lg py-1.5 pl-8 pr-2.5 text-xs font-medium transition ${
                          act ? 'bg-[#5B21B6] text-white' : 'text-gray-600 hover:bg-gray-200/70'
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-sm"
                          style={{ background: act ? '#fff' : c.color }}
                        />
                        <span className="truncate">{c.nombre}</span>
                        {mio && (
                          <span
                            className={`ml-auto shrink-0 rounded px-1 py-0.5 text-[9px] font-extrabold ${
                              act ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            MÍO
                          </span>
                        )}
                      </Link>
                    );
                  })}
              </div>
            );
          }

          return (
            <Link
              key={s}
              href={item.href}
              className={`mx-2 my-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition ${
                activo ? 'bg-[#5B21B6] text-white' : 'text-gray-700 hover:bg-gray-200/70'
              }`}
            >
              <Icono n={item.icono} s={17} c={activo ? '#fff' : '#6B7280'} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Usuario */}
      <div className="border-t border-gray-200 p-3">
        <div className="mb-2 flex items-center gap-2.5 px-1">
          <Avatar nombre={perfil.nombre} s={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-gray-900">{perfil.nombre}</p>
            <p className="truncate text-[10px] font-semibold text-gray-500">
              {ETIQUETA_ROL[perfil.rol]}
              {perfil.comunidad_id &&
                ` · ${comunidades.find((c) => c.id === perfil.comunidad_id)?.nombre ?? ''}`}
            </p>
          </div>
        </div>
        <form action={salir}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-gray-600 transition hover:bg-gray-200/70"
          >
            <Icono n="logout" s={16} c="#6B7280" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
