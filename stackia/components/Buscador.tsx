"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { categorias, herramientas } from "@/lib/data";

export function Buscador() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const resultados = useMemo(() => {
    const t = q.trim().toLowerCase();
    return herramientas.filter(
      (h) =>
        (!cat || h.categoria === cat) &&
        (!t || [h.nombre, h.resumen, h.mejor_para].some((s) => s.toLowerCase().includes(t))),
    );
  }, [q, cat]);

  return (
    <>
      <input
        className="search"
        placeholder="Busca: base de datos, voz, cobrar, agente…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="chips">
        <button className={`chip ${cat === null ? "on" : ""}`} onClick={() => setCat(null)}>
          Todo
        </button>
        {categorias.map((c) => (
          <button key={c.slug} className={`chip ${cat === c.slug ? "on" : ""}`} onClick={() => setCat(c.slug)}>
            {c.nombre}
          </button>
        ))}
      </div>
      <div className="grid">
        {resultados.map((h) => (
          <Link key={h.slug} href={`/herramienta/${h.slug}`} className="card">
            <h3>{h.nombre}</h3>
            <p>{h.mejor_para}</p>
            <div className="meta">{h.precio}</div>
          </Link>
        ))}
      </div>
      {resultados.length === 0 && <p className="muted">Nada todavía. Sugiérenos una herramienta en la newsletter.</p>}
    </>
  );
}
