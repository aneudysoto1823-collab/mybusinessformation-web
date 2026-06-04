# Proceso 11 — SEO Técnico y de Contenido

## Descripción
Configuración de todas las señales que Google y otros motores de búsqueda usan para entender, indexar y rankear el sitio. Cubre dos frentes: (a) SEO técnico — metadata global, sitemap.xml dinámico, robots.txt, Open Graph, Schema.org, hreflang ES/EN, Core Web Vitals; y (b) SEO de contenido — páginas /guia y /wiki con artículos editoriales.

**Estado:** SEO técnico completo (2026-05-01). SEO de contenido pendiente (esperando artículos).

---

## Archivos creados / modificados

| Archivo | Qué hace |
|---------|---------|
| `backend/app/layout.tsx` | Metadata global: metadataBase, Open Graph, Twitter Cards, hreflang ES/EN, canonical, robots, icons, font preconnect |
| `backend/app/robots.ts` | Genera `/robots.txt` — Disallow /admin/, /api/, /client-portal/dashboard |
| `backend/app/sitemap.ts` | Genera `/sitemap.xml` dinámico con todas las páginas públicas |
| `backend/app/opengraph-image.tsx` | Imagen auto-generada 1200×630 para Open Graph / Twitter |
| `backend/app/page.tsx` | Metadata única + Schema.org JSON-LD (Organization, WebSite, Service, FAQPage) |
| `backend/app/about/page.tsx` | Metadata: title "About Us", description, canonical |
| `backend/app/servicios/page.tsx` | Metadata: title "Our Services", description, canonical |
| `backend/app/privacy/page.tsx` | Metadata: title "Privacy Policy", description, canonical, nofollow |
| `backend/app/terms/page.tsx` | Metadata: title "Terms of Service", description, canonical, nofollow |
| `backend/app/legal/page.tsx` | Metadata: title "Legal Disclaimer", description, canonical, nofollow |

---

## SEO Técnico — Implementación detallada

### layout.tsx — Metadata global
```ts
metadataBase: new URL('https://mybusinessformation.com')
title: { default: '...', template: '%s | MyBusinessFormation' }
openGraph: { type: 'website', siteName, locale: 'en_US', alternateLocale: ['es_US'] }
twitter: { card: 'summary_large_image' }
alternates.languages: { 'en-US': BASE_URL, 'es-US': BASE_URL + '/?lang=es' }
```
El `template` hace que cada página muestre su título propio + " | MyBusinessFormation" automáticamente.

### robots.ts
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /client-portal/dashboard
Sitemap: https://mybusinessformation.com/sitemap.xml
```

### sitemap.ts
Páginas incluidas con prioridad:
- `/` → priority 1.0, weekly
- `/servicios` → priority 0.8, monthly
- `/about` → priority 0.7, monthly
- `/privacy`, `/terms`, `/legal` → priority 0.3, yearly
- `/login` → priority 0.2, yearly

Cuando se integren los artículos de /guia y /wiki, se agregan dinámicamente consultando los archivos .md publicados.

### opengraph-image.tsx
- Ruta: `/opengraph-image` (Next.js la sirve como PNG automáticamente)
- Runtime: `edge` para velocidad máxima
- Contenido: logo FL + wordmark "MyBusinessFormation" + tagline + pills de precios (Basic $0, Standard $199, Premium $299) + URL en footer
- Se usa en OG y Twitter Cards de todas las páginas que no definan imagen propia

### Schema.org JSON-LD (home)
Tipos implementados:
- **Organization**: nombre, URL, logo, email, idiomas, área de servicio (US-FL)
- **WebSite**: URL, nombre, publisher
- **Service**: "Florida LLC Formation" con offers (Basic $0, Standard $199, Premium $299)
- **FAQPage**: 4 preguntas frecuentes (2 EN, 2 ES) — listas para Rich Results

### Metadata por página
Cada `page.tsx` exporta su propio objeto `metadata` con title único, description única y canonical. Las páginas legales (privacy, terms, legal) tienen `robots: { follow: false }` para evitar que Google siga sus links hacia afuera.

---

## Audit de Alt Text
**Resultado: PASS**
El sitio no contiene ninguna etiqueta `<img>`. Todos los elementos visuales se implementan con:
- SVG inline (iconos decorativos, sin contenido semántico requerido)
- CSS (fondos, gradientes, formas)
- Emoji de texto (tratados como caracteres Unicode por los lectores de pantalla)

No hay imágenes externas que requieran `alt` text.

---

## Core Web Vitals
**Font preconnect (CLS/LCP):** ✅ Implementado en layout.tsx
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```
**Lazy loading:** ✅ N/A — no existen etiquetas `<img>` en el sitio.
**Width/height explícitos:** ✅ N/A — sin imágenes. El SVG de ChatWidget tiene `width` y `height` explícitos en todos los usos.

