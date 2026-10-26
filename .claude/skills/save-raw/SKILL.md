---
name: save-raw
description: Save a distilled snapshot of the last N assistant answers of the current chat (with the user questions that triggered them) into a knowledge base's immutable raw/ folder, for later ingest. Use when the user types /save-raw [N] or explicitly asks to save this discussion to the wiki / long-term project memory.
argument-hint: "[N] [--kb <dir>]"
disable-model-invocation: true
---

# /save-raw

Fixes valuable context from this chat as an **input snapshot** for a later ingest. It never touches `wiki/`:
capturing a source and compiling knowledge are separate steps, so the wiki can be rebuilt later from `raw/`.

Arguments: `$ARGUMENTS` — `N` = how many of the latest substantive assistant answers to include (default 1);
`--kb <dir>` = target knowledge base.

## Steps

1. **Pick the KB.** Find knowledge bases: `find . -maxdepth 4 -name config.json -path '*/scripts/*' -not -path '*/node_modules/*'`
   (the KB root is the parent of `scripts/`). One KB -> use it. Several -> use `--kb`, else the one matching the topic of the
   discussion, else ask the user. None -> tell the user to run the `llm-wiki-init` skill and stop.
2. **Select the material.** Take the last N assistant answers of this conversation plus the user messages that prompted them.
   Exclude this `/save-raw` call itself. If you cannot see enough history (context was compacted), say so rather than inventing content.
3. **Distill, don't transcribe.** Keep facts, domain logic, formulas, decisions with their reasons, rejected alternatives,
   and references to code objects (files, tables, functions). Drop greetings, tool chatter, and anything speculative that was not confirmed.
   Write in the KB's wiki language (see its `SCHEMA.md`). Never include secrets, tokens, or personal data.
4. **Write** `<kb>/raw/YYYY-MM-DD--<slug>.md` (today's date from `date +%F`; slug = latin kebab-case, 3-6 words describing the topic;
   if the file exists, append `-2`, `-3`, ...). Use exactly this structure:

   ```markdown
   ---
   title: <short title>
   kind: chat-snapshot
   saved_at: <YYYY-MM-DD>
   covers: last <N> assistant answer(s) of the session (distilled)
   ---

   # <title>

   ## Context
   What was being worked on and the question(s) asked.

   ## Findings
   Facts, logic, formulas, constraints established.

   ## Decisions and rationale
   What was decided, why, and what was rejected.

   ## Open questions and code references
   Unresolved points; files / tables / objects involved.
   ```
5. **Do not edit the file after writing it.** Do not touch `wiki/`, `SCHEMA.md`, or anything else.
6. **Report** in 2-4 lines: file path, what it covers, and the next step — `/ingest-wiki` to compile it into the wiki.
