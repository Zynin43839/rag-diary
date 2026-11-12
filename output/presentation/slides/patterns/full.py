# -*- coding: utf-8 -*-
"""Full-bleed patterns: cover, section, bullets and cards fill the whole slide.

The PPTX branch positions shapes in inches; the HTML branch emits flex layouts
with the same proportions so the web deck looks like the printed one.
"""
import os
import sys

from slidekit import pattern

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _htmlkit import colors, data_uri, esc  # noqa: E402


def _th(r):
    return getattr(r, "th", None)


def _fit_image(r, path, x, y, w, h):
    """Draw a picture inside the box, preserving aspect ratio and centering it."""
    try:
        from PIL import Image
        from pptx.util import Inches
        iw, ih = Image.open(path).size
        scale = min(w / float(iw), h / float(ih))
        dw, dh = iw * scale, ih * scale
        left = x + (w - dw) / 2.0
        top = y + (h - dh) / 2.0
        r.slide.shapes.add_picture(path, Inches(left), Inches(top),
                                   width=Inches(dw), height=Inches(dh))
        return True
    except Exception:
        return False


@pattern("coverfull", "Full-bleed cover: dark panel, title, and a framed screenshot")
def coverfull(r, d):
    th = _th(r)
    if not hasattr(r, "slide"):
        _cover_html(r, d)
        return

    sw, sh = th.sw, th.sh
    ink = th.color("ink")
    page = th.color("bg")
    accent = th.color("accent2")

    r.shape(0, 0, sw, sh, fill=page)
    panel_w = sw * 0.56
    r.shape(0, 0, panel_w, sh, fill=ink)
    r.shape(panel_w, 0, 0.09, sh, fill=accent)

    x = th.mx + 0.25
    r.shape(x, 1.15, 0.95, 0.06, fill=accent)

    tf = r.tbox(x, 1.42, panel_w - 1.0, 0.34)
    r.para(tf, d.get("kicker", ""), kind="small", color=accent, bold=True, first=True)

    tf = r.tbox(x, 1.9, panel_w - 0.9, 1.1)
    r.para(tf, d.get("title", ""), kind="cover", color=page, bold=True, first=True)

    tf = r.tbox(x, 3.05, panel_w - 0.9, 1.5)
    r.para(tf, d.get("sub", ""), kind="h2", color=page, first=True, spacing=1.2)

    tf = r.tbox(x, 4.75, panel_w - 0.9, 0.9)
    r.para(tf, d.get("lead", ""), kind="body", color=th.color("surface2"), first=True)

    img = d.get("image")
    if img and os.path.exists(img):
        from PIL import Image
        box_x, box_y = panel_w + 0.45, 1.0
        box_w, box_h = sw - box_x - th.mx, sh - 2.0
        iw, ih = Image.open(img).size
        scale = min(box_w / float(iw), box_h / float(ih))
        dw, dh = iw * scale, ih * scale
        left = box_x + (box_w - dw) / 2.0
        top = box_y + (box_h - dh) / 2.0
        r.shape(left - 0.10, top - 0.10, dw + 0.20, dh + 0.20,
                fill=th.color("surface"), line=ink, lw=1.0)
        _fit_image(r, img, left, top, dw, dh)

    stats = d.get("stats") or []
    if stats:
        n = len(stats)
        gx = 0.18
        sx = panel_w + 0.45
        sw_avail = sw - sx - th.mx
        cw_ = (sw_avail - gx * (n - 1)) / n
        sy = sh - 1.55
        for i, (value, label) in enumerate(stats):
            x = sx + i * (cw_ + gx)
            r.shape(x, sy, cw_, 0.95, fill=th.color("surface"), line=th.color("line"), lw=1.0)
            tf = r.tbox(x + 0.16, sy + 0.10, cw_ - 0.3, 0.45)
            r.para(tf, value, kind="h2", color=th.color("accent"), bold=True, first=True)
            tf = r.tbox(x + 0.16, sy + 0.55, cw_ - 0.3, 0.3)
            r.para(tf, label, kind="tiny", color=th.color("muted"), first=True)


