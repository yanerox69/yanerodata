import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoria, getHerramienta, herramientas, herramientasDe } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return herramientas.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const h = getHerramienta((await params).slug);
  return h ? { title: `${h.nombre}: para qué sirve y precio`, description: h.resumen } : {};
}

export default async function HerramientaPage({ params }: Props) {
  const h = getHerramienta((await params).slug);
  if (!h) notFound();
  const cat = getCategoria(h.categoria)!;
  const alternativas = herramientasDe(h.categoria).filter((x) => x.slug !== h.slug);

  // Datos estructurados para que buscadores y chatbots puedan citar la ficha.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: h.nombre,
    url: h.url,
    applicationCategory: cat.nombre,
    description: h.resumen,
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="hero">
        <Link href={`/categoria/${cat.slug}`} className="badge">
          {cat.nombre}
        </Link>
        <h1>{h.nombre}</h1>
        <p>{h.resumen}</p>
      </div>
      <div className="panel">
        <dl>
          <dt>Mejor para</dt>
          <dd>{h.mejor_para}</dd>
          <dt>Precio</dt>
          <dd>{h.precio}</dd>
          <dt>Ojo con</dt>
          <dd>{h.ojo}</dd>
          <dt>Web oficial</dt>
          <dd>
            <a href={h.url} target="_blank" rel="noopener">
              {h.url}
            </a>
          </dd>
        </dl>
      </div>
      {alternativas.length > 0 && (
        <section>
          <h2>Alternativas</h2>
          <div className="chips">
            {alternativas.map((a) => (
              <Link key={a.slug} href={`/herramienta/${a.slug}`} className="chip">
                {a.nombre}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
