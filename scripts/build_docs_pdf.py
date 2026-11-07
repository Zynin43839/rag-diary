# -*- coding: utf-8 -*-
"""Rebuild the PDFs for documents changed in this round.

Markdown -> HTML (markdown-it) -> A4 PDF via headless Chrome.
"""
import os
import subprocess
import sys
import tempfile

from markdown_it import MarkdownIt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, 'docs')
OUT = os.path.join(ROOT, 'output', 'pdf')
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

TARGETS = {
    'D-01-CASE-STUDY': r'00-case-study\CASE-STUDY.md',
    'D-02-PRODUCT-BRIEF': r'01-discovery\PRODUCT-BRIEF.md',
    'D-05-SRS': r'02-requirements\SRS.md',
    'D-09-TRACEABILITY-MATRIX': r'02-requirements\TRACEABILITY-MATRIX.md',
    'D-11-C4-ARCHITECTURE': r'03-modeling\C4-ARCHITECTURE.md',
    'D-13-SEQUENCE-DIAGRAMS': r'03-modeling\SEQUENCE-DIAGRAMS.md',
    'D-14-DFD-PRIVACY': r'03-modeling\DFD-PRIVACY.md',
    'D-16-API-CONTRACT': r'04-design\API-CONTRACT.md',
    'D-17-ADR': r'04-design\ADR.md',
    'D-18-NFR-SPEC': r'05-quality\NFR-SPEC.md',
    'D-19-RISK-REGISTER': r'05-quality\RISK-REGISTER.md',
    'D-20-TEST-PLAN': r'05-quality\TEST-PLAN.md',
    'D-22-ROADMAP': r'06-delivery\ROADMAP.md',
}

CSS = """
@page { size: A4; margin: 18mm 16mm 18mm 16mm; }
body { font-family: 'Cordia New', 'Leelawadee UI', sans-serif; font-size: 12pt;
       line-height: 1.55; color: #1a1a1a; }
h1 { font-size: 20pt; margin: 0 0 10pt; color: #0b1f33; }
h2 { font-size: 15pt; margin: 16pt 0 6pt; color: #1f5fa8; border-bottom: 1px solid #d5deea; }
h3 { font-size: 13pt; margin: 12pt 0 4pt; color: #0b1f33; }
p, li { font-size: 12pt; }
table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 10.5pt; }
th, td { border: 1px solid #c9d3e0; padding: 3pt 5pt; vertical-align: top; text-align: left; }
th { background: #eef2f8; }
code { font-family: 'Cascadia Mono', Consolas, monospace; font-size: 10pt;
       background: #f3f5f9; padding: 1pt 3pt; border-radius: 3px; }
pre { background: #f3f5f9; padding: 8pt; border-radius: 4px; white-space: pre-wrap;
      font-size: 9.5pt; }
pre code { background: none; padding: 0; }
blockquote { margin: 8pt 0; padding: 4pt 10pt; border-left: 3px solid #c98a3c;
             background: #fbf7ef; color: #444; }
img { max-width: 100%; }
a { color: #1f5fa8; text-decoration: none; }
"""

md = MarkdownIt('commonmark', {'html': True, 'linkify': True}).enable(
    ['table', 'strikethrough']
)

os.makedirs(OUT, exist_ok=True)
tmpdir = tempfile.mkdtemp(prefix='rag-pdf-')

wanted = sys.argv[1:]
for name, rel in TARGETS.items():
    if wanted and name not in wanted:
        continue
    src = os.path.join(DOCS, rel)
    text = open(src, encoding='utf-8').read()
    html = (
        '<!doctype html><html><head><meta charset="utf-8">'
        '<title>%s</title><style>%s</style></head><body>%s</body></html>'
        % (name, CSS, md.render(text))
    )
    html_path = os.path.join(tmpdir, name + '.html')
    with open(html_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(html)

    pdf_path = os.path.join(OUT, name + '.pdf')
    cmd = [
        CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
        '--print-to-pdf=' + pdf_path, 'file:///' + html_path.replace('\\', '/'),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    size = os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
    print('%-28s exit=%d size=%d' % (name, res.returncode, size), flush=True)

print('done')
