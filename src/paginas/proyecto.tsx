import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { Nav, Footer, Curvas } from '@/components/landing/Chrome';
import { Icono } from '@/components/ui';
import { PROYECTO } from '@/lib/contenido';
import { PROYECTO_EN } from '@/lib/i18n/contenido-en';
import { dict, ruta, type Idioma } from '@/lib/i18n';
import { GALERIA } from '@/lib/fotos';

export const metadata: Metadata = {
  title: 'El proyecto · Expediciones Sierra Norte',
  description:
    'Desde 1994: un modelo de desarrollo regional operado por las comunidades zapotecas de los Pueblos Mancomunados.',
};

export const revalidate = 3600;

export default async function ProyectoPage({ lang }: { lang: Idioma }) {
  const d = dict(lang);
  const P = lang === 'es' ? PROYECTO : PROYECTO_EN;
  const supabase = await createClient();
  const [{ count: paquetes }, { count: comunidades }] = await Promise.all([
    supabase.from('paquetes').select('*', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('comunidades').select('*', { count: 'exact', head: true }).eq('activa', true),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <Nav lang={lang} aqui="/proyecto" />

      {/* Portada */}
      <header className="relative h-[440px] overflow-hidden sm:h-[520px]">
        <Image
          src="/fotos/maguey-latuvi.jpg"
          alt="Comunero de los Pueblos Mancomunados"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F3D2E] via-[#0F3D2E]/85 to-[#0F3D2E]/25" />
        <Curvas />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-6xl px-5 pb-14">
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-300">
              {d.elProyecto}
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
              {P.titulo}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
              {P.entrada}
            </p>
          </div>
        </div>
      </header>

      {/* Cifras */}
      <section className="border-b border-gray-100 bg-white py-10">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 sm:grid-cols-4">
          <Cifra n="1994" l={lang === 'es' ? 'Primer año de operación' : 'First year of operation'} />
          <Cifra n="100+" l={lang === 'es' ? 'Kilómetros de senderos' : 'Kilometres of trail'} />
          <Cifra n={String(comunidades ?? 10)} l={d.comunidades} />
          <Cifra n={String(paquetes ?? 33)} l={d.experiencias} />
        </dl>
      </section>

      <main>
        {/* Misión */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="relative overflow-hidden rounded-3xl">
            <Image
              src={GALERIA[0]}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F3D2E]/95 to-[#1F7D5E]/85" />
            <Curvas />
            <div className="relative p-10 sm:p-16">
              <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-300">
                {lang === 'es' ? 'Nuestra misión' : PROYECTO_EN.nuestraMision}
              </p>
              <blockquote className="mt-5 max-w-3xl text-2xl font-semibold leading-relaxed text-white sm:text-3xl">
                “{P.mision}”
              </blockquote>
            </div>
          </div>
        </section>

        {/* Línea del tiempo */}
        <section className="border-y border-gray-100 bg-gray-50 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#1F7D5E]">
              {lang === 'es' ? 'Cómo llegamos hasta aquí' : PROYECTO_EN.comoLlegamos}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {lang === 'es' ? 'Treinta años de trabajo comunitario' : PROYECTO_EN.treintaAnios}
            </h2>

            <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {P.hitos.map((h, i) => {
                const esHoy = h.anio === 'Hoy' || h.anio === 'Today';
                return (
                  <li
                    key={i}
                    className={`relative overflow-hidden rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-md ${
                      esHoy
                        ? 'border-[#1F7D5E] bg-[#1F7D5E] text-white'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <span
                      className={`text-4xl font-extrabold ${
                        esHoy ? 'text-white/30' : 'text-gray-100'
                      }`}
                    >
                      {h.anio}
                    </span>
                    <h3
                      className={`mt-3 text-lg font-extrabold ${
                        esHoy ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {h.titulo}
                    </h3>
                    <p
                      className={`mt-2 text-sm leading-relaxed ${
                        esHoy ? 'text-white/80' : 'text-gray-600'
                      }`}
                    >
                      {h.texto}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Objetivos */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-xs font-extrabold uppercase tracking-widest text-[#1F7D5E]">
                {lang === 'es' ? 'Para qué lo hacemos' : PROYECTO_EN.paraQue}
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                {lang === 'es' ? 'Cuatro objetivos fundamentales' : PROYECTO_EN.cuatroObjetivos}
              </h2>
              <div className="relative mt-8 h-64 overflow-hidden rounded-2xl">
                <Image
                  src={GALERIA[4]}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>

            <ol className="space-y-4">
              {P.objetivos.map((o, i) => (
                <li
                  key={i}
                  className="flex gap-5 rounded-2xl border border-gray-200 p-6 transition hover:border-[#1F7D5E]/40 hover:shadow-sm"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                      <Icono n={o.icono} s={19} c="#1F7D5E" />
                    </span>
                    <span className="text-xs font-extrabold text-gray-300">0{i + 1}</span>
                  </div>
                  <p className="pt-1.5 leading-relaxed text-gray-600">{o.texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Galería */}
        <section className="border-t border-gray-100 bg-gray-50 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#1F7D5E]">
              {lang === 'es' ? 'La sierra' : PROYECTO_EN.laSierra}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {lang === 'es' ? 'Esto es lo que vas a encontrar' : PROYECTO_EN.loQueEncontraras}
            </h2>

            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
              {GALERIA.map((f, i) => (
                <div
                  key={f}
                  className={`group relative overflow-hidden rounded-xl ${
                    i === 0 || i === 5 ? 'col-span-2 row-span-2 h-64 md:h-full' : 'h-40'
                  }`}
                >
                  <Image
                    src={f}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cierre */}
        <section className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            {lang === 'es' ? 'El proyecto se sostiene con quien lo camina' : PROYECTO_EN.cierreTitulo}
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-gray-500">
            {lang === 'es'
              ? 'Lo que dejas en la sierra se queda en la sierra: en quien te guía, en quien te da de comer y en quien mantiene el sendero abierto.'
              : PROYECTO_EN.cierreTexto}
          </p>
          <Link
            href={ruta(lang, '/#experiencias')}
            className="mt-8 inline-block rounded-xl bg-[#1F7D5E] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#166148]"
          >
            {d.verExperiencias}
          </Link>
        </section>
      </main>

      <Footer lang={lang} />
    </div>
  );
}

function Cifra({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <dt className="text-3xl font-extrabold text-[#1F7D5E] sm:text-4xl">{n}</dt>
      <dd className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-gray-500">{l}</dd>
    </div>
  );
}
