// Todo lo que cuelga de /en está en inglés.
//
// El <html lang="es"> vive en el layout raíz y sólo puede haber uno, así que
// aquí volvemos a declarar el idioma para este subárbol: el HTML permite
// marcar el idioma en cualquier elemento y tanto Google como los lectores de
// pantalla respetan el `lang` más cercano al texto.
export default function LayoutEn({ children }: { children: React.ReactNode }) {
  return <div lang="en">{children}</div>;
}
