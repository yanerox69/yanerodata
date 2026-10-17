import Link from "next/link";
import { Buscador } from "@/components/Buscador";
import { Newsletter } from "@/components/Newsletter";
import { ToolCard } from "@/components/ToolCard";
import { categorias, herramientasDe, recientes } from "@/lib/data";

export default function Home() {
  return (
    <main>
      <div className="hero">
        <span className="badge">en español · actualizado a diario</span>
        <h1>¿Qué uso para construir esto?</h1>
        <p>Recomendaciones honestas de herramientas de IA para vibe coders y creadores, ordenadas por trabajo.</p>
        <Buscador />
      </div>

      <section>
        <h2>Nuevo esta semana</h2>
        <div className="grid">
          {recientes().map((h) => (
            <ToolCard key={h.slug} h={h} />
          ))}
        </div>
      </section>

      <section id="categorias">
        <h2>Categorías</h2>
        <div className="grid">
          {categorias.map((c) => (
            <Link key={c.slug} href={`/categoria/${c.slug}`} className="card">
              <h3>{c.nombre}</h3>
              <p>{c.descripcion}</p>
              <div className="meta">{herramientasDe(c.slug).length} herramientas</div>
            </Link>
          ))}
        </div>
      </section>

      <Newsletter />
    </main>
  );
}
