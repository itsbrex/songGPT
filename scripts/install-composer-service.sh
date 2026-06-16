#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Install a user-level systemd service for the SongGPT local CLI composer.

Usage:
  scripts/install-composer-service.sh [--start] [--enable-linger]

Environment overrides:
  REPO_DIR       SongGPT checkout path. Defaults to this script's repo.
  ENV_FILE       Ignored composer env file. Defaults to ~/.config/songgpt/songgpt-composer.env.
  SERVICE_NAME   systemd user unit name. Defaults to songgpt-composer.service.
  PYTHON_BIN     Python executable. Defaults to the python3 found on PATH.

The script writes no secrets. If ENV_FILE does not exist, it creates a starter
file with COMPOSER_TOKEN left blank.
EOF
}

START_SERVICE=0
ENABLE_LINGER=0
for arg in "$@"; do
  case "$arg" in
    --start)
      START_SERVICE=1
      ;;
    --enable-linger)
      ENABLE_LINGER=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      usage >&2
      exit 2
      ;;
  esac
done

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${REPO_DIR:-$(cd -- "$SCRIPT_DIR/.." && pwd)}"
PYTHON_BIN="${PYTHON_BIN:-$(command -v python3)}"
SERVICE_NAME="${SERVICE_NAME:-songgpt-composer.service}"
XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
ENV_FILE="${ENV_FILE:-$XDG_CONFIG_HOME/songgpt/songgpt-composer.env}"
UNIT_DIR="$XDG_CONFIG_HOME/systemd/user"
UNIT_PATH="$UNIT_DIR/$SERVICE_NAME"

if ! command -v systemctl >/dev/null 2>&1; then
  echo "systemctl is required to install the composer service." >&2
  exit 1
fi

if [ ! -f "$REPO_DIR/composer/songgpt_composer.py" ]; then
  echo "Composer script not found at $REPO_DIR/composer/songgpt_composer.py" >&2
  exit 1
fi

ENV_DIR="$(dirname -- "$ENV_FILE")"
mkdir -p "$ENV_DIR" "$UNIT_DIR"
if [ -O "$ENV_DIR" ]; then
  chmod 700 "$ENV_DIR"
fi

if [ ! -f "$ENV_FILE" ]; then
  cp "$REPO_DIR/composer/songgpt-composer.env.example" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "Created $ENV_FILE. Add COMPOSER_TOKEN before starting the service."
else
  chmod 600 "$ENV_FILE"
fi

cat > "$UNIT_PATH" <<EOF
[Unit]
Description=SongGPT local CLI composer
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$REPO_DIR
EnvironmentFile=$ENV_FILE
ExecStartPre=$PYTHON_BIN $REPO_DIR/composer/songgpt_composer.py --check
ExecStart=$PYTHON_BIN $REPO_DIR/composer/songgpt_composer.py
Restart=always
RestartSec=15

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload

echo "Installed $UNIT_PATH"
echo "Environment file: $ENV_FILE"

if [ "$ENABLE_LINGER" -eq 1 ]; then
  if command -v loginctl >/dev/null 2>&1; then
    loginctl enable-linger "$USER"
    echo "Enabled lingering for $USER"
  else
    echo "loginctl not found; skipping linger setup." >&2
  fi
fi

if [ "$START_SERVICE" -eq 1 ]; then
  systemctl --user enable --now "$SERVICE_NAME"
  systemctl --user --no-pager status "$SERVICE_NAME"
else
  echo "Service not started. Run this after setting COMPOSER_TOKEN:"
  echo "  systemctl --user enable --now $SERVICE_NAME"
fi