---

## Favicon
**Estado: pendiente** — se necesitan los archivos PNG:
- `backend/public/icon.png` (32×32)
- `backend/public/apple-icon.png` (180×180)
- El `favicon.ico` ya existe en `/app/favicon.ico` (generado por Next.js por defecto)

Una vez que existan los PNG, el layout.tsx ya los referencia correctamente en `metadata.icons`.

---

## Validación final — Auditoría de producción 2026-06-04

**Estado: completada parcial** — todos los pass excepto Performance que queda como sprint propio diferido a Fabián (responsable de la parte mobile/perf).

### Resultados de los 5 tests externos

| Test | Resultado | Nota |
|------|-----------|------|
| **SSL Labs** | A+ | HSTS preload + TLS 1.3 |
| **Rich Results Test** (Google) | PASS | Detecta Organization + LocalBusiness + Service + FAQPage + WebSite |
| **Schema.org validator** | PASS | Sin errors/warnings — el `@graph` del home y JSON-LD nuevos en /about /servicios /wiki /guias validan limpios (clave para Bing, ver doc 21 sección 6.1) |
| **Mobile-Friendly Test** | PASS | El sitio renderiza correctamente en viewports mobile |
| **PageSpeed Insights mobile** | **64 / 100** ❌ | Below target ≥85. Detalle abajo. |

### PageSpeed Insights — desglose mobile

| Categoría | Score |
|-----------|-------|
| **SEO** | 🎉 **100** |
| Accessibility | 89 |
| Best Practices | 81 |
| **Performance** | ❌ **64** |

**Core Web Vitals (mobile):**
- LCP (Largest Contentful Paint): **6.7s** (target <2.5s) 🔴
- FCP (First Contentful Paint): **4.3s** (target <1.8s) 🔴
- TBT (Total Blocking Time): 30ms ✅
- CLS (Cumulative Layout Shift): 0 ✅

**Diagnóstico de PSI (oportunidades de optimización)**:

| Issue | Ahorro estimado |
|-------|-----------------|
| Reduce unused JavaScript | **793 KB** |
| Improve image delivery | 177 KB |
| Render-blocking requests | 1050 ms |
| Legacy JavaScript | 14 KB |
| Minify JavaScript | 7 KB |
| Forced reflow | — |
| Network dependency tree | — |

**Causa raíz**: `app/page.tsx` (~6000 líneas) carga el wizard completo de formación, traducciones, FAQ y catálogo en el bundle inicial. La mayoría del JS no se usa hasta que el usuario clickea un CTA.

**Decisión 2026-06-04**: **diferido** a Fabián como sprint propio de Performance (~3-5 hrs). Fabián trabaja la parte mobile/perf del proyecto. Las acciones recomendadas para ese sprint:

1. Code-split del wizard de formación — `dynamic()` import del overlay cuando el usuario clickea "Get Started", no en el initial bundle
2. `next/font` para Fraunces + Plus Jakarta Sans (elimina render-blocking de los `<link>` externos)
3. Defer scripts no críticos (consent default puede quedarse beforeInteractive, gtag puede ir afterInteractive — ya lo está, validar)
4. Optimizar imágenes con `next/image` donde aplique (avatar Claudia, OG image)
5. Auditoría de unused JS — identificar qué módulos pesan más y candidatos a lazy-loading

### Otros resultados de la auditoría de producción

