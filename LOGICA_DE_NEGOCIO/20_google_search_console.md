# 20 — Google Search Console (GSC) + Bing Webmaster Tools

Documento maestro del sistema de monitoreo de indexación y performance en buscadores. Cubre cómo está configurada la property de GSC, cómo se hace el submit correcto del sitemap, cómo se setean alertas, y cómo se replica todo en Bing.

> **Slot 12 del roadmap original (CONTEXTO Etapa 12)** se quedó sin número en `LOGICA_DE_NEGOCIO/` porque slot 12 ya lo ocupaba `12_marketing_automation_campanas.md`. Por eso este doc va con el siguiente libre — 20. Cuando alguien busque "Etapa 12" en CONTEXTO, este es el doc.

---

## Stack

| Componente | Producto / Tipo | Rol |
|------------|-----------------|-----|
| Google Search Console | Property tipo **Domain** sobre `mybusinessformation.com` | Monitoreo indexación + Performance + alertas |
| Verificación GSC | DNS **TXT** en Namecheap (zona apex) | Owner verification — permanente |
| Sitemap canónico | `https://mybusinessformation.com/sitemap.xml` | Generado dinámicamente por `backend/app/sitemap.ts` |
| robots.txt | `https://mybusinessformation.com/robots.txt` | Generado por `backend/app/robots.ts` — referencia el sitemap |
| Bing Webmaster Tools | Property en `https://mybusinessformation.com` | Mismo rol que GSC pero para Bing/DuckDuckGo |

---

## Property type — Domain vs URL-prefix

Esta distinción es **crítica** y afecta cómo se hace el submit del sitemap.

### Domain (es la que usamos)

- Cobertura: **TODOS** los subdominios + ambos protocolos (`https://mybusinessformation.com`, `https://www.mybusinessformation.com`, `https://blog.mybusinessformation.com`, etc.)
- Verificación: **solo DNS TXT** — no acepta HTML file ni meta tag
- Sin prefijo precargado en la UI — los campos esperan URLs completas
- Una sola property cubre tráfico de www y apex sin necesidad de duplicar

### URL-prefix (NO la usamos)

- Cobertura: una URL específica (ej. `https://www.mybusinessformation.com/`)
- Verificación: HTML file, meta tag, DNS, Google Analytics, o GTM
- La UI **precarga el prefijo** del dominio en los formularios — el submit acepta paths cortos como `sitemap.xml`
- Si tenés ambos protocolos o subdominios, necesitás una property por cada uno

### Por qué Domain

- Más simple — una sola property cubre todo
- Cualquier nuevo subdominio futuro queda cubierto automáticamente
- Verificación permanente vía DNS (no se rompe si tocás el HTML del sitio)
- El redirect www → apex 301 (configurado en `next.config.ts` + Vercel) consolida toda la autoridad en el apex; la property Domain lo refleja

---

## Submit del sitemap

### En GSC (property tipo Domain)

GSC → Sitemaps → "Add a new sitemap" → pegar **la URL completa**:

```
https://mybusinessformation.com/sitemap.xml
```

⚠️ **NO funciona** pegar solo `sitemap.xml` o `/sitemap.xml` en una property Domain. La UI no precarga el dominio en este tipo de property. Google va a tomar el path como si fuera relativo a nada y marcará "Couldn't fetch".

> **El path corto (`sitemap.xml`) solo es válido en properties URL-prefix**, donde la UI sí precarga el dominio que registraste.

### Verificación post-submit

- Status esperado: "Success" inicialmente. Hasta 24-48h después, GSC corre su primer crawl y la columna pasa a "Success" con número de páginas descubiertas.
- Si después de 48h sigue "Couldn't fetch" → verificar manualmente con `curl -I https://mybusinessformation.com/sitemap.xml` que retorna 200 + `Content-Type: application/xml`. Si OK, esperar otras 24h. Si persiste, revisar logs en Vercel.

### Re-submit

GSC re-crawlea el sitemap automáticamente (~1 vez por semana cuando hay actividad). No hace falta re-submitearlo manualmente cuando publicás un artículo nuevo en `/wiki` o `/guias` — el sitemap se regenera dinámico en cada deploy y GSC lo refresca solo. Solo re-submit si hubo cambio estructural mayor (ej: nueva sección del sitio que aparece en URLs nuevas).

---

