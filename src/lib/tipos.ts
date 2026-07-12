// =====================================================================
// Tipos del dominio — reflejan el esquema de Supabase
// =====================================================================

export type Rol = 'admin' | 'ventas' | 'comunidad' | 'finanzas';

export type Duracion = '1 día' | '2 días' | '3 días' | '4 días' | '5 días' | '7 días' | 'Servicios';
export type StatusOperativo = 'Planeación' | 'Confirmado' | 'En Curso' | 'Finalizado';
export type MetodoPago = 'Efectivo' | 'Transfer/Tarjeta' | 'Pago en comunidad';
export type Plataforma = 'WeTravel' | 'PayPal' | 'BBVA Transfer';
export type StatusPago = 'Pendiente' | 'Confirmado' | 'Vencido' | 'Devuelto';
export type TipoComida = 'Desayuno' | 'Comida' | 'Cena' | 'Box lunch';
export type TipoLiquidacion =
  | 'Comedor' | 'Sendero' | 'Hospedaje' | 'Actividad' | 'Taller' | 'Transporte' | 'Anfitrión';

export interface Perfil {
  user_id: string;
  nombre: string;
  email: string;
  rol: Rol;
  comunidad_id: string | null;
  activo: boolean;
}

export interface Comunidad {
  id: string;
  nombre: string;
  color: string;
  orden: number;
}

export interface Guia {
  id: string;
  nombre: string;
  bilingue: boolean;
  idiomas: string | null;
}

export interface Paquete {
  id: string;
  nombre: string;
  duracion: Duracion;
  descripcion: string | null;
  precio: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  status: StatusOperativo;
  anfitrion_nombre: string | null;
  anfitrion_idiomas: string | null;
  anfitrion_monto: number;
  transporte_proveedor: string | null;
  transporte_tipo: string | null;
  transporte_ruta: string | null;
  transporte_monto: number;
  // derivados de v_paquetes
  reservas: number;
  pax: number;
  ninos: number;
  ingreso: number;
  comedores: number;
  dias: number;
  comunidades: string[] | null;
  pagado_pct: number;
}

export interface Reserva {
  id: string;
  codigo: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  paquete_id: string | null;
  paquete: string | null;
  duracion: Duracion | null;
  personas: number;
  ninos: boolean;
  num_ninos: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  precio: number;
  metodo_pago: MetodoPago; // el método principal; el reparto real vive en `pagos`
  plataforma: Plataforma | null;
  metodos: string[] | null; // con qué métodos se está pagando de verdad
  mixto: boolean; // true si se paga con más de uno
  guia_id: string | null;
  guia: string | null;
  transporte: string | null;
  status: StatusOperativo;
  notas: string | null;
  pagado: number;
  saldo: number;
  pagado_pct: number;
  comunidades: string[] | null;
  created_at: string;
}

// Una línea del pago dividido: 40% en efectivo, 60% por transferencia…
export interface LineaPago {
  metodo_pago: MetodoPago;
  plataforma: Plataforma | null;
  monto: number;
}

export interface Pago {
  id: string;
  reserva_id: string;
  codigo: string;
  cliente: string;
  paquete: string | null;
  monto: number;
  fecha: string;
  metodo_pago: MetodoPago;
  plataforma: Plataforma | null;
  status: StatusPago;
  referencia: string | null;
  comprobante_url: string | null;
  automatico: boolean;
  saldo_reserva: number;
}

// La factura de venta: no todos los clientes la piden.
export interface FacturaVenta {
  con_factura: boolean;
  folio_factura: string | null;
  subtotal: number | null;
  iva: number | null;
}

// La base concentrada: lo que entró y lo que salió, en una sola tabla.
// Es lo que el auxiliar contable cotejaba a mano.
export interface MovimientoContable {
  flujo: 'ingreso' | 'egreso';
  id: string;
  fecha: string;
  referencia_interna: string;
  contraparte: string; // el cliente, o el proveedor
  concepto: string;
  metodo: string;
  canal: string;
  con_factura: boolean;
  folio: string | null;
  subtotal: number;
  iva: number;
  total: number;
  archivo_url: string | null;
  comunidad_id: string | null;
}

