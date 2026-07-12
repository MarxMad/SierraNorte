import { redirect } from 'next/navigation';
import { exigirAcceso } from '@/lib/sesion';
import { createClient } from '@/lib/supabase/server';

// Redirige a la primera comunidad (o a la del coordinador)
export default async function ComunidadesIndex() {
  const perfil = await exigirAcceso('comunidades');

  if (perfil.rol === 'comunidad' && perfil.comunidad_id) {
    redirect(`/comunidades/${perfil.comunidad_id}`);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('comunidades')
    .select('id')
    .eq('activa', true)
    .order('orden')
    .limit(1)
    .single();

  redirect(`/comunidades/${data?.id ?? 'cuajimoloyas'}`);
}
