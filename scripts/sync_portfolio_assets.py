# -*- coding: utf-8 -*-
"""Copy the generated PDFs into the BA and SA portfolios and rebuild their bundles.

Run after `scripts/build_docs_pdf.py` so neither site serves an older PDF than
the one in output/pdf. Both portfolios live in their own repositories, as sibling
folders of this project.
"""
import hashlib
import os
import shutil
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_TH = os.path.join(ROOT, 'output', 'pdf')
SRC_EN = os.path.join(ROOT, 'output', 'pdf', 'en')
PARENT = os.path.dirname(ROOT)

BA_DOCS = [
    'D-00-README.pdf', 'D-01-CASE-STUDY.pdf', 'D-02-PRODUCT-BRIEF.pdf',
    'D-03-STAKEHOLDER-MATRIX.pdf', 'D-04-AS-IS-TO-BE.pdf', 'D-05-SRS.pdf',
    'D-06-USER-STORIES.pdf', 'D-07-USE-CASES.pdf', 'D-08-BUSINESS-RULES.pdf',
    'D-09-TRACEABILITY-MATRIX.pdf', 'D-21-UAT.pdf', 'D-22-ROADMAP.pdf',
    'D-23-CHANGE-REQUEST-LOG.pdf', 'D-24-GLOSSARY.pdf',
]
SA_DOCS = [
    'D-10-PROCESS-FLOWS.pdf', 'D-11-C4-ARCHITECTURE.pdf', 'D-12-DATA-MODEL.pdf',
    'D-13-SEQUENCE-DIAGRAMS.pdf', 'D-14-DFD-PRIVACY.pdf', 'D-15-UI-WIREFRAMES.pdf',
    'D-16-API-CONTRACT.pdf', 'D-17-ADR.pdf', 'D-18-NFR-SPEC.pdf',
    'D-19-RISK-REGISTER.pdf', 'D-20-TEST-PLAN.pdf',
]

TARGETS = [
    ('ba-portfolio', BA_DOCS, 'RAG-Diary-Docs'),
    ('sa-portfolio', SA_DOCS, 'RAG-Diary-SA-Docs'),
]


def digest(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def sync(src_dir, dst_dir, names, label):
    os.makedirs(dst_dir, exist_ok=True)
    copied = 0
    for name in names:
        src = os.path.join(src_dir, name)
        if not os.path.exists(src):
            raise SystemExit('missing %s - run build_docs_pdf.py first' % src)
        dst = os.path.join(dst_dir, name)
        same = os.path.exists(dst) and digest(src) == digest(dst)
        if not same:
            shutil.copy2(src, dst)
            copied += 1
    print('%-22s %d/%d copied' % (label, copied, len(names)))


def bundle(src_dir, names, dest):
    with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED) as z:
        for name in names:
            z.write(os.path.join(src_dir, name), arcname=name)
    print('%-22s %.2f MB' % (os.path.basename(dest), os.path.getsize(dest) / 1048576))


def main():
    for folder, names, stem in TARGETS:
        site = os.path.join(PARENT, folder)
        if not os.path.isdir(site):
            raise SystemExit('portfolio not found at %s' % site)
        docs_th = os.path.join(site, 'assets', 'docs')
        docs_en = os.path.join(docs_th, 'en')
        media = os.path.join(site, 'assets', 'media')
        os.makedirs(media, exist_ok=True)

        sync(SRC_TH, docs_th, names, folder + ' TH')
        sync(SRC_EN, docs_en, names, folder + ' EN')
        bundle(SRC_TH, names, os.path.join(media, stem + '.zip'))
        bundle(SRC_EN, names, os.path.join(media, stem + '-EN.zip'))


if __name__ == '__main__':
    main()