export interface ContabilidadKpis {
  entro: number;
  salio: number;
  saldo: number;
  facturado_ventas: number;
  facturado_gastos: number;
  iva_trasladado: number;
  iva_acreditable: number;
  iva_saldo: number; // positivo = a cargo (se le debe al SAT); negativo = a favor
  ingresos_sin_factura: number;
  gastos_sin_factura: number;
  sin_archivo: number;
}

// Cobro que no pasa por el banco (efectivo o pago en comunidad):
// se valida en Liquidación.
export interface CobroLiquidacion {
  id: string;
  reserva_id: string;
  codigo: string;
  cliente: string;
  paquete: string | null;
  salida: string | null;
  pax: number;
  monto: number;
  fecha: string;
  metodo_pago: MetodoPago;
  status: StatusPago;
  referencia: string | null;
  comprobante_url: string | null;
  automatico: boolean;
  precio_reserva: number;
  saldo_reserva: number;
}

export interface EventoCalendario {
  tipo: 'salida' | 'reserva';
  id: string;
  titulo: string;
  duracion: Duracion;
  fecha_inicio: string;
  fecha_fin: string | null;
  status: StatusOperativo;
  pax: number;
  codigo: string | null;
  metodo_pago: MetodoPago | null;
  paquete_id: string | null;
  paquete: string | null;
}

export interface Gasto {
  id: string;
  fecha: string;
  proveedor: string;
  concepto: string;
  folio: string | null;
  subtotal: number;
  iva: number;
  total: number;
  con_factura: boolean;
  archivo_url: string | null;
  paquete_id: string | null;
  comunidad_id: string | null;
}

export interface ConceptoLiquidacion {
  origen: 'comedor' | 'item' | 'transporte' | 'anfitrion';
  origen_id: string;
  paquete_id: string;
  paquete: string;
  fecha_inicio: string | null;
  tipo: TipoLiquidacion;
  concepto: string;
  comunidad_id: string | null;
  comunidad: string | null;
  dia: number;
  monto_unitario: number;
  por_persona: boolean;
  pax: number;
  monto: number;
  pago_directo: boolean;
  liquidado: boolean;
}

export interface VentaLiquidacion {
  paquete_id: string;
  paquete: string;
  duracion: Duracion;
  fecha_inicio: string;
  fecha_fin: string | null;
  status: StatusOperativo;
  reservas: number;
  pax: number;
  ninos: number;
  ingreso: number; // lo VENDIDO (suma de reservas.precio)
  cobrado: number; // lo que YA entró: pagos confirmados de cualquier canal
  por_cobrar: number;
  cobrado_pct: number;
  costo: number;
  liquidado: number;
  pendiente: number;
  conceptos: number;
  conceptos_liquidados: number;
  conceptos_directos: number;
  utilidad: number;
  margen_pct: number;
  avance_pct: number;
}

export interface OperacionComunidad {
  paquete_id: string;
  comunidad_id: string;
  comunidad: string;
  color: string;
  paquete: string;
  duracion: Duracion;
  fecha_inicio: string | null;
  status: StatusOperativo;
  reservas: number; // un tramo sólo existe si tiene reservas
  pax: number;
  checks_total: number;
  checks_ok: number;
  lista: boolean;
  pct: number;
  comunidades_listas: number;
  comunidades_del_tour: number;
  avance_tour: number;
  presupuesto: number;
  gastado: number;
}

// ---------------------------------------------------------------------
// El detalle de un paquete: lo que de verdad alimenta la Liquidación.
// Sin esto, un paquete nuevo no tiene ni costo ni comunidades.
// ---------------------------------------------------------------------
export interface ItemItinerario {
  id?: string;
  orden: number;
  texto: string;
  tipo: TipoLiquidacion | null; // null = no se liquida (traslados, tiempo libre…)
  comunidad_id: string | null;
  monto: number;
  por_persona: boolean;
}

export interface DiaItinerario {
  id?: string;
  dia: number;
  recorrido: string;
  items: ItemItinerario[];
}

