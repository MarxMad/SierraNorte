'use client';

import { useState, useMemo } from 'react';
import type { Comunidad } from '@/lib/tipos';
import type { PaqueteWeb } from '@/paginas/landing';
import type { Escena } from '@/lib/escenas';
import { Nav, Footer } from '@/components/landing/Chrome';
import CinematicoPueblo from '@/components/landing/CinematicoPueblo';
import { dict, type Idioma } from '@/lib/i18n';
import { solicitarInformacionLead } from '@/app/acciones-web';

export default function PuebloLanding({
  lang,
  comunidad,
  escena,
  descripcion,
  paquetes,
}: {
  lang: Idioma;
  comunidad: Comunidad;
  escena: Escena;
  descripcion: string | null;
  paquetes: PaqueteWeb[];
}) {
  const d = dict(lang);
  const [leadOk, setLeadOk] = useState(false);
  const [lead, setLead] = useState({ nombre: '', email: '', notas: '' });
  const [pending, setPending] = useState(false);

  const experiencias = useMemo(() => paquetes.filter((p) => p.duracion !== 'Servicios'), [paquetes]);

  const enviarLead = async () => {
    setPending(true);
    const res = await solicitarInformacionLead({
      ...lead,
      origenComunidadId: comunidad.id,
      lang,
    });
    setPending(false);
    if (res.ok) setLeadOk(true);
    else alert(res.error);
  };

  return (
    <div className="min-h-screen bg-white">
      <Nav lang={lang} aqui={`/pueblos/${comunidad.id}`} />

      {/* El catálogo del pueblo vive dentro del acto: el carrusel lleva las
          mismas fichas que antes estaban en la retícula, con sus enlaces
          en el HTML servido. */}
      <CinematicoPueblo
        lang={lang}
        comunidad={comunidad}
        escena={escena}
        descripcion={descripcion}
        experiencias={experiencias}
      />

      <section className="border-t border-gray-100 bg-gray-50 py-14">
        <div className="mx-auto max-w-lg px-5">
          <h2 className="text-xl font-extrabold text-gray-900">{d.puebloContactoLead}</h2>
          {leadOk ? (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              {d.puebloLeadOk}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#1F7D5E]"
                placeholder={d.formNombrePh}
                value={lead.nombre}
                onChange={(e) => setLead((v) => ({ ...v, nombre: e.target.value }))}
              />
              <input
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#1F7D5E]"
                type="email"
                placeholder={d.formCorreo}
                value={lead.email}
                onChange={(e) => setLead((v) => ({ ...v, email: e.target.value }))}
              />
              <textarea
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#1F7D5E]"
                rows={3}
                placeholder={d.formNotasPh}
                value={lead.notas}
                onChange={(e) => setLead((v) => ({ ...v, notas: e.target.value }))}
              />
              <button
                type="button"
                disabled={pending}
                onClick={enviarLead}
                className="w-full rounded-xl bg-[#1F7D5E] py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {pending ? d.formEnviando : d.puebloContactoLead}
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer lang={lang} />
    </div>
  );
}