def _cover_html(r, d):
    c = colors(r)
    img = d.get("image")
    img_html = ""
    if img and os.path.exists(img):
        img_html = (
            '<div style="flex:0.95;min-width:0;display:flex;align-items:center;justify-content:center">'
            f'<img src="{data_uri(img)}" alt="" style="width:100%;max-height:522px;'
            f'object-fit:contain;border:1px solid {c["line"]};'
            'box-shadow:0 22px 54px rgba(0,0,0,.35)"></div>'
        )

    stats = d.get("stats") or []
    stats_html = ""
    if stats:
        cells = "".join(
            f'<div style="flex:1;background:{c["surface"]};border-left:4px solid {c["accent"]};'
            'padding:12px 16px">'
            f'<div style="font-size:48px;font-weight:700;color:{c["accent"]};line-height:1">'
            f'{esc(v)}</div>'
            f'<div style="font-size:21px;color:{c["muted"]};margin-top:6px">{esc(l)}</div>'
            '</div>'
            for v, l in stats
        )
        stats_html = f'<div style="display:flex;gap:16px;margin-top:30px">{cells}</div>'

    r._add(f'<div style="position:absolute;inset:0;background:{c["ink"]}"></div>')
    r._add(
        '<div style="position:relative;flex:1;display:flex;gap:44px;align-items:center">'
        '<div data-fit style="flex:1.05;min-width:0;overflow:hidden">'
        f'<div style="font-size:21px;letter-spacing:.12em;color:{c["accent2"]};'
        f'font-weight:700">{esc(d.get("kicker", ""))}</div>'
        f'<h1 style="font-size:84px;line-height:1.06;color:{c["white"]};'
        f'margin:16px 0 12px;font-weight:700">{esc(d.get("title", ""))}'
        f'<br><span style="font-size:50px;color:{c["surface2"]}">'
        f'{esc(d.get("sub", ""))}</span></h1>'
        f'<p style="font-size:31px;line-height:1.45;color:{c["surface2"]};margin:0">'
        f'{esc(d.get("lead", ""))}</p>{stats_html}'
        f'</div>{img_html}</div>'
    )


@pattern("sectionfull", "Full-bleed section divider with a large number")
def sectionfull(r, d):
    th = _th(r)
    if not hasattr(r, "slide"):
        _section_html(r, d)
        return

    sw, sh = th.sw, th.sh
    r.shape(0, 0, sw, sh, fill=th.color("accent"))

    tf = r.tbox(th.mx + 0.2, 0.85, 4.2, 2.45)
    r.para(tf, d.get("number", ""), kind="cover", size=110,
           color=th.color("surface2"), bold=True, first=True)

    tf = r.tbox(th.mx + 0.2, 3.35, th.cw * 0.48, 0.95)
    r.para(tf, d.get("title", ""), kind="h1", color=th.color("bg"), bold=True, first=True)

    tf = r.tbox(th.mx + 0.2, 4.25, th.cw * 0.48, 1.3)
    r.para(tf, d.get("sub", ""), kind="body", color=th.color("surface2"), first=True)

    points = d.get("points") or []
    if points:
        px = th.mx + th.cw * 0.56
        r.shape(px - 0.30, 3.35, 0.04, 3.00, fill=th.color("surface2"))
        py = 3.35
        for point in points[:3]:
            tf = r.tbox(px, py, th.cw * 0.42, 0.9)
            r.para(tf, point, kind="h2", color=th.color("bg"), first=True, spacing=1.25)
            py += 1.10

    tf = r.tbox(th.mx + 0.2, th.foot_y - 0.55, th.cw * 0.5, 0.3)
    r.para(tf, "ส่วนที่ %s จาก 3" % d.get("number", ""), kind="small",
           color=th.color("surface2"), first=True)


def _section_html(r, d):
    c = colors(r)
    points = d.get("points") or []
    points_html = "".join(
        f'<div style="display:flex;gap:14px;align-items:flex-start">'
        f'<span style="flex:none;width:9px;height:9px;margin-top:13px;'
        f'background:{c["accent2"]}"></span>'
        f'<span style="font-size:35px;line-height:1.45;color:{c["white"]}">{esc(p)}</span>'
        '</div>'
        for p in points[:3]
    )
    r._add(f'<div style="position:absolute;inset:0;background:{c["accent"]}"></div>')
    r._add(
        '<div style="position:relative;flex:1;display:flex;gap:34px;align-items:center">'
        '<div style="flex:1.0">'
        f'<div style="font-size:165px;line-height:1;font-weight:700;'
        f'color:{c["surface2"]};opacity:.55">{esc(d.get("number", ""))}</div>'
        f'<h1 style="font-size:70px;color:{c["bg"]};margin:8px 0 10px">'
        f'{esc(d.get("title", ""))}</h1>'
        f'<p style="font-size:31px;line-height:1.5;color:{c["surface2"]};margin:0">'
        f'{esc(d.get("sub", ""))}</p></div>'
        f'<div style="width:1px;align-self:stretch;background:{c["surface2"]};opacity:.45"></div>'
        f'<div style="flex:1.05;display:flex;flex-direction:column;justify-content:center;'
        f'gap:28px">{points_html}</div></div>'
    )


