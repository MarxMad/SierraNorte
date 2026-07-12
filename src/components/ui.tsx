'use client';

import { hexA, iniciales, colorAvatar } from '@/lib/tipos';

// =====================================================================
// Iconos SVG — sin emojis, mismo set que el dashboard original
// =====================================================================
const PATHS: Record<string, string> = {
  clipboard:
    'M9 2h6a1 1 0 0 1 1 1v1h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V3a1 1 0 0 1 1-1Zm1 2v1h4V4h-4ZM6 6v14h12V6h-2v1H8V6H6Zm2 4h8v2H8v-2Zm0 4h8v2H8v-2Z',
  mountain: 'M12 4 2 20h20L12 4Zm0 4.2 3.1 5-1.6 1.6-1.5-1.5-3 3-1.6-1.1L12 8.2Z',
  bank: 'M12 2 2 8v2h20V8L12 2ZM4 12v6H2v2h20v-2h-2v-6h-2v6h-3v-6h-2v6h-3v-6H4Z',
  chart: 'M4 20V10h4v10H4Zm6 0V4h4v16h-4Zm6 0v-7h4v7h-4Z',
  receipt:
    'M5 2v20l2-1.5L9 22l2-1.5L13 22l2-1.5L17 22l2-1.5V2l-2 1.5L15 2l-2 1.5L11 2 9 3.5 7 2 5 3.5V2Zm3 5h8v2H8V7Zm0 4h8v2H8v-2Zm0 4h5v2H8v-2Z',
  calendar:
    'M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7ZM5 9h14v10H5V9Z',
  user: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4 0-8 2-8 5v2h16v-2c0-3-4-5-8-5Z',
  users:
    'M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.5 13c-3.3 0-6.5 1.7-6.5 4v3h13v-3c0-2.3-3.2-4-6.5-4Zm8 0c-.7 0-1.4.1-2 .2 1.5 1 2.5 2.3 2.5 3.8v3h5v-3c0-2.1-2.7-4-5.5-4Z',
  child: 'M12 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm-4 8h8a2 2 0 0 1 2 2v4h-2v6h-2v-6h-4v6H8v-6H6v-4a2 2 0 0 1 2-2Z',
  utensils:
    'M6 2v8a2 2 0 0 0 2 2v10h2V12a2 2 0 0 0 2-2V2h-1.6v6.4H9.6V2H8.4v6.4H7.6V2H6Zm11 0c-1.7 0-3 2.7-3 6 0 2.3.9 4.2 2 5v9h2V2h-1Z',
  bus: 'M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-1 1.7V19h-2v-2H6v2H4v-2.3A2 2 0 0 1 3 15V6a2 2 0 0 1 2-2Zm0 2v5h14V6H5Zm1.5 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm11 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z',
  ticket: 'M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V6Zm6 2v8h2V8H9Z',
  edit: 'M4 16.5V20h3.5l9.9-9.9-3.5-3.5L4 16.5ZM19.7 7.3a1 1 0 0 0 0-1.4l-1.6-1.6a1 1 0 0 0-1.4 0l-1.4 1.4 3.5 3.5 1-1Z',
  eye: 'M12 5C6.5 5 2.7 9.6 2 12c.7 2.4 4.5 7 10 7s9.3-4.6 10-7c-.7-2.4-4.5-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  trash: 'M9 3h6l1 2h4v2H4V5h4l1-2ZM6 9h12l-1 12H7L6 9Z',
  plus: 'M11 5v6H5v2h6v6h2v-6h6v-2h-6V5h-2Z',
  close: 'M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6 6.4 5Z',
  check: 'M9.5 16.2 4.8 11.5l1.4-1.4 3.3 3.3 8.3-8.3 1.4 1.4-9.7 9.7Z',
  checkCircle: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.2 14.5-4-4 1.4-1.4 2.6 2.6 5.6-5.6L17.8 9l-7 7.5Z',
  chevron: 'M8.5 5.5 15 12l-6.5 6.5L7 17l5-5-5-5 1.5-1.5Z',
  search: 'M11 4a7 7 0 1 0 4.95 11.95l3.55 3.55 1.4-1.4-3.55-3.55A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z',
  wallet: 'M3 5h15a2 2 0 0 1 2 2v1h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm14 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z',
  cash: 'M2 6h20v12H2V6Zm2 2v8h16V8H4Zm8 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z',
  card: 'M2 5h20a1 1 0 0 1 1 1v3H1V6a1 1 0 0 1 1-1Zm-1 6h22v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-7Zm3 4v2h5v-2H4Z',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5v5.4l4 2.3-1 1.7-5-2.9V7h2Z',
  alert: 'M12 2 1 21h22L12 2Zm-1 6h2v7h-2V8Zm0 9h2v2h-2v-2Z',
  percent: 'M6.5 4a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm11 11a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM5 19.6 17.6 4l1.4 1.1L6.4 20.7 5 19.6Z',
  trendUp: 'M3.5 17.5 2 16l7-7 4 4 6-6H16V5h6v6h-2V8.4l-7 7-4-4-5.5 6.1Z',
  route: 'M6 3a3 3 0 0 1 1 5.8V11h4a3 3 0 0 0 3-3V5.8A3 3 0 1 1 16 5.8V8a5 5 0 0 1-5 5H7v2.2a3 3 0 1 1-2 0V8.8A3 3 0 0 1 6 3Z',
  language:
    'M4 4h9v2H9.6c-.3 2.2-1.1 4-2.2 5.4.7.7 1.5 1.3 2.4 1.8l-.8 1.8c-1.1-.6-2.1-1.3-3-2.2-1.1 1-2.4 1.8-3.9 2.3L1.4 13c1.2-.4 2.2-1 3.1-1.7C3.4 9.9 2.6 8.1 2.3 6H4V4Zm2.3 2c.3 1.6.9 2.9 1.7 3.9.8-1 1.4-2.3 1.6-3.9H6.3ZM16 9h2.5l4 13h-2.1l-.9-3h-4.5l-.9 3h-2.1l4-13Zm.5 8h3l-1.5-5-1.5 5Z',
  cog: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 4-2.1 1.6.4 2.6-2.3 1.3-1.9-1.8-2.6.7-1 2.4h-2.6l-1-2.4-2.6-.7-1.9 1.8-2.3-1.3.4-2.6L1 12l2.1-1.6-.4-2.6 2.3-1.3 1.9 1.8 2.6-.7 1-2.4h2.6l1 2.4 2.6.7 1.9-1.8 2.3 1.3-.4 2.6L21 12Z',
  logout: 'M10 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-8v-2h8V5h-8V3ZM8 8.5 4.5 12 8 15.5V13h6v-2H8V8.5Z',
  download: 'M12 3v10l4-4 1.4 1.4L12 16.8 6.6 11.4 8 10l4 4V3h0ZM4 19h16v2H4z',
  dots: 'M12 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
  note: 'M4 3h12l4 4v14H4V3Zm2 2v14h12V9h-4V5H6Zm2 6h8v2H8v-2Zm0 4h8v2H8v-2Z',
  hut: 'M12 3 3 10h2v11h5v-6h4v6h5V10h2l-9-7Z',
};

