import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_URL, SUPABASE_KEY } from '@/lib/supabase/env';

// Refresca la sesión en cada request y bloquea el acceso sin login.
// En Next 16 esta convención se llama `proxy` (antes `middleware`).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: getUser() revalida el token contra Supabase. No usar getSession() aquí.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  // El sitio público (landing, región, proyecto, equipo) y el login no piden
  // sesión. Todo lo demás — el dashboard — sí.
  // El sitio público existe en español (/) y en inglés (/en).
  // sitemap.xml y robots.txt son para Google: si los mandamos al login, no
  // indexa nada.
  const PUBLICAS = ['/', '/region', '/proyecto', '/equipo', '/sitemap.xml', '/robots.txt'];
  const sinIdioma = pathname.startsWith('/en/')
    ? pathname.slice(3)
    : pathname === '/en'
      ? '/'
      : pathname;

  const esPublica =
    PUBLICAS.includes(sinIdioma) ||
    sinIdioma.startsWith('/experiencias') ||
    sinIdioma.startsWith('/pueblos') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth');

  if (!user && !esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/inicio';
    url.searchParams.delete('redirect');
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