@pattern("bulletsfull", "Bullets distributed over the full body area, optional side panel")
def bulletsfull(r, d):
    th = _th(r)
    if not hasattr(r, "slide"):
        _bullets_html(r, d)
        return

    r.header(d.get("kicker", ""), d.get("title", ""), d.get("sub", ""))

    top = th.top_body
    band_h = 0.52 if d.get("band") else 0.0
    bottom = th.foot_y - 0.30 - band_h - 0.14
    area = max(1.2, bottom - top)

    aside = d.get("aside")
    left_w = th.cw * (0.60 if aside else 1.0)

    items = d.get("items", [])
    n = max(1, len(items))
    row_h = min(1.05, max(0.40, (area - 0.25) / n))
    gap = min(0.32, max(0.12, (area - row_h * n) / max(1, n + 1)))
    block = row_h * n + gap * (n - 1)
    y = top + max(0.0, (area - block) / 2.0)
    for item in items:
        if isinstance(item, (tuple, list)):
            lead, rest = item[0], item[1]
        else:
            lead, rest = "", str(item)
        r.shape(th.mx + 0.02, y + 0.15, 0.11, 0.11, fill=th.color("accent2"))
        tf = r.tbox(th.mx + 0.32, y, left_w - 0.38, row_h)
        if lead:
            r.rich(tf, [(lead, th.color("ink"), True), (rest, th.color("body"), False)],
                   kind="body", first=True, spacing=1.2)
        else:
            r.para(tf, rest, kind="body", color=th.color("body"), first=True, spacing=1.2)
        y += row_h + gap

    if aside:
        ax = th.mx + th.cw * 0.655
        aw = th.cw * 0.345
        ah = min(area, 3.6)
        ay = top + max(0.0, (area - ah) / 2.0)
        r.shape(ax, ay, aw, ah, fill=th.color("surface"))
        r.shape(ax, ay, 0.075, ah, fill=th.color("accent2"))
        tf = r.tbox(ax + 0.28, ay + 0.24, aw - 0.5, 0.45)
        r.para(tf, aside.get("title", ""), kind="h3", color=th.color("ink"), bold=True, first=True)
        tf = r.tbox(ax + 0.28, ay + 0.82, aw - 0.5, ah - 1.05)
        r.para(tf, aside.get("body", ""), kind="body", color=th.color("body"),
               first=True, spacing=1.25)

    if d.get("band"):
        by = th.foot_y - 0.30 - band_h
        r.shape(th.mx, by, th.cw, band_h, fill=th.color("surface2"))
        r.shape(th.mx, by, 0.075, band_h, fill=th.color("accent"))
        tf = r.tbox(th.mx + 0.24, by + 0.05, th.cw - 0.4, band_h - 0.1)
        r.para(tf, d["band"], kind="small", color=th.color("ink"), first=True)


def _bullets_html(r, d):
    c = colors(r)
    r.header(d.get("kicker", ""), d.get("title", ""), d.get("sub", ""))

    rows = []
    for item in d.get("items", []):
        lead, rest = (item if isinstance(item, (tuple, list)) else ("", str(item)))
        lead_html = f'<b style="color:{c["ink"]}">{esc(lead)}</b> ' if lead else ""
        rows.append(
            '<div style="display:flex;gap:16px;align-items:flex-start">'
            f'<span style="flex:none;width:10px;height:10px;margin-top:14px;'
            f'background:{c["accent2"]}"></span>'
            f'<p style="margin:0;font-size:34px;line-height:1.5;color:{c["body"]}">'
            f'{lead_html}{esc(rest)}</p></div>'
        )

    aside = d.get("aside")
    aside_html = ""
    left_style = "flex:1"
    if aside:
        left_style = "flex:1.65"
        aside_html = (
            f'<div data-fit style="flex:1;align-self:center;max-height:74%;min-width:0;'
            f'overflow:hidden;background:{c["surface"]};'
            f'border-left:5px solid {c["accent2"]};padding:26px 24px;display:flex;'
            'flex-direction:column;justify-content:center">'
            f'<h3 style="margin:0 0 12px;font-size:38px;color:{c["ink"]}">'
            f'{esc(aside.get("title", ""))}</h3>'
            f'<p style="margin:0;font-size:28px;line-height:1.55;color:{c["body"]}">'
            f'{esc(aside.get("body", ""))}</p></div>'
        )

    r._add(
        f'<div style="flex:1;display:flex;gap:34px;align-items:stretch">'
        f'<div data-fit style="{left_style};min-width:0;overflow:hidden;display:flex;'
        f'flex-direction:column;justify-content:space-evenly">{"".join(rows)}</div>{aside_html}</div>'
    )

    if d.get("band"):
        r.band(d["band"])


