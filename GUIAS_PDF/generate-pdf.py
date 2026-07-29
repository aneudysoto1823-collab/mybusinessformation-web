#!/usr/bin/env python3
"""
Generador de PDF para las guías de GUIAS_PDF/*.md.

Uso:
    python3 GUIAS_PDF/generate-pdf.py GUIAS_PDF/guia-1-florida-formacion.md [salida.pdf]

Requiere:
    - módulo Python `markdown` (pip install markdown)
    - Google Chrome instalado (usa --headless --print-to-pdf, sin dependencias
      externas tipo pandoc/wkhtmltopdf/puppeteer).

Portada: se arma automáticamente a partir del título (# ...), el kicker
(### ... con "Guía I/II" y "Edición Florida") y el subtítulo en cursiva que
encabezan el .md — ese bloque se saca del cuerpo del documento y se
re-renderiza como portada de una sola hoja (diseño aprobado 2026-07-21:
foto de /client-portal-bg.jpg, tipografía Fraunces+Plus Jakarta Sans
embebida en base64, filete navy translúcido, título a dos tonos, logo OB
al pie). Fuentes y foto viven pre-descargadas en _cover_assets.py — no
requiere red para generar el PDF.

Cada paso dentro de "## El proceso paso a paso" (los bloques que empiezan en
### ) se envuelve en un contenedor con page-break-inside:avoid, para que el
navegador nunca corte un tema a la mitad entre dos páginas. Si dos temas
cortos caben en la misma hoja, quedan juntos de forma natural; si un tema es
largo, empieza en la siguiente página en vez de partirse.
"""
import re
import subprocess
import sys
from pathlib import Path

import markdown

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _cover_assets import FONTS, PHOTO_PNG_B64  # noqa: E402

CHROME_CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
]

# Frase a resaltar en azul dentro del título de portada, por guía de la
# serie (diseño aprobado: "la frase clave en azul, resto en navy").
HIGHLIGHT_PHRASES = ["LLC o Corporación", "LLC or Corporation", "al Día"]

CSS = """
<style>
  @page { margin: 30mm 16mm 20mm 16mm; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    color: #1f2937;
    line-height: 1.55;
    font-size: 12.5px;
    max-width: 780px;
    margin: 0 auto;
  }
  h1, h2, h3 { font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; }
  h1 { color: #1C2E44; font-size: 24px; margin-bottom: 2px; }
  h1 + h3 { color: #2563EB; font-weight: 600; font-size: 13px; margin-top: 0; }
  h2 {
    color: #1C2E44;
    font-size: 17px;
    border-bottom: 2px solid #2563EB;
    padding-bottom: 4px;
    margin-top: 26px;
    page-break-after: avoid;
    break-after: avoid;
  }
  h2.force-break {
    page-break-before: always;
    break-before: page;
  }
  h3 { color: #1C2E44; font-size: 13.5px; margin-top: 18px; page-break-after: avoid; break-after: avoid; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 18px 0; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
  th { background: #f0f4f8; color: #1C2E44; }
  code { background: #f0f4f8; padding: 1px 4px; border-radius: 3px; font-size: 11px; }
  a { color: #2563EB; text-decoration: none; }
  a[href*="opabiz.com/servicios"], a[href*="opabiz.com/booking"], a[href="https://opabiz.com"] {
    display: inline-block;
    background: #2563EB;
    color: #fff !important;
    padding: 7px 16px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 12px;
    margin: 6px 0 4px 0;
  }
  li { margin-bottom: 3px; }
  em { color: #475569; }
  strong { color: #1C2E44; }

  /* Cada paso de "El proceso paso a paso" no se corta entre dos páginas salvo
     que el tema en sí sea más largo que una hoja completa (inevitable). */
  .topic-block {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Cada sección ## se trata como una unidad: si cabe completa en el espacio
     restante de la hoja, se queda ahí (dos secciones cortas comparten
     página); si no cabe, arranca en la siguiente. Si la sección es más larga
     que una hoja entera, el navegador ignora esto y la deja fluir normal. */
  .section-block {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* ── Portada ─────────────────────────────────────────────────────── */
  .cover-page {
    page-break-after: always;
    break-after: page;
    height: 225mm;
    display: flex;
  }
  .cover-frame {
    position: relative;
    width: 100%;
    border: 1px solid rgba(28,46,68,.3);
    border-radius: 4px;
    padding: 46px 40px;
    display: flex;
    flex-direction: column;
    background: #FBFCFE;
    overflow: hidden;
  }
  .cover-kicker {
    position: relative; z-index: 1;
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 500;
    color: #2563EB;
    font-size: 15px;
    margin-bottom: 16px;
  }
  .cover-title {
    position: relative; z-index: 1;
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 600;
    color: #1C2E44;
    font-size: 40px;
    line-height: 1.18;
    max-width: 72%;
  }
  .cover-title .accent { color: #2563EB; }
  .cover-subtitle {
    position: relative; z-index: 1;
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    color: #475569;
    font-size: 14px;
    margin-top: 20px;
    max-width: 58%;
    line-height: 1.65;
  }
  .cover-photo {
    position: absolute;
    right: -24px;
    bottom: -24px;
    width: 62%;
    height: 68%;
    background-image: url('data:image/png;base64,__PHOTO_B64__');
    background-size: cover;
    background-position: center;
    z-index: 0;
  }
  .cover-footer {
    position: relative; z-index: 1;
    margin-top: auto;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .cover-logo-mark {
    width: 30px; height: 30px; border-radius: 8px;
    background: linear-gradient(135deg, #1C2E44, #2563EB);
    color: #fff; display: flex; align-items: center; justify-content: center;
    font-family: 'Fraunces', Georgia, serif; font-weight: 700; font-size: 13px;
  }
  .cover-logo-text { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; font-weight: 700; font-size: 14px; }
  .cover-logo-text .opa { color: #1C2E44; }
  .cover-logo-text .biz { color: #2563EB; }
  .cover-edition {
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    color: #64748B; font-size: 12px; margin-left: 4px;
  }
</style>
"""


