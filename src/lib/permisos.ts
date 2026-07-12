import type { Rol } from './tipos';

// =====================================================================
// Permisos por rol — espejo del RLS de la base.
// La base es la que MANDA (aunque alguien burle la UI, Postgres lo frena).
// Esto sólo decide qué se muestra.
// =====================================================================

export type Seccion = 'ventas' | 'comunidades' | 'liquidacion' | 'banca' | 'calendario' | 'admin';

const ACCESO: Record<Rol, Seccion[]> = {
  admin: ['ventas', 'comunidades', 'liquidacion', 'banca', 'calendario', 'admin'],
  ventas: ['ventas', 'comunidades', 'calendario'],
  comunidad: ['comunidades', 'liquidacion'],
  finanzas: ['banca', 'liquidacion', 'ventas', 'calendario'],
};

export const puedeVer = (rol: Rol, seccion: Seccion) => ACCESO[rol]?.includes(seccion) ?? false;

export const seccionesDe = (rol: Rol) => ACCESO[rol] ?? [];

// Escritura
export const puedeEditarVentas = (rol: Rol) => rol === 'admin' || rol === 'ventas';
export const puedeEditarPagos = (rol: Rol) => rol === 'admin' || rol === 'finanzas';
export const puedeLiquidar = (rol: Rol) => rol === 'admin' || rol === 'finanzas';
export const puedeEditarGastos = (rol: Rol) => rol === 'admin' || rol === 'finanzas' || rol === 'comunidad';
export const puedeAdministrar = (rol: Rol) => rol === 'admin';

// El coordinador de comunidad sólo confirma el checklist de SU pueblo
export const puedeCheckComunidad = (rol: Rol, miComunidad: string | null, comunidadId: string) =>
  rol === 'admin' || rol === 'ventas' || (rol === 'comunidad' && miComunidad === comunidadId);

// A dónde mandar a cada rol al entrar
export const inicioDe = (rol: Rol): string => {
  switch (rol) {
    case 'comunidad':
      return '/comunidades';
    case 'finanzas':
      return '/banca';
    default:
      return '/ventas';
  }
};

export const ETIQUETA_ROL: Record<Rol, string> = {
  admin: 'Administrador',
  ventas: 'Ventas',
  comunidad: 'Comunidad',
  finanzas: 'Finanzas',
};
