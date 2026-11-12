# -*- coding: utf-8 -*-
"""Headline numbers in a grid: value, label and one line of context per cell."""
import math
import os
import sys

from slidekit import pattern

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _htmlkit import colors, esc  # noqa: E402


@pattern("statgrid", "Grid of headline numbers with a label and context")
def statgrid(r, d):
    items = d.get("items", [])
    cols = max(1, int(d.get("columns", 3)))
    rows = max(1, int(math.ceil(len(items) / float(cols))))

    if not hasattr(r, "slide"):
        _html(r, d, items, cols, rows)
        return

    th = r.th
    r.header(d.get("kicker", ""), d.get("title", ""), d.get("sub", ""))

    band_h = 0.52 if d.get("band") else 0.0
    top = th.top_body
    bottom = th.foot_y - 0.30 - band_h - 0.14
    area = max(1.6, bottom - top)

    gx, gy = 0.20, 0.18
    cw = (th.cw - gx * (cols - 1)) / cols
    ch = (area - gy * (rows - 1)) / rows

    for i, it in enumerate(items):
        col, row = i % cols, i // cols
        x = th.mx + col * (cw + gx)
        y = top + row * (ch + gy)
        r.shape(x, y, cw, ch, fill=th.color("surface"), line=th.color("line"), lw=1.0)
        r.shape(x, y, 0.075, ch, fill=th.color("accent"))

        tf = r.tbox(x + 0.28, y + 0.18, cw - 0.5, 0.62)
        r.para(tf, it.get("value", ""), kind="stat", color=th.color("accent"),
               bold=True, first=True)

        tf = r.tbox(x + 0.28, y + 0.80, cw - 0.5, 0.34)
        r.para(tf, it.get("label", ""), kind="h3", color=th.color("ink"),
               bold=True, first=True)

        tf = r.tbox(x + 0.28, y + 1.18, cw - 0.5, ch - 1.30)
        r.para(tf, it.get("detail", ""), kind="small", color=th.color("body"),
               first=True, spacing=1.2)

    if d.get("band"):
        by = th.foot_y - 0.30 - band_h
        r.shape(th.mx, by, th.cw, band_h, fill=th.color("surface2"))
        r.shape(th.mx, by, 0.075, band_h, fill=th.color("accent"))
        tf = r.tbox(th.mx + 0.24, by + 0.05, th.cw - 0.4, band_h - 0.1)
        r.para(tf, d["band"], kind="small", color=th.color("ink"), first=True)


def _html(r, d, items, cols, rows):
    c = colors(r)
    r.header(d.get("kicker", ""), d.get("title", ""), d.get("sub", ""))

    cells = []
    for it in items:
        cells.append(
            f'<div data-fit style="background:{c["surface"]};border:1px solid {c["line"]};'
            f'border-left:5px solid {c["accent"]};padding:18px 16px;display:flex;'
            'flex-direction:column;justify-content:flex-start;min-width:0;overflow:hidden">'
            f'<div style="font-size:64px;line-height:1;font-weight:700;'
            f'color:{c["accent"]}">{esc(it.get("value", ""))}</div>'
            f'<div style="font-size:31px;font-weight:700;color:{c["ink"]};'
            f'margin:12px 0 8px">{esc(it.get("label", ""))}</div>'
            f'<div style="font-size:24px;line-height:1.5;color:{c["body"]}">'
            f'{esc(it.get("detail", ""))}</div></div>'
        )

    r._add(
        f'<div style="flex:1;display:grid;grid-template-columns:repeat({cols},1fr);'
        f'grid-template-rows:repeat({rows},1fr);gap:16px">{"".join(cells)}</div>'
    )
    if d.get("band"):
        r.band(d["band"])
