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

## Validación final
**Estado: pendiente** — requiere dominio `mybusinessformation.com` apuntando a Vercel (Etapa 10).

Checklist de validación (hacer manualmente una vez activo el dominio):
- [ ] Rich Results Test: https://search.google.com/test/rich-results → ingresar URL del home → verificar Organization, FAQPage, Service
- [ ] Mobile-Friendly Test: https://search.google.com/test/mobile-friendly
- [ ] PageSpeed Insights: https://pagespeed.web.dev → meta ≥ 85 en mobile
- [ ] Validar sitemap: https://mybusinessformation.com/sitemap.xml
- [ ] Validar robots: https://mybusinessformation.com/robots.txt
- [ ] Validar OG image: compartir URL en Telegram o usar https://www.opengraph.xyz

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