@pattern("cardsfull", "Cards stretched to fill the body area")
def cardsfull(r, d):
    th = _th(r)
    if not hasattr(r, "slide"):
        _cards_html(r, d)
        return

    r.header(d.get("kicker", ""), d.get("title", ""), d.get("sub", ""))

    band_h = 0.52 if d.get("band") else 0.0
    top = th.top_body
    bottom = th.foot_y - 0.30 - band_h - 0.14
    area = max(1.4, bottom - top)

    items = d.get("items", [])
    n = max(1, min(int(d.get("columns", 3)), len(items) or 1))
    gx = 0.18
    w = (th.cw - gx * (n - 1)) / n

    for i, it in enumerate(items):
        x = th.mx + i * (w + gx)
        r.shape(x, top, w, area, fill=th.color("surface"), line=th.color("line"), lw=1.0)
        r.shape(x, top, w, 0.08, fill=th.color("accent"))

        ty = top + 0.28
        tf = r.tbox(x + 0.22, ty, w - 0.44, 0.32)
        r.para(tf, it.get("lead", ""), kind="small", color=th.color("accent2"),
               bold=True, first=True)
        ty += 0.40
        tf = r.tbox(x + 0.22, ty, w - 0.44, 0.55)
        r.para(tf, it.get("title", ""), kind="h3", color=th.color("ink"),
               bold=True, first=True)
        ty += 0.62
        note = it.get("note", "")
        body_h = area - (ty - top) - (0.55 if note else 0.25)
        tf = r.tbox(x + 0.22, ty, w - 0.44, body_h)
        r.para(tf, it.get("body", ""), kind="body", color=th.color("body"),
               first=True, spacing=1.3)
        if note:
            tf = r.tbox(x + 0.22, top + area - 0.48, w - 0.44, 0.32)
            r.para(tf, note, kind="tiny", color=th.color("muted"), first=True)

    if d.get("band"):
        by = th.foot_y - 0.30 - band_h
        r.shape(th.mx, by, th.cw, band_h, fill=th.color("surface2"))
        r.shape(th.mx, by, 0.075, band_h, fill=th.color("accent"))
        tf = r.tbox(th.mx + 0.24, by + 0.05, th.cw - 0.4, band_h - 0.1)
        r.para(tf, d["band"], kind="small", color=th.color("ink"), first=True)


def _cards_html(r, d):
    c = colors(r)
    r.header(d.get("kicker", ""), d.get("title", ""), d.get("sub", ""))

    items = d.get("items", [])
    n = max(1, min(int(d.get("columns", 3)), len(items) or 1))
    cells = []
    for it in items:
        body = esc(it.get("body", "")).replace("\n", "<br>")
        note = it.get("note", "")
        note_html = (
            f'<div style="font-size:18px;color:{c["muted"]};margin-top:12px">{esc(note)}</div>'
            if note else ""
        )
        cells.append(
            f'<div data-fit style="background:{c["surface"]};border:1px solid {c["line"]};'
            f'border-top:4px solid {c["accent"]};padding:20px 18px;display:flex;'
            'flex-direction:column;min-width:0;overflow:hidden">'
            f'<div style="font-size:21px;font-weight:700;color:{c["accent2"]};'
            f'letter-spacing:.04em">{esc(it.get("lead", ""))}</div>'
            f'<h3 style="margin:8px 0 16px;font-size:41px;color:{c["ink"]}">'
            f'{esc(it.get("title", ""))}</h3>'
            f'<p style="margin:0;font-size:28px;line-height:1.6;color:{c["body"]}">'
            f'{body}</p>{note_html}</div>'
        )

    r._add(
        f'<div style="flex:1;display:grid;grid-template-columns:repeat({n},1fr);'
        f'gap:18px;align-items:stretch">{"".join(cells)}</div>'
    )

    if d.get("band"):
        r.band(d["band"])
