import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_KEY } from './env';

// Cliente de Supabase para componentes del navegador ("use client")
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
