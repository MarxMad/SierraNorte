'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type EstadoAuth = { error?: string; ok?: string };

export async function entrar(_prev: EstadoAuth, formData: FormData): Promise<EstadoAuth> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const redirectTo = String(formData.get('redirect') ?? '') || '/inicio';

  if (!email || !password) return { error: 'Escribe tu correo y tu contraseña.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg =
      error.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : error.message === 'Email not confirmed'
          ? 'Falta confirmar tu correo. Revisa tu bandeja.'
          : error.message;
    return { error: msg };
  }

  revalidatePath('/', 'layout');
  redirect(redirectTo);
}

export async function registrarse(_prev: EstadoAuth, formData: FormData): Promise<EstadoAuth> {
  const nombre = String(formData.get('nombre') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!nombre) return { error: 'Escribe tu nombre.' };
  if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } },
  });

  if (error) return { error: error.message };

  return {
    ok: 'Cuenta creada. Un administrador debe asignarte un rol antes de que puedas entrar.',
  };
}

export async function salir() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
