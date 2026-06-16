# songGPT

songGPT is an open-source project that generates short musical compositions in
ABC notation, converts them to MIDI, and renders audio files. The current hosted
path is designed to stay on Cloudflare's free tiers: Cloudflare Pages for the
React app, Pages Functions for the API, D1 for song metadata, and R2 for ABC,
and MIDI files.

The composer itself runs outside Cloudflare through an existing subscription CLI
login. Use `SONGGPT_GENERATOR=claude` for Claude Code or `SONGGPT_GENERATOR=codex`
for Codex CLI; both paths use structured JSON output and then render the music
locally with `abc2midi`.

## Repository Structure

- **front-end**: Vite React app, Cloudflare Pages Functions, D1 migrations, and
  R2 bindings.
- **composer**: A small polling worker that claims queued songs from the
  Cloudflare API, runs Claude or Codex CLI, renders MIDI, and uploads
  results.
- **back-end**: The original FastAPI shape preserved as a local/VPS-compatible
  fallback. It now uses the same local CLI composer idea with SQLite and local
  file storage instead of Firebase/provider APIs.
- **notebooks**: Historical Jupyter experiments from the first version of the
  project.

## How It Works

1. The React app creates a queued song row through `/api/songs`.
2. D1 stores the prompt, system message, status, and finished ABC/response text.
3. The composer worker polls `/api/composer/claim` using `COMPOSER_TOKEN`.
4. The worker runs Claude or Codex CLI with a JSON schema requiring `response`,
   `abc`, and optional `score`.
5. The worker writes `.abc`, runs `abc2midi`, and uploads the finished files
   back through `/api/composer/:id/complete`.
6. R2 stores generated `.abc` and `.mid` files. The app reads them from
   `/api/songs/:id/files/:type`.

## Cloudflare Setup

Use secrets from your local environment at command time. Do not commit them.

```bash
cd front-end
set -a
source /home/soli/projects/soli.blue/.env
set +a

npx wrangler@latest d1 create songgpt
npx wrangler@latest r2 bucket create songgpt-files
```

Copy the created D1 database id into `front-end/wrangler.jsonc`, then apply the
migration:

```bash
npx wrangler@latest d1 migrations apply songgpt --remote
```

Set `COMPOSER_TOKEN` as a Pages secret in Cloudflare, then deploy:

```bash
npm run build
npx wrangler@latest pages deploy dist --project-name=songgpt --branch=main --commit-dirty=true
```

Attach `songgpt.soli.blue` to the Pages project. If you want a separate API
hostname, attach `api.songgpt.soli.blue` to the same project or a small Worker
that forwards to the Pages Functions routes.

## Composer Worker

```bash
export SONGGPT_API_BASE="https://songgpt.soli.blue/api"
export COMPOSER_TOKEN="<same secret configured in Cloudflare>"
export SONGGPT_GENERATOR="claude" # or "codex"
export CLAUDE_MODEL="sonnet"
export CODEX_MODEL="gpt-5"

python3 composer/songgpt_composer.py
```

## Contributing

We welcome contributions to the project. Please see `CONTRIBUTING.md` for more.
