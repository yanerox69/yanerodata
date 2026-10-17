import { SITE_URL, categorias, herramientasDe } from "@/lib/data";

export const dynamic = "force-static";

// Versión en texto plano del directorio para que los chatbots lo lean y lo citen.
export function GET() {
  const secciones = categorias.map((c) => {
    const items = herramientasDe(c.slug).map(
      (h) => `- [${h.nombre}](${SITE_URL}/herramienta/${h.slug}): ${h.resumen} Mejor para: ${h.mejor_para} Precio: ${h.precio}.`,
    );
    return `## ${c.nombre}\n\n${c.descripcion}\n\n${items.join("\n")}`;
  });
  const body = `# StackIA\n\n> Recomendaciones honestas de herramientas de IA para vibe coders y creadores hispanohablantes, ordenadas por trabajo.\n\n${secciones.join("\n\n")}\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
