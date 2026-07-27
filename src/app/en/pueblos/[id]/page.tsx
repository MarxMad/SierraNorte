import PuebloPage from '@/paginas/pueblo';
import { alternos } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { alternates: alternos('en', `/pueblos/${id}`) };
}

export default async function PageEn({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PuebloPage lang="en" id={id} />;
}
