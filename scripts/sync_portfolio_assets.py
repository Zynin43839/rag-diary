# -*- coding: utf-8 -*-
"""Copy the generated PDFs into the BA/SA portfolio and rebuild both bundles.

Run after `scripts/build_docs_pdf.py` so the site never serves an older PDF than
the one in output/pdf. The portfolio lives in its own repository (sibling folder
`oranut-blueprint`) and holds all 25 documents; the SA site is retired and redirects
there.
"""
import hashlib
import os
import shutil
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_TH = os.path.join(ROOT, 'output', 'pdf')
SRC_EN = os.path.join(ROOT, 'output', 'pdf', 'en')
PORTFOLIO = os.path.join(os.path.dirname(ROOT), 'oranut-blueprint')
DOCS_TH = os.path.join(PORTFOLIO, 'assets', 'docs')
DOCS_EN = os.path.join(DOCS_TH, 'en')
MEDIA = os.path.join(PORTFOLIO, 'assets', 'media')


def digest(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def sync(src_dir, dst_dir, label):
    os.makedirs(dst_dir, exist_ok=True)
    names = sorted(n for n in os.listdir(src_dir) if n.lower().endswith('.pdf'))
    if not names:
        raise SystemExit('no PDFs in %s - run build_docs_pdf.py first' % src_dir)

    copied = 0
    for name in names:
        src = os.path.join(src_dir, name)
        dst = os.path.join(dst_dir, name)
        same = os.path.exists(dst) and digest(src) == digest(dst)
        if not same:
            shutil.copy2(src, dst)
            copied += 1
    print('%-4s %d/%d copied' % (label, copied, len(names)))
    return names


def bundle(src_dir, names, dest):
    with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED) as z:
        for name in names:
            z.write(os.path.join(src_dir, name), arcname=name)
    print('%-24s %.2f MB' % (os.path.basename(dest), os.path.getsize(dest) / 1048576))


def main():
    if not os.path.isdir(PORTFOLIO):
        raise SystemExit('portfolio not found at %s - check the folder layout'
                         % PORTFOLIO)

    th_names = sync(SRC_TH, DOCS_TH, 'TH')
    en_names = sync(SRC_EN, DOCS_EN, 'EN')

    os.makedirs(MEDIA, exist_ok=True)
    bundle(SRC_TH, th_names, os.path.join(MEDIA, 'RAG-Diary-Docs.zip'))
    bundle(SRC_EN, en_names, os.path.join(MEDIA, 'RAG-Diary-Docs-EN.zip'))


if __name__ == '__main__':
    main()
