#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

fail() {
  echo "not ok - $*" >&2
  exit 1
}

ok() {
  echo "ok - $*"
}

tracked_exact() {
  git -C "$ROOT_DIR" ls-files --error-unmatch "$1" >/dev/null 2>&1
}

tracked_under() {
  git -C "$ROOT_DIR" ls-files "$1" | grep -q .
}

for path in \
  ".firebaserc" \
  "firebase.json" \
  "front-end/firebase.json" \
  "back-end/firebase.json" \
  "google-services.json" \
  "front-end/google-services.json" \
  "GoogleService-Info.plist" \
  "front-end/GoogleService-Info.plist"; do
  if tracked_exact "$path"; then
    fail "$path must not be tracked"
  fi
done
ok "Firebase config files are not tracked"

for path in \
  ".firebase" \
  "front-end/.firebase" \
  "back-end/.firebase" \
  "front-end/.expo" \
  "front-end/.expo-shared"; do
  if tracked_under "$path"; then
    fail "$path must not contain tracked files"
  fi
done
ok "Firebase and Expo build state is not tracked"

active_files="$(
  git -C "$ROOT_DIR" ls-files \
    'front-end/src/**' \
    'front-end/functions/**' \
    'front-end/package.json' \
    'front-end/package-lock.json' \
    'front-end/wrangler.jsonc' \
    'composer/**' \
    'back-end/app/**' \
    'back-end/requirements.txt' \
    'back-end/pyproject.toml'
)"

if [ -z "$active_files" ]; then
  fail "active runtime file list is empty"
fi

scan_active() {
  local label="$1"
  local pattern="$2"
  local offenders
  offenders="$(
    cd "$ROOT_DIR" &&
      printf '%s\n' "$active_files" |
        xargs -r rg -n -i -- "$pattern" 2>/dev/null || true
  )"
  if [ -n "$offenders" ]; then
    printf '%s\n' "$offenders" >&2
    fail "$label found in active runtime files"
  fi
  ok "$label absent from active runtime files"
}

scan_active "Firebase runtime references" 'firebase|firestore|appspot|firebaseapp'
scan_active "provider API-key references" 'OPENAI[_-]?API[_-]?KEY|api\.openai\.com|openai\.ChatCompletion|@google-cloud|google-cloud'
scan_active "WAV generation/storage references" 'midi_to_wav|midi_to_audio|audio/wav|\.wav\b|fluidsynth\.wav|pyFluidSynth|mido=='

node --input-type=module - "$ROOT_DIR/front-end/package.json" <<'JS'
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(process.argv[2], "utf8"));
const deps = {
  ...(pkg.dependencies || {}),
  ...(pkg.devDependencies || {}),
};
const forbidden = Object.keys(deps).filter((name) =>
  /^(firebase|expo|react-native)$|^@react-native|^@google-cloud|openai/i.test(name),
);

if (forbidden.length) {
  console.error(`not ok - forbidden frontend dependencies: ${forbidden.join(", ")}`);
  process.exit(1);
}

console.log("ok - frontend dependencies are free of Firebase, Expo, OpenAI, and Google Cloud SDKs");
JS

ok "decommissioned service check complete"
