# TROUBLESHOOTING — MyBusinessFormation.com

**Manual de emergencia para producción.** No es documentación técnica — es la guía que abres cuando algo está roto y necesitas resolverlo YA.

---

## Para qué sirve esta carpeta

Cuando algo falla en producción (sitio caído, pago fallido, email no llega, etc.), abres el archivo correspondiente, identificas tu síntoma en la lista, y aplicas la solución directa.

NO contiene explicaciones técnicas. NO contiene código. Solo: **"si pasa X, haz Y"**.

---

## Cómo usarla — 3 pasos

1. **Identificar el síntoma** — ¿qué está fallando? (sitio no carga, cliente no puede pagar, emails no llegan, etc.)
2. **Abrir el archivo correspondiente** — usar el índice de abajo
3. **Buscar el síntoma exacto y seguir la solución** paso a paso

Si después de aplicar la solución el problema persiste, escala: contacta al equipo, abre ticket con el proveedor (Vercel/Railway/Supabase/Stripe/Resend), o documenta el problema nuevo en `10_otros.md`.

---

## Leyenda de gravedad

| Símbolo | Nivel | Significado | Tiempo de respuesta esperado |
|---------|-------|-------------|------------------------------|
| 🔴 | Crítico | Sistema caído o no se puede vender | < 30 minutos |
| 🟡 | Medio | Sistema funciona pero hay features rotas | < 4 horas |
| 🟢 | Bajo | Problema menor, no urgente | < 48 horas |

---

## Índice de archivos

| # | Archivo | Cubre |
|---|---------|-------|
| 01 | [01_sitio_caido.md](01_sitio_caido.md) | Frontend Vercel — sitio no carga, errores 500, deploy falló |
| 02 | [02_backend_no_responde.md](02_backend_no_responde.md) | Backend Express en Railway — APIs caídas, timeouts |
| 03 | [03_base_de_datos.md](03_base_de_datos.md) | Supabase PostgreSQL — connection limit, queries lentas, datos perdidos |
| 04 | [04_pagos_fallidos.md](04_pagos_fallidos.md) | Stripe — pagos rechazados, webhooks rotos, refunds |
| 05 | [05_emails_no_envian.md](05_emails_no_envian.md) | Resend — emails no llegan, spam, dominio no verificado |
| 06 | [06_busqueda_nombres.md](06_busqueda_nombres.md) | Sunbiz Florida — base local desactualizada, búsqueda lenta |
| 07 | [07_panel_admin.md](07_panel_admin.md) | `/admin` — login admin, dashboard, acciones sobre órdenes |
| 08 | [08_portal_cliente.md](08_portal_cliente.md) | `/client-portal` — login cliente, descargas, datos incorrectos |
| 09 | [09_dominio_dns.md](09_dominio_dns.md) | Dominio mybusinessformation.com — DNS, SSL, propagación |
| 10 | [10_otros.md](10_otros.md) | Problemas no categorizados — DDoS, sobrecostos, accesos revocados |

---

## Reglas para mantener este manual vivo

1. **Cada vez que ocurra un problema nuevo en producción**, agregarlo aquí inmediatamente después de resolverlo.
2. **Si una solución cambia** (porque el proveedor cambió su UI, por ejemplo), actualizar este manual.
3. **No agregar problemas hipotéticos** — solo cosas que realmente puedan pasar dada nuestra arquitectura.
4. **Mantener el lenguaje simple** — cualquier persona del equipo (técnica o no) debe poder leer y actuar.
5. **Status (🔴🟡🟢) según impacto en VENTAS, no en complejidad técnica.**

---

## Contactos de emergencia

| Servicio | Dashboard | Soporte / Status page |
|----------|-----------|------------------------|
| Vercel | https://vercel.com/dashboard | https://www.vercel-status.com |
| Railway | https://railway.com/dashboard | https://status.railway.com |
| Supabase | https://supabase.com/dashboard | https://status.supabase.com |
| Stripe | https://dashboard.stripe.com | https://status.stripe.com |
| Resend | https://resend.com/emails | https://resend-status.com |
| GitHub | https://github.com | https://www.githubstatus.com |
| Cloudflare (futuro) | https://dash.cloudflare.com | https://www.cloudflarestatus.com |

---

**Responsable principal del manual:** Ethan (founder)
**Última actualización:** 20 abril 2026
