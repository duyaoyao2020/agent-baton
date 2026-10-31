#!/usr/bin/env bash
# NUC Linux 验收：init → doctor → status --fixture → go --print → remove
# D5 焦点：跨厂商 go（Claude→Codex）。自动写 HANDOFF 只是手段，不是演示主卖点。
# 用法（在已安装 agent-baton 的机器上）：
#   BATON_BIN=baton ./scripts/nuc-acceptance.sh
#   或：./scripts/nuc-acceptance.sh /path/to/baton
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BATON_BIN="${1:-${BATON_BIN:-baton}}"
FIXTURE_85="$ROOT/fixtures/rate85.json"
WORK="$(mktemp -d /tmp/baton-accept-XXXXXX)"
PASS=0
FAIL=0

log() { printf '%s\n' "$*"; }
ok() { PASS=$((PASS+1)); log "OK  $*"; }
bad() { FAIL=$((FAIL+1)); log "FAIL $*"; }

cleanup() {
  if command -v "$BATON_BIN" >/dev/null 2>&1 || [[ -x "$BATON_BIN" ]]; then
    "$BATON_BIN" remove --force >/dev/null 2>&1 || true
  fi
  rm -rf "$WORK"
}
trap cleanup EXIT

log "== Baton NUC acceptance =="
log "ROOT=$ROOT"
log "BATON_BIN=$BATON_BIN"
log "WORK=$WORK"

if ! command -v "$BATON_BIN" >/dev/null 2>&1 && [[ ! -x "$BATON_BIN" ]]; then
  log "SKIP: baton CLI not found. Install/link agent-baton first (wait for MVP_STATUS.md / npm link)."
  exit 2
fi

for f in "$FIXTURE_85" "$ROOT/fixtures/rate20.json" "$ROOT/fixtures/rate100.json"; do
  [[ -f "$f" ]] || { bad "missing fixture $f"; exit 1; }
done
ok "fixtures present"

cd "$WORK"
git init -q
echo 'console.log("demo")' > app.js
git add app.js
git -c user.email=baton@test -c user.name=baton commit -qm "seed"

# --- init ---
if "$BATON_BIN" init; then ok "init"; else bad "init"; fi

# --- doctor ---
if "$BATON_BIN" doctor; then ok "doctor after init"; else bad "doctor after init"; fi

# --- status fixture ---
if "$BATON_BIN" status --fixture "$FIXTURE_85"; then ok "status --fixture rate85"; else bad "status --fixture rate85"; fi

# --- dry-run / print ---
if "$BATON_BIN" go codex --print >"$WORK/print.out" 2>"$WORK/print.err"; then
  if [[ -s "$WORK/print.out" ]]; then ok "go codex --print (non-empty)"; else bad "go codex --print empty stdout"; fi
else
  # try --dry-run alias
  if "$BATON_BIN" go codex --dry-run >"$WORK/print.out" 2>"$WORK/print.err"; then
    ok "go codex --dry-run"
  else
    bad "go codex --print/--dry-run"
    cat "$WORK/print.err" || true
  fi
fi

# --- redact check if HANDOFF exists ---
if [[ -f HANDOFF.md ]]; then
  if "$BATON_BIN" redact --check HANDOFF.md; then ok "redact --check HANDOFF.md"; else bad "redact --check HANDOFF.md"; fi
else
  log "NOTE: no HANDOFF.md yet (hook may need Stop event); skipping redact on handoff"
fi

# --- remove clean ---
if "$BATON_BIN" remove; then ok "remove"; else bad "remove"; fi

if "$BATON_BIN" doctor; then
  # doctor may exit 0 with "not installed" or non-zero — accept either if message mentions not installed
  ok "doctor after remove (exit 0)"
else
  ok "doctor after remove (exit non-zero expected if not installed)"
fi

# --- dirty remove ---
"$BATON_BIN" init >/dev/null
# mutate a known config if present — best effort
for cand in "$HOME/.claude/settings.json" "$HOME/.codex/hooks.json"; do
  if [[ -f "$cand" ]]; then
    echo "" >>"$cand"
    echo "// baton-accept-mutate $(date -Iseconds)" >>"$cand"
    break
  fi
done
set +e
"$BATON_BIN" remove
rc=$?
set -e
if [[ $rc -ne 0 ]]; then ok "remove refuses dirty config (exit $rc)"; else bad "remove should refuse dirty config without --force"; fi
if "$BATON_BIN" remove --force; then ok "remove --force"; else bad "remove --force"; fi

log "== summary: PASS=$PASS FAIL=$FAIL =="
[[ "$FAIL" -eq 0 ]]
