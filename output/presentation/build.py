# -*- coding: utf-8 -*-
"""Build this project's deck.

The slide engine lives in the global skill, so this project only carries its
own content (slides/deck.py) and its own overrides (slides/project.py).
"""
import io
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.environ.get("SLIDEKIT_HOME") or os.path.expanduser(
    "~/.config/opencode/skills/slide-deck-builder")
sys.path.insert(0, SKILL)
sys.path.insert(0, HERE)

from slidekit import build                      # noqa: E402
from slides.deck import DECK                     # noqa: E402
from slides.deck_en import DECK as DECK_EN       # noqa: E402
from slides.project import PROJECT               # noqa: E402

# The web deck is read on a laptop at a distance, so its type is larger than
# the PPTX defaults (~20 pt body instead of ~12 pt).
WEB_SCALE = """
.kicker { font-size: 31px; }
h1 { font-size: 78px; }
.sub { font-size: 36px; }
.cover-title { font-size: 98px; }
.lead { font-size: 41px; }
.note { font-size: 31px; }
.section-wrap h1 { font-size: 87px; }
ul.bullets { font-size: 39px; line-height: 1.5; }
.card h3 { font-size: 45px; }
.card p { font-size: 36px; line-height: 1.5; }
.cell .stat { font-size: 64px; }
.cell h3 { font-size: 39px; }
.cell p { font-size: 34px; line-height: 1.42; }
.tbl { font-size: 36px; }
.band { font-size: 36px; }
.body-p { font-size: 39px; }
.refs { font-size: 31px; }
.hrow { font-size: 36px; }
"""

# The deck is designed on a fixed 1600x900 canvas. Viewport units inside the
# template would make the layout drift on smaller windows, so every vh/vw that
# affects the layout is pinned to the canvas here and the whole slide is scaled
# to fit by the script below.
CANVAS = """
html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #141414; }
.slide { width: 1600px; height: 900px; padding: 26px 64px 28px; overflow: hidden; }
.hd { margin-bottom: 12px; }
.hd.bar:before { left: -64px; right: -64px; top: -26px; height: 5px; }
.hd.bar:after { left: -64px; top: -26px; width: 210px; height: 5px; }
.cover-band { height: 315px; }
.cover-title { margin-top: 60px; }
.lead { margin-top: 24px; }
.note { margin-top: 12px; }
.section-wrap { margin: -26px -64px; padding: 0 64px; }
.section-no { font-size: 110px; }
.bullets-wrap { gap: 26px; }
"""

FIT_SCRIPT = """<script id="web-fit">
(function () {
  function fit() {
    var s = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
    var left = (window.innerWidth - 1600 * s) / 2;
    var top = (window.innerHeight - 900 * s) / 2;
    var slides = document.querySelectorAll('.slide');
    for (var k = 0; k < slides.length; k++) {
      var el = slides[k];
      el.style.transformOrigin = 'top left';
      el.style.transform = 'scale(' + s + ')';
      el.style.left = left + 'px';
      el.style.top = top + 'px';
    }
  }

  // Shrink a text zone that no longer fits its own box. Images live in their
  // own grid cells, so a zone can only clip its own text, never cover a picture.
  // Scale a text zone down when its content is taller than its box. Transform
  // is used (not zoom) because the browser clips on the transformed box, so the
  // content can never reach a neighbouring cell.
  function autofit() {
    var slides = document.querySelectorAll('.slide');
    var current = -1;
    for (var k = 0; k < slides.length; k++) {
      if (slides[k].classList.contains('active')) current = k;
    }
    for (var k = 0; k < slides.length; k++) {
      var slide = slides[k];
      var was = slide.classList.contains('active');
      if (!was) slide.classList.add('active');
      var zones = slide.querySelectorAll('[data-fit]');
      for (var z = 0; z < zones.length; z++) {
        var zone = zones[z];
        var kids = zone.children;
        for (var c = 0; c < kids.length; c++) {
          kids[c].style.transform = '';
          kids[c].style.transformOrigin = '';
        }

        // Tables overflow their own box, so their text is reduced instead of
        // scaled; this is the closest HTML equivalent of PowerPoint autofit.
        var table = zone.querySelector('table');
        if (table) {
          table.style.fontSize = '';
          var rows = table.querySelectorAll('tr');
          var contentH = function () {
            var h = 0;
            for (var i = 0; i < rows.length; i++) h += rows[i].getBoundingClientRect().height;
            return h;
          };
          var guard = 0;
          while (contentH() > zone.clientHeight - 2 && guard < 24) {
            var size = parseFloat(getComputedStyle(table).fontSize);
            if (size <= 14) break;
            table.style.fontSize = (size - 1) + 'px';
            guard++;
          }
          continue;
        }

        var box = zone.getBoundingClientRect();
        var style = getComputedStyle(zone);
        var gap = parseFloat(style.rowGap || style.gap || 0) || 0;
        var need = gap * Math.max(0, kids.length - 1);
        for (var c = 0; c < kids.length; c++) {
          need += kids[c].getBoundingClientRect().height;
        }
        if (need > box.height + 1 && box.height > 0) {
          var scale = Math.max(0.55, box.height / need);
          for (var c = 0; c < kids.length; c++) {
            kids[c].style.transformOrigin = 'top center';
            kids[c].style.transform = 'scale(' + scale.toFixed(3) + ')';
          }
        }
      }
      if (!was) slide.classList.remove('active');
    }
    if (current >= 0) slides[current].classList.add('active');
  }

  function apply() { fit(); autofit(); }

  window.addEventListener('resize', apply);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
  window.__deckFit = apply;
  apply();
})();
</script>
"""