export interface ComedorPaquete {
  id?: string;
  dia: number;
  comunidad_id: string | null;
  recorrido?: string | null;
  nombre: string;
  tipo: TipoComida;
  monto_por_persona: number;
}

export interface DetallePaquete {
  paquete_id: string;
  comunidades_ids: string[];
  dias: DiaItinerario[];
  comedores: ComedorPaquete[];
}

export const TIPOS_LIQUIDACION: TipoLiquidacion[] = [
  'Sendero',
  'Hospedaje',
  'Actividad',
  'Taller',
  'Transporte',
];

export const TIPOS_COMIDA: TipoComida[] = ['Desayuno', 'Comida', 'Cena', 'Box lunch'];

export interface ItemChecklist {
  id: string;
  paquete_id: string;
  comunidad_id?: string;
  item: string;
  completado: boolean;
}

// ---------------------------------------------------------------------
// Paleta — la misma del dashboard original
// ---------------------------------------------------------------------
export const COLOR_DURACION: Record<string, string> = {
  '1 día': '#10B981',
  '2 días': '#3B82F6',
  '3 días': '#A78BFA',
  '4 días': '#FB923C',
  '5 días': '#EF4444',
  '7 días': '#6D28D9',
  Servicios: '#0D9488',
};

export const COLOR_STATUS: Record<string, string> = {
  Planeación: '#9CA3AF',
  Confirmado: '#2563EB',
  'En Curso': '#A78BFA',
  Finalizado: '#16A34A',
};

export const COLOR_PAGO: Record<string, string> = {
  Pendiente: '#FB923C',
  Confirmado: '#16A34A',
  Vencido: '#DC2626',
  Devuelto: '#9CA3AF',
};

export const COLOR_METODO: Record<string, string> = {
  Efectivo: '#16A34A',
  'Transfer/Tarjeta': '#2563EB',
  'Pago en comunidad': '#B45309',
};

export const COLOR_PLATAFORMA: Record<string, string> = {
  WeTravel: '#0EA5E9',
  PayPal: '#003087',
  'BBVA Transfer': '#072146',
};

export const COLOR_LIQ: Record<string, string> = {
  Comedor: '#F59E0B',
  Sendero: '#1F7D5E',
  Hospedaje: '#7C3AED',
  Actividad: '#EC4899',
  Taller: '#DB2777',
  Transporte: '#2563EB',
  Anfitrión: '#0D9488',
};

export const STATUSES: StatusOperativo[] = ['Planeación', 'Confirmado', 'En Curso', 'Finalizado'];
export const METODOS: MetodoPago[] = ['Efectivo', 'Transfer/Tarjeta', 'Pago en comunidad'];
export const PLATAFORMAS: Plataforma[] = ['WeTravel', 'PayPal', 'BBVA Transfer'];
export const TRANSPORTES = [
  'Van (Expediciones)',
  'Camioneta (Expediciones)',
  'Autobús',
  'Colectivo',
  'Vehículo propio',
  'Sin transporte',
];

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------
export const dinero = (n: number | null | undefined) =>
  '$' + Number(n ?? 0).toLocaleString('es-MX', { maximumFractionDigits: 2 });

export const fecha = (f: string | null | undefined) => {
  if (!f) return 'Sin fecha';
  const d = new Date(f + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

export const rango = (a: string | null, b: string | null) => {
  if (!a) return 'Sin fecha';
  if (!b || a === b) return fecha(a);
  return `${fecha(a)} – ${fecha(b)}`;
};

export const hexA = (hex: string, alpha: number) => {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export const colorPagado = (p: number) => (p < 50 ? '#DC2626' : p < 80 ? '#FBBF24' : '#16A34A');

export const iniciales = (nombre: string) => {
  const p = nombre.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
};

const AVATAR_COLORS = ['#5B21B6', '#2563EB', '#DB2777', '#059669', '#D97706', '#0891B2', '#DC2626', '#7C3AED'];
export const colorAvatar = (nombre: string) => {
  let s = 0;
  for (let i = 0; i < nombre.length; i++) s += nombre.charCodeAt(i);
  return AVATAR_COLORS[s % AVATAR_COLORS.length];
};
