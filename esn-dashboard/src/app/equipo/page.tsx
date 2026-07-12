import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { Nav, Footer, Portada } from '@/components/landing/Chrome';
import { Icono } from '@/components/ui';
import { EQUIPO, CONTACTO } from '@/lib/contenido';
import { GALERIA, fotoComunidad } from '@/lib/fotos';
import type { Comunidad } from '@/lib/tipos';

export const metadata: Metadata = {
  title: 'Quiénes somos · Expediciones Sierra Norte',
  description:
    'Una empresa comunitaria que pertenece y es operada por los Pueblos Mancomunados de Oaxaca. Aquí manda la asamblea.',
};

export const revalidate = 3600;

export default async function EquipoPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('comunidades').select('*').eq('activa', true).order('orden');
  const comunidades = (data ?? []) as Comunidad[];

  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <Portada
        eyebrow="Quiénes somos"
        titulo="Una empresa que es de los pueblos"
        entrada={EQUIPO.intro[0]}
      />

      <main className="mx-auto max-w-6xl px-5 py-20">
        {/* Gobernanza */}
        <section className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#1F7D5E]">
              Cómo se decide
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
              Manda la asamblea, no la gerencia
            </h2>
            <p className="mt-5 leading-relaxed text-gray-600">{EQUIPO.intro[1]}</p>

            <div className="mt-8 space-y-3">
              {[
                {
                  icono: 'users',
                  titulo: 'Asamblea General de Comuneros',
                  texto: 'Las comunidades participan en cada etapa del proyecto y en el Consejo Directivo.',
                },
                {
                  icono: 'mountain',
                  titulo: 'Consejo de ancianos',
                  texto:
                    'Todas las propuestas se presentan para su aprobación a los “caracterizados”, siguiendo los usos y costumbres.',
                },
                {
                  icono: 'route',
                  titulo: 'Cargos rotativos',
                  texto:
                    'Los equipos en las comunidades cambian cada uno a tres años. Así más gente del pueblo aprende el oficio.',
                },
              ].map((r) => (
                <div key={r.titulo} className="flex gap-3.5 rounded-xl border border-gray-200 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                    <Icono n={r.icono} s={17} c="#1F7D5E" />
                  </span>
                  <div>
                    <p className="font-bold text-gray-900">{r.titulo}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-gray-500">{r.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Foto + gestión híbrida */}
          <div>
            <div className="relative h-72 overflow-hidden rounded-2xl">
              <Image
                src={GALERIA[3]}
                alt="Comunero de los Pueblos Mancomunados"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="mt-5 rounded-2xl border border-gray-200 bg-gradient-to-br from-emerald-50 to-white p-7">
              <h3 className="text-lg font-extrabold text-gray-900">{EQUIPO.gestion.titulo}</h3>
              <p className="mt-2.5 leading-relaxed text-gray-600">{EQUIPO.gestion.texto}</p>
            </div>
          </div>
        </section>

        {/* Quién te recibe */}
        <section className="mt-24">
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#1F7D5E]">
            En el territorio
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Cada pueblo tiene su equipo
          </h2>
          <p className="mt-3 max-w-2xl text-gray-500">
            Guías, cocineras, encargados de cabañas y responsables de sendero. Son de la comunidad y
            viven de esto. Es a ellos a quienes vas a conocer cuando llegues.
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <span className="absolute inset-x-0 top-0 h-1" style={{ background: c.color }} />
                <p className="absolute inset-x-0 bottom-0 p-4 font-bold text-white">{c.nombre}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Oficina */}
        <section className="mt-24 grid gap-10 rounded-3xl border border-gray-200 bg-gray-50 p-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#1F7D5E]">
              Oficina de enlace
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900">
              Ciudad de Oaxaca
            </h2>
            <p className="mt-3 leading-relaxed text-gray-600">
              Desde 1998 tenemos una oficina de promoción y venta directa en el centro de Oaxaca. Ahí
              se coordinan las salidas con cada comunidad, pero las decisiones se toman en la sierra.
            </p>
          </div>

          <div className="space-y-1">
            <Dato icono="mountain" label="Dirección" valor={CONTACTO.direccion} />
            <Dato icono="note" label="Correo" valor={CONTACTO.email} href={`mailto:${CONTACTO.email}`} />
            <Dato
              icono="bell"
              label="Teléfono"
              valor={CONTACTO.telefono}
              href={`tel:${CONTACTO.telefono.replace(/\s/g, '')}`}
            />
          </div>
        </section>

        <div className="mt-14 text-center">
          <Link
            href="/#experiencias"
            className="inline-block rounded-xl bg-[#1F7D5E] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#166148]"
          >
            Ver las experiencias
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Dato({
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
  const cuerpo = (
    <div className="flex items-center gap-4 border-b border-gray-200 py-4 last:border-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
        <Icono n={icono} s={17} c="#1F7D5E" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{valor}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block transition hover:opacity-70">
      {cuerpo}
    </a>
  ) : (
    cuerpo
  );
}
