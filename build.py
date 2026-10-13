#!/usr/bin/env python3
"""andralabs.org static site builder (stdlib only).

Usage:
    python3 build.py                # build src/ -> docs/
    python3 build.py --serve 8080   # build, then serve docs/ on 0.0.0.0:8080

See README.md for the structure and editing guide.
"""
import argparse
import json
import re
import shutil
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT = ROOT / "docs"


def read(path):
    return path.read_text(encoding="utf-8")


def load_json(name):
    return json.loads(read(SRC / "data" / name))


# ---------- fragment renderers ----------

def chips_html(chips):
    return "".join('<span class="chip">%s</span>' % c for c in chips)


def foot_html(links):
    """Render a card footer: meta spans and wlink anchors (wrapped when plural)."""
    if not links:
        return ""
    parts = []
    anchors = []
    for link in links:
        kind = link.get("kind", "wlink")
        if kind == "meta":
            parts.append('<span class="meta">%s</span>' % link["label"])
        else:
            arrow = link.get("arrow", " \u2197")
            anchors.append(
                '<a class="wlink" href="%s" target="_blank" rel="noopener">%s%s</a>'
                % (link["href"], link["label"], arrow)
            )
    if len(anchors) == 1:
        parts.append(anchors[0])
    elif len(anchors) > 1:
        parts.append('<span class="wlinks">%s</span>' % "".join(anchors))
    return "".join(parts)


def card_html(item, desc_key="desc", links_key="links"):
    return (
        '<article class="card"><span class="meta">%s</span><h3>%s</h3><p>%s</p>'
        '<div class="foot"><div class="chips">%s</div>%s</div></article>'
        % (item["meta"], item["title"], item[desc_key], chips_html(item["chips"]), foot_html(item.get(links_key)))
    )


def row_html(item):
    return (
        '<a class="row" href="{{base}}experiments/"><span class="meta">%s</span>'
        '<span class="t">%s</span><span class="meta">%s</span></a>'
        % (item["row_year"], item["row_text"], item["row_tag"])
    )


def wrow_html(item):
    return (
        '<div class="wrow"><span class="meta">%s</span>'
        '<div><div class="role">%s</div><div class="org">%s</div></div>'
        '<div class="note">%s</div></div>'
        % (item["period"], item["role"], item["org"], item["note"])
    )


# ---------- page machinery ----------

def parse_front_matter(text):
    m = re.match(r"\s*<!--\s*(.*?)\s*-->\s*", text, re.S)
    if not m:
        raise SystemExit("page file is missing its front-matter comment")
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            meta[key.strip()] = value.strip()
    if "title" not in meta or "description" not in meta:
        raise SystemExit("front matter needs at least title and description")
    return meta, text[m.end():]


def build():
    site = load_json("site.json")
    projects = load_json("projects.json")
    experiments = load_json("experiments.json")
    work = load_json("work.json")

    fragments = {
        "{{LINKEDIN}}": site["linkedin"],
        "{{X}}": site["x"],
        "{{projects_featured}}": "\n        ".join(
            card_html(p, "short", "home_links" if p.get("home_links") is not None else "links")
            for p in projects if p.get("featured")
        ),
        "{{projects_all}}": "\n        ".join(card_html(p) for p in projects),
        "{{experiments_all}}": "\n        ".join(card_html(e) for e in experiments),
        "{{experiments_rows}}": "\n        ".join(
            row_html(e)
            for e in sorted(
                (e for e in experiments if e.get("row_text")),
                key=lambda e: e.get("row_order", 99),
            )
        ),
        "{{work_rows}}": "\n        ".join(wrow_html(w) for w in work if w["group"] == "experience"),
        "{{leadership_rows}}": "\n        ".join(wrow_html(w) for w in work if w["group"] == "leadership"),
    }

    base_tpl = read(SRC / "layout" / "base.html")

    if OUT.exists():
        shutil.rmtree(OUT)
    (OUT / "assets").mkdir(parents=True)
    for asset in sorted((SRC / "assets").iterdir()):
        shutil.copy2(asset, OUT / "assets" / asset.name)

    pages = []
    for page_file in sorted((SRC / "pages").glob("*.html")):
        fm, body = parse_front_matter(read(page_file))
        slug = page_file.stem
        content = body
        for token, value in fragments.items():
            content = content.replace(token, value)

        scripts = ""
        for s in fm.get("scripts", "").split(","):
            if s.strip():
                scripts += '<script src="{{base}}assets/%s"></script>\n' % s.strip()
        scripts += '<script src="{{base}}assets/main.js"></script>'

        full = (
            base_tpl.replace("{{title}}", fm["title"])
            .replace("{{description}}", fm["description"])
            .replace("{{CONTENT}}", content.rstrip())
            .replace("{{scripts}}", scripts)
        )
        full = full.replace("{{LINKEDIN}}", site["linkedin"]).replace("{{X}}", site["x"])

        active = fm.get("active", "")
        if active:
            full = re.sub(
                r'(<a href="[^"]*" )data-nav="%s"' % re.escape(active),
                r'\1class="current" data-nav="%s"' % active,
                full,
            )

        base = "./" if slug == "index" else "../"
        full = full.replace("{{base}}", base)

        out_file = OUT / ("index.html" if slug == "index" else "%s/index.html" % slug)
        out_file.parent.mkdir(parents=True, exist_ok=True)
        out_file.write_text(full + "\n", encoding="utf-8")
        pages.append(out_file.relative_to(ROOT))

    print("built %d pages:" % len(pages))
    for p in pages:
        print("  ", p)
    print("assets ->", (OUT / "assets").relative_to(ROOT))


def serve(port):
    handler = partial(SimpleHTTPRequestHandler, directory=str(OUT))
    httpd = ThreadingHTTPServer(("0.0.0.0", port), handler)
    print("serving %s at http://0.0.0.0:%d/ (Ctrl+C to stop)" % (OUT, port))
    httpd.serve_forever()


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="andralabs.org site builder")
    ap.add_argument("--serve", type=int, metavar="PORT", help="serve docs/ after building")
    args = ap.parse_args()
    build()
    if args.serve:
        serve(args.serve)