## robots.txt

Ya está servido en `https://mybusinessformation.com/robots.txt`. Contenido actual:

```
User-Agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /client-portal/dashboard

Sitemap: https://mybusinessformation.com/sitemap.xml
```

La línea `Sitemap:` ayuda a buscadores que no usan GSC (ej. Bing antes del Webmaster Tools, DuckDuckGo, motores chinos como Baidu) a descubrir el sitemap. **No reemplaza** al submit manual en GSC — los dos sistemas son independientes.

---

## Email notifications

### Owner-level alerts

GSC → Settings (engranaje en menú lateral abajo) → **Users and permissions** → confirmar que la cuenta usada está como **Owner**.

GSC → click en tu avatar (arriba derecha) → **Search Console preferences** → activar **"Send me Search Console alerts by email"**.

Esto activa emails para:
- **Coverage** — URLs que fallan al indexar (404, server errors, blocked by robots)
- **Manual Actions** — penalizaciones manuales del equipo de Google (spam, esquemas de links, etc.)
- **Security issues** — sitio hackeado, malware detectado, phishing
- **Mobile Usability** — issues de mobile-friendly
- **Core Web Vitals** — degradación de performance (LCP, CLS, FID/INP)
- **Schema errors** — errores en JSON-LD estructurado

### Por qué importa

Estos emails son la única forma de enterarse temprano de problemas serios. Una penalización manual o un hackeo notificado puede llegar el mismo día y darte tiempo a reaccionar antes de perder rankings.

---

## Bing Webmaster Tools

Bing maneja ~3% del tráfico orgánico USA + es el motor de DuckDuckGo (que crece). Setup rápido:

### Opción A — Import desde GSC (recomendado, ~2 min)

1. https://www.bing.com/webmasters → Sign in con la misma cuenta Google que tiene GSC
2. Dashboard → botón **"Import your sites from Google Search Console"**
3. Bing copia la property + verificación + sitemap automáticamente

Si el import falla (a veces no toma properties tipo Domain), pasar a Opción B.

### Opción B — Manual

1. Add site: `https://mybusinessformation.com`
2. Verification (3 opciones):
   - **DNS TXT** — Bing te da otro valor TXT distinto al de GSC. Agregar en Namecheap (zona apex). Verificar al instante.
   - **HTML file** — descargar `BingSiteAuth.xml`, ponerlo en `backend/public/`, commit + deploy, verificar
   - **Meta tag** — pegar el `<meta>` en `<head>` (no recomendado en este proyecto — preferimos DNS o HTML file para tener menos clutter en layout.tsx)
3. Una vez verificado: **Sitemaps** → Submit `https://mybusinessformation.com/sitemap.xml` (URL completa, mismo principio que GSC Domain)

### Diferencias relevantes vs GSC

- Bing tiene un crawl más lento — primeras impressions pueden tardar 2-4 semanas más que Google
- Bing no tiene "Manual actions" como categoría separada; los issues serios aparecen en "Security & manual actions" igual
- Bing tiene un tool "URL Inspection" similar al de GSC pero más limitado en historial

---

## Métricas a vigilar (post-launch)

### Coverage (Indexing → Pages)

Meta: **90%+ URLs como "Indexed"** dentro de 4 semanas post-submit.

- "Indexed, not submitted in sitemap" → URLs descubiertas pero que olvidaste agregar. Investigar.
- "Discovered — currently not indexed" → Google las vio pero decidió no indexar (usualmente low quality / duplicado). Mejorar contenido.
- "Crawled — currently not indexed" → Google las crawled pero las descartó. Razón típica: thin content. Mejorar.
- "Excluded by 'noindex' tag" → intencional usualmente (ej. `/admin/*` aunque está disallowed). OK si era el plan.

### Performance (Search results)

Meta: **empieza a recibir clicks/impressions** post-indexación. Si en 6 semanas no hay tráfico, hay un problema estructural (thin content, sin backlinks, target keywords mal elegidos).

Mirar:
- **Query report** — qué buscaron los usuarios que llegaron al sitio
- **Pages report** — qué páginas reciben tráfico
- **Country/Device** — segmentación
- **CTR vs Position** — si CTR es bajo a position 5-10, mejorar title + meta description

### Manual Actions

Meta: **cero**. Si aparece algo acá, parar todo y leer el detalle. Las penalizaciones manuales se levantan haciendo el fix solicitado + Request review.

