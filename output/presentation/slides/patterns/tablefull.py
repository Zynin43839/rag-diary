# -*- coding: utf-8 -*-
"""Table pattern that centres the table in the body and keeps the band at the
bottom edge, so a four-row table does not leave the lower half empty."""
import os
import sys

from slidekit import pattern

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _htmlkit import colors  # noqa: E402


@pattern("tablefull", "Table centred in the body area, band anchored at the bottom")
def tablefull(r, d):
    headers = d.get("headers", [])
    rows = d.get("rows", [])
    widths = d.get("widths")
    align = d.get("align")
    band = d.get("band")

    if not hasattr(r, "slide"):
        colors(r)  # keeps the palette warm-up in one place
        r.header(d.get("kicker", ""), d.get("title", ""), d.get("sub", ""))
        r._add('<div data-fit style="flex:1;min-height:0;display:flex;flex-direction:column;'
               'justify-content:center;overflow:hidden">')
        r.table(headers, rows, widths=widths, align=align)
        r._add('</div>')
        if band:
            r.band(band, tone=d.get("band_tone", "accent"))
        return

    r.header(d.get("kicker", ""), d.get("title", ""), d.get("sub", ""))
    r.table(headers, rows, widths=widths, align=align)

    # Centre the table in the body so a short table does not hug the header.
    if band:
        th = r.th
        try:
            from pptx.util import Emu
            shape = r.slide.shapes[-1]
            area_top = th.top_body
            area_bottom = th.foot_y - 0.30 - 0.52
            avail = area_bottom - area_top
            height = shape.height / 914400.0
            if 0 < height < avail:
                shape.top = Emu(int((area_top + (avail - height) / 2.0) * 914400))
        except Exception:
            pass

    if band:
        th = r.th
        by = th.foot_y - 0.30 - 0.52
        r.shape(th.mx, by, th.cw, 0.52, fill=th.color("surface2"))
        r.shape(th.mx, by, 0.075, 0.52, fill=th.color("accent"))
        tf = r.tbox(th.mx + 0.24, by + 0.05, th.cw - 0.4, 0.42)
        r.para(tf, band, kind="small", color=th.color("ink"), first=True)
