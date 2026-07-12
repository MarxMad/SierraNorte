import { exigirAcceso } from '@/lib/sesion';
import { createClient } from '@/lib/supabase/server';
import type { Pago, Reserva } from '@/lib/tipos';
import BancaVista from './BancaVista';

export default async function BancaPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string; q?: string }>;
}) {
  const perfil = await exigirAcceso('banca');
  const { v = 'pagos', q = '' } = await searchParams;
  const supabase = await createClient();

  const [{ data: pagos }, { data: kpis }, { data: resumen }, { data: porComunidad }, { data: rent }, { data: reservas }] =
    await Promise.all([
      supabase.from('v_banca_pagos').select('*').order('fecha', { ascending: false }),
      supabase.from('v_banca_kpis').select('*').single(),
      supabase.from('v_resumen_financiero').select('*').single(),
      supabase.from('v_gastos_por_comunidad').select('*'),
      supabase.from('v_rentabilidad_paquetes').select('*'),
      supabase.from('v_reservas').select('id, codigo, nombre, precio, saldo').order('codigo'),
    ]);

  return (
    <BancaVista
      perfil={perfil}
      vista={v}
      busqueda={q}
      pagos={(pagos ?? []) as Pago[]}
      kpis={kpis ?? { pendiente: 0, confirmado: 0, vencido: 0, promedio: 0 }}
      resumen={resumen ?? { ingresos: 0, gastos: 0, utilidad: 0, margen_pct: 0, por_liquidar: 0 }}
      porComunidad={porComunidad ?? []}
      rentabilidad={rent ?? []}
      reservas={(reservas ?? []) as Pick<Reserva, 'id' | 'codigo' | 'nombre' | 'precio' | 'saldo'>[]}
    />
  );
}
