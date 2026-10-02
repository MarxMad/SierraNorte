'use client';

// =====================================================================
// El acto cinematográfico del micrositio de un pueblo
//
// Portado del prototipo `Sierra Norte cinematic scroll` (export de una
// herramienta de diseño: no era React, corría sobre su propio runtime).
// Se conserva la técnica —un rAF con suavizado y todo el movimiento en
// custom properties— y se corrigen cuatro cosas del original:
//
//   1. El avance se mide contra la propia sección, no contra window.scrollY.
//      Arriba del acto hay una barra de navegación; con scrollY el acto
//      arrancaba desfasado.
//   2. El recorrido es una fracción de 0 a 1, no píxeles fijos. Así una
//      pantalla de 720 px y una de 1440 ven el mismo montaje.
//   3. Se respeta prefers-reduced-motion (el CSS apila el contenido).
//   4. El carrusel usa scroll-snap nativo en vez del truco de las tres
//      copias del original, que se rompía según cuántas experiencias
//      tuviera el pueblo.
//
// Los tiempos de cada fase están documentados en globals.css.
// =====================================================================

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Comunidad, Duracion } from '@/lib/tipos';
import type { PaqueteWeb } from '@/paginas/landing';
import type { Escena } from '@/lib/escenas';
import { COLOR_DURACION, dinero, hexA } from '@/lib/tipos';
import { fotoDe } from '@/lib/fotos';
import { dict, ruta, type Idioma } from '@/lib/i18n';
import { display } from '@/lib/tipografia';

const ORDEN_DURACION: Duracion[] = [
  '1 día',
  '2 días',
  '3 días',
  '4 días',
  '5 días',
  '7 días',
  'Servicios',
];

