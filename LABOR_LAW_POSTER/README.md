# Labor Law Poster (producto $120) — póster único all-in-one

Un solo póster de **42" de ancho × 39" de alto** con los avisos federales y de
Florida, usando el arte oficial de cada agencia sin alterar. Reemplaza desde
2026-10-03 a los 2 pósters separados (Federal 26×26 + Florida 26×42), que se
eliminaron: en el Federal, FMLA/EPPA/FLSA salían a ~4" de ancho (~5pt de letra).

## Archivos

- `combined-en.html` / `combined-es.html` — el diseño (marca OpaBiz). Se abren
  directo en el navegador para verlo.
- `build.py` — genera los 4 PDF (OpaBiz/MyBiz × EN/ES). Para MyBiz cambia logo,
  dominio, QR y aviso legal. Correr después de cualquier cambio:
  `python3 LABOR_LAW_POSTER/build.py`
- Salida: `backend/public/labor-law-poster/labor-law-poster[-fbfc][-es].pdf`
  (los usa `/admin/labor-law-poster`, ver `backend/lib/labor-law-poster.ts`) y
  copias con nombre legible en `print/` (gitignored) para mandar a la imprenta.
- `img/` — arte oficial en PNG. El build lo baja a 300 dpi del tamaño impreso
  en JPEG q85: la imprenta limita la subida directa a 18 MB (en PNG pesaba 27 MB).

## Layout (3 filas, sin espacio entre avisos)

Elegido con una búsqueda exhaustiva de empaquetado, no a ojo. En cada fila las
columnas usan `fr` = proporción de cada imagen, así todos quedan a la misma altura.

| Fila | Avisos | Alto |
|---|---|---|
| 1 | OSHA · FL Minimum Wage · FCHR · FL Child Labor | 14.1" |
| 2 | FMLA · EPPA · FLSA · Workers' Comp | 11.7" |
| 3 | EEOC · USERRA · nota E-Verify · RT-83 · Right to Work | 9.3" |

Mínimos legales reales (verificados en fuente primaria), todos cumplidos:
OSHA ≥ 8.5×14 a 10pt (29 CFR 1903.2), Workers' Comp ≥ 17×11 a color, FL Minimum
Wage ≥ 8.5×11 a 16pt. Los otros 10 avisos solo exigen ser legibles; el más chico
queda a ~7.2" de ancho (~9pt).

## Decisiones a no deshacer

- **E-Verify Participation NO se incluye:** el PDF público dice "Sample Only" y
  "Commercial sale of this poster is strictly prohibited" (el real lo baja cada
  empleador desde su cuenta). En su lugar va un recuadro explicativo del mismo tamaño.
- **Child Labor de Florida queda en inglés** en la versión ES: el estado no
  publica ese aviso en español (aclarado en el pie).
- Sin etiquetas por aviso ("All employers", etc.): ocupaban alto.

## ⏰ Mantenimiento — cada ~30 de septiembre

Revisar versión **y** restricciones de venta/uso de cada aviso (no solo la
fecha). Detalle de fuentes, revisiones vigentes a 2026-10-03 y trucos de
descarga (dol.gov bloquea curl) en la memoria `project_labor_law_poster.md`.
