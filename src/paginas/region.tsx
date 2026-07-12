import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { clientePublico } from '@/lib/supabase/publico';
import { Nav, Footer, Curvas } from '@/components/landing/Chrome';
import { Icono } from '@/components/ui';
import { REGION } from '@/lib/contenido';
import { REGION_EN } from '@/lib/i18n/contenido-en';
import { dict, ruta, type Idioma } from '@/lib/i18n';
import { GALERIA, fotoComunidad } from '@/lib/fotos';
import type { Comunidad } from '@/lib/tipos';

export const metadata: Metadata = {
  title: 'La región · Expediciones Sierra Norte',
  description:
    'Bosque de niebla, 2,000 especies de plantas y más de 400 de aves. La Sierra Norte de Oaxaca, tierra de la gente de las nubes.',
};

export const revalidate = 3600;

// Una foto para cada bloque temático
const FOTO_SECCION: Record<string, string> = {
  geografia: '/fotos/montana-1.jpg',
  flora: '/fotos/bosque-mesofilo.jpg',
  fauna: '/fotos/hongo.jpg',
  clima: '/fotos/portada.jpg',
};

export default async function RegionPage({ lang }: { lang: Idioma }) {
  const d = dict(lang);
  const R = lang === 'es' ? REGION : REGION_EN;
  const supabase = clientePublico();
  const { data } = await supabase.from('comunidades').select('*').eq('activa', true).order('orden');
  const comunidades = (data ?? []) as Comunidad[];

  return (
    <div className="min-h-screen bg-white">
      <Nav lang={lang} aqui="/region" />

      {/* Portada con foto */}
      <header className="relative h-[480px] overflow-hidden sm:h-[560px]">
        <Image
          src="/fotos/sendero-bromelias.jpg"
          alt="Bosque de la Sierra Norte de Oaxaca"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F3D2E] via-[#0F3D2E]/70 to-[#0F3D2E]/30" />
        <Curvas />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-6xl px-5 pb-14">
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-300">
              {d.laRegion}
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
              {R.titulo}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
              {lang === 'es'
                ? 'Diez familias zapotecas dejaron Zaachila buscando tierras fértiles. Encontraron una montaña que el viento del Golfo cubre de niebla.'
                : REGION_EN.entradaCorta}
            </p>
          </div>
        </div>
      </header>

      {/* Cifras */}
      <section className="border-b border-gray-100 bg-white py-10">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 sm:grid-cols-4">
          {R.cifras.map((c) => (
            <div key={c.l}>
              <dt className="text-3xl font-extrabold text-[#1F7D5E] sm:text-4xl">
                {c.n}
                <span className="ml-1 text-sm font-bold text-gray-400">{c.u}</span>
              </dt>
              <dd className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {c.l}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <main>
        {/* El origen */}
        <section className="mx-auto max-w-3xl px-5 py-20 text-center">
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#1F7D5E]">
            {lang === 'es' ? 'El origen' : REGION_EN.origen}
          </p>
          <p className="mt-5 text-xl leading-relaxed text-gray-600 sm:text-2xl">
            {R.entrada}
          </p>
        </section>

        {/* Secciones alternadas con foto */}
        {R.secciones.map((s, i) => {
          const invertido = i % 2 === 1;
          return (
            <section
              key={s.id}
              id={s.id}
              className={i % 2 === 0 ? 'border-y border-gray-100 bg-gray-50' : 'bg-white'}
            >
              <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2">
                {/* Foto */}
                <div
                  className={`relative h-80 overflow-hidden rounded-3xl sm:h-96 ${
                    invertido ? 'lg:order-2' : ''
                  }`}
                >
                  <Image
                    src={FOTO_SECCION[s.id] ?? GALERIA[i]}
                    alt={s.titulo}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>

                {/* Texto */}
                <div className={invertido ? 'lg:order-1' : ''}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
                    <Icono n={s.icono} s={22} c="#1F7D5E" />
                  </span>
                  <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                    {s.titulo}
                  </h2>
                  <p className="mt-5 leading-relaxed text-gray-600">{s.texto}</p>
                  {s.extra && <p className="mt-4 leading-relaxed text-gray-600">{s.extra}</p>}
                </div>
              </div>
            </section>
          );
        })}

        {/* Cuándo venir */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#1F7D5E]">
            {lang === 'es' ? 'Cuándo venir' : REGION_EN.cuandoVenir}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {lang === 'es' ? 'Dos temporadas, dos sierras distintas' : REGION_EN.dosTemporadas}
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {R.cuandoIr.map((t, i) => (
              <div
                key={t.temporada}
                className="relative overflow-hidden rounded-3xl border border-gray-200"
              >
                <div className="relative h-44">
                  <Image
                    src={i === 0 ? '/fotos/bosque-mesofilo.jpg' : '/fotos/montana-3.jpg'}
                    alt={t.temporada}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                    <h3 className="text-xl font-extrabold text-white">
                      {lang === 'es' ? `Temporada de ${t.temporada}` : t.temporada}
                    </h3>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white"
                      style={{ background: t.color }}
                    >
                      {t.meses}
                    </span>
                  </div>
                </div>
                <p className="p-6 leading-relaxed text-gray-600">{t.texto}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900">
            <span className="mt-0.5 shrink-0">
              <Icono n="alert" s={16} c="#B45309" />
            </span>
            {lang === 'es'
              ? 'Trae un buen abrigo: en las cumbres el promedio es de 8 a 10 °C y hiela seguido. Y prepárate para un café entre las nubes, que es el mejor espectáculo.'
              : REGION_EN.aviso}
          </p>
        </section>

        {/* El territorio */}
        <section className="border-t border-gray-100 bg-gray-50 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#1F7D5E]">
              {lang === 'es' ? 'El territorio' : REGION_EN.territorio}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              {lang === 'es' ? 'Los pueblos que lo administran en común' : REGION_EN.territorioTitulo}
            </h2>
            <p className="mt-3 max-w-2xl text-gray-500">
              {lang === 'es'
                ? 'No hay dueño individual. El bosque es de todos, y todos responden por él ante la asamblea.'
                : REGION_EN.territorioSub}
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {comunidades.map((c) => (
                <div
                  key={c.id}
                  className="group relative h-44 overflow-hidden rounded-xl transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <Image
                    src={fotoComunidad(c.id)}
                    alt={c.nombre}
                    fill
                    sizes="(max-width: 768px) 100vw, 20vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <span className="absolute inset-x-0 top-0 h-1" style={{ background: c.color }} />
                  <p className="absolute inset-x-0 bottom-0 p-4 font-bold text-white">{c.nombre}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href={ruta(lang, '/#experiencias')}
                className="inline-block rounded-xl bg-[#1F7D5E] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#166148]"
              >
                {d.verExperiencias}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer lang={lang} />
    </div>
  );
}
