import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolCard } from "@/components/ToolCard";
import { categorias, getCategoria, herramientasDe } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return categorias.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = getCategoria((await params).slug);
  return c ? { title: `Mejores herramientas: ${c.nombre}`, description: c.descripcion } : {};
}

export default async function CategoriaPage({ params }: Props) {
  const c = getCategoria((await params).slug);
  if (!c) notFound();
  const lista = herramientasDe(c.slug);

  return (
    <main>
      <div className="hero">
        <h1>{c.nombre}</h1>
        <p>{c.descripcion}</p>
      </div>
      <section>
        <h2>Preguntas rápidas</h2>
        <div className="panel">
          <p>
            <strong>¿Cuál elijo si empiezo hoy?</strong> {lista[0]?.nombre}: {lista[0]?.mejor_para}
          </p>
          <p className="muted" style={{ marginBottom: 0 }}>
            Hay {lista.length} herramientas en esta categoría. Abre cada una para ver para quién es y qué vigilar.
          </p>
        </div>
      </section>
      <div className="grid">
        {lista.map((h) => (
          <ToolCard key={h.slug} h={h} />
        ))}
      </div>
    </main>
  );
}