export function Icono({
  n,
  s = 16,
  c = 'currentColor',
  className,
}: {
  n: keyof typeof PATHS | string;
  s?: number;
  c?: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill={c} className={className} aria-hidden>
      <path d={PATHS[n] ?? ''} />
    </svg>
  );
}

// =====================================================================
// Píldora
// =====================================================================
export function Pill({
  texto,
  color,
  solid,
  dot = true,
  onClick,
}: {
  texto: string;
  color: string;
  solid?: boolean;
  dot?: boolean;
  onClick?: () => void;
}) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${
        onClick ? 'cursor-pointer' : ''
      }`}
      style={{
        color: solid ? '#fff' : color,
        background: solid ? color : hexA(color, 0.12),
        border: solid ? 'none' : `1px solid ${hexA(color, 0.28)}`,
      }}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: solid ? 'rgba(255,255,255,.9)' : color }}
        />
      )}
      {texto}
    </span>
  );
}

// =====================================================================
// Avatar
// =====================================================================
export function Avatar({ nombre, s = 28 }: { nombre: string; s?: number }) {
  return (
    <span
      title={nombre}
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white"
      style={{
        width: s,
        height: s,
        background: colorAvatar(nombre),
        fontSize: s * 0.4,
      }}
    >
      {iniciales(nombre)}
    </span>
  );
}

// =====================================================================
// Botón de acción (editar, ver, borrar…)
// =====================================================================
export function BotonAccion({
  icono,
  titulo,
  onClick,
  color = '#5B21B6',
}: {
  icono: string;
  titulo: string;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      title={titulo}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white transition hover:border-current"
      style={{ color }}
    >
      <Icono n={icono} s={15} c={color} />
    </button>
  );
}

// =====================================================================
// Tarjeta de KPI
// =====================================================================
export function Kpi({
  icono,
  label,
  valor,
  color,
}: {
  icono: string;
  label: string;
  valor: string | number;
  color: string;
}) {
  return (
    <div className="flex min-w-[170px] flex-1 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ background: hexA(color, 0.12) }}
      >
        <Icono n={icono} s={19} c={color} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-gray-500">{label}</span>
        <span className="block text-lg font-extrabold" style={{ color }}>
          {valor}
        </span>
      </span>
    </div>
  );
}

// =====================================================================
// Barra de progreso
// =====================================================================
export function Barra({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
      />
    </div>
  );
}

// =====================================================================
// Estado vacío
// =====================================================================
export function Vacio({ titulo, sub, icono = 'calendar' }: { titulo: string; sub?: string; icono?: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-6 py-14 text-center">
      <span className="mx-auto mb-3 flex justify-center">
        <Icono n={icono} s={30} c="#D1D5DB" />
      </span>
      <p className="font-bold text-gray-700">{titulo}</p>
      {sub && <p className="mt-1 text-sm text-gray-400">{sub}</p>}
    </div>
  );
}

// =====================================================================
// Modal
// =====================================================================
export function Modal({
  titulo,
  sub,
  color = '#5B21B6',
  icono,
  chip,
  onClose,
  children,
  footer,
  ancho = 'max-w-2xl',
}: {
  titulo: string;
  sub?: string;
  color?: string;
  icono?: string;
  chip?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  ancho?: string;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/50 p-4 py-10 backdrop-blur-[2px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${ancho} overflow-hidden rounded-2xl bg-white shadow-2xl`}
      >
        <div className="h-1" style={{ background: color }} />
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
          {icono && (
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: hexA(color, 0.12) }}
            >
              <Icono n={icono} s={20} c={color} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-gray-900">{titulo}</h2>
              {chip}
            </div>
            {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
          </div>
          <button
            onClick={onClose}
            title="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 transition hover:bg-gray-200"
          >
            <Icono n="close" s={17} c="#6B7280" />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2.5 border-t border-gray-100 bg-gray-50/60 px-6 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function BtnPrimario({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg bg-[#5B21B6] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#4C1D95] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function BtnGhost({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

// =====================================================================
// Campo de formulario
// =====================================================================
export function Campo({
  label,
  icono,
  req,
  children,
}: {
  label: string;
  icono?: string;
  req?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-gray-700">
        {icono && <Icono n={icono} s={13} c="#9CA3AF" />}
        {label}
        {req && <span className="text-red-600">*</span>}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#5B21B6] focus:ring-2 focus:ring-[#5B21B6]/15';
