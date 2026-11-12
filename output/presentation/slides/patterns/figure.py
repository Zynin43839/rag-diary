# -*- coding: utf-8 -*-
"""Figure pattern: full-width PNG with aspect-fit (PPTX) or inline image (HTML)."""
import os
import sys

from slidekit import pattern

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _htmlkit import figure_html  # noqa: E402


@pattern("figure", "Full-width diagram with aspect-fit (PPTX) or inline image (HTML)")
def figure(r, d):
    r.header(d.get("kicker", ""), d.get("title", ""), d.get("sub", ""))
    path = d.get("path", "")
    caption = d.get("caption", "")

    if hasattr(r, "slide"):
        from pptx.util import Inches
        try:
            from PIL import Image
            iw, ih = Image.open(path).size
            max_w, max_h = 11.9, 4.18
            scale = min(max_w / float(iw), max_h / float(ih))
            w, h = iw * scale, ih * scale
            left = 0.7 + (max_w - w) / 2.0
            r.slide.shapes.add_picture(path, Inches(left), Inches(1.75),
                                       width=Inches(w), height=Inches(h))
        except Exception:
            r.text_block("ไม่พบภาพ: %s" % (caption or os.path.basename(path)))
        if caption:
            th = r.th
            by = th.foot_y - 0.95
            r.shape(th.mx, by, th.cw, 0.62, fill=th.color("surface2"))
            r.shape(th.mx, by, 0.075, 0.62, fill=th.color("accent"))
            tf = r.tbox(th.mx + 0.24, by + 0.10, th.cw - 0.4, 0.42)
            r.para(tf, caption, kind="small", color=th.color("ink"), first=True)
        return

    figure_html(r, path, caption)
    if caption:
        r.band(caption)
