#!/usr/bin/env python3
"""Deterministic lint for an LLM Wiki knowledge base.

Usage: validate-wiki.py [KB_DIR] [--quiet]

Exit code 0 = no errors (warnings allowed), 1 = errors found.
Rules live in SCHEMA.md; this script is their executable form.
"""
import re
import sys
from pathlib import Path

DIR_TYPES = {"sources": "source", "entities": "entity", "concepts": "concept", "analyses": "analysis"}
SPECIAL = {"index.md", "overview.md", "log.md"}
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-{1,2}[a-z0-9]+)*$")
LOG_RE = re.compile(r"^## \[(\d{4}-\d{2}-\d{2})\] (init|save|ingest|query|lint|update|context) \| .+")
WIKILINK_RE = re.compile(r"\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]")
COMMON_KEYS = ("title", "type", "created", "updated")


def parse_frontmatter(text):
    """Minimal YAML subset: scalars, inline [a, b] lists, and '- item' lists."""
    if not text.startswith("---\n"):
        return None, text
    end = text.find("\n---", 4)
    if end == -1:
        return None, text
    block, body = text[4:end], text[end + 4:].lstrip("\n")
    data, key = {}, None
    for line in block.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", line)
        if m:
            key, val = m.group(1), m.group(2).strip()
            if val == "":
                data[key] = []
            elif val.startswith("[") and val.endswith("]"):
                data[key] = [v.strip().strip("'\"") for v in val[1:-1].split(",") if v.strip()]
            else:
                data[key] = val.strip("'\"")
        elif key and line.lstrip().startswith("- ") and isinstance(data.get(key), list):
            data[key].append(line.lstrip()[2:].strip().strip("'\""))
    return data, body


def strip_code(text):
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    return re.sub(r"`[^`\n]*`", "", text)


def wikilinks(text):
    return [m.group(1).strip() for m in WIKILINK_RE.finditer(strip_code(text))]


