import PuebloPage from '@/paginas/pueblo';
import { alternos } from '@/lib/i18n';
import { clientePublico } from '@/lib/supabase/publico';

export const revalidate = 3600;

export async function generateStaticParams() {
  const { data } = await clientePublico().from('comunidades').select('id').eq('activa', true);
  return (data ?? []).map((c) => ({ id: c.id as string }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { alternates: alternos('es', `/pueblos/${id}`) };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PuebloPage lang="es" id={id} />;
}
