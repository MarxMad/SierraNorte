import type { MetadataRoute } from 'next';
import { clientePublico } from '@/lib/supabase/publico';
import { SITIO } from '@/lib/sitio';
import { ruta } from '@/lib/i18n';

// El mapa que Google usa para encontrar las 33 experiencias. Sin esto sólo
// descubre lo que esté enlazado desde la portada.
//
// Se regenera cada hora, igual que el resto del sitio público. Lee el catálogo
// sin sesión (es público), así que no toca cookies y se puede cachear.
export const revalidate = 3600;

const url = (lang: 'es' | 'en', path: string) => `${SITIO}${ruta(lang, path)}`;

/** La misma página, en los dos idiomas, como la quiere el estándar de sitemaps. */
const entrada = (path: string, extra: Partial<MetadataRoute.Sitemap[number]> = {}) => ({
  url: url('es', path),
  lastModified: new Date(),
  alternates: { languages: { es: url('es', path), en: url('en', path) } },
  ...extra,
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = clientePublico();

  const { data: paquetes } = await supabase
    .from('paquetes')
    .select('id')
    .eq('activo', true)
    .neq('duracion', 'Servicios'); // Servicios Individuales no tiene página propia

  return [
    entrada('/', { changeFrequency: 'weekly', priority: 1 }),
    entrada('/region', { changeFrequency: 'monthly', priority: 0.7 }),
    entrada('/proyecto', { changeFrequency: 'monthly', priority: 0.7 }),
    entrada('/equipo', { changeFrequency: 'monthly', priority: 0.5 }),
    ...(paquetes ?? []).map((p) =>
      entrada(`/experiencias/${p.id}`, { changeFrequency: 'monthly' as const, priority: 0.8 })
    ),
  ];
}
