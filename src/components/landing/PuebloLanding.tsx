'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Comunidad, Duracion } from '@/lib/tipos';
import type { PaqueteWeb } from '@/paginas/landing';
import { Nav, Footer } from '@/components/landing/Chrome';
import { Icono } from '@/components/ui';
import { COLOR_DURACION, dinero, hexA } from '@/lib/tipos';
import { fotoDe, fotoComunidad } from '@/lib/fotos';
import { dict, ruta, type Idioma } from '@/lib/i18n';
import { solicitarInformacionLead } from '@/app/acciones-web';

export default function PuebloLanding({
  lang,
  comunidad,
  descripcion,
  paquetes,
}: {
  lang: Idioma;
  comunidad: Comunidad;
  descripcion: string | null;
  paquetes: PaqueteWeb[];
}) {
  const d = dict(lang);
  const [leadOk, setLeadOk] = useState(false);
  const [lead, setLead] = useState({ nombre: '', email: '', notas: '' });
  const [pending, setPending] = useState(false);

  const experiencias = useMemo(() => paquetes.filter((p) => p.duracion !== 'Servicios'), [paquetes]);

  const enviarLead = async () => {
    setPending(true);
    const res = await solicitarInformacionLead({
      ...lead,
      origenComunidadId: comunidad.id,
      lang,
    });
    setPending(false);
    if (res.ok) setLeadOk(true);
    else alert(res.error);
  };

  return (
    <div className="min-h-screen bg-white">
      <Nav lang={lang} aqui={`/pueblos/${comunidad.id}`} />

      <header className="relative overflow-hidden">
        <Image
          src={fotoComunidad(comunidad.id)}
          alt={comunidad.nombre}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-28 sm:pt-32">
          <p className="text-xs font-extrabold uppercase tracking-widest text-white/70">
            Pueblos Mancomunados · Oaxaca
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {comunidad.nombre}
          </h1>
          {descripcion && (
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">{descripcion}</p>
          )}
          <Link
            href={ruta(lang, '/')}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
          >
            <Icono n="chevron" s={14} c="#fff" />
            {d.puebloVerTodas}
          </Link>
        </div>
        <span className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: comunidad.color }} />
      </header>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-extrabold text-gray-900">
          {d.puebloExperiencias} {comunidad.nombre}
        </h2>
        <p className="mt-2 text-gray-500">
          {experiencias.length}{' '}
          {lang === 'en'
            ? experiencesLabel(experiencias.length)
            : experiencias.length === 1
              ? 'experiencia'
              : 'experiencias'}
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {experiencias.map((p) => {
            const color = COLOR_DURACION[p.duracion];
            return (
              <Link
                key={p.id}
                href={`${ruta(lang, `/experiencias/${p.id}`)}?pueblo=${comunidad.id}`}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[4/3]">
                  <Image src={fotoDe(p.id)} alt="" fill sizes="33vw" className="object-cover transition group-hover:scale-105" />
                  <span
                    className="absolute left-3 top-3 rounded-lg px-2 py-1 text-[11px] font-extrabold text-white"
                    style={{ background: hexA(color, 0.92) }}
                  >
                    {p.duracion}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-extrabold text-gray-900 group-hover:text-[#1F7D5E]">{p.nombre}</h3>
                  <p className="mt-2 text-sm font-bold" style={{ color }}>
                    {p.precio > 0 ? `${dinero(p.precio)} / persona` : d.cotizacion}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50 py-14">
        <div className="mx-auto max-w-lg px-5">
          <h2 className="text-xl font-extrabold text-gray-900">{d.puebloContactoLead}</h2>
          {leadOk ? (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              {d.puebloLeadOk}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#5B21B6]"
                placeholder={d.formNombrePh}
                value={lead.nombre}
                onChange={(e) => setLead((v) => ({ ...v, nombre: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#5B21B6]"
                type="email"
                placeholder={d.formCorreo}
                value={lead.email}
                onChange={(e) => setLead((v) => ({ ...v, email: e.target.value }))}
              />
              <textarea
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#5B21B6]"
                rows={3}
                placeholder={d.formNotasPh}
                value={lead.notas}
                onChange={(e) => setLead((v) => ({ ...v, notas: e.target.value }))}
              />
              <button
                type="button"
                disabled={pending}
                onClick={enviarLead}
                className="w-full rounded-xl bg-[#5B21B6] py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {pending ? d.formEnviando : d.puebloContactoLead}
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer lang={lang} />
    </div>
  );
}

function experiencesLabel(n: number) {
  return n === 1 ? 'experience' : 'experiences';
}
