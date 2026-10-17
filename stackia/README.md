# StackIA: un micronegocio dirigido por un agente CEO en Claude Code

Réplica del método del vídeo ("Grok/Milo construyó un negocio que ya factura") hecha con **Claude Code**.
El negocio: un directorio en español de herramientas de IA para vibe coders ("¿qué uso para construir esto?"),
monetizado con patrocinios y newsletter.

## Los 5 pasos

1. **Agente con rol de CEO**: `CLAUDE.md` le da a Claude Code el papel, el negocio y los límites.
2. **Pídele la idea**: ya está elegida (directorio en español). Para otra, abre `claude` aquí y pídele
   *"Eres el CEO. Propón 6 problemas pequeños que un agente pueda resolver casi solo"*.
3. **"Constrúyela ya"**: la web Next.js de esta carpeta (portada con buscador, categorías, fichas,
   `/patrocinar`, `/llms.txt`, sitemap y newsletter).
4. **Conecta 4 herramientas**:
   - **GitHub**: ya está en este repo.
   - **Vercel**: importa el repo en vercel.com, *Root Directory* = `stackia`.
   - **Resend**: crea una API key y una audiencia; pon `RESEND_API_KEY` y `RESEND_AUDIENCE_ID` en Vercel.
   - **Stripe**: crea un Payment Link de patrocinio; pon `NEXT_PUBLIC_STRIPE_SPONSOR_LINK` en Vercel.
   - Opcional: que Claude Code los gestione con MCP, p. ej. `claude mcp add --transport http vercel https://mcp.vercel.com`
     y `claude mcp add --transport http stripe https://mcp.stripe.com`.
5. **Dale su lista de tareas**: ya está en `CLAUDE.md` (monetizar, SEO, chatbots, newsletter, feedback, tests,
   bugs, informes, patrocinadores).

## Rutinas

| Comando | Cuándo | Qué hace |
| --- | --- | --- |
| `/ops-diaria` | cada mañana | añade novedades, revisa bugs, una mejora SEO → abre un PR |
| `/informe-semanal` | los lunes | borrador de newsletter + informe y decisiones pendientes → abre un PR |

Ejecútalas a mano (`claude` dentro de `stackia/` y escribe el comando) o prográmalas como tarea programada en
claude.ai/code. El agente **nunca** fusiona, envía emails, escribe a patrocinadores ni toca Stripe sin tu
aprobación: tú revisas el PR y decides.

## Desarrollo local

```bash
cd stackia
npm install
cp .env.example .env.local   # rellena las claves
npm run dev                  # http://localhost:3000
```

Para añadir herramientas edita `data/herramientas.json`; las páginas se generan solas.
