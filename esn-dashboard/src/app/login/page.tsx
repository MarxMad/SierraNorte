'use client';

import { Suspense, useActionState, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { entrar, registrarse, type EstadoAuth } from './acciones';

const inicial: EstadoAuth = {};

// useSearchParams() obliga a un límite de Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <Login />
    </Suspense>
  );
}

function Login() {
  const params = useSearchParams();
  const redirectTo = params.get('redirect') ?? '/inicio';
  const errorUrl = params.get('error');

  const [modo, setModo] = useState<'entrar' | 'registro'>('entrar');
  const [estadoEntrar, accionEntrar, pendingEntrar] = useActionState(entrar, inicial);
  const [estadoRegistro, accionRegistro, pendingRegistro] = useActionState(registrarse, inicial);

  const estado = modo === 'entrar' ? estadoEntrar : estadoRegistro;
  const pending = modo === 'entrar' ? pendingEntrar : pendingRegistro;

  const mensajeUrl =
    errorUrl === 'sin-perfil'
      ? 'Tu cuenta existe pero no tiene perfil. Pide a un administrador que te dé de alta.'
      : errorUrl === 'inactivo'
        ? 'Tu cuenta está desactivada. Contacta al administrador.'
        : null;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden flex-col justify-between bg-gradient-to-br from-[#1F7D5E] via-[#166148] to-[#0F3D2E] p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/95 p-1.5">
            <Image src="/sierran.png" alt="" width={40} height={40} className="object-contain" />
          </div>
          <div>
            <p className="text-sm font-bold">Expediciones Sierra Norte</p>
            <p className="text-xs text-white/70">Pueblos Mancomunados</p>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight">
            La operación de la cooperativa,
            <br />
            en un solo lugar.
          </h1>
          <p className="mt-4 max-w-md text-white/70">
            Reservas, comunidades, liquidación y banca. Cada quien ve lo que le toca.
          </p>
        </div>

        <p className="max-w-md text-sm italic text-white/60">
          “When done right, tourism can protect the natural and cultural treasures of a place,
          rather than destroy them.”
        </p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Image src="/sierran.png" alt="" width={40} height={40} className="object-contain" />
            <div>
              <p className="text-sm font-bold text-gray-900">Expediciones Sierra Norte</p>
              <p className="text-xs text-gray-500">Pueblos Mancomunados</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">
            {modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {modo === 'entrar'
              ? 'Accede con tu correo y contraseña.'
              : 'Después un administrador te asignará tu rol.'}
          </p>

          {mensajeUrl && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
              {mensajeUrl}
            </div>
          )}

          <form action={modo === 'entrar' ? accionEntrar : accionRegistro} className="mt-6 space-y-4">
            <input type="hidden" name="redirect" value={redirectTo} />

            {modo === 'registro' && (
              <Campo label="Nombre completo">
                <input
                  name="nombre"
                  required
                  autoComplete="name"
                  placeholder="Elena Ramírez"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#5B21B6] focus:ring-2 focus:ring-[#5B21B6]/15"
                />
              </Campo>
            )}

            <Campo label="Correo">
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="tu@correo.com"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#5B21B6] focus:ring-2 focus:ring-[#5B21B6]/15"
              />
            </Campo>

            <Campo label="Contraseña">
              <input
                name="password"
                type="password"
                required
                autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                placeholder={modo === 'registro' ? 'Mínimo 8 caracteres' : '••••••••'}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#5B21B6] focus:ring-2 focus:ring-[#5B21B6]/15"
              />
            </Campo>

            {estado.error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
                {estado.error}
              </p>
            )}
            {estado.ok && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
                {estado.ok}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-[#5B21B6] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#4C1D95] disabled:opacity-60"
            >
              {pending ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {modo === 'entrar' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              onClick={() => setModo(modo === 'entrar' ? 'registro' : 'entrar')}
              className="font-bold text-[#5B21B6] hover:underline"
            >
              {modo === 'entrar' ? 'Crear una' : 'Entrar'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-gray-700">{label}</span>
      {children}
    </label>
  );
}
