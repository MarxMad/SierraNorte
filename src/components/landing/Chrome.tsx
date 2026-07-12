import Image from 'next/image';
import Link from 'next/link';
import { CONTACTO } from '@/lib/contenido';

const LINKS = [
  { href: '/#experiencias', label: 'Experiencias' },
  { href: '/region', label: 'La región' },
  { href: '/proyecto', label: 'El proyecto' },
  { href: '/equipo', label: 'Quiénes somos' },
  { href: '/#contacto', label: 'Contacto' },
];

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-black/5 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image src="/sierran.png" alt="" width={36} height={36} />
          <span className="leading-tight">
            <span className="block text-[13px] font-extrabold text-gray-900">
              Expediciones Sierra Norte
            </span>
            <span className="block text-[10px] font-medium text-gray-500">
              Pueblos Mancomunados · Oaxaca
            </span>
          </span>
        </Link>
        <div className="flex-1" />
        <div className="hidden items-center gap-6 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-gray-600 transition hover:text-[#1F7D5E]"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <Link
          href="/login"
          className="ml-2 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-bold text-gray-700 transition hover:border-[#1F7D5E] hover:text-[#1F7D5E]"
        >
          Entrar
        </Link>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-10">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex flex-wrap items-center gap-4">
          <Image src="/sierran.png" alt="" width={32} height={32} />
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-gray-900">Expediciones Sierra Norte</p>
            <p className="text-xs text-gray-500">Pueblos Mancomunados · Oaxaca, México</p>
          </div>
          <div className="flex-1" />
          <div className="flex flex-wrap gap-5">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs font-semibold text-gray-500 transition hover:text-[#1F7D5E]"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-6">
          <a
            href={`mailto:${CONTACTO.email}`}
            className="text-xs font-semibold text-gray-500 hover:text-[#1F7D5E]"
          >
            {CONTACTO.email}
          </a>
          <span className="text-gray-200">·</span>
          <a
            href={`tel:${CONTACTO.telefono.replace(/\s/g, '')}`}
            className="text-xs font-semibold text-gray-500 hover:text-[#1F7D5E]"
          >
            {CONTACTO.telefono}
          </a>
          <div className="flex-1" />
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Expediciones Sierra Norte
          </p>
          <Link href="/login" className="text-xs font-bold text-gray-500 hover:text-[#1F7D5E]">
            Acceso del equipo
          </Link>
        </div>
      </div>
    </footer>
  );
}

/** Curvas de nivel — textura de mapa topográfico. */
export function Curvas({ sutil }: { sutil?: boolean }) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity: sutil ? 0.18 : 0.13 }}
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 800 400"
      fill="none"
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <path
          key={i}
          d={`M-50 ${90 + i * 34} C 120 ${40 + i * 34}, 240 ${150 + i * 30}, 400 ${100 + i * 32} S 700 ${30 + i * 34}, 860 ${110 + i * 33}`}
          stroke="#fff"
          strokeWidth={1.1}
          fill="none"
        />
      ))}
    </svg>
  );
}

/** Encabezado verde de las páginas interiores. */
export function Portada({
  eyebrow,
  titulo,
  entrada,
}: {
  eyebrow: string;
  titulo: string;
  entrada?: string;
}) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-[#0F3D2E] via-[#166148] to-[#1F7D5E]">
      <Curvas />
      <div className="relative mx-auto max-w-6xl px-5 py-20 sm:py-24">
        <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-300">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
          {titulo}
        </h1>
        {entrada && (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">{entrada}</p>
        )}
      </div>
    </header>
  );
}
