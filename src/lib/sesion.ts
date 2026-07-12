import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import type { Perfil } from './tipos';
import { puedeVer, type Seccion, inicioDe } from './permisos';

// Perfil del usuario en sesión. Si no hay sesión, manda al login.
export async function perfilActual(): Promise<Perfil> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!perfil) redirect('/login?error=sin-perfil');
  if (!perfil.activo) redirect('/login?error=inactivo');

  return perfil as Perfil;
}

// Igual que arriba, pero además exige acceso a una sección.
export async function exigirAcceso(seccion: Seccion): Promise<Perfil> {
  const perfil = await perfilActual();
  if (!puedeVer(perfil.rol, seccion)) {
    redirect(inicioDe(perfil.rol));
  }
  return perfil;
}
