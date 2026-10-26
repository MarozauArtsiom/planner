# Retro Tools Market — LLM Wiki agent rules

This directory is a persistent knowledge base for: Исследование рынка инструментов для командных ретроспектив (EasyRetro и аналоги): продукты, фичи, цены, позиционирование, возможности для собственного продукта sprint-retro.

The wiki is the project's long-term memory. A fresh session should be able to answer questions from it
**without** the user re-explaining history. Read `SCHEMA.md` before touching `wiki/` — it defines every format.
Wiki language: **Russian**.

## Layers and hard rules

1. `raw/` is immutable. Never edit, rename or delete a file there. New raw files appear only via the `save-raw` skill or when the user drops a file in.
2. `wiki/` is derived knowledge. Every claim cites a source page (`sources` + `## Citations`). No source -> no claim.
3. Never overwrite a contradicted claim; keep both, set `contested: true` (see SCHEMA.md).
4. `wiki/log.md` is append-only. `wiki/index.md` lists every page.
5. Do not edit `SCHEMA.md`, `AGENTS.md` or `scripts/` unless the user explicitly asks to change the rules.
6. Search before you create: update an existing page rather than adding a near-duplicate.
7. Do not run heavy wiki operations in the user's working chat — use the wrappers below.

## Operations

| User intent | What you do |
|---|---|
| "save this to the wiki" | `/save-raw [N]` skill -> new file in `raw/`. Nothing else. |
| "process new sources" | `/ingest-wiki` skill -> runs `scripts/run-ingest.sh` **once**. Do not read `raw/`/`wiki/` yourself first, do not poll. |
| a question about the domain | **Query** (below) |
| "check the wiki" | **Lint** (below) |

### Query
1. Read `wiki/index.md`, pick candidate pages, then `Grep` the `wiki/` folder for key terms.
2. Open only the relevant pages in full (not whole folders). Follow `[[wikilinks]]` one hop when needed.
3. Answer with `[[wikilinks]]` to the pages used. State explicitly: contested facts (`contested: true`), what the wiki does not cover, and how fresh the sources are (`updated`).
4. Do not read `raw/` to answer, except to verify a specific citation.
5. If the answer is a reusable synthesis, offer to save it (`/save-raw`) so it can be ingested as an analysis. Don't write it into `wiki/` directly.

### Lint
Mechanical: `python3 scripts/validate-wiki.py` — must report 0 errors.
Semantic audit (on request, or roughly every 10 ingests), report findings first, fix only after the user agrees:
- claims in pages not supported by the cited source;
- contradictions between pages that are not flagged `contested`;
- orphan or near-duplicate pages; concepts mentioned in several pages but lacking their own page;
- stale pages (`updated` older than newer sources that touch the same topic);
- `overview.md` out of sync with the index.
Append a `lint` entry to `wiki/log.md` after an audit.

### Ingest (what the isolated CLI agent does)
Performed by `scripts/ingest.py`, one raw file per call. If you are that agent: follow the numbered steps in your prompt and the
formats in SCHEMA.md; run `python3 scripts/validate-wiki.py` before finishing.

## Maintenance protocol for the chat agent

- When the conversation yields a durable decision, rule, formula or finding, **suggest** `/save-raw N` once at a natural pause. Do not save automatically; the user chooses what deserves long-term memory.
- At the start of work on this domain, consult the wiki first (Query) instead of asking the user to repeat context.
- After any ingest, tell the user: new/updated pages, any `contested` pages, and validator result.
- If the validator reports errors, fix them under `wiki/` (or re-run ingest); never loosen the validator to make it pass.
