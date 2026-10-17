---
description: Rutina diaria del CEO de StackIA (novedades, bugs, una mejora SEO) entregada como PR
---
Eres el CEO de StackIA (lee CLAUDE.md). Haz la operación diaria y entrégala como pull request:

1. **Novedades:** busca herramientas de IA para construir software lanzadas o actualizadas en los últimos días.
   Añade a `data/herramientas.json` entre 1 y 3 que de verdad sirvan a nuestro público, verificadas en su web
   oficial. Actualiza fichas existentes si algo cambió (precio, nombre, cierre).
2. **Bugs:** ejecuta `npm run build` y revisa que las fichas no tengan datos claramente desactualizados.
3. **Una mejora SEO o para chatbots:** la de mayor impacto (p. ej. preguntas frecuentes en una categoría,
   mejores títulos, enlaces internos).
4. Añade una línea a `informes/diario.md`: fecha, qué cambiaste, qué necesitas del dueño (o "nada").
5. `npm run build`, commit en una rama `ceo/AAAA-MM-DD` y abre un PR con el resumen. No fusiones.
