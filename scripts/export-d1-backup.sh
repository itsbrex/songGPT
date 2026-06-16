#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/backups}"
DATABASE_NAME="${DATABASE_NAME:-songgpt}"
TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  printf 'CLOUDFLARE_API_TOKEN is required. Set it in ENV_FILE or export it before running.\n' >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

SQL_OUTPUT="$OUTPUT_DIR/${DATABASE_NAME}-d1-${TIMESTAMP}.sql"
EXPORT_LOG="$OUTPUT_DIR/${DATABASE_NAME}-d1-export-${TIMESTAMP}.log"
INFO_OUTPUT="$OUTPUT_DIR/${DATABASE_NAME}-d1-info-${TIMESTAMP}.txt"
COUNTS_OUTPUT="$OUTPUT_DIR/${DATABASE_NAME}-d1-counts-${TIMESTAMP}.txt"
FILES_OUTPUT="$OUTPUT_DIR/${DATABASE_NAME}-d1-file-keys-${TIMESTAMP}.txt"

cd "$ROOT_DIR/front-end"

npx wrangler@latest d1 export "$DATABASE_NAME" \
  --remote \
  --skip-confirmation \
  --output "$SQL_OUTPUT" \
  > "$EXPORT_LOG" 2>&1

npx wrangler@latest d1 info "$DATABASE_NAME" > "$INFO_OUTPUT"
npx wrangler@latest d1 execute "$DATABASE_NAME" \
  --remote \
  --command "SELECT status, model, COUNT(*) AS count FROM songs GROUP BY status, model ORDER BY status, model;" \
  > "$COUNTS_OUTPUT"
npx wrangler@latest d1 execute "$DATABASE_NAME" \
  --remote \
  --command "SELECT COUNT(*) AS total_songs, SUM(abc_key IS NOT NULL) AS songs_with_abc_key, SUM(midi_key IS NOT NULL) AS songs_with_midi_key, SUM(abc IS NOT NULL) AS songs_with_inline_abc FROM songs;" \
  > "$FILES_OUTPUT"

printf 'D1 backup written:\n'
printf '  %s\n' "$SQL_OUTPUT"
printf '  %s\n' "$EXPORT_LOG"
printf '  %s\n' "$INFO_OUTPUT"
printf '  %s\n' "$COUNTS_OUTPUT"
printf '  %s\n' "$FILES_OUTPUT"
