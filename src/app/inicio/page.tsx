import { redirect } from 'next/navigation';
import { perfilActual } from '@/lib/sesion';
import { inicioDe } from '@/lib/permisos';

// Punto de entrada tras el login: manda a cada rol a su pantalla.
export default async function Inicio() {
  const perfil = await perfilActual();
  redirect(inicioDe(perfil.rol));
}
