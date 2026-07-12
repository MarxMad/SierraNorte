'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icono } from '@/components/ui';
import ReservaForm from '@/components/landing/ReservaForm';
import { COLOR_DURACION, COLOR_LIQ, hexA, type Duracion } from '@/lib/tipos';
import type { Dia } from './page';

type Paquete = {
  id: string;
  nombre: string;
  duracion: Duracion;
  descripcion: string | null;
  precio: number;
};

// Cómo se lee cada tipo de actividad del itinerario
const ETIQUETA: Record<string, { label: string; icono: string }> = {
  Sendero: { label: 'Caminata', icono: 'route' },
  Hospedaje: { label: 'Hospedaje', icono: 'hut' },
  Actividad: { label: 'Actividad', icono: 'mountain' },
  Taller: { label: 'Taller', icono: 'users' },
};

export default function DetalleExperiencia({
  paquete,
  foto,
  comunidades,
  itinerario,
}: {
  paquete: Paquete;
  foto: string;
  comunidades: { id: string; nombre: string; color: string }[];
  itinerario: Dia[];
}) {
  const [abierto, setAbierto] = useState(false);
  const color = COLOR_DURACION[paquete.duracion];

  // Kilómetros y horas que aparecen en el texto del itinerario
  const km = itinerario
    .flatMap((d) => d.items)
    .map((i) => i.texto.match(/(\d+(?:\.\d+)?)\s*km/i))
    .filter(Boolean)
    .reduce((a, m) => a + Number(m![1]), 0);

  return (
    <>
      {/* Portada */}
      <header className="relative h-[420px] overflow-hidden sm:h-[520px]">
        <Image
          src={foto}
          alt={paquete.nombre}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-6xl px-5 pb-10">
            <Link
              href="/#experiencias"
              className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-white/80 transition hover:text-white"
            >
              <span className="rotate-180">
                <Icono n="chevron" s={13} c="currentColor" />
              </span>
              Todas las experiencias
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-extrabold text-white"
                style={{ background: color }}
              >
                {paquete.duracion}
              </span>
              {comunidades.map((c) => (
                <span
                  key={c.id}
                  className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur"
                >
                  {c.nombre}
                </span>
              ))}
            </div>

            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              {paquete.nombre}
            </h1>

            <div className="mt-5 flex flex-wrap gap-6 text-sm font-semibold text-white/80">
              {itinerario.length > 0 && (
                <span className="flex items-center gap-2">
                  <Icono n="calendar" s={15} c="#6EE7B7" />
                  {itinerario.length} {itinerario.length === 1 ? 'día' : 'días'}
                </span>
              )}
              {km > 0 && (
                <span className="flex items-center gap-2">
                  <Icono n="route" s={15} c="#6EE7B7" />
                  {km} km de sendero
                </span>
              )}
              <span className="flex items-center gap-2">
                <Icono n="mountain" s={15} c="#6EE7B7" />
                {comunidades.length}{' '}
                {comunidades.length === 1 ? 'comunidad' : 'comunidades'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
          {/* Contenido */}
          <div>
            {paquete.descripcion && (
              <p className="text-lg leading-relaxed text-gray-600">{paquete.descripcion}</p>
            )}

            {itinerario.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
                  Itinerario día por día
                </h2>
                <p className="mt-1.5 text-sm text-gray-500">
                  Esto es exactamente lo que vas a caminar, comer y dónde vas a dormir.
                </p>

                <ol className="mt-8 space-y-5">
                  {itinerario.map((d) => (
                    <li
                      key={d.dia}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                    >
                      <div
                        className="flex items-center gap-3.5 border-b border-gray-100 px-5 py-4"
                        style={{ background: hexA(color, 0.05) }}
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white"
                          style={{ background: color }}
                        >
                          D{d.dia}
                        </span>
                        <span className="font-extrabold text-gray-900">{d.recorrido}</span>
                      </div>

                      <ul className="divide-y divide-gray-50">
                        {d.items.map((it) => {
                          const meta = it.tipo ? ETIQUETA[it.tipo] : null;
                          const c = it.tipo ? COLOR_LIQ[it.tipo] : '#9CA3AF';
                          return (
                            <li key={it.id} className="flex gap-3.5 px-5 py-3">
                              <span
                                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                style={{ background: hexA(c, 0.12) }}
                              >
                                <Icono n={meta?.icono ?? 'clock'} s={14} c={c} />
                              </span>
                              <div className="min-w-0">
                                <p className="text-[15px] leading-snug text-gray-700">{it.texto}</p>
                                {meta && (
                                  <p
                                    className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide"
                                    style={{ color: c }}
                                  >
                                    {meta.label}
                                  </p>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ol>

                <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-900">
                  Guías, cocineras y anfitriones son de las comunidades por las que vas a pasar. Al
                  viajar con nosotros, el turismo se queda en la sierra.
                </p>
              </section>
            )}
          </div>

          {/* Reserva */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              {paquete.precio > 0 ? (
                <p>
                  <span className="text-sm text-gray-400">desde </span>
                  <span className="text-3xl font-extrabold text-gray-900">
                    ${paquete.precio.toLocaleString('es-MX')}
                  </span>
                  <span className="text-sm text-gray-400"> / persona</span>
                </p>
              ) : (
                <p className="text-xl font-extrabold text-gray-900">Cotización a medida</p>
              )}

              <p className="mt-2 text-sm text-gray-500">
                Guía local, alimentos y hospedaje en cabañas de la comunidad.
              </p>

              <button
                onClick={() => setAbierto(true)}
                className="mt-5 w-full rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
                style={{ background: color }}
              >
                Solicitar reserva
              </button>

              <a
                href={`https://wa.me/5219515148271?text=${encodeURIComponent(`Hola, me interesa la experiencia "${paquete.nombre}".`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Preguntar por WhatsApp
              </a>

              <ul className="mt-6 space-y-2.5 border-t border-gray-100 pt-5">
                {[
                  'Guía de la comunidad',
                  'Alimentos en comedores locales',
                  itinerario.length > 1 ? 'Hospedaje en cabañas' : 'Actividades incluidas',
                  'Anfitrión bilingüe disponible',
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Icono n="check" s={14} c="#16A34A" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {abierto && (
        <ReservaForm
          paqueteId={paquete.id}
          paqueteNombre={paquete.nombre}
          precio={paquete.precio}
          color={color}
          onClose={() => setAbierto(false)}
        />
      )}
    </>
  );
}
