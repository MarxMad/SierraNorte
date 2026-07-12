import { notFound, redirect } from 'next/navigation';
import { exigirAcceso } from '@/lib/sesion';
import { createClient } from '@/lib/supabase/server';
import type { Comunidad, OperacionComunidad, ItemChecklist } from '@/lib/tipos';
import ComunidadVista from './ComunidadVista';

export default async function ComunidadPage({ params }: { params: Promise<{ id: string }> }) {
  const perfil = await exigirAcceso('comunidades');
  const { id } = await params;

  // El coordinador sólo entra a la suya
  if (perfil.rol === 'comunidad' && perfil.comunidad_id !== id) {
    redirect(`/comunidades/${perfil.comunidad_id}`);
  }

  const supabase = await createClient();
  const [{ data: comunidad }, { data: operacion }, { data: checksCom }, { data: checksGen }] =
    await Promise.all([
      supabase.from('comunidades').select('*').eq('id', id).single(),
      supabase.from('v_operacion_comunidad').select('*').eq('comunidad_id', id),
      supabase.from('checklist_comunidad').select('*').order('item'),
      supabase.from('checklist_general').select('*').order('item'),
    ]);

  if (!comunidad) notFound();

  return (
    <ComunidadVista
      perfil={perfil}
      comunidad={comunidad as Comunidad}
      operacion={(operacion ?? []) as OperacionComunidad[]}
      checksComunidad={(checksCom ?? []) as ItemChecklist[]}
      checksGeneral={(checksGen ?? []) as ItemChecklist[]}
    />
  );
}