def fit_pptx_text(path):
    """Let PowerPoint shrink any text that would otherwise spill out of its box."""
    from pptx import Presentation
    from pptx.dml.color import RGBColor
    from pptx.enum.text import MSO_AUTO_SIZE

    prs = Presentation(path)
    for index, slide in enumerate(prs.slides):
        for shape in slide.shapes:
            if not getattr(shape, "has_text_frame", False):
                continue
            frame = shape.text_frame
            if not frame.text.strip():
                continue
            frame.word_wrap = True
            frame.auto_size = MSO_AUTO_SIZE.TEXT_TO_FIT_SHAPE
            # The cover is a dark panel, so its footer needs a light colour.
            if index == 0 and "ภาพรวมโครงการ" in frame.text:
                for para in frame.paragraphs:
                    for run in para.runs:
                        run.font.color.rgb = RGBColor(0xF3, 0xE6, 0xD3)
    prs.save(path)


def scale_web_deck(path):
    t = io.open(path, encoding="utf-8").read()
    block = '<style id="web-scale">\n' + WEB_SCALE + CANVAS + '</style>\n'
    if 'id="web-scale"' not in t:
        t = t.replace("</head>", block + "</head>", 1)
    else:
        t = t.replace(t[t.index('<style id="web-scale">'):t.index('</style>', t.index('<style id="web-scale">')) + 8], block.strip())
    if 'id="web-fit"' not in t:
        t = t.replace("</body>", FIT_SCRIPT + "</body>", 1)
    io.open(path, "w", encoding="utf-8", newline="\n").write(t)


def main():
    html = "--html" in sys.argv
    english = "--en" in sys.argv
    out = os.path.join(HERE, "out")
    deck = DECK_EN if english else DECK
    stem = "deck-en" if english else "deck"
    # project patterns live next to the content; add them to the deck
    deck.patterns = list(deck.patterns or []) + [
        os.path.join(HERE, "slides", "patterns")]
    thresholds = dict(PROJECT.get("qa") or {})
    if "--no-notes" in sys.argv:
        thresholds["require_notes"] = False
    res = build(deck, os.path.join(out, stem + ".pptx"),
                out_html=os.path.join(out, stem + ".html") if html else None,
                thresholds=thresholds)
    print("wrote %s (%d slides)" % (res.pptx, res.slides))
    fit_pptx_text(res.pptx)
    if res.html:
        scale_web_deck(res.html)
        print("wrote %s (web type scaled)" % res.html)
    print("problems:", len(res.problems))
    for p in res.problems:
        print("  -", p)
    return 1 if res.problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
