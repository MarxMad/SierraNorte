import Sidebar from '@/components/Sidebar';
import { perfilActual } from '@/lib/sesion';
import { createClient } from '@/lib/supabase/server';
import type { Comunidad } from '@/lib/tipos';

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const perfil = await perfilActual();
  const supabase = await createClient();
  const { data: comunidades } = await supabase
    .from('comunidades')
    .select('*')
    .eq('activa', true)
    .order('orden');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <Sidebar perfil={perfil} comunidades={(comunidades ?? []) as Comunidad[]} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