| Check | Resultado |
|-------|-----------|
| 6 security headers (CSP/HSTS/X-Frame/X-Content/Referrer/Permissions) | ✅ PASS — todos presentes con valores correctos |
| Redirect www → apex (308) | ✅ PASS — después de agregar `www` como dominio en Vercel (hallazgo de la auditoría: el cert SSL no cubría www) |
| Redirect HTTP → HTTPS (308) | ✅ PASS |
| HSTS preload-ready | ✅ `max-age=63072000; includeSubDomains; preload` |
| Canonicals → apex sin www | ✅ PASS en home, /es, /servicios, /about |
| hreflang en-US/es-US | ✅ PASS (Next.js renderiza camelCase `hrefLang`, crawlers lo procesan case-insensitive) |
| OpenGraph image | ✅ 1200×630 PNG servido OK |
| Favicon | ✅ 25.9 KB ico servido |
| GA4 Script (gtag) | ✅ Cargado con ID `G-6F9CHVYRXW`, Real-Time funcionando |
| Consent Mode v2 default-deny | ✅ PASS — Script inline correcto antes de gtag.js |
| Sitemap apex | ✅ `https://mybusinessformation.com/sitemap.xml` 200 OK, application/xml, 10 URLs base + auto-suma artículos |
| robots.txt | ✅ Disallow /admin /api /client-portal/dashboard + Sitemap ref correcto |
| JSON-LD home | ✅ `@graph` con 5 entidades (Organization, WebSite, Service, LocalBusiness/ProfessionalService, FAQPage) |
| JSON-LD /new-business | ✅ Organization + Service + Offer + OfferCatalog |
| JSON-LD /about, /servicios, hubs wiki/guias | ✅ AGREGADO 2026-06-04 commit `5b0c3d4` — ver sección abajo |

### JSON-LD agregado el 2026-06-04 (commit `5b0c3d4`)

La auditoría inicial reveló que `/about`, `/servicios` y los hubs de `/wiki` + `/guias` no exponían Schema.org. Esto era pérdida directa de rich snippets, **más impactante en Bing** que en Google (ver `LOGICA_DE_NEGOCIO/21_seo_multi_engine_bing_ai.md` sección 6.1 — Bing descarta structured data completo si hay errors, mientras Google es forgiving).

Implementación:
- **`/about`**: `AboutPage` + `BreadcrumbList` — reusa `@id` de Organization del home via `mainEntity`
- **`/servicios`**: `CollectionPage` + `BreadcrumbList` + `ItemList` con 18 `Service` items. Cada Service tiene `provider` Organization, `areaServed: State Florida`, `serviceType: "Business Formation & Compliance"`. `Offer` con `price` numérico USD para 15 servicios con precio fijo. Para los 3 con precio variable (Registered Agent annual, Virtual address monthly, Annual Report annual) se omite `offer` — Bing es estricto y prefiere ausencia a un price con valor "Annual" string.
- **`/wiki`, `/wiki/es`, `/guias`, `/guias/es`** (hubs): helper `buildHubSchema()` en `components/content/HubView.tsx` — `CollectionPage` + `BreadcrumbList` + `ItemList` con `Article` items cuando hay artículos publicados. Si el hub está vacío (caso actual), emite solo `CollectionPage` + `BreadcrumbList` — sigue siendo válido para crawlers.

Convenciones de diseño consistente:
- Todos los `@id` usan apex sin www (alineado con `metadataBase` y `sitemap.ts`)
- Reuso de `@id` `#organization` y `#website` declarados en el home — evita duplicar info y mejora coherencia del grafo
- `BreadcrumbList` en cada página
- `inLanguage` correcto por idioma del hub

---

## SEO de Contenido
**Estado: pendiente** — esperando los 30 artículos del founder.

Plan de implementación al recibirlos:
1. Crear `backend/app/guia/` y `backend/app/wiki/` como rutas de Next.js
2. Leer archivos `.md` con `gray-matter` para frontmatter (title, description, date, lastUpdated, category)
3. Renderizar con `react-markdown` o `next-mdx-remote`
4. Agregar Schema.org `Article` + `BreadcrumbList` por artículo desde el frontmatter
5. Incluir artículos en `sitemap.ts` dinámicamente
6. Crear `backend/lib/cross-links.ts` con mapa de relaciones entre artículos y páginas principales
7. Agregar links en footer a `/guia` y `/wiki`

---

## Decisiones de diseño
- **No se usa `next/image`** — el sitio genera HTML como strings en `dangerouslySetInnerHTML`. Migrar a componentes Image de Next.js requeriría refactorizar todas las páginas (tarea de Etapa 14+).
- **hreflang `es-US` apunta a `?lang=es`** — el sitio maneja el idioma via JavaScript (toggle de idioma en el navbar). No existen rutas separadas `/es/`. Si en el futuro se crean rutas localizadas, actualizar `alternates.languages` en layout.tsx.
- **privacy/terms/legal con `robots: follow: false`** — son páginas legales que no deben distribuir "link juice" hacia afuera.
