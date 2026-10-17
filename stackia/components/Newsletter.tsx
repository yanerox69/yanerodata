"use client";

import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    const res = await fetch("/api/suscribir", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setEstado(res.ok ? "ok" : "error");
  }

  return (
    <div className="panel newsletter" id="newsletter">
      <h2>Las mejores herramientas nuevas, cada lunes</h2>
      <p className="muted">Un email corto en español: qué salió, para qué sirve y si merece la pena. Gratis.</p>
      {estado === "ok" ? (
        <p>¡Listo! Revisa tu bandeja de entrada el lunes.</p>
      ) : (
        <form onSubmit={enviar}>
          <input type="email" required placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn" disabled={estado === "enviando"}>
            {estado === "enviando" ? "Enviando…" : "Suscribirme"}
          </button>
        </form>
      )}
      {estado === "error" && <p className="muted">Algo falló. Inténtalo de nuevo en un momento.</p>}
    </div>
  );
}
