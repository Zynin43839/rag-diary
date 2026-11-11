# -*- coding: utf-8 -*-
"""Rebuild the PDFs for documents changed in this round.

Markdown -> HTML (markdown-it) -> A4 PDF via headless Chrome.
"""
import base64
import mimetypes
import os
import re
import subprocess
import sys
import tempfile

from markdown_it import MarkdownIt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, 'docs')
OUT = os.path.join(ROOT, 'output', 'pdf')
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

TARGETS_TH = {
    'D-00-README': r'README.md',
    'D-01-CASE-STUDY': r'00-case-study\CASE-STUDY.md',
    'D-02-PRODUCT-BRIEF': r'01-discovery\PRODUCT-BRIEF.md',
    'D-03-STAKEHOLDER-MATRIX': r'01-discovery\STAKEHOLDER-MATRIX.md',
    'D-04-AS-IS-TO-BE': r'01-discovery\AS-IS-TO-BE.md',
    'D-05-SRS': r'02-requirements\SRS.md',
    'D-06-USER-STORIES': r'02-requirements\USER-STORIES.md',
    'D-07-USE-CASES': r'02-requirements\USE-CASES.md',
    'D-08-BUSINESS-RULES': r'02-requirements\BUSINESS-RULES.md',
    'D-09-TRACEABILITY-MATRIX': r'02-requirements\TRACEABILITY-MATRIX.md',
    'D-10-PROCESS-FLOWS': r'03-modeling\PROCESS-FLOWS.md',
    'D-11-C4-ARCHITECTURE': r'03-modeling\C4-ARCHITECTURE.md',
    'D-12-DATA-MODEL': r'03-modeling\DATA-MODEL.md',
    'D-13-SEQUENCE-DIAGRAMS': r'03-modeling\SEQUENCE-DIAGRAMS.md',
    'D-14-DFD-PRIVACY': r'03-modeling\DFD-PRIVACY.md',
    'D-15-UI-WIREFRAMES': r'04-design\UI-WIREFRAMES.md',
    'D-16-API-CONTRACT': r'04-design\API-CONTRACT.md',
    'D-17-ADR': r'04-design\ADR.md',
    'D-18-NFR-SPEC': r'05-quality\NFR-SPEC.md',
    'D-19-RISK-REGISTER': r'05-quality\RISK-REGISTER.md',
    'D-20-TEST-PLAN': r'05-quality\TEST-PLAN.md',
    'D-21-UAT': r'05-quality\UAT.md',
    'D-22-ROADMAP': r'06-delivery\ROADMAP.md',
    'D-23-CHANGE-REQUEST-LOG': r'06-delivery\CHANGE-REQUEST-LOG.md',
    'D-24-GLOSSARY': r'06-delivery\GLOSSARY.md',
}

# English editions live under docs/en with the same file names; add each
# document here as its translation lands.
TARGETS_EN = {
    'D-00-README': r'README.md',
    'D-01-CASE-STUDY': r'00-case-study\CASE-STUDY.md',
    'D-02-PRODUCT-BRIEF': r'01-discovery\PRODUCT-BRIEF.md',
    'D-03-STAKEHOLDER-MATRIX': r'01-discovery\STAKEHOLDER-MATRIX.md',
    'D-04-AS-IS-TO-BE': r'01-discovery\AS-IS-TO-BE.md',
    'D-05-SRS': r'02-requirements\SRS.md',
    'D-06-USER-STORIES': r'02-requirements\USER-STORIES.md',
    'D-07-USE-CASES': r'02-requirements\USE-CASES.md',
    'D-08-BUSINESS-RULES': r'02-requirements\BUSINESS-RULES.md',
    'D-09-TRACEABILITY-MATRIX': r'02-requirements\TRACEABILITY-MATRIX.md',
    'D-10-PROCESS-FLOWS': r'03-modeling\PROCESS-FLOWS.md',
    'D-11-C4-ARCHITECTURE': r'03-modeling\C4-ARCHITECTURE.md',
    'D-12-DATA-MODEL': r'03-modeling\DATA-MODEL.md',
    'D-13-SEQUENCE-DIAGRAMS': r'03-modeling\SEQUENCE-DIAGRAMS.md',
    'D-14-DFD-PRIVACY': r'03-modeling\DFD-PRIVACY.md',
    'D-15-UI-WIREFRAMES': r'04-design\UI-WIREFRAMES.md',
    'D-16-API-CONTRACT': r'04-design\API-CONTRACT.md',
    'D-17-ADR': r'04-design\ADR.md',
    'D-18-NFR-SPEC': r'05-quality\NFR-SPEC.md',
    'D-19-RISK-REGISTER': r'05-quality\RISK-REGISTER.md',
    'D-20-TEST-PLAN': r'05-quality\TEST-PLAN.md',
    'D-21-UAT': r'05-quality\UAT.md',
    'D-22-ROADMAP': r'06-delivery\ROADMAP.md',
    'D-23-CHANGE-REQUEST-LOG': r'06-delivery\CHANGE-REQUEST-LOG.md',
    'D-24-GLOSSARY': r'06-delivery\GLOSSARY.md',
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


def embed_images(html, base_dir):
    """Inline local images so the temp HTML in %TEMP% can still find them."""
    def repl(match):
        src = match.group(1)
        if src.startswith(('http://', 'https://', 'data:', 'file:')):
            return match.group(0)
        path = os.path.normpath(os.path.join(base_dir, src))
        if not os.path.exists(path):
            print('  missing image: %s' % src, flush=True)
            return match.group(0)
        mime = mimetypes.guess_type(path)[0] or 'image/png'
        with open(path, 'rb') as f:
            data = base64.b64encode(f.read()).decode('ascii')
        return 'src="data:%s;base64,%s"' % (mime, data)

    return re.sub(r'src="([^"]+)"', repl, html)

args = sys.argv[1:]
english = '--en' in args
wanted = [a for a in args if a != '--en']

targets = TARGETS_EN if english else TARGETS_TH
base_dir = os.path.join(DOCS, 'en') if english else DOCS
out_dir = os.path.join(OUT, 'en') if english else OUT
css = CSS
if english:
    css = CSS.replace("'Cordia New', 'Leelawadee UI', sans-serif",
                      "'Segoe UI', Arial, sans-serif")

os.makedirs(out_dir, exist_ok=True)
tmpdir = tempfile.mkdtemp(prefix='rag-pdf-')

for name, rel in targets.items():
    if wanted and name not in wanted:
        continue
    src = os.path.join(base_dir, rel)
    if not os.path.exists(src):
        print('%-28s missing %s' % (name, rel), flush=True)
        continue
    text = open(src, encoding='utf-8').read()
    body_html = embed_images(md.render(text), os.path.dirname(src))
    html = (
        '<!doctype html><html><head><meta charset="utf-8">'
        '<title>%s</title><style>%s</style></head><body>%s</body></html>'
        % (name, css, body_html)
    )
    html_path = os.path.join(tmpdir, name + '.html')
    with open(html_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(html)

    pdf_path = os.path.join(out_dir, name + '.pdf')
    cmd = [
        CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
        '--print-to-pdf=' + pdf_path, 'file:///' + html_path.replace('\\', '/'),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    size = os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
    print('%-28s exit=%d size=%d' % (name, res.returncode, size), flush=True)

print('done')
