import { exigirAcceso } from '@/lib/sesion';
import { createClient } from '@/lib/supabase/server';
import type { Perfil, Comunidad } from '@/lib/tipos';
import AdminVista from './AdminVista';

export default async function AdminPage() {
  await exigirAcceso('admin');
  const supabase = await createClient();

  const [{ data: perfiles }, { data: comunidades }] = await Promise.all([
    supabase.from('perfiles').select('*').order('nombre'),
    supabase.from('comunidades').select('*').order('orden'),
  ]);

  return (
    <AdminVista
      perfiles={(perfiles ?? []) as Perfil[]}
      comunidades={(comunidades ?? []) as Comunidad[]}
    />
  );
}
