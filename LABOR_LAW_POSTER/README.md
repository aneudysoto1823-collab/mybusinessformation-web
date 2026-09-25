# Labor Law Poster (producto $120 de OpaBiz) — en diseño

Ver CLAUDE.md sección "Sesión 2026-09-24 — Labor Law Poster" y memoria
`project_labor_law_poster.md` para el detalle completo de decisiones,
matemática de layout, y bugs reales encontrados/corregidos.

## Estado

✅ **Aprobadas por el founder (inglés, OpaBiz):**
- `federal-en.html` — 6 avisos federales (OSHA, EEOC, FMLA, EPPA, USERRA, FLSA). Tamaño 26"×26" / 24"×24".
- `florida-en.html` — 7 avisos de Florida (Salario Mínimo, Workers' Comp, RT-83, Trabajo Infantil, No Discriminación, E-Verify x2). Tamaño 26"×42" / 24"×38".

✅ **Versión MyBiz (mybusinessformation.com), inglés — 2026-09-25:**
- `federal-mybiz-en.html` / `florida-mybiz-en.html` — mismo contenido/layout,
  logo FBFC real (`fbfc-logo.png`, extraído de `backend/lib/fbfc-seal.ts`) en
  vez del "OB", dominio+QR apuntando a mybusinessformation.com, disclosure
  legal ajustado ("Florida Business Formation Center is a professional...",
  sin mencionar "OpaBiz" — mismo criterio que las Guías PDF).

Todas referencian las imágenes como `img/<archivo>.png` (bug de paths
corregido 2026-09-25 en `federal-en.html`/`florida-en.html` — antes referían
`<archivo>.png` sin el prefijo `img/`, rotas si se abrían fuera de un Artifact
publicado con remapeo de paths). Abrir cualquiera de los 4 HTML directo en un
navegador — tienen selector de tamaño de impresión y botón "Print / Save as
PDF" incluidos.

**PDFs finales** (impresos con Chrome headless, mismo enfoque que
`GUIAS_PDF/generate-pdf.py`) viven en `backend/public/labor-law-poster/*.pdf`
— servidos como asset estático, con panel admin en `/admin/labor-law-poster`
(ver `backend/lib/labor-law-poster.ts`) para ver/descargar/enviar por email
cada set (Federal+Florida) de una marca+idioma. El PDF de Florida (~23MB) va
siempre como link de descarga, nunca adjunto (supera cualquier límite
práctico de email) — el Federal (~7MB) sí se adjunta.

✅ **Versión en español, OpaBiz y MyBiz — 2026-09-25:**
- `federal-es.html` / `florida-es.html` (OpaBiz) y `federal-mybiz-es.html` /
  `florida-mybiz-es.html` (MyBiz) — las 8 combinaciones completas ya están
  generadas (PDFs en `backend/public/labor-law-poster/`, panel admin en
  `/admin/labor-law-poster`).
- 9 de los 11 documentos que faltaban se consiguieron con su arte oficial
  real en español (osha-es, eeoc-es, userra-es, fmla-es, eppa-es, flsa-es,
  fl-minwage-es, fl-workerscomp-es, rt83-es — ver `img/`). Varios se
  recuperaron vía archive.org porque dol.gov bloqueaba `curl` directo con 403
  (Akamai) incluso con headers de navegador real.
- **E-Verify Participation**: no hizo falta generar `-es` — el PNG en inglés
  ya existente (`everify-participation.png`) es el documento oficial
  bilingüe EN/ES en una sola página (igual que `fchr` y `everify-rtw`).
  Se reutiliza tal cual en el póster ES.
- **Florida Trabajo Infantil**: sin edición oficial en español. El único
  documento en español que publica el estado es un folleto (brochure) de
  2 páginas con contenido/formato distinto al póster (tabla de una página) —
  no es el mismo documento, así que no se usó como sustituto. Queda en
  inglés dentro del póster ES, con una nota en el pie del recuadro
  ("sin edición oficial en español").
- **✅ OSHA — unificado a la edición vigente en ambos idiomas (resuelto
  2026-09-25):** se verificó cuál de las 2 versiones de OSHA es la más
  reciente. `osha.gov/publications/poster` confirma que **"OSHA Cares Job
  Safety and Health Workplace Poster"** (Pub. 3165-02R EN / 3167-02R ES,
  "OSHA Cares that you go home safe" / "OSHA se preocupa por su seguridad")
  es el póster oficial vigente en 2026, con URLs propias
  (`/sites/default/files/publications/OSHA3165.pdf` en inglés) — reemplaza
  al clásico "Job Safety and Health: It's The Law" (`osha3165-8514.pdf`,
  todavía hosteado pero ya no es el diseño actual). Se descargó la versión
  en inglés de la URL correcta y se reemplazó `img/osha.png` — ahora EN y ES
  muestran la MISMA edición (mismas proporciones, 4131×5751, AR 0.718). El
  layout del `fed-grid` (5.7fr/6.3fr en los 4 archivos Federal) quedó
  unificado para ambos idiomas — ya no hace falta un split distinto por
  idioma.

⏳ **Pendiente:**
- El aviso NLRA quedó ofrecido (solo aplica a contratistas federales) pero no construido — evaluar si se agrega como aviso condicional aparte.

## Contenido de `img/`

Imágenes reales oficiales renderizadas desde los PDF de cada agencia (OSHA,
EEOC, DOL, agencias de Florida, DHS/E-Verify) — no son mockups ni resúmenes,
son el arte oficial tal cual. `fchr-es.png` y `everify-rtw-es.png` ya están
listas en español (esos 2 PDFs oficiales vienen bilingües EN/ES de fábrica) —
sirven directo cuando se arme la versión en español, no hace falta re-bajarlas.

## ⏰ Mantenimiento recurrente

Revisar ~cada 30 de septiembre (coincide con la actualización anual del
salario mínimo de Florida) si alguno de los 13 documentos oficiales cambió de
versión. Lista completa de URLs oficiales + notas de qué dominios bloquean
`curl` sin headers de navegador: ver memoria `project_labor_law_poster.md`.
