#!/usr/bin/env bash
# ~30s demo: fixture 85% → handoff → go codex --print
set -euo pipefail
export PATH="$HOME/.local/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK=$(mktemp -d /tmp/baton-demo-XXXX)
cd "$WORK"
git init -q
printf 'export function greet(name) {\n  return `hello ${name}`\n}\n' > app.js
git add app.js
git -c user.email=demo@baton -c user.name=baton commit -qm "demo: seed"
baton init --force >/dev/null 2>&1 || baton init >/dev/null

type() {
  local s="$1" i
  for ((i=0; i<${#s}; i++)); do printf '%s' "${s:$i:1}"; sleep 0.045; done
  printf '\n'; sleep 0.35
}

clear 2>/dev/null || printf '\n'
echo "# Baton — hit the limit? One command, Codex keeps going."
echo "# Demo uses a fixture (no real quota burned)."
sleep 2.5

printf '$ '
type "baton status --fixture fixtures/rate85.json"
# use absolute fixture path but show short name in typed cmd — already typed short; run real:
baton status --fixture "$ROOT/fixtures/rate85.json"
sleep 3.5

printf '$ '
type "baton handoff"
baton handoff
sleep 2.0

printf '$ '
type "sed -n '1,28p' HANDOFF.md"
sed -n '1,28p' HANDOFF.md
sleep 3.5

printf '$ '
type "baton go codex --print | head -35"
baton go codex --print | head -35
sleep 4.0

echo ""
echo "# Drop --print to spawn Codex for real. Windows supported."
sleep 3.0
baton remove --force >/dev/null 2>&1 || true
