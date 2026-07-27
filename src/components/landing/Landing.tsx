'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Comunidad, Duracion } from '@/lib/tipos';
import type { PaqueteWeb } from '@/paginas/landing';
import { Icono } from '@/components/ui';
import { Nav, Footer, Curvas } from '@/components/landing/Chrome';
import { CONTACTO } from '@/lib/contenido';
import { COLOR_DURACION, hexA } from '@/lib/tipos';
import { PORTADA, fotoDe, fotoComunidad } from '@/lib/fotos';
import { dict, ruta, type Idioma, type Dict } from '@/lib/i18n';

const WHATSAPP = CONTACTO.whatsapp;
const TEL = CONTACTO.telefono;
const EMAIL = CONTACTO.email;
const DIRECCION = CONTACTO.direccion;

const ORDEN: Duracion[] = ['1 día', '2 días', '3 días', '4 días', '5 días', '7 días', 'Servicios'];

export default function Landing({
  lang,
  paquetes,
  comunidades,
}: {
  lang: Idioma;
  paquetes: PaqueteWeb[];
  comunidades: Comunidad[];
}) {
  const d = dict(lang);
  const [filtro, setFiltro] = useState<Duracion | 'todos'>('todos');

  const experiencias = useMemo(() => paquetes.filter((p) => p.duracion !== 'Servicios'), [paquetes]);

  const duraciones = useMemo(() => {
    const set = new Set(experiencias.map((p) => p.duracion));
    return ORDEN.filter((d) => set.has(d));
  }, [experiencias]);

  const visibles = useMemo(
    () => (filtro === 'todos' ? experiencias : experiencias.filter((p) => p.duracion === filtro)),
    [experiencias, filtro]
  );

  const servicios = paquetes.find((p) => p.duracion === 'Servicios');

  return (
    <div className="min-h-screen bg-white">
      <Nav lang={lang} aqui="/" />

      {/* ============ HERO ============ */}
      <header className="relative overflow-hidden">
        <Image
          src={PORTADA}
          alt="Bosque de pino-encino en la Sierra Norte de Oaxaca"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F3D2E]/92 via-[#0F3D2E]/75 to-[#1F7D5E]/60" />
        <Curvas />
        <div className="relative mx-auto max-w-6xl px-5 py-24 sm:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white/90 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
            {d.heroBadge}
          </span>

          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-6xl">
            {d.heroTitulo1}
            <br />
            <span className="text-emerald-300">{d.heroTitulo2}</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
            {d.heroSub(experiencias.length, comunidades.length)}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#experiencias"
              className="rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#0F3D2E] shadow-lg shadow-black/20 transition hover:bg-emerald-50"
            >
              {d.verExperiencias}
            </a>
            <a
              href={`https://wa.me/${WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              <IconoWhats />
              {d.reservarWhats}
            </a>
          </div>

          <dl className="mt-16 grid max-w-2xl grid-cols-2 gap-6 border-t border-white/15 pt-8 sm:grid-cols-4">
            <Dato n={comunidades.length} l={d.comunidades} />
            <Dato n={experiencias.length} l={d.experiencias} />
            <Dato n="1–7" l={d.diasDeRuta} />
            <Dato n="100%" l={d.comunitario} />
          </dl>
        </div>
      </header>

      {/* ============ EXPERIENCIAS ============ */}
      <section id="experiencias" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#1F7D5E]">
              {d.paquetesEyebrow}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {d.paquetesTitulo}
            </h2>
            <p className="mt-3 max-w-xl text-gray-500">
              {d.paquetesSub}
            </p>
          </div>
        </div>

        {/* Filtro */}
        <div className="mb-8 flex flex-wrap gap-2">
          <Filtro activo={filtro === 'todos'} onClick={() => setFiltro('todos')} color="#0F3D2E">
            {d.todas} ({experiencias.length})
          </Filtro>
          {duraciones.map((d) => {
            const n = experiencias.filter((p) => p.duracion === d).length;
            return (
              <Filtro
                key={d}
                activo={filtro === d}
                onClick={() => setFiltro(d)}
                color={COLOR_DURACION[d]}
              >
                {d} ({n})
              </Filtro>
            );
          })}
        </div>

        {/* Tarjetas */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visibles.map((p) => (
            <Tarjeta key={p.id} p={p} lang={lang} d={d} />
          ))}
        </div>

        {/* Servicios sueltos */}
        {servicios && (
          <div className="mt-12 rounded-2xl border border-gray-200 bg-gradient-to-br from-teal-50 to-white p-8">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex-1">
                <p className="text-xs font-extrabold uppercase tracking-widest text-teal-700">
                  {d.alaCarta}
                </p>
                <h3 className="mt-1.5 text-xl font-extrabold text-gray-900">
                  {d.alaCartaTitulo}
                </h3>
                <p className="mt-2 max-w-lg text-sm text-gray-600">
                  {d.alaCartaSub}
                </p>
              </div>
              <a
                href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lang === 'es' ? 'Hola, me interesan los servicios individuales.' : 'Hi, I am interested in the individual services.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-800"
              >
                {d.cotizarServicios}
              </a>
            </div>
          </div>
        )}
      </section>

      {/* ============ COMUNIDADES ============ */}
      <section id="comunidades" className="border-y border-gray-100 bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#1F7D5E]">
            {d.pueblosEyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {d.pueblosTitulo(comunidades.length)}
          </h2>
          <p className="mt-3 max-w-2xl text-gray-500">
            {d.pueblosSub}
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {comunidades.map((c) => {
              const n = paquetes.filter((p) => p.comunidades.includes(c.nombre)).length;
              return (
                <Link
                  key={c.id}
                  href={ruta(lang, `/pueblos/${c.id}`)}
                  className="group relative block h-40 overflow-hidden rounded-xl transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <Image
                    src={fotoComunidad(c.id)}
                    alt={c.nombre}
                    fill
                    sizes="(max-width: 768px) 100vw, 20vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="font-bold text-white">{c.nombre}</p>
                    <p className="mt-0.5 text-xs font-semibold text-white/70">
                      {d.experiencia(n)}
                    </p>
                  </div>
                  <span
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ background: c.color }}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ NOSOTROS ============ */}
      <section id="nosotros" className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#1F7D5E]">
              {d.porQueEyebrow}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {d.porQueTitulo}
            </h2>
            <blockquote className="mt-6 border-l-4 border-[#1F7D5E] pl-5 text-lg italic leading-relaxed text-gray-600">
              “When done right, tourism can protect the natural and cultural treasures of a place,
              rather than destroy them.”
            </blockquote>
            <p className="mt-6 leading-relaxed text-gray-600">{d.porQueTexto}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Pilar icono="route" titulo={d.pilar1t} texto={d.pilar1d} />
            <Pilar icono="utensils" titulo={d.pilar2t} texto={d.pilar2d} />
            <Pilar icono="hut" titulo={d.pilar3t} texto={d.pilar3d} />
            <Pilar icono="language" titulo={d.pilar4t} texto={d.pilar4d} />
          </div>
        </div>
      </section>

      {/* ============ CONTACTO ============ */}
      <section id="contacto" className="relative overflow-hidden bg-[#0F3D2E] py-20">
        <Curvas />
        <div className="relative mx-auto max-w-6xl px-5">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {d.contactoTitulo}
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-white/70">
                {d.contactoSub}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`https://wa.me/${WHATSAPP}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/20 transition hover:brightness-105"
                >
                  <IconoWhats />
                  WhatsApp
                </a>
                <a
                  href={`mailto:${EMAIL}`}
                  className="rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  {d.enviarCorreo}
                </a>
              </div>
            </div>

            <div className="space-y-1 lg:pl-10">
              <Contacto icono="note" label={d.correo} valor={EMAIL} href={`mailto:${EMAIL}`} />
              <Contacto icono="bell" label={d.telefono} valor={TEL} href={`tel:${TEL.replace(/\s/g, '')}`} />
              <Contacto icono="mountain" label={d.oficina} valor={DIRECCION} />
            </div>
          </div>
        </div>
      </section>

      <Footer lang={lang} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Tarjeta({ p, lang, d }: { p: PaqueteWeb; lang: Idioma; d: Dict }) {
  const color = COLOR_DURACION[p.duracion];

  return (
    <Link
      href={ruta(lang, `/experiencias/${p.id}`)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Foto */}
      <div className="relative h-52 overflow-hidden">
        <Image
          src={fotoDe(p.id)}
          alt={p.nombre}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <span
          className="absolute left-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white shadow-sm"
          style={{ background: color }}
        >
          {p.duracion}
        </span>
        {p.dias > 0 && (
          <span className="absolute bottom-3.5 left-4 text-xs font-bold text-white/95 drop-shadow">
            {d.diaRuta(p.dias)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-extrabold leading-snug text-gray-900 transition group-hover:text-[#1F7D5E]">
          {p.nombre}
        </h3>

        <div className="mt-2 flex flex-wrap gap-1">
          {p.comunidades.slice(0, 3).map((c) => (
            <span
              key={c}
              className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-600"
            >
              {c}
            </span>
          ))}
          {p.comunidades.length > 3 && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-bold text-gray-500">
              +{p.comunidades.length - 3}
            </span>
          )}
        </div>

        {p.descripcion && (
          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-500">
            {p.descripcion}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
          {p.precio > 0 ? (
            <span>
              <span className="text-xs text-gray-400">{d.desde} </span>
              <span className="text-lg font-extrabold text-gray-900">
                ${p.precio.toLocaleString('es-MX')}
              </span>
            </span>
          ) : (
            <span className="text-sm font-semibold text-gray-400">{d.cotizacion}</span>
          )}

          <span
            className="flex items-center gap-1 text-xs font-extrabold transition group-hover:gap-2"
            style={{ color }}
          >
            {d.verItinerario}
            <Icono n="chevron" s={12} c={color} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Filtro({
  activo,
  onClick,
  color,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border-2 px-4 py-2 text-sm font-bold transition"
      style={{
        borderColor: activo ? color : '#E5E7EB',
        background: activo ? color : '#fff',
        color: activo ? '#fff' : '#6B7280',
      }}
    >
      {children}
    </button>
  );
}

function Dato({ n, l }: { n: string | number; l: string }) {
  return (
    <div>
      <dt className="text-3xl font-extrabold text-white">{n}</dt>
      <dd className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-white/50">{l}</dd>
    </div>
  );
}

function Pilar({ icono, titulo, texto }: { icono: string; titulo: string; texto: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-5 transition hover:border-[#1F7D5E]/40 hover:shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
        <Icono n={icono} s={19} c="#1F7D5E" />
      </span>
      <h3 className="mt-3.5 font-extrabold text-gray-900">{titulo}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{texto}</p>
    </div>
  );
}

function Contacto({
  icono,
  label,
  valor,
  href,
}: {
  icono: string;
  label: string;
  valor: string;
  href?: string;
}) {
  const contenido = (
    <div className="flex items-center gap-4 border-b border-white/10 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
        <Icono n={icono} s={17} c="#6EE7B7" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-white/40">{label}</p>
        <p className="text-sm font-semibold text-white">{valor}</p>
      </div>
    </div>
  );

  return href ? (
    <a href={href} className="block transition hover:opacity-80">
      {contenido}
    </a>
  ) : (
    contenido
  );
}

function IconoWhats() {
  return (
    <svg viewBox="0 0 24 24" width={17} height={17} fill="currentColor" aria-hidden>
      <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-1.6-.8-2.7-1.5-3.7-3.3-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.5.8.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
    </svg>
  );
}