/** Interpolación suave entre dos marcas del recorrido (smoothstep). */
const suavizar = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function CinematicoPueblo({
  lang,
  comunidad,
  escena,
  descripcion,
  experiencias,
}: {
  lang: Idioma;
  comunidad: Comunidad;
  escena: Escena;
  descripcion: string | null;
  experiencias: PaqueteWeb[];
}) {
  const d = dict(lang);
  const seccionRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const panel1Ref = useRef<HTMLElement>(null);
  const panel2Ref = useRef<HTMLElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const flechasRef = useRef<HTMLDivElement>(null);
  const pistaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const seccion = seccionRef.current;
    if (!seccion) return;

    // Quien pide menos movimiento recibe el layout apilado que arma el
    // CSS: no hay acto que recorrer y no arrancamos el bucle.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // El paralaje del ratón no existe en una pantalla táctil.
    const conRaton = window.matchMedia('(pointer: fine)').matches;

    let mx = 0;
    let my = 0;
    let suave = 0;
    let recorrido = 0;
    let raf = 0;
    const ultimo = { p: -1, mx: 0, my: 0 };

    const medir = () => {
      recorrido = seccion.offsetHeight - window.innerHeight;
    };

    const pintar = (p: number) => {
      const v = seccion.style;
      const t1 = suavizar(0, 0.17, p);
      const t2b = suavizar(0.2, 0.42, p);
      const t3 = suavizar(0.45, 0.7, p);
      const t4 = suavizar(0.62, 0.88, p);
      const t5 = suavizar(0.82, 0.95, p);

      v.setProperty('--t0', suavizar(0.05, 0.2, p).toFixed(4));
      v.setProperty('--t1', t1.toFixed(4));
      v.setProperty('--t2', suavizar(0.14, 0.42, p).toFixed(4));
      v.setProperty('--t2b', t2b.toFixed(4));
      v.setProperty('--t3', t3.toFixed(4));
      v.setProperty('--t4', t4.toFixed(4));
      v.setProperty('--t5', t5.toFixed(4));
      v.setProperty('--mx', mx.toFixed(3));
      v.setProperty('--my', my.toFixed(3));

      // Los cuatro bloques se turnan el mismo centro de pantalla y sus
      // cajas se traslapan. Con `opacity: 0` un bloque apagado sigue
      // recibiendo el clic y el tabulador; `visibility` sí lo saca.
      const apagar = (nodo: HTMLElement | null, encendido: boolean) => {
        if (nodo) nodo.style.visibility = encendido ? 'visible' : 'hidden';
      };
      apagar(heroRef.current, t1 < 0.99);
      apagar(panel1Ref.current, t2b * (1 - t3) > 0.02);
      apagar(panel2Ref.current, t3 * (1 - t4) > 0.02);
      apagar(sliderRef.current, t4 > 0.01);
      apagar(flechasRef.current, t5 > 0.01);
    };

    const cuadro = () => {
      const destino =
        recorrido > 0
          ? Math.min(1, Math.max(0, -seccion.getBoundingClientRect().top / recorrido))
          : 0;

      suave += (destino - suave) * 0.12;
      if (Math.abs(destino - suave) < 0.0004) suave = destino; // que asiente

      if (Math.abs(suave - ultimo.p) > 0.0003 || mx !== ultimo.mx || my !== ultimo.my) {
        pintar(suave);
        ultimo.p = suave;
        ultimo.mx = mx;
        ultimo.my = my;
      }

      raf = requestAnimationFrame(cuadro);
    };

    const alMover = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    medir();
    pintar(0);
    window.addEventListener('resize', medir);
    if (conRaton) window.addEventListener('mousemove', alMover, { passive: true });
    raf = requestAnimationFrame(cuadro);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', medir);
      window.removeEventListener('mousemove', alMover);
    };
  }, []);

  /** Las flechas empujan el carrusel una tarjeta a la vez. */
  const mover = (dir: 1 | -1) => {
    const pista = pistaRef.current;
    if (!pista) return;
    const tarjeta = pista.firstElementChild as HTMLElement | null;
    const paso = tarjeta ? tarjeta.offsetWidth + 20 : 280;
    pista.scrollBy({ left: dir * paso, behavior: 'smooth' });
  };

  // Las cifras del panel salen del catálogo real: ninguna está escrita a mano.
  const diasMax = experiencias.reduce((m, e) => Math.max(m, e.dias), 0);
  const precios = experiencias.map((e) => e.precio).filter((p) => p > 0);
  const desde = precios.length ? Math.min(...precios) : 0;
  const duraciones = ORDEN_DURACION.filter(
    (x) => x !== 'Servicios' && experiencias.some((e) => e.duracion === x)
  );

  const sena = escena.sena ? escena.sena[lang] : 'Pueblos Mancomunados · Oaxaca';
  const hay = experiencias.length > 0;

  return (
    <section
      ref={seccionRef}
      className={`cine ${display.variable}`}
      style={{ '--acento': comunidad.color } as React.CSSProperties}
      aria-label={comunidad.nombre}
    >
      <div className="cine-escenario">
        {/* ---------- las capas del escenario ---------- */}
        <div className="cine-capas" aria-hidden>
          <div className="cine-capa cine-cielo">
            <Image
              src={escena.capas.cielo}
              alt=""
              fill
              sizes="100vw"
              loading="eager"
              fetchPriority="high"
            />
          </div>
          <div className="cine-capa cine-niebla">
            <Image src={escena.capas.niebla} alt="" fill sizes="100vw" loading="eager" />
          </div>
          <div className="cine-capa cine-pueblo">
            <Image src={escena.capas.pueblo} alt="" fill sizes="100vw" loading="eager" />
          </div>

          <div className="cine-marco cine-izq">
            <Image
              src={escena.capas.izq}
              alt=""
              fill
              sizes="(max-width: 900px) 68vw, 40vw"
            />
          </div>
          <div className="cine-marco cine-der">
            <Image
              src={escena.capas.der}
              alt=""
              fill
              sizes="(max-width: 900px) 68vw, 40vw"
            />
          </div>
          <div className="cine-marco cine-sendero">
            <Image src={escena.capas.sendero} alt="" fill sizes="100vw" />
          </div>
          <div className="cine-marco cine-naturaleza">
            <Image src={escena.capas.naturaleza} alt="" fill sizes="(max-width: 900px) 92vw, 72vw" />
          </div>

          <div className="cine-sombra" />
        </div>

        {/* ---------- el contenido ---------- */}
        <div className="cine-contenido">
          <div className="cine-hero" ref={heroRef}>
            <p className="cine-kicker">{sena}</p>
            <h1 className="cine-titulo">{comunidad.nombre}</h1>
            <p className="cine-lema">{descripcion ?? d.pueblosSub}</p>

            {duraciones.length > 0 && (
              <ul className="cine-etiquetas">
                {duraciones.slice(0, 4).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            )}

            <p className="cine-kicker" style={{ marginTop: 30, opacity: 0.55 }}>
              {d.cineDesplaza} ↓
            </p>
          </div>

          <section className="cine-panel cine-panel-1" ref={panel1Ref} aria-label={d.cineP1t}>
            <h2>{d.cineP1t}</h2>
            <p>{d.cineP1d}</p>
            <dl className="cine-cifras">
              <div>
                <dt>{experiencias.length}</dt>
                <dd>{d.experiencias}</dd>
              </div>
              {diasMax > 0 && (
                <div>
                  <dt>{diasMax}</dt>
                  <dd>{d.diasDeRuta}</dd>
                </div>
              )}
              {desde > 0 && (
                <div>
                  <dt>{dinero(desde)}</dt>
                  <dd>{d.desde}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="cine-panel cine-panel-2" ref={panel2Ref} aria-label={d.cineP2t}>
            <h2>{d.cineP2t}</h2>
            <p>{d.cineP2d}</p>
            <Link href={ruta(lang, '/')} className="cine-cta">
              <span aria-hidden>↗</span>
              {d.puebloVerTodas}
            </Link>
          </section>

          {hay && (
            <div
              ref={sliderRef}
              className="cine-slider"
              aria-label={`${d.puebloExperiencias} ${comunidad.nombre}`}
            >
              <p className="cine-slider-titulo">
                {d.puebloExperiencias} {comunidad.nombre}
              </p>
              <div className="cine-banda">
                <div className="cine-pista" ref={pistaRef}>
                  {experiencias.map((p) => {
                    const color = COLOR_DURACION[p.duracion];
                    return (
                      <Link
                        key={p.id}
                        href={`${ruta(lang, `/experiencias/${p.id}`)}?pueblo=${comunidad.id}`}
                        className="cine-tarjeta"
                      >
                        <div className="cine-tarjeta-foto">
                          <Image
                            src={fotoDe(p.id)}
                            alt=""
                            fill
                            sizes="262px"
                            className="object-cover"
                          />
                          <span
                            className="absolute left-3 top-3 rounded-lg px-2 py-1 text-[11px] font-extrabold text-white"
                            style={{ background: hexA(color, 0.92) }}
                          >
                            {p.duracion}
                          </span>
                        </div>
                        <div className="cine-tarjeta-cuerpo">
                          <h3>{p.nombre}</h3>
                          <p className="mt-2.5 text-sm font-bold" style={{ color }}>
                            {p.precio > 0 ? `${dinero(p.precio)} ${d.porPersona}` : d.cotizacion}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="cine-flechas" ref={flechasRef}>
                  <button type="button" aria-label={d.cineAnterior} onClick={() => mover(-1)}>
                    <span aria-hidden>←</span>
                  </button>
                  <button type="button" aria-label={d.cineSiguiente} onClick={() => mover(1)}>
                    <span aria-hidden>→</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* La firma de color de la comunidad, como en el resto del sitio. */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 z-30 h-1.5"
          style={{ background: comunidad.color }}
        />
      </div>
    </section>
  );
}
