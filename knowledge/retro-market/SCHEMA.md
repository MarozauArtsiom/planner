# Retro Tools Market — Wiki Schema

Source of truth for page formats. `scripts/validate-wiki.py` enforces these rules mechanically;
`AGENTS.md` tells the agent how to work. If the two ever disagree, fix the validator or this file
deliberately (a human decision), never silently.

- Domain: Исследование рынка инструментов для командных ретроспектив (EasyRetro и аналоги): продукты, фичи, цены, позиционирование, возможности для собственного продукта sprint-retro.
- Wiki language: Russian (file names and frontmatter keys always stay latin / English)

## Layers

| Layer | Path | Who writes | Mutability |
|---|---|---|---|
| Raw sources | `raw/` | humans, `save-raw` skill | **immutable** — add files only, never edit |
| Synthesized knowledge | `wiki/` | the agent (ingest) | maintained, always cites raw sources |
| Rules | `SCHEMA.md`, `AGENTS.md`, `scripts/` | humans | changed deliberately |

`raw/assets/` holds binaries (images, PDFs). Only `raw/**/*.md` and `raw/**/*.txt` are ingested.

Raw file name: `YYYY-MM-DD--<slug>.md` (latin kebab-case slug).

## Wiki layout

```
wiki/
  sources/    one page per raw file                 (type: source)
  entities/   concrete things: systems, tables, people, dashboards   (type: entity)
  concepts/   terms, business rules, algorithms, metrics             (type: concept)
  analyses/   syntheses, comparisons, requirement traces, decisions   (type: analysis)
  index.md    catalog of EVERY page, one line each
  overview.md living summary of the whole domain
  log.md      append-only chronological journal
```

File names: latin kebab-case, `a-z 0-9 -`. A source page is named after its raw file without extension
(`raw/2026-10-17--initial-audit.md` -> `wiki/sources/2026-10-17--initial-audit.md`).

## Frontmatter

Source page:

```yaml
---
title: Initial audit meeting
type: source
resource: raw/2026-10-17--initial-audit.md
created: 2026-10-17
updated: 2026-10-17
tags: [meeting]
---
```

Entity / concept / analysis page:

```yaml
---
title: Like-for-Like comparison
type: concept            # entity | concept | analysis — must match the folder
created: 2026-10-17
updated: 2026-10-20
source_count: 2          # == number of items in `sources`
sources: [2026-10-17--initial-audit, 2026-10-19--classifier-discussion]   # stems of wiki/sources pages
contested: false         # true while sources contradict each other
tags: []
---
```

## Page bodies

- Source page: `## Summary`, `## Key facts`, `## Mentioned pages` (wikilinks to entities/concepts/analyses it fed), `## Open questions`.
- Entity / concept: short definition first, then details; `## Contradictions` when `contested: true`; always end with `## Citations`.
- Analysis: question or goal, findings, decision/status; end with `## Citations`.
- `## Citations`: one bullet per source, `- [[sources/<stem>]] — what this source established`.
- Every non-obvious claim must be traceable to a source listed in `sources`. No source -> no claim.

## Links

- Use `[[wikilinks]]`. Prefer path-qualified links: `[[concepts/like-for-like-comparison]]`.
- Links to raw files: `[[raw/<file>.md]]`.
- A link must resolve; ambiguous bare names are errors.

## index.md

Grouped by `## Sources`, `## Entities`, `## Concepts`, `## Analyses`. One line per page:
`- [[concepts/like-for-like-comparison]] — one-line summary`. Every page must be listed.

## log.md (append-only)

Heading format: `## [YYYY-MM-DD] <op> | <title>` where `<op>` is one of
`init save ingest query lint update context`. Under the heading, short bullets of what changed.
Earlier entries are never edited or removed.

## Contradictions

Never overwrite an older claim silently. Keep both positions, name their sources, set `contested: true`,
and describe the conflict under `## Contradictions`. Clear the flag only when a source resolves it
(and say which one).

## Operations

1. **Save** (`save-raw`): snapshot selected chat content into `raw/`. No wiki edits.
2. **Ingest** (`ingest-wiki` -> `scripts/run-ingest.sh`): one raw file per isolated agent call: source page,
   merge into entities/concepts/analyses, update index and log. Deterministic checks and reindexing run afterwards.
3. **Query**: search first, read the selected pages, answer with `[[wikilinks]]` and call out contested facts and gaps.
   A reusable answer may be filed back as an analysis (via `save-raw` + ingest, so provenance stays intact).
4. **Lint**: `python3 scripts/validate-wiki.py` (mechanical) plus a periodic semantic audit described in `AGENTS.md`.
