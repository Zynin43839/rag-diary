# -*- coding: utf-8 -*-
"""Small helpers for the HTML side of the full-bleed patterns.

The stock renderer only knows semantic calls (header, bullets, cards), so the
project's own patterns emit HTML directly when they need to fill the 16:9
canvas or show an image.
"""
import base64
import html
import os


def esc(text):
    return html.escape(str(text), quote=False)


def data_uri(path):
    """Inline the PNG so the deck stays a single self-contained file."""
    ext = os.path.splitext(path)[1].lower()
    mime = 'image/jpeg' if ext in ('.jpg', '.jpeg') else 'image/png'
    with open(path, 'rb') as f:
        return 'data:%s;base64,%s' % (mime, base64.b64encode(f.read()).decode('ascii'))


DEFAULTS = {
    'bg': '#FFFDF8', 'surface': '#FBF3E7', 'surface2': '#F3E6D3',
    'ink': '#3B2A1E', 'body': '#4A382B', 'muted': '#7A6353',
    'line': '#E4D5C2', 'accent': '#2F5D8C', 'accent2': '#C8553D',
    'white': '#FFFFFF',
}


def _hex(value):
    text = str(value)
    return text if text.startswith('#') else '#' + text


def colors(r):
    th = getattr(r, 'th', None)
    palette = getattr(th, 'colors', None) or {}
    out = dict(DEFAULTS)
    out.update({k: _hex(v) for k, v in palette.items() if k in DEFAULTS})
    return out


def figure_html(r, path, caption='', max_height='100%'):
    """Centered, aspect-preserving image that fills the remaining slide area."""
    if not path or not os.path.exists(path):
        r.text_block('ไม่พบภาพ: %s' % (caption or os.path.basename(path or '')))
        return
    r._add(
        '<div style="flex:1;min-height:0;display:flex;align-items:center;'
        'justify-content:center">'
        '<img src="%s" alt="%s" style="max-width:100%%;max-height:%s;'
        'object-fit:contain;border:1px solid var(--line);background:#fff">'
        '</div>' % (data_uri(path), esc(caption), max_height)
    )
