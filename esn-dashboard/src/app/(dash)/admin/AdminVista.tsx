'use client';

import { useTransition } from 'react';
import Encabezado from '@/components/Encabezado';
import { Avatar, Pill, Icono } from '@/components/ui';
import { actualizarPerfil } from '@/app/acciones';
import type { Perfil, Comunidad, Rol } from '@/lib/tipos';
import { ETIQUETA_ROL } from '@/lib/permisos';

const ROLES: Rol[] = ['admin', 'ventas', 'comunidad', 'finanzas'];

const COLOR_ROL: Record<Rol, string> = {
  admin: '#5B21B6',
  ventas: '#2563EB',
  comunidad: '#1F7D5E',
  finanzas: '#B45309',
};

const DESCRIPCION: Record<Rol, string> = {
  admin: 'Ve y edita todo, incluidos los usuarios.',
  ventas: 'Reservas, paquetes y calendario.',
  comunidad: 'Sólo su comunidad: checklist y liquidación.',
  finanzas: 'Banca, gastos y liquidación.',
};

export default function AdminVista({
  perfiles,
  comunidades,
}: {
  perfiles: Perfil[];
  comunidades: Comunidad[];
}) {
  const [pending, startTransition] = useTransition();

  const cambiar = (userId: string, cambios: Parameters<typeof actualizarPerfil>[1]) => {
    startTransition(async () => {
      const r = await actualizarPerfil(userId, cambios);
      if (!r.ok) alert(r.error);
    });
  };

  return (
    <>
      <Encabezado titulo="Usuarios" sub="Quién entra y qué puede ver" />

      <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r) => (
            <div key={r} className="rounded-xl border border-gray-200 bg-white p-4">
              <Pill texto={ETIQUETA_ROL[r]} color={COLOR_ROL[r]} solid />
              <p className="mt-2 text-xs text-gray-500">{DESCRIPCION[r]}</p>
            </div>
          ))}
        </div>

        <div className="overflow-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2.5">Usuario</th>
                <th className="px-4 py-2.5">Rol</th>
                <th className="px-4 py-2.5">Comunidad</th>
                <th className="px-4 py-2.5">Estado</th>
              </tr>
            </thead>
            <tbody>
              {perfiles.map((p) => (
                <tr key={p.user_id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar nombre={p.nombre} s={32} />
                      <div>
                        <p className="font-bold text-gray-900">{p.nombre}</p>
                        <p className="text-xs text-gray-400">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.rol}
                      disabled={pending}
                      onChange={(e) =>
                        cambiar(p.user_id, {
                          rol: e.target.value,
                          comunidad_id:
                            e.target.value === 'comunidad'
                              ? (p.comunidad_id ?? comunidades[0]?.id)
                              : null,
                        })
                      }
                      className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold outline-none"
                      style={{ color: COLOR_ROL[p.rol] }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ETIQUETA_ROL[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {p.rol === 'comunidad' ? (
                      <select
                        value={p.comunidad_id ?? ''}
                        disabled={pending}
                        onChange={(e) => cambiar(p.user_id, { comunidad_id: e.target.value })}
                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold outline-none"
                      >
                        {comunidades.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => cambiar(p.user_id, { activo: !p.activo })}
                      disabled={pending}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                        p.activo
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <Icono n={p.activo ? 'checkCircle' : 'close'} s={13} c={p.activo ? '#16A34A' : '#9CA3AF'} />
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800">
          Los usuarios se registran ellos mismos en la pantalla de acceso. Aquí les asignas el rol.
          Entran como <b>Ventas</b> hasta que los cambies.
        </p>
      </div>
    </>
  );
}
