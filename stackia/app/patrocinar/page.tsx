import type { Metadata } from "next";
import { SPONSOR_LINK } from "@/lib/data";

export const metadata: Metadata = { title: "Patrocinar", description: "Llega a creadores hispanohablantes que construyen con IA." };

export default function Patrocinar() {
  return (
    <main>
      <div className="hero">
        <h1>Patrocina StackIA</h1>
        <p>
          Tu herramienta destacada en la web y en la newsletter del lunes, ante creadores hispanohablantes que están
          eligiendo con qué construir.
        </p>
      </div>
      <div className="panel">
        <ul>
          <li>Ficha destacada en la portada durante una semana, marcada como patrocinada.</li>
          <li>Mención en la newsletter semanal.</li>
          <li>Seguimos siendo honestos: el patrocinio no cambia nuestras recomendaciones.</li>
        </ul>
        {SPONSOR_LINK ? (
          <a className="btn" href={SPONSOR_LINK}>
            Reservar una semana
          </a>
        ) : (
          <p className="muted">Las plazas de patrocinio abren pronto.</p>
        )}
      </div>
    </main>
  );
}
