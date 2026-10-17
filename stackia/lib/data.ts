import categorias from "@/data/categorias.json";
import herramientas from "@/data/herramientas.json";

export type Categoria = (typeof categorias)[number];
export type Herramienta = (typeof herramientas)[number];

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stackia.vercel.app";
export const SPONSOR_LINK = process.env.NEXT_PUBLIC_STRIPE_SPONSOR_LINK ?? "";

export { categorias, herramientas };

export function getCategoria(slug: string) {
  return categorias.find((c) => c.slug === slug);
}

export function getHerramienta(slug: string) {
  return herramientas.find((h) => h.slug === slug);
}

export function herramientasDe(categoria: string) {
  return herramientas.filter((h) => h.categoria === categoria);
}

/** Las más recientes primero; alimenta "Nuevo esta semana". */
export function recientes(n = 4) {
  return [...herramientas].sort((a, b) => b.anadido.localeCompare(a.anadido)).slice(0, n);
}
