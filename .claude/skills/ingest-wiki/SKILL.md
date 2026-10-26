---
name: ingest-wiki
description: Compile new raw/ documents into the LLM Wiki by running the knowledge base's deterministic wrapper script (isolated agent CLI, validation, reindex). Use when the user types /ingest-wiki or asks to process / ingest new sources into the wiki.
argument-hint: "[--plan] [--force] [--kb <dir>] [raw/<file>]"
disable-model-invocation: true
---

# /ingest-wiki

Thin shell over `<kb>/scripts/run-ingest.sh`. All orchestration (finding pending files, one isolated agent call per file,
protected-file guards, `validate-wiki.py`, QMD reindex, summary) is done by the script. Your job is to launch it **once** and relay the result.

Arguments: `$ARGUMENTS`

## Rules

- Do **not** read or search `raw/`, `wiki/`, or terminals yourself before or after. Do not "help" the script.
- Do **not** run qmd, the validator, or any other command afterwards — the script already did.
- Do **not** poll. Launch in the background and wait for the completion notification.

## Steps

1. Locate the KB: `find . -maxdepth 4 -name config.json -path '*/scripts/*' -not -path '*/node_modules/*'` (KB root = parent of `scripts/`).
   Several KBs -> take `--kb`, else ask the user. None -> suggest the `llm-wiki-init` skill and stop.
2. Run exactly one Bash call with `run_in_background: true` (an ingest takes minutes per file):

   ```bash
   cd <kb> && ./scripts/run-ingest.sh <arguments except --kb>
   ```
   `--plan` only lists pending files (fast; no background needed). `--force` re-ingests. A `raw/<file>` argument ingests only that file.
3. When it finishes, report the script's summary: files created / updated, validator result, and any `contested` pages mentioned.
   On a non-zero exit show the error block as is: exit 1 = validation still failing, 2 = agent failed/timed out,
   3 = a protected file (raw/SCHEMA/AGENTS/scripts) was modified or log.md rewritten. Don't retry on your own; ask the user.
