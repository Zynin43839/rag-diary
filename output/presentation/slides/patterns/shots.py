# -*- coding: utf-8 -*-
"""Two product screenshots side by side, each with its own caption."""
import os
import sys

from slidekit import pattern

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _htmlkit import colors, data_uri, esc  # noqa: E402


@pattern("shots", "Two screenshots side by side with captions")
def shots(r, d):
    shots = d.get("shots") or []

    if not hasattr(r, "slide"):
        _html(r, d, shots)
        return

    th = r.th
    r.header(d.get("kicker", ""), d.get("title", ""), d.get("sub", ""))

    band_h = 0.52 if d.get("band") else 0.0
    top = th.top_body
    bottom = th.foot_y - 0.30 - band_h - 0.14
    area = max(1.6, bottom - top)
    gap = 0.30
    n = max(1, len(shots))
    w = (th.cw - gap * (n - 1)) / n
    cap_h = 0.42

    for i, s in enumerate(shots):
        x = th.mx + i * (w + gap)
        r.shape(x, top, w, area, fill=th.color("surface"), line=th.color("line"), lw=1.0)
        path = s.get("path", "")
        box_h = area - cap_h - 0.30
        if path and os.path.exists(path):
            from PIL import Image
            from pptx.util import Inches
            iw, ih = Image.open(path).size
            scale = min((w - 0.30) / float(iw), box_h / float(ih))
            dw, dh = iw * scale, ih * scale
            left = x + (w - dw) / 2.0
            top_img = top + 0.15 + (box_h - dh) / 2.0
            r.slide.shapes.add_picture(path, Inches(left), Inches(top_img),
                                       width=Inches(dw), height=Inches(dh))
        tf = r.tbox(x + 0.18, top + area - cap_h - 0.06, w - 0.36, cap_h)
        r.para(tf, s.get("caption", ""), kind="small", color=th.color("ink"), first=True)

    if d.get("band"):
        by = th.foot_y - 0.30 - band_h
        r.shape(th.mx, by, th.cw, band_h, fill=th.color("surface2"))
        r.shape(th.mx, by, 0.075, band_h, fill=th.color("accent"))
        tf = r.tbox(th.mx + 0.24, by + 0.05, th.cw - 0.4, band_h - 0.1)
        r.para(tf, d["band"], kind="small", color=th.color("ink"), first=True)


def _html(r, d, shots):
    c = colors(r)
    r.header(d.get("kicker", ""), d.get("title", ""), d.get("sub", ""))

    cells = []
    for s in shots:
        path = s.get("path", "")
        img = ""
        if path and os.path.exists(path):
            img = (
                f'<img src="{data_uri(path)}" alt="" style="max-width:100%;'
                'max-height:100%;object-fit:contain;border:1px solid '
                f'{c["line"]}">'
            )
        cells.append(
            f'<div style="background:{c["surface"]};border:1px solid {c["line"]};'
            'padding:10px;display:flex;flex-direction:column;align-items:center;'
            'justify-content:center;gap:10px;min-height:0;min-width:0;overflow:hidden">'
            f'<div style="flex:1;min-height:0;display:flex;align-items:center;'
            f'justify-content:center;width:100%">{img}</div>'
            f'<div data-fit style="font-size:22px;color:{c["ink"]};text-align:center">'
            f'{esc(s.get("caption", ""))}</div></div>'
        )

    r._add(
        f'<div style="flex:1;display:grid;grid-template-columns:repeat({max(1, len(shots))},1fr);'
        f'gap:20px;min-height:0">{"".join(cells)}</div>'
    )
    if d.get("band"):
        r.band(d["band"])