def find_chrome() -> str:
    for candidate in CHROME_CANDIDATES:
        if candidate.startswith("/"):
            if Path(candidate).exists():
                return candidate
        else:
            found = subprocess.run(["which", candidate], capture_output=True, text=True)
            if found.returncode == 0 and found.stdout.strip():
                return candidate
    raise SystemExit(
        "No se encontró Google Chrome / Chromium instalado. "
        "Instala Chrome o ajusta CHROME_CANDIDATES en este script."
    )


def build_font_face_css() -> str:
    rules = []
    for entry in FONTS.values():
        rules.append(
            f"@font-face {{ font-family: '{entry['family']}'; "
            f"font-style: {entry['style']}; font-weight: {entry['weight']}; "
            f"src: url(data:font/{entry['format']};base64,{entry['b64']}) "
            f"format('{entry['format']}'); }}"
        )
    return "<style>" + "\n".join(rules) + "</style>"


def split_cover_source(markdown_text: str):
    """Separa el bloque de portada (título/kicker/subtítulo antes del primer
    '---') del resto del contenido, y extrae los 3 textos para armar la
    portada por separado."""
    parts = markdown_text.split("\n---\n", 1)
    header, rest = (parts[0], parts[1]) if len(parts) == 2 else ("", markdown_text)

    lines = [l for l in header.splitlines() if l.strip()]
    title = kicker = subtitle = ""
    for line in lines:
        if line.startswith("### ") and not kicker:
            kicker = line[4:].strip()
        elif line.startswith("# ") and not title:
            title = line[2:].strip()
        elif line.startswith("*") and line.endswith("*") and not line.startswith("**") and not subtitle:
            subtitle = line.strip("*").strip()

    return title, kicker, subtitle, rest


def split_title_two_tone(title: str):
    for phrase in HIGHLIGHT_PHRASES:
        if phrase in title:
            before, _, after = title.partition(phrase)
            return before, phrase, after
    return title, "", ""


def build_cover_html(title: str, kicker: str, subtitle: str) -> str:
    before, highlight, after = split_title_two_tone(title)
    title_html = before + (f'<span class="accent">{highlight}</span>' if highlight else "") + after

    edition = kicker.split("·")[-1].strip() if "·" in kicker else ""
    guide_match = re.search(r"Guía\s+([IVX]+)", kicker)
    guide_num = guide_match.group(1) if guide_match else ""
    footer_label = f"{edition} · {guide_num}" if edition and guide_num else kicker

    photo_html = (
        f'<div class="cover-photo"></div>' if PHOTO_PNG_B64 else ""
    )

    return f"""<div class="cover-page"><div class="cover-frame">
  <div class="cover-kicker">{kicker}</div>
  <div class="cover-title">{title_html}</div>
  <div class="cover-subtitle">{subtitle}</div>
  {photo_html}
  <div class="cover-footer">
    <div class="cover-logo-mark">OB</div>
    <div class="cover-logo-text"><span class="opa">Opa</span><span class="biz">Biz</span></div>
    <div class="cover-edition">{footer_label}</div>
  </div>
</div></div>"""


