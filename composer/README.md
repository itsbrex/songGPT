# SongGPT Composer

This worker runs outside Cloudflare on any machine that has a logged-in
subscription CLI and `abc2midi`.

It polls the Cloudflare Pages Function API for queued songs, generates ABC with
either Claude or Codex, renders MIDI locally, and uploads the ABC/MIDI files to
R2 through the protected composer endpoint.

```bash
export SONGGPT_API_BASE="https://api.songgpt.soli.blue"
export COMPOSER_TOKEN="<same secret configured in Cloudflare Pages>"
export SONGGPT_GENERATOR="claude" # or "codex"
export CLAUDE_MODEL="sonnet"
# Leave CODEX_MODEL unset to use ~/.codex/config.toml, or set a supported model.

python3 composer/songgpt_composer.py
```

For a single smoke-test job:

```bash
python3 composer/songgpt_composer.py --once
```

For a safe preflight that does not claim a job:

```bash
python3 composer/songgpt_composer.py --check
```

## Continuous Worker

Copy `composer/songgpt-composer.env.example` to an ignored env file and set the
real `COMPOSER_TOKEN`. The example systemd unit assumes the repo is checked out
at `/opt/songgpt`:

```bash
sudo cp composer/songgpt-composer.service.example /etc/systemd/system/songgpt-composer.service
sudo systemctl daemon-reload
sudo systemctl enable --now songgpt-composer
sudo journalctl -u songgpt-composer -f
```
