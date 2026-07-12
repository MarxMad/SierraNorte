import LandingPage from '@/paginas/landing';
import { alternos } from '@/lib/i18n';

export const metadata = { alternates: alternos('es', '/') };
export const revalidate = 3600;

export default function Home() {
  return <LandingPage lang="es" />;
}