SECTION_TITLES_TO_FORCE_BREAK = ["¿Está listo para formalizar?"]


def force_break_before_sections(html: str) -> str:
    """Le agrega la clase 'force-break' a ciertos <h2> puntuales, para
    separarlos del bloque anterior (ej. Aviso legal + Introducción son
    'portada/frontmatter', y lo que sigue es el contenido real)."""
    for title in SECTION_TITLES_TO_FORCE_BREAK:
        html = html.replace(f"<h2>{title}</h2>", f'<h2 class="force-break">{title}</h2>')
    return html


def wrap_all_h2_sections(html: str) -> str:
    """Envuelve cada sección ## completa (del <h2> al próximo <h2>, o al
    final) en un <div class="section-block"> para que dos secciones cortas
    puedan compartir hoja, pero ninguna quede partida a la mitad si cabe
    entera en el espacio que resta."""
    chunks = re.split(r"(?=<h2\b)", html)
    wrapped = []
    for chunk in chunks:
        if chunk.strip().startswith("<h2"):
            wrapped.append(f'<div class="section-block">{chunk}</div>')
        else:
            wrapped.append(chunk)  # todo lo previo al primer <h2> (no debería haber nada)
    return "".join(wrapped)


def wrap_topics_in_deep_dive_section(html: str) -> str:
    """Envuelve cada ### ...contenido... de 'El proceso paso a paso' en un
    <div class="topic-block"> para controlar el salto de página al imprimir."""
    section_marker = "<h2>El proceso paso a paso</h2>"
    start = html.find(section_marker)
    if start == -1:
        return html  # no-op si la guía no tiene esa sección

    # Fin de la sección: el próximo <h2> después del marcador.
    next_h2 = html.find("<h2>", start + len(section_marker))
    end = next_h2 if next_h2 != -1 else len(html)

    before, section, after = html[:start], html[start:end], html[end:]

    # Todo antes del primer <h3> de la sección (intro + nota de paquetes)
    # queda igual; a partir de ahí, cada <h3>...siguiente <h3> se envuelve.
    first_h3 = section.find("<h3>")
    if first_h3 == -1:
        return html  # no hay temas todavía, nada que envolver

    intro, topics_html = section[:first_h3], section[first_h3:]

    chunks = re.split(r"(?=<h3>)", topics_html)
    wrapped = "".join(
        f'<div class="topic-block">{chunk}</div>' for chunk in chunks if chunk.strip()
    )

    return before + intro + wrapped + after


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        raise SystemExit(1)

    md_path = Path(sys.argv[1])
    if not md_path.exists():
        raise SystemExit(f"No existe el archivo: {md_path}")

    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else md_path.with_suffix(".pdf")

    text = md_path.read_text(encoding="utf-8")
    title, kicker, subtitle, rest = split_cover_source(text)
    cover_html = build_cover_html(title, kicker, subtitle) if title else ""

    body = markdown.markdown(rest, extensions=["tables", "fenced_code", "sane_lists"])
    # Orden importante: primero el detalle fino (temas dentro de "El proceso
    # paso a paso"), recién después se envuelve cada sección ## completa —
    # si se invierte, los <div> de sección quedan mal anidados.
    body = wrap_topics_in_deep_dive_section(body)
    body = force_break_before_sections(body)
    body = wrap_all_h2_sections(body)

    css = CSS.replace("__PHOTO_B64__", PHOTO_PNG_B64)
    font_faces = build_font_face_css()

    html = f"""<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>{md_path.stem}</title>{font_faces}{css}</head>
<body>
{cover_html}
{body}
</body>
</html>"""

    html_path = out_path.with_suffix(".html")
    html_path.write_text(html, encoding="utf-8")

    chrome = find_chrome()
    subprocess.run(
        [
            chrome,
            "--headless",
            "--disable-gpu",
            "--no-sandbox",
            f"--print-to-pdf={out_path}",
            "--no-pdf-header-footer",
            f"file://{html_path.resolve()}",
        ],
        check=True,
        capture_output=True,
    )

    print(f"PDF generado: {out_path}")
    print(f"(HTML intermedio conservado en: {html_path} — podés borrarlo si no lo necesitás)")


if __name__ == "__main__":
    main()
