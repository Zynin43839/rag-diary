# -*- coding: utf-8 -*-
"""QA gate helper: assert the 25 PDF deliverables exist."""
import glob
import os
import sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pdfs = glob.glob(os.path.join(root, 'output', 'pdf', '*.pdf'))
print('PDFS: %d' % len(pdfs))
sys.exit(0 if len(pdfs) == 25 else 1)
