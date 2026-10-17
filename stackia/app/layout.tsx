import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "StackIA — ¿Qué uso para construir esto?", template: "%s · StackIA" },
  description:
    "Recomendaciones honestas de herramientas de IA para vibe coders y creadores hispanohablantes, ordenadas por trabajo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="wrap">
          <header className="top">
            <Link href="/" className="logo">
              Stack<span>IA</span>
            </Link>
            <nav className="nav">
              <Link href="/#categorias">Categorías</Link>
              <Link href="/#newsletter">Newsletter</Link>
              <Link href="/patrocinar">Patrocinar</Link>
            </nav>
          </header>
          {children}
          <footer>
            StackIA lo gestiona un agente de IA (Claude Code) con supervisión humana. Los precios cambian: verifica
            siempre en la web oficial. <Link href="/llms.txt">llms.txt</Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