class Wiki:
    def __init__(self, kb):
        self.kb = kb
        self.wiki = kb / "wiki"
        self.errors, self.warnings = [], []
        self.pages = {}  # rel path without .md (posix) -> Path
        self.stems = {}  # stem -> [rel, ...]

    def err(self, where, msg):
        self.errors.append(f"{where}: {msg}")

    def warn(self, where, msg):
        self.warnings.append(f"{where}: {msg}")

    def rel(self, p):
        return p.relative_to(self.kb).as_posix()

    def resolve(self, target, where):
        target = target.strip()
        if target.endswith(".md"):
            target = target[:-3]
        if target in ("index", "overview", "log"):
            return None
        if target.startswith("raw/"):
            ok = (self.kb / target).exists() or (self.kb / (target + ".md")).exists()
            if not ok:
                self.err(where, f"broken link [[{target}]] (raw file not found)")
            return None
        if target in self.pages:
            return target
        hits = self.stems.get(target, [])
        if len(hits) == 1:
            return hits[0]
        if len(hits) > 1:
            self.err(where, f"ambiguous link [[{target}]] -> {', '.join(hits)}; use a path-qualified link")
        else:
            self.err(where, f"broken link [[{target}]]")
        return None

    def run(self):
        self.check_structure()
        for sub in DIR_TYPES:
            d = self.wiki / sub
            if d.is_dir():
                for p in sorted(d.rglob("*.md")):
                    rel = p.relative_to(self.wiki).with_suffix("").as_posix()
                    self.pages[rel] = p
                    self.stems.setdefault(p.stem, []).append(rel)
        for rel, p in self.pages.items():
            self.check_page(rel, p)
        self.check_index()
        self.check_raw_coverage()
        self.check_log()
        return not self.errors

    def check_structure(self):
        for d in ("raw", "wiki", *(f"wiki/{s}" for s in DIR_TYPES)):
            if not (self.kb / d).is_dir():
                self.err(d, "required directory is missing")
        for f in ("AGENTS.md", "SCHEMA.md", "wiki/index.md", "wiki/overview.md", "wiki/log.md"):
            if not (self.kb / f).is_file():
                self.err(f, "required file is missing")

    def check_page(self, rel, p):
        where = self.rel(p)
        fm, body = parse_frontmatter(p.read_text(encoding="utf-8"))
        if fm is None:
            self.err(where, "missing or unterminated YAML frontmatter")
            return
        for k in COMMON_KEYS:
            if not fm.get(k):
                self.err(where, f"frontmatter key '{k}' is missing")
        folder = rel.split("/")[0]
        expected = DIR_TYPES[folder]
        if fm.get("type") and fm["type"] != expected:
            self.err(where, f"type is '{fm['type']}' but the page lives in {folder}/ (expected '{expected}')")
        for k in ("created", "updated"):
            if fm.get(k) and not DATE_RE.match(str(fm[k])):
                self.err(where, f"'{k}' must be YYYY-MM-DD, got '{fm[k]}'")
        if not SLUG_RE.match(p.stem):
            self.err(where, "file name must be latin kebab-case (a-z, 0-9, '-')")
        if not body.strip():
            self.warn(where, "page body is empty")

        if expected == "source":
            res = fm.get("resource", "")
            if not res.startswith("raw/"):
                self.err(where, "source page needs 'resource: raw/<file>'")
            elif not (self.kb / res).is_file():
                self.err(where, f"resource '{res}' does not exist")
        else:
            srcs = fm.get("sources")
            if not isinstance(srcs, list) or not srcs:
                self.err(where, "'sources' must list at least one source page (file stem)")
                srcs = []
            for s in srcs:
                if f"sources/{s}" not in self.pages:
                    self.err(where, f"sources entry '{s}' has no page in wiki/sources/")
            try:
                if int(fm.get("source_count", -1)) != len(srcs):
                    self.err(where, f"source_count={fm.get('source_count')} but sources lists {len(srcs)}")
            except ValueError:
                self.err(where, "source_count must be an integer")
            if "## Citations" not in body:
                self.warn(where, "no '## Citations' section")
            else:
                for s in srcs:
                    if f"sources/{s}" not in [w.removesuffix(".md") for w in wikilinks(body)]:
                        self.warn(where, f"source '{s}' is not cited as [[sources/{s}]] in the body")
            if fm.get("contested") not in (None, "true", "false"):
                self.err(where, "contested must be true or false")

        for t in wikilinks(body):
            self.resolve(t, where)

    def check_index(self):
        idx = self.wiki / "index.md"
        if not idx.is_file():
            return
        linked = set()
        for t in wikilinks(idx.read_text(encoding="utf-8")):
            r = self.resolve(t, "wiki/index.md")
            if r:
                linked.add(r)
        for rel in self.pages:
            if rel not in linked:
                self.err("wiki/index.md", f"page [[{rel}]] is not listed in the index")

    def check_raw_coverage(self):
        done = set()
        for rel, p in self.pages.items():
            if rel.startswith("sources/"):
                fm, _ = parse_frontmatter(p.read_text(encoding="utf-8"))
                if fm and fm.get("resource"):
                    done.add(fm["resource"])
        raw = self.kb / "raw"
        if raw.is_dir():
            for f in sorted(raw.rglob("*")):
                if f.is_file() and f.suffix in (".md", ".txt") and "assets" not in f.relative_to(raw).parts:
                    r = self.rel(f)
                    if r not in done:
                        self.warn(r, "not ingested yet (no source page references it)")

    def check_log(self):
        log = self.wiki / "log.md"
        if not log.is_file():
            return
        last = ""
        for n, line in enumerate(log.read_text(encoding="utf-8").splitlines(), 1):
            if line.startswith("## "):
                m = LOG_RE.match(line)
                if not m:
                    self.warn(f"wiki/log.md:{n}", "heading should be '## [YYYY-MM-DD] <op> | <title>'")
                    continue
                if m.group(1) < last:
                    self.warn(f"wiki/log.md:{n}", "entries must be chronological (append-only)")
                last = m.group(1)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    quiet = "--quiet" in sys.argv
    kb = Path(args[0]).resolve() if args else Path(__file__).resolve().parent.parent
    w = Wiki(kb)
    ok = w.run()
    for e in w.errors:
        print(f"ERROR   {e}")
    if not quiet:
        for x in w.warnings:
            print(f"WARNING {x}")
    print(f"validate-wiki: {len(w.pages)} pages, {len(w.errors)} errors, {len(w.warnings)} warnings")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
