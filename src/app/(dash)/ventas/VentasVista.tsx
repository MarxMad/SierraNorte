'use client';

import { useState, useTransition } from 'react';
import Encabezado from '@/components/Encabezado';
import { Icono, Pill, Avatar, BotonAccion, Vacio, BtnPrimario } from '@/components/ui';
import ReservaModal from './ReservaModal';
import PaqueteModal from './PaqueteModal';
import PanelReservas from './PanelReservas';
import { borrarReserva } from '@/app/acciones';
import {
  type Reserva,
  type Paquete,
  type Guia,
  type Perfil,
  type Comunidad,
  COLOR_DURACION,
  COLOR_STATUS,
  COLOR_METODO,
  COLOR_PLATAFORMA,
  dinero,
  rango,
  colorPagado,
} from '@/lib/tipos';
import { puedeEditarVentas } from '@/lib/permisos';

const VISTAS = [
  { id: 'panel', label: 'Panel', icono: 'chart' },
  { id: 'clientes', label: 'Clientes', icono: 'users' },
  { id: 'paquetes', label: 'Paquetes', icono: 'clipboard' },
];

export default function VentasVista({
  perfil,
  vista,
  busqueda,
  reservas,
  paquetes,
  guias,
  comunidades,
}: {
  perfil: Perfil;
  vista: string;
  busqueda: string;
  reservas: Reserva[];
  paquetes: Paquete[];
  guias: Guia[];
  comunidades: Comunidad[];
}) {
  const [editandoReserva, setEditandoReserva] = useState<Partial<Reserva> | null>(null);
  const [editandoPaquete, setEditandoPaquete] = useState<Paquete | null>(null);
  const [expandido, setExpandido] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();

  const editable = puedeEditarVentas(perfil.rol);
  const q = busqueda.toLowerCase();

  const rs = reservas.filter(
    (r) =>
      !q ||
      r.nombre.toLowerCase().includes(q) ||
      r.codigo.toLowerCase().includes(q) ||
      (r.paquete ?? '').toLowerCase().includes(q)
  );
  const ps = paquetes.filter((p) => !q || p.nombre.toLowerCase().includes(q));

  const totalPax = rs.reduce((a, r) => a + r.personas, 0);
  const totalNinos = rs.reduce((a, r) => a + (r.ninos ? r.num_ninos : 0), 0);

  const eliminar = (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la reserva de ${nombre}?`)) return;
    startTransition(async () => {
      const res = await borrarReserva(id);
      if (!res.ok) alert(res.error);
    });
  };

  return (
    <>
      <Encabezado
        titulo="Ventas"
        sub="Reservas de clientes · Paquetes de Experiencias"
        vistas={VISTAS}
        vistaActiva={vista}
        acciones={
          editable && (
            <BtnPrimario
              onClick={() =>
                vista === 'paquetes'
                  ? setEditandoPaquete({} as Paquete)
                  : setEditandoReserva({ personas: 1, metodo_pago: 'Efectivo', status: 'Planeación' })
              }
            >
              <Icono n="plus" s={15} c="#fff" />
              {vista === 'paquetes' ? 'Crear paquete' : 'Nueva reserva'}
            </BtnPrimario>
          )
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-auto px-6 py-4">
        {vista === 'panel' && (
          <PanelReservas reservas={reservas} onAbrir={(r) => setEditandoReserva(r)} />
        )}

        {vista === 'clientes' ? (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-2.5">
              <Chip icono="ticket" label="Reservas" valor={rs.length} color="#5B21B6" />
              <Chip icono="users" label="Personas" valor={totalPax} color="#2563EB" />
              <Chip icono="child" label="Niños" valor={totalNinos} color="#B45309" />
            </div>

            {rs.length === 0 ? (
              <Vacio titulo="Sin reservas" sub="Crea la primera con el botón Nueva reserva." icono="ticket" />
            ) : (
              <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full min-w-[1500px] border-collapse text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      <Th>Código</Th>
                      <Th>Cliente</Th>
                      <Th>Personas</Th>
                      <Th>Niños</Th>
                      <Th>Paquete</Th>
                      <Th>Fechas</Th>
                      <Th>Guía</Th>
                      <Th>Transporte</Th>
                      <Th>Precio</Th>
                      <Th>Método de pago</Th>
                      <Th>% Pagado</Th>
                      <Th>Status</Th>
                      <Th sticky>Acciones</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rs.map((r) => (
                      <tr key={r.id} className="group border-t border-gray-100 hover:bg-gray-50">
                        <Td>
                          <span className="rounded-md bg-violet-50 px-2 py-1 font-mono text-xs font-bold text-[#5B21B6]">
                            {r.codigo}
                          </span>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <Avatar nombre={r.nombre} s={26} />
                            <div className="min-w-0">
                              <p className="truncate font-bold text-gray-800">{r.nombre}</p>
                              <p className="truncate text-[11px] text-gray-400">{r.email}</p>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <span className="inline-flex items-center gap-1.5 font-bold text-gray-900">
                            <Icono n="users" s={14} c="#9CA3AF" />
                            {r.personas}
                          </span>
                        </Td>
                        <Td>
                          {r.ninos ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                              <Icono n="child" s={12} c="#B45309" />
                              {r.num_ninos}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </Td>
                        <Td>
                          {r.paquete ? (
                            <div className="flex min-w-0 items-center gap-2" title="Se edita en Paquetes">
                              <span
                                className="h-5 w-1 shrink-0 rounded-sm"
                                style={{ background: COLOR_DURACION[r.duracion ?? ''] ?? '#9CA3AF' }}
                              />
                              <span className="truncate font-medium text-gray-700">{r.paquete}</span>
                            </div>
                          ) : (
                            <span className="text-gray-300">Sin paquete</span>
                          )}
                        </Td>
                        <Td>
                          <span className="whitespace-nowrap rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                            {rango(r.fecha_inicio, r.fecha_fin)}
                          </span>
                        </Td>
                        <Td>
                          {r.guia ? (
                            <div className="flex items-center gap-2">
                              <Avatar nombre={r.guia} s={22} />
                              <span className="truncate text-xs font-semibold text-gray-700">{r.guia}</span>
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </Td>
                        <Td>
                          {r.transporte ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">
                              <Icono n="bus" s={12} c="#2563EB" />
                              <span className="truncate">{r.transporte}</span>
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </Td>
                        <Td>
                          <span className="font-bold text-gray-900">{dinero(r.precio)}</span>
                        </Td>
                        <Td>
                          <div className="flex flex-wrap gap-1">
                            {r.mixto ? (
                              // Se paga con varios métodos: el detalle vive en sus cobros
                              (r.metodos ?? []).map((m) => (
                                <Pill key={m} texto={m} color={COLOR_METODO[m] ?? '#6B7280'} />
                              ))
                            ) : (
                              <>
                                <Pill texto={r.metodo_pago} color={COLOR_METODO[r.metodo_pago]} />
                                {r.plataforma && (
                                  <Pill
                                    texto={r.plataforma}
                                    color={COLOR_PLATAFORMA[r.plataforma]}
                                    dot={false}
                                  />
                                )}
                              </>
                            )}
                          </div>
                        </Td>
                        <Td>
                          <div className="w-24">
                            <p
                              className="mb-1 text-[11px] font-bold"
                              style={{ color: colorPagado(r.pagado_pct) }}
                            >
                              {r.pagado_pct}%
                            </p>
                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${r.pagado_pct}%`,
                                  background: colorPagado(r.pagado_pct),
                                }}
                              />
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <Pill texto={r.status} color={COLOR_STATUS[r.status]} solid />
                        </Td>
                        <Td sticky>
                          <div className="flex items-center gap-1">
                            {editable ? (
                              <>
                                <BotonAccion
                                  icono="edit"
                                  titulo="Editar cliente"
                                  onClick={() => setEditandoReserva(r)}
                                />
                                <BotonAccion
                                  icono="trash"
                                  titulo="Eliminar"
                                  color="#DC2626"
                                  onClick={() => eliminar(r.id, r.nombre)}
                                />
                              </>
                            ) : (
                              <span className="text-xs text-gray-400">Sólo lectura</span>
                            )}
                          </div>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          /* ---------------- PAQUETES ---------------- */
          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[1200px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  <Th>Paquete</Th>
                  <Th>Duración</Th>
                  <Th>Clientes</Th>
                  <Th>Fechas</Th>
                  <Th>Comunidades</Th>
                  <Th>Comedores</Th>
                  <Th>Precio</Th>
                  <Th>% Pagado</Th>
                  <Th>Status</Th>
                  <Th sticky>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {ps.map((p) => {
                  const abierto = expandido[p.id];
                  const suyas = reservas.filter((r) => r.paquete_id === p.id);
                  return (
                    <>
                      <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <Td>
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className="h-6 w-1 shrink-0 rounded-sm"
                              style={{ background: COLOR_DURACION[p.duracion] }}
                            />
                            <button
                              onClick={() => setExpandido((e) => ({ ...e, [p.id]: !e[p.id] }))}
                              title="Ver clientes"
                              className={`transition-transform ${abierto ? 'rotate-90' : ''}`}
                            >
                              <Icono n="chevron" s={12} c="#9CA3AF" />
                            </button>
                            <span className="truncate font-bold text-gray-800">{p.nombre}</span>
                          </div>
                        </Td>
                        <Td>
                          <Pill texto={p.duracion} color={COLOR_DURACION[p.duracion]} />
                        </Td>
                        <Td>
                          {p.pax > 0 ? (
                            <span className="text-xs font-bold text-gray-600">
                              {p.reservas} · {p.pax} pax
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </Td>
                        <Td>
                          <span className="whitespace-nowrap rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                            {rango(p.fecha_inicio, p.fecha_fin)}
                          </span>
                        </Td>
                        <Td>
                          <div className="flex flex-wrap gap-1">
                            {(p.comunidades ?? []).slice(0, 2).map((c) => (
                              <span
                                key={c}
                                className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-600"
                              >
                                {c}
                              </span>
                            ))}
                            {(p.comunidades ?? []).length > 2 && (
                              <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[11px] font-bold text-[#5B21B6]">
                                +{(p.comunidades ?? []).length - 2}
                              </span>
                            )}
                          </div>
                        </Td>
                        <Td>
                          {p.comedores > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                              <Icono n="utensils" s={12} c="#B45309" />
                              {p.comedores}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </Td>
                        <Td>
                          <span className="font-bold text-gray-900">{dinero(p.precio)}</span>
                        </Td>
                        <Td>
                          <span className="text-xs font-bold" style={{ color: colorPagado(p.pagado_pct) }}>
                            {p.pagado_pct}%
                          </span>
                        </Td>
                        <Td>
                          <Pill texto={p.status} color={COLOR_STATUS[p.status]} solid />
                        </Td>
                        <Td sticky>
                          {editable ? (
                            <BotonAccion
                              icono="edit"
                              titulo="Editar paquete"
                              onClick={() => setEditandoPaquete(p)}
                            />
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </Td>
                      </tr>
                      {abierto &&
                        suyas.map((r) => (
                          <tr key={r.id} className="border-t border-gray-50 bg-gray-50/60 text-xs">
                            <Td>
                              <div className="flex items-center gap-2 pl-8">
                                <Avatar nombre={r.nombre} s={20} />
                                <span className="font-semibold text-gray-700">{r.nombre}</span>
                              </div>
                            </Td>
                            <Td>
                              <span className="font-mono font-bold text-[#5B21B6]">{r.codigo}</span>
                            </Td>
                            <Td>{r.personas} pax</Td>
                            <Td>{rango(r.fecha_inicio, r.fecha_fin)}</Td>
                            <Td>{r.email}</Td>
                            <Td />
                            <Td>{dinero(r.precio)}</Td>
                            <Td>{r.pagado_pct}%</Td>
                            <Td>
                              <Pill texto={r.metodo_pago} color={COLOR_METODO[r.metodo_pago]} dot={false} />
                            </Td>
                            <Td sticky>
                              {editable && (
                                <BotonAccion
                                  icono="edit"
                                  titulo="Editar cliente"
                                  onClick={() => setEditandoReserva(r)}
                                />
                              )}
                            </Td>
                          </tr>
                        ))}
                      {abierto && suyas.length === 0 && (
                        <tr className="border-t border-gray-50 bg-gray-50/60">
                          <td colSpan={10} className="px-4 py-2.5 pl-14 text-xs text-gray-400">
                            Sin reservas todavía
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editandoReserva && (
        <ReservaModal
          reserva={editandoReserva}
          paquetes={paquetes}
          guias={guias}
          onClose={() => setEditandoReserva(null)}
        />
      )}
      {editandoPaquete && (
        <PaqueteModal
          paquete={editandoPaquete}
          comunidades={comunidades}
          onClose={() => setEditandoPaquete(null)}
        />
      )}
    </>
  );
}

function Th({ children, sticky }: { children?: React.ReactNode; sticky?: boolean }) {
  return (
    <th
      className={`whitespace-nowrap px-3 py-2.5 font-bold ${
        sticky ? 'sticky right-0 z-20 bg-gray-50 shadow-[-6px_0_12px_-6px_rgba(0,0,0,.08)]' : ''
      }`}
    >
      {children}
    </th>
  );
}

function Td({ children, sticky }: { children?: React.ReactNode; sticky?: boolean }) {
  return (
    <td
      className={`px-3 py-2.5 align-middle ${
        sticky
          ? 'sticky right-0 z-10 bg-white shadow-[-6px_0_12px_-6px_rgba(0,0,0,.08)] group-hover:bg-gray-50'
          : ''
      }`}
    >
      {children}
    </td>
  );
}

function Chip({
  icono,
  label,
  valor,
  color,
}: {
  icono: string;
  label: string;
  valor: number;
  color: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5"
      style={{ background: `${color}1a`, border: `1px solid ${color}40` }}
    >
      <Icono n={icono} s={13} c={color} />
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <span className="text-sm font-extrabold" style={{ color }}>
        {valor}
      </span>
    </span>
  );
}
