# -*- coding: utf-8 -*-
"""Project overrides: Cordia New throughout, 16 pt body, tighter margins."""

PROJECT = {
    "theme": "warm",
    "footer": "RAG-Diary | ภาพรวมโครงการ BA/SA | v1.0",
    "overrides": {
        "colors": {
            "accent": "#2F5D8C",
            "accent2": "#C8553D",
        },
        "fonts": {
            "heading": "Cordia New",
            "body": "Cordia New",
            "thai": "Cordia New",
        },
        "types": {
            "cover": 40,
            "h1": 32,
            "h2": 24,
            "h3": 18,
            "body": 16,
            "small": 14,
            "tiny": 12,
            "kicker": 14,
            "stat": 32,
        },
        "layout": {
            "mx": 0.45,
            "my": 0.32,
            "top_body": 1.45,
            "foot_y": 7.05,
            "gap": 0.16,
        },
        "chrome": {
            "header_style": "bar",
            "card_style": "outline",
            "uppercase_kicker": False,
        },
    },
    "qa": {
        "min_font_pt": 12,
        "require_notes": True,
        "allow_citations": False,
    },
}
