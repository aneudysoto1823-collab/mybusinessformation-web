#!/usr/bin/env python3
"""Build the 4 all-in-one Labor Law Poster PDFs (42in x 39in).

Sources: combined-en.html / combined-es.html (OpaBiz branding, PNG images in img/).
Outputs:
  backend/public/labor-law-poster/labor-law-poster[-fbfc][-es].pdf  (served by /admin/labor-law-poster)
  LABOR_LAW_POSTER/print/<Brand>-Labor-Law-Poster-<EN|ES>-42x39.pdf   (same files, friendly names for the print shop)

Images are downsampled to exactly 300 dpi at their printed size and saved as JPEG q85:
the print shop caps direct uploads at 18 MB, and PNG output weighed ~27 MB.

Usage: python3 LABOR_LAW_POSTER/build.py
"""
import os
import re
import shutil
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT.parent / 'backend' / 'public' / 'labor-law-poster'
PRINT = ROOT / 'print'
BUILD_IMG = ROOT / '.build-img'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

# Printed width (inches) of each notice in the 42x39 layout — see combined-en.html.
PRINT_WIDTH_IN = {
    'osha': 10.10, 'fl-minwage': 10.87, 'fchr': 10.87, 'fl-childlabor': 9.10,
    'fmla': 7.60, 'eppa': 7.60, 'flsa': 7.60, 'fl-workerscomp': 18.15,
    'eeoc': 7.21, 'userra': 7.21, 'rt83': 7.21, 'everify-rtw': 12.08,
}

FBFC_REPLACEMENTS = [
    ("text:'https://opabiz.com'", "text:'https://mybusinessformation.com'"),
    ('<span class="qr-cap">opabiz.com</span>', '<span class="qr-cap">mybusinessformation.com</span>'),
    ('<img src="opabiz-logo.png" alt="OpaBiz">', '<img src="fbfc-logo.png" alt="Florida Business Formation Center">'),
    ('<span class="domain">opabiz.com</span>', '<span class="domain">mybusinessformation.com</span>'),
    ('<strong>OpaBiz</strong> is a trade name of Florida Business Formation Center, a professional',
     '<strong>Florida Business Formation Center</strong> is a professional'),
    ('<strong>OpaBiz</strong> es un nombre comercial de Florida Business Formation Center, un servicio',
     '<strong>Florida Business Formation Center</strong> es un servicio'),
]

VARIANTS = [
    # (brand, lang, public filename, print filename)
    ('opabiz', 'en', 'labor-law-poster.pdf', 'OpaBiz-Labor-Law-Poster-EN-42x39.pdf'),
    ('opabiz', 'es', 'labor-law-poster-es.pdf', 'OpaBiz-Labor-Law-Poster-ES-42x39.pdf'),
    ('fbfc', 'en', 'labor-law-poster-fbfc.pdf', 'MyBiz-Labor-Law-Poster-EN-42x39.pdf'),
    ('fbfc', 'es', 'labor-law-poster-fbfc-es.pdf', 'MyBiz-Labor-Law-Poster-ES-42x39.pdf'),
]


def print_image(name: str) -> str:
    """Return the relative path of a 300 dpi JPEG copy of img/<name>.png."""
    key = next(k for k in PRINT_WIDTH_IN if name.startswith(k))
    out = BUILD_IMG / (name + '.jpg')
    if not out.exists():
        im = Image.open(ROOT / 'img' / (name + '.png')).convert('RGB')
        target = round(PRINT_WIDTH_IN[key] * 300)
        if im.width > target:
            im = im.resize((target, round(im.height * target / im.width)), Image.LANCZOS)
        im.save(out, 'JPEG', quality=85, optimize=True, dpi=(300, 300))
    return f'{BUILD_IMG.name}/{out.name}'


def build_html(brand: str, lang: str) -> str:
    html = (ROOT / f'combined-{lang}.html').read_text(encoding='utf-8')
    if brand == 'fbfc':
        for old, new in FBFC_REPLACEMENTS:
            if old in html:
                html = html.replace(old, new)
        assert 'OpaBiz' not in html.replace('opabiz-logo', ''), f'OpaBiz branding left in fbfc-{lang}'
    return re.sub(r'img/([\w\-]+)\.png', lambda m: print_image(m.group(1)), html)


def main() -> None:
    BUILD_IMG.mkdir(exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    PRINT.mkdir(exist_ok=True)
    for brand, lang, public_name, print_name in VARIANTS:
        tmp = ROOT / f'.build-{brand}-{lang}.html'
        tmp.write_text(build_html(brand, lang), encoding='utf-8')
        pdf = PUBLIC / public_name
        subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
                        '--virtual-time-budget=8000', f'--print-to-pdf={pdf}', tmp.as_uri()],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        tmp.unlink()
        shutil.copyfile(pdf, PRINT / print_name)
        mb = os.path.getsize(pdf) / 1e6
        print(f'{brand:6s} {lang}  {mb:5.1f} MB  {public_name}')
        assert mb < 18, f'{public_name} is over the 18 MB print-shop upload limit'


if __name__ == '__main__':
    main()
