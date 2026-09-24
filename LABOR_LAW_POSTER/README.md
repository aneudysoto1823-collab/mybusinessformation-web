# Labor Law Poster (producto $120 de OpaBiz) — en diseño

Ver CLAUDE.md sección "Sesión 2026-09-24 — Labor Law Poster" y memoria
`project_labor_law_poster.md` para el detalle completo de decisiones,
matemática de layout, y bugs reales encontrados/corregidos.

## Estado

✅ **Aprobadas por el founder (inglés):**
- `federal-en.html` — 6 avisos federales (OSHA, EEOC, FMLA, EPPA, USERRA, FLSA). Tamaño 26"×26" / 24"×24".
- `florida-en.html` — 7 avisos de Florida (Salario Mínimo, Workers' Comp, RT-83, Trabajo Infantil, No Discriminación, E-Verify x2). Tamaño 26"×42" / 24"×38".

Abrir cualquiera de los 2 HTML directo en un navegador (o servir la carpeta) —
tienen selector de tamaño de impresión y botón "Print / Save as PDF" incluidos.

⏳ **Pendiente:**
- Versión en español de ambos (Federal + Florida).
- Versión MyBiz (mybusinessformation.com) de los 4 — logo FBFC real en vez de OB, dominio mybusinessformation.com en QR/footer.
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
