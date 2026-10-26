#!/usr/bin/env python3
"""Deterministic ingest orchestrator for an LLM Wiki.

The LLM does only the semantic merge (one raw file per isolated agent call).
Everything else is plain code: discovery, guards, validation, reindexing, summary.

Usage: ingest.py [--plan] [--force] [--no-index] [raw/<file>]
  --plan      list pending raw files and exit
  --force     re-ingest even if a source page already exists (all files, or the given one)
  --no-index  skip QMD maintenance
Exit codes: 0 ok, 1 validation failed, 2 agent failed, 3 protected file was modified.
"""
import argparse
import hashlib
import importlib.util
import json
import os
import shlex
import shutil
import subprocess
import sys
from pathlib import Path

KB = Path(__file__).resolve().parent.parent
PROTECTED = ["raw", "SCHEMA.md", "AGENTS.md", "CLAUDE.md", "scripts"]


def load_validator():
    spec = importlib.util.spec_from_file_location("validate_wiki", KB / "scripts" / "validate-wiki.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


V = load_validator()


def config():
    return json.loads((KB / "scripts" / "config.json").read_text(encoding="utf-8"))


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def snapshot(*roots):
    out = {}
    for r in roots:
        p = KB / r
        files = [p] if p.is_file() else sorted(f for f in p.rglob("*") if f.is_file()) if p.is_dir() else []
        for f in files:
            if "__pycache__" in f.parts:
                continue
            out[f.relative_to(KB).as_posix()] = sha(f)
    return out


def raw_files():
    raw = KB / "raw"
    return sorted(
        f.relative_to(KB).as_posix()
        for f in raw.rglob("*")
        if f.is_file() and f.suffix in (".md", ".txt") and "assets" not in f.relative_to(raw).parts
    )


def ingested():
    done = set()
    for p in sorted((KB / "wiki" / "sources").rglob("*.md")):
        fm, _ = V.parse_frontmatter(p.read_text(encoding="utf-8"))
        if fm and fm.get("resource"):
            done.add(fm["resource"])
    return done


def build_prompt(raw_rel, fix_report=None):
    if fix_report:
        return (
            "You are fixing the LLM Wiki in the current directory after an ingest of "
            f"`{raw_rel}`. Read AGENTS.md and SCHEMA.md. `python3 scripts/validate-wiki.py` reported:\n\n"
            f"{fix_report}\n\nFix exactly these problems by editing files under wiki/ only. "
            "Do not touch raw/, SCHEMA.md, AGENTS.md or scripts/. Do not run qmd. "
            "Re-run the validator until it reports 0 errors. Finish with one line."
        )
    return (
        "You are running the INGEST operation for the LLM Wiki in the current directory.\n"
        "1. Read AGENTS.md and SCHEMA.md, then wiki/index.md.\n"
        f"2. Read exactly one raw file: `{raw_rel}`.\n"
        "3. Before creating any page, search for existing related pages (qmd query if available, "
        "otherwise Grep over wiki/ and index.md). Update existing pages instead of creating duplicates.\n"
        "4. Create the source page wiki/sources/<stem>.md with `resource: " + raw_rel + "`.\n"
        "5. Merge new facts into entities/, concepts/ and analyses/ pages (create only what is truly new); "
        "bump source_count, extend `sources` and `## Citations`, mark conflicts with `contested: true` and "
        "describe both positions.\n"
        "6. Update wiki/index.md (every page listed) and append one entry to wiki/log.md "
        "(`## [YYYY-MM-DD] ingest | <title>`); never rewrite earlier log entries.\n"
        "7. Run `python3 scripts/validate-wiki.py` and fix every error.\n"
        "Forbidden: modifying raw/, SCHEMA.md, AGENTS.md, scripts/; running qmd update/embed/cleanup "
        "(the wrapper does it); git commands. Write wiki pages in the language set in SCHEMA.md. "
        "Finish with a one-line summary of what changed."
    )


def run_agent(prompt, cfg):
    env_cmd = os.environ.get("WIKI_AGENT_CMD")
    cmd = shlex.split(env_cmd) if env_cmd else list(cfg["agent_cmd"])
    via = cfg.get("prompt_via", "stdin")
    kwargs = dict(cwd=KB, text=True, capture_output=True, timeout=cfg.get("agent_timeout_sec", 1500))
    if via == "stdin":
        kwargs["input"] = prompt
    else:
        cmd = cmd + [prompt]
    try:
        r = subprocess.run(cmd, **kwargs)
    except FileNotFoundError:
        print(f"ERROR agent command not found: {cmd[0]} (edit agent_cmd in scripts/config.json "
              "or set WIKI_AGENT_CMD)", file=sys.stderr)
        return False
    except subprocess.TimeoutExpired:
        print("ERROR agent timed out", file=sys.stderr)
        return False
    tail = (r.stdout or "").strip().splitlines()[-3:]
    if tail:
        print("  agent: " + " | ".join(tail))
    if r.returncode != 0:
        print(f"ERROR agent exited with {r.returncode}\n{(r.stderr or '').strip()[-800:]}", file=sys.stderr)
        return False
    return True


def validate():
    w = V.Wiki(KB)
    ok = w.run()
    return ok, w


def guards_ok(before):
    after = snapshot(*PROTECTED)
    bad = sorted(k for k in set(before) | set(after) if before.get(k) != after.get(k))
    if bad:
        print("ERROR protected files were changed by the agent:\n  " + "\n  ".join(bad), file=sys.stderr)
        return False
    return True


def log_is_append_only(old_log):
    new = (KB / "wiki" / "log.md").read_text(encoding="utf-8")
    if not new.startswith(old_log):
        print("ERROR wiki/log.md is append-only but earlier content was altered", file=sys.stderr)
        return False
    return True


def qmd_maintenance(cfg):
    q = cfg.get("qmd", {})
    if not q.get("enabled"):
        return
    if not shutil.which("qmd"):
        print("WARNING qmd not found in PATH; skipped reindex")
        return
    for cmd in (["qmd", "update"], ["qmd", "embed", "-c", q["collection"]], ["qmd", "cleanup"]):
        r = subprocess.run(cmd, cwd=KB, text=True, capture_output=True)
        print(f"  {' '.join(cmd)} -> {'ok' if r.returncode == 0 else 'FAILED'}")
        if r.returncode != 0:
            print((r.stderr or r.stdout).strip()[-400:])


def ingest_one(raw_rel, cfg):
    print(f"\n== ingest {raw_rel}")
    wiki_before = snapshot("wiki")
    protected_before = snapshot(*PROTECTED)
    old_log = (KB / "wiki" / "log.md").read_text(encoding="utf-8")

    if not run_agent(build_prompt(raw_rel), cfg):
        return 2, {}, []
    if not guards_ok(protected_before) or not log_is_append_only(old_log):
        return 3, {}, []

    ok, w = validate()
    if not ok:
        report = "\n".join(w.errors)
        print(f"  validation failed, one fix pass:\n{report}")
        if not run_agent(build_prompt(raw_rel, fix_report=report), cfg):
            return 2, {}, []
        if not guards_ok(protected_before) or not log_is_append_only(old_log):
            return 3, {}, []
        ok, w = validate()
    if not ok:
        print("ERROR validation still failing:\n  " + "\n  ".join(w.errors), file=sys.stderr)
        return 1, {}, []

    wiki_after = snapshot("wiki")
    added = sorted(k for k in wiki_after if k not in wiki_before)
    changed = sorted(k for k in wiki_after if k in wiki_before and wiki_after[k] != wiki_before[k])
    removed = sorted(k for k in wiki_before if k not in wiki_after)
    return 0, {"added": added, "changed": changed, "removed": removed}, w.warnings


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file", nargs="?")
    ap.add_argument("--plan", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--no-index", action="store_true")
    a = ap.parse_args()
    cfg = config()

    allraw, done = raw_files(), ingested()
    if a.file:
        target = Path(a.file)
        rel = (target.resolve().relative_to(KB).as_posix() if target.is_absolute() or target.exists()
               else target.as_posix())
        if rel not in allraw:
            sys.exit(f"ERROR {a.file} is not an ingestable file under raw/")
        todo = [rel] if a.force or rel not in done else []
    else:
        todo = allraw if a.force else [r for r in allraw if r not in done]

    print(f"KB: {KB}\nraw files: {len(allraw)}, already ingested: {len(done)}, pending: {len(todo)}")
    for r in todo:
        print(f"  - {r}")
    if a.plan or not todo:
        return 0

    summary = []
    for r in todo:
        code, diff, _ = ingest_one(r, cfg)
        if code:
            print(f"\nSTOPPED at {r} (exit {code}). Earlier files in this run are already ingested.")
            sys.exit(code)
        summary.append((r, diff))

    if not a.no_index:
        print("\n== reindex")
        qmd_maintenance(cfg)

    print("\n== summary")
    for r, d in summary:
        print(f"{r}: +{len(d['added'])} new, ~{len(d['changed'])} updated, -{len(d['removed'])} removed")
        for k in d["added"]:
            print(f"  + {k}")
        for k in d["changed"]:
            print(f"  ~ {k}")
        for k in d["removed"]:
            print(f"  - {k}")
    ok, w = validate()
    print(f"validate-wiki: {len(w.pages)} pages, {len(w.errors)} errors, {len(w.warnings)} warnings")
    return 0


if __name__ == "__main__":
    sys.exit(main())
