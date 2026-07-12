'use client';

import { useState, useTransition } from 'react';
import Encabezado from '@/components/Encabezado';
import { Icono, Pill, Vacio, Barra, Modal, BtnGhost } from '@/components/ui';
import { marcarCheck } from '@/app/acciones';
import {
  type Comunidad,
  type OperacionComunidad,
  type ItemChecklist,
  type Perfil,
  COLOR_DURACION,
  COLOR_STATUS,
  dinero,
  fecha,
  hexA,
} from '@/lib/tipos';
import { puedeCheckComunidad, puedeEditarVentas } from '@/lib/permisos';

export default function ComunidadVista({
  perfil,
  comunidad,
  operacion,
  checksComunidad,
  checksGeneral,
}: {
  perfil: Perfil;
  comunidad: Comunidad;
  operacion: OperacionComunidad[];
  checksComunidad: ItemChecklist[];
  checksGeneral: ItemChecklist[];
}) {
  const [abierto, setAbierto] = useState<OperacionComunidad | null>(null);
  const [, startTransition] = useTransition();

  const puedeMarcar = puedeCheckComunidad(perfil.rol, perfil.comunidad_id, comunidad.id);
  const puedeGeneral = puedeEditarVentas(perfil.rol);

  const toggle = (tabla: 'checklist_general' | 'checklist_comunidad', item: ItemChecklist) => {
    startTransition(async () => {
      const r = await marcarCheck(tabla, item.id, !item.completado);
      if (!r.ok) alert(r.error);
    });
  };

  return (
    <>
      <Encabezado titulo={comunidad.nombre} sub="Operación por comunidad" />

      <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
        {operacion.length === 0 ? (
          <Vacio titulo="Sin paquetes en esta comunidad" icono="mountain" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {operacion.map((t) => {
              const multi = t.comunidades_del_tour > 1;
              return (
                <button
                  key={t.paquete_id}
                  onClick={() => setAbierto(t)}
                  className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:shadow-md"
                  style={{ borderLeft: `4px solid ${comunidad.color}` }}
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="font-bold text-gray-900">{t.paquete}</p>
                    {t.lista && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700">
                        <Icono n="check" s={10} c="#16A34A" />
                        LISTA
                      </span>
                    )}
                  </div>

                  <p className="mb-2.5 text-[11px] font-bold" style={{ color: comunidad.color }}>
                    {multi
                      ? `Tramo en ${comunidad.nombre} · ${t.comunidades_del_tour} comunidades en el tour`
                      : `Tramo en ${comunidad.nombre}`}
                  </p>

                  <div className="mb-3 space-y-1 text-xs text-gray-500">
                    <p className="flex justify-between">
                      <span>Fechas</span>
                      <span className="font-semibold text-gray-700">{fecha(t.fecha_inicio)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Personas</span>
                      <span className="font-semibold text-gray-700">{t.pax} pax</span>
                    </p>
                    <p className="flex justify-between">
                      <span>Presupuesto</span>
                      <span className="font-bold text-gray-900">
                        {dinero(t.gastado)} / {dinero(t.presupuesto)}
                      </span>
                    </p>
                  </div>

                  {multi && (
                    <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-gray-400">
                      Comunidades listas: {t.comunidades_listas}/{t.comunidades_del_tour}
                    </p>
                  )}

                  <div className="mb-1 flex justify-between text-[11px] font-bold text-gray-500">
                    <span>Avance en {comunidad.nombre}</span>
                    <span>{t.pct ?? 0}%</span>
                  </div>
                  <Barra pct={t.pct ?? 0} color={t.lista ? '#16A34A' : comunidad.color} />

                  <div className="mt-3 flex items-center justify-between">
                    <Pill texto={t.duracion} color={COLOR_DURACION[t.duracion]} dot={false} />
                    <Pill texto={t.status} color={COLOR_STATUS[t.status]} solid />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {abierto && (
        <Modal
          titulo={abierto.paquete}
          sub={
            abierto.comunidades_del_tour > 1
              ? `Tramo en ${comunidad.nombre} · ${abierto.comunidades_del_tour} comunidades · ${abierto.comunidades_listas} listas`
              : `Tramo en ${comunidad.nombre}`
          }
          icono="mountain"
          color={comunidad.color}
          chip={
            abierto.lista ? (
              <Pill texto="Comunidad lista" color="#16A34A" solid />
            ) : (
              <Pill texto={abierto.status} color={COLOR_STATUS[abierto.status]} solid />
            )
          }
          onClose={() => setAbierto(null)}
          footer={<BtnGhost onClick={() => setAbierto(null)}>Cerrar</BtnGhost>}
        >
          <div className="space-y-5">
            {/* Avance del tour completo */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-extrabold text-gray-700">Avance del tour completo</span>
                <span
                  className="text-sm font-extrabold"
                  style={{ color: abierto.avance_tour === 100 ? '#16A34A' : '#5B21B6' }}
                >
                  {abierto.avance_tour}%
                </span>
              </div>
              <Barra pct={abierto.avance_tour} color={abierto.avance_tour === 100 ? '#16A34A' : '#5B21B6'} />
              <p className="mt-2 text-[11px] font-semibold text-gray-500">
                {abierto.comunidades_listas}/{abierto.comunidades_del_tour} comunidades listas
              </p>
            </div>

            {/* Checklist general del tour */}
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2.5">
                <Icono n="clipboard" s={14} c="#5B21B6" />
                <span className="flex-1 text-xs font-extrabold text-gray-700">General del tour</span>
                <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-extrabold text-[#5B21B6]">
                  SE CONFIRMA UNA VEZ
                </span>
              </div>
              <div className="p-1">
                {checksGeneral
                  .filter((c) => c.paquete_id === abierto.paquete_id)
                  .map((c) => (
                    <Linea
                      key={c.id}
                      item={c}
                      disabled={!puedeGeneral}
                      onToggle={() => toggle('checklist_general', c)}
                    />
                  ))}
              </div>
            </div>

            {/* Checklist de esta comunidad */}
            <div>
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-gray-400">
                Checklist de {comunidad.nombre}
              </p>
              <div
                className="overflow-hidden rounded-xl border"
                style={{
                  borderColor: abierto.lista ? hexA('#16A34A', 0.3) : hexA(comunidad.color, 0.35),
                  background: abierto.lista ? '#FAFEFB' : '#fff',
                }}
              >
                <div
                  className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5"
                  style={{ background: abierto.lista ? '#F1FCF4' : hexA(comunidad.color, 0.06) }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: comunidad.color }} />
                  <span className="flex-1 text-xs font-extrabold text-gray-800">{comunidad.nombre}</span>
                  {abierto.lista ? (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                      <Icono n="check" s={10} c="#16A34A" />
                      LISTA
                    </span>
                  ) : (
                    <span className="text-[11px] font-extrabold text-amber-600">
                      {abierto.checks_ok}/{abierto.checks_total} confirmado
                    </span>
                  )}
                </div>
                <div className="p-1">
                  {checksComunidad
                    .filter(
                      (c) => c.paquete_id === abierto.paquete_id && c.comunidad_id === comunidad.id
                    )
                    .map((c) => (
                      <Linea
                        key={c.id}
                        item={c}
                        disabled={!puedeMarcar}
                        onToggle={() => toggle('checklist_comunidad', c)}
                      />
                    ))}
                </div>
              </div>
              {!puedeMarcar && (
                <p className="mt-2 text-[11px] text-gray-400">
                  Tu rol no puede confirmar el checklist de esta comunidad.
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Linea({
  item,
  disabled,
  onToggle,
}: {
  item: ItemChecklist;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <span
        className="flex shrink-0 items-center justify-center rounded-md border-2"
        style={{
          width: 20,
          height: 20,
          borderColor: item.completado ? '#16A34A' : '#D1D5DB',
          background: item.completado ? '#16A34A' : '#fff',
        }}
      >
        {item.completado && <Icono n="check" s={12} c="#fff" />}
      </span>
      <span className={item.completado ? 'text-gray-400 line-through' : 'text-gray-700'}>
        {item.item}
      </span>
    </button>
  );
}
