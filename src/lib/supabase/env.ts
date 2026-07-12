// La llave pública de Supabase. Acepta el formato nuevo (sb_publishable_...)
// y el JWT anon de siempre — las dos respetan RLS.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
