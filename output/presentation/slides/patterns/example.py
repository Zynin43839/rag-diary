# -*- coding: utf-8 -*-
"""Example external pattern: a statement slide with a supporting band.

Patterns are plain functions ``fn(renderer, data)`` registered by name. They
compose the renderer API, so the same file works for PPTX and HTML.
"""
from slidekit import pattern


@pattern("statement", "A paragraph statement with a supporting band")
def statement(r, d):
    r.header(d.get("kicker", ""), d.get("title", ""), d.get("sub", ""))
    r.text_block(d.get("text", ""))
    if d.get("band"):
        r.band(d["band"], tone=d.get("tone", "accent"))
