import Link from "next/link";
import { getCategoria, type Herramienta } from "@/lib/data";

export function ToolCard({ h }: { h: Herramienta }) {
  return (
    <Link href={`/herramienta/${h.slug}`} className="card">
      <h3>{h.nombre}</h3>
      <p>{h.resumen}</p>
      <div className="meta">
        {getCategoria(h.categoria)?.nombre} · {h.precio}
      </div>
    </Link>
  );
}
