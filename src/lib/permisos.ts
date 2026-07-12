import type { Rol } from './tipos';

// =====================================================================
// Permisos por rol — espejo del RLS de la base.
// La base es la que MANDA (aunque alguien burle la UI, Postgres lo frena).
// Esto sólo decide qué se muestra.
// =====================================================================

export type Seccion = 'ventas' | 'comunidades' | 'liquidacion' | 'banca' | 'calendario' | 'admin';

// La información es de todos: cualquier rol ENTRA a toda la operación.
// Usuarios se queda fuera: no es info de la operación, es el control de
// quién puede entrar y con qué permisos.
const OPERACION: Seccion[] = ['ventas', 'comunidades', 'liquidacion', 'banca', 'calendario'];

const ACCESO: Record<Rol, Seccion[]> = {
  admin: [...OPERACION, 'admin'],
  ventas: OPERACION,
  comunidad: OPERACION,
  finanzas: OPERACION,
};

export const puedeVer = (rol: Rol, seccion: Seccion) => ACCESO[rol]?.includes(seccion) ?? false;

export const seccionesDe = (rol: Rol) => ACCESO[rol] ?? [];

// -----------------------------------------------------------------
// Escritura — aquí sí, cada quien mueve lo suyo.
// -----------------------------------------------------------------
export const puedeEditarVentas = (rol: Rol) => rol === 'admin' || rol === 'ventas';
export const puedeEditarPagos = (rol: Rol) => rol === 'admin' || rol === 'finanzas';
export const puedeLiquidar = (rol: Rol) => rol === 'admin' || rol === 'finanzas';
export const puedeAdministrar = (rol: Rol) => rol === 'admin';

// Gastos: finanzas los captura todos; el coordinador, sólo los de SU pueblo.
// (Un gasto sin comunidad asignada es de la cooperativa: no es suyo.)
export const puedeEditarGasto = (rol: Rol, miComunidad: string | null, comunidadDelGasto: string | null) =>
  rol === 'admin' ||
  rol === 'finanzas' ||
  (rol === 'comunidad' && comunidadDelGasto !== null && miComunidad === comunidadDelGasto);

// ¿Puede este usuario dar de alta gastos? (el botón "Agregar gasto")
export const puedeCapturarGastos = (rol: Rol) =>
  rol === 'admin' || rol === 'finanzas' || rol === 'comunidad';

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
