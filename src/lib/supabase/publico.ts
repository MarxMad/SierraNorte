import { createClient as crear } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './env';

// =====================================================================
// Cliente para el SITIO PÚBLICO (catálogo, región, proyecto, equipo).
//
// Es el mismo Supabase y la misma llave pública que el resto, pero SIN
// cookies: el visitante no tiene sesión y el catálogo es de todos.
//
// El detalle importante: leer cookies obliga a Next a renderizar la página
// en cada visita. Sin cookies, la portada se congela una hora (el
// `revalidate = 3600` de cada página) y el visitante recibe HTML ya hecho
// en vez de esperar cuatro consultas a la base.
//
// El dashboard NO usa esto: necesita saber quién eres → supabase/server.ts
// =====================================================================
export const clientePublico = () => crear(SUPABASE_URL, SUPABASE_KEY);
