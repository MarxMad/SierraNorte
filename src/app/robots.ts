import type { MetadataRoute } from 'next';
import { SITIO } from '@/lib/sitio';

// El sitio público se indexa; el dashboard del equipo, no.
// (El dashboard ya está protegido por login y por el RLS de Postgres: esto
// sólo evita que sus URLs salgan en Google.)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/login',
        '/inicio',
        '/ventas',
        '/comunidades',
        '/liquidacion',
        '/banca',
        '/calendario',
        '/admin',
      ],
    },
    sitemap: `${SITIO}/sitemap.xml`,
  };
}
