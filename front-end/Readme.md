# SongGPT Frontend

This is a Vite React app deployed to Cloudflare Pages. It keeps the original
SongGPT flow and visual rhythm while replacing Expo/Firebase with:

- React Router for `/songs/`, `/songs/:songID/`, and `/songs/create/`
- TanStack Query for API state
- Cloudflare Pages Functions under `functions/api`
- D1 for song metadata
- R2 for generated ABC and MIDI files

The hosted app is available at `https://songgpt.soli.blue/`; API routes are
served from the same Pages Functions deployment at `/api/...` and from
`https://api.songgpt.soli.blue/...`.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

Cloudflare commands use `npx wrangler@latest` so the repo does not pin Wrangler
or commit Cloudflare credentials.
