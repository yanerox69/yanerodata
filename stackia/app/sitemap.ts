import type { MetadataRoute } from "next";
import { SITE_URL, categorias, herramientas } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/patrocinar` },
    ...categorias.map((c) => ({ url: `${SITE_URL}/categoria/${c.slug}` })),
    ...herramientas.map((h) => ({ url: `${SITE_URL}/herramienta/${h.slug}`, lastModified: h.anadido })),
  ];
}
