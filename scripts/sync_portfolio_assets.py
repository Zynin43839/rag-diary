# -*- coding: utf-8 -*-
"""Copy the generated PDFs into the portfolio site and rebuild the docs bundle.

Run after `scripts/build_docs_pdf.py` so the public site never serves an older
PDF than the one in output/pdf.
"""
import hashlib
import os
import shutil
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'output', 'pdf')
DOCS = os.path.join(ROOT, 'portfolio', 'assets', 'docs')
ZIP_PATH = os.path.join(ROOT, 'portfolio', 'assets', 'media', 'RAG-Diary-Docs.zip')


def digest(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def main():
    os.makedirs(DOCS, exist_ok=True)
    names = sorted(n for n in os.listdir(SRC) if n.lower().endswith('.pdf'))
    if not names:
        raise SystemExit('no PDFs in output/pdf - run build_docs_pdf.py first')

    copied = 0
    for name in names:
        src = os.path.join(SRC, name)
        dst = os.path.join(DOCS, name)
        same = os.path.exists(dst) and digest(src) == digest(dst)
        if not same:
            shutil.copy2(src, dst)
            copied += 1
        print('%-34s %s' % (name, 'unchanged' if same else 'updated'), flush=True)

    # Rebuild the downloadable bundle with the same flat layout as before.
    with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as z:
        for name in names:
            z.write(os.path.join(SRC, name), arcname=name)

    print('copied %d/%d PDFs' % (copied, len(names)))
    print('bundle: %s (%.1f MB)' % (ZIP_PATH, os.path.getsize(ZIP_PATH) / 1048576))


if __name__ == '__main__':
    main()