---

## Change of Address (si en el futuro migra el dominio)

Si en algún momento se cambia el dominio (ej. rebrand, venta, etc.):

1. Usar el tool **antes** de tocar DNS — GSC Settings → Change of Address
2. Configurar 301 permanente del dominio viejo al nuevo
3. Verificar ambos dominios en GSC (vieja + nueva property)
4. Submit el sitemap de la nueva
5. Esperar 6-12 meses para transferencia completa de autoridad

Si se cambia DNS sin el tool, los rankings no se transfieren limpio y se pierde meses de SEO.

---

## Decisiones embutidas

- **Property tipo Domain** — porque cubre todos los subdominios + protocolos en una sola property. La alternativa (URL-prefix por cada protocolo) significaría duplicar trabajo de monitoreo.

- **Submit con URL completa** — porque las properties Domain no precargan el dominio en los inputs. Documentado en este doc para evitar el error común de pegar solo `sitemap.xml` y que Google marque "Couldn't fetch".

- **Verificación por DNS TXT** — persistente y no rompible. Si en el futuro alguien borra `backend/public/google<hash>.html` (que ni siquiera tenemos porque no usamos URL-prefix), la verificación no se rompe.

- **Bing import desde GSC** — preferir la opción A (auto-import) para no duplicar mantenimiento de verificaciones.

- **Sin Schema.org `WebSite` action** todavía — Schema.org básico (Organization, FAQPage, Article) ya está en el sitio. Cuando hagamos el doc de tipos avanzados (HowTo, Service, BreadcrumbList expandido) lo sumamos al inventario de doc 11.

---

## Troubleshooting

Ver también `TROUBLESHOOTING/09_dominio_dns.md` para issues de DNS y `TROUBLESHOOTING/01_sitio_caido.md` si el sitio no responde.

### "Couldn't fetch" en GSC después de submit

1. `curl -I https://mybusinessformation.com/sitemap.xml` — debe retornar 200, Content-Type `application/xml`
2. Verificar que **NO** pegaste solo `sitemap.xml` en una property Domain (causa #1 de este error)
3. ¿Pegaste `http://` en vez de `https://`? GSC rechaza HTTP en properties HTTPS
4. Esperar 24-48h — primer fetch puede tardar
5. Si persiste: GSC → URL Inspection → pegar la URL del sitemap → "Test live URL" — muestra el error específico que Google encuentra

### "URLs no aparecen indexadas después de 4 semanas"

1. GSC → URL Inspection → pegar una URL específica
2. Si dice "URL is not on Google" + "Crawled — currently not indexed":
   - Probable causa: thin content (poco texto), duplicado, sin backlinks
   - Solución: mejorar contenido + conseguir 1-2 backlinks externos
3. Si dice "URL is not on Google" + "Discovered — currently not indexed":
   - Google las vio en el sitemap pero todavía no las crawled
   - Esperar 2-4 semanas más; o "Request indexing" desde el URL Inspection para forzar
4. Si dice "Indexed, though blocked by robots.txt":
   - Revisar `backend/app/robots.ts` — alguna línea está bloqueando algo que debería ser público

### "Recibo emails de Coverage errors falsos positivos"

- GSC a veces reporta errores transitorios (deploys, cold starts de Vercel). Si el error desaparece en 24h sin acción, no era real.
- Si persiste: revisar logs de Vercel para 5xx en esa URL específica.

### "Bing dice que mi sitio no es seguro / categorización wrong"

- Bing → Configure my Site → Crawl Control → confirmar settings
- Si Bing categoriza mal el sitio (ej. "Adult content"): Bing Webmaster Support → Submit reconsideration request

---

## Referencias

- Google Search Console docs: https://support.google.com/webmasters
- Sitemap format: https://www.sitemaps.org/protocol.html
- Bing Webmaster Tools docs: https://www.bing.com/webmasters/help/help-center-661b2d18
- Doc relacionado: [`11_seo_tecnico_y_contenido.md`](11_seo_tecnico_y_contenido.md) — metadata, Schema.org, hreflang
- Doc relacionado: [`19_analytics_ga4.md`](19_analytics_ga4.md) — GA4 (complementario a GSC: GSC mide tráfico orgánico pre-click, GA4 mide comportamiento post-click)
