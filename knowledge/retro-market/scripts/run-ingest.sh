#!/usr/bin/env bash
# Deterministic ingest: raw/ -> (isolated agent CLI) -> wiki/ -> validate -> reindex.
# Usage: run-ingest.sh [--plan] [--force] [--no-index] [raw/<file>]
set -euo pipefail
exec python3 "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ingest.py" "$@"
