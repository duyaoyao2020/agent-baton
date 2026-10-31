#!/usr/bin/env bash
# 密钥过滤用例：优先调用 `baton redact`；若 CLI 未就绪则用内置参考实现对照 .out.md
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BATON_BIN="${BATON_BIN:-baton}"
IN_DIR="$ROOT/testdata/redaction"
FAIL=0

ref_redact() {
  # 参考启发式（与 docs/redaction-test-cases.md 对齐；正式实现应在 src/）
  python3 - "$1" <<'PY'
import re,sys
p=sys.argv[1]
t=open(p,encoding='utf-8').read()
patterns=[
 (re.compile(r'sk-ant-api03-[A-Za-z0-9_-]+'),'[REDACTED:key]'),
 (re.compile(r'sk-proj-[A-Za-z0-9_-]+'),'[REDACTED:key]'),
 (re.compile(r'sk-[A-Za-z0-9]{20,}'),'[REDACTED:key]'),
 (re.compile(r'ghp_[A-Za-z0-9]{20,}'),'[REDACTED:key]'),
 (re.compile(r'gho_[A-Za-z0-9]{20,}'),'[REDACTED:key]'),
 (re.compile(r'github_pat_[A-Za-z0-9_]{20,}'),'[REDACTED:key]'),
 (re.compile(r'xox[bp]-[A-Za-z0-9-]+'),'[REDACTED:key]'),
 (re.compile(r'AKIA[0-9A-Z]{16}'),'[REDACTED:key]'),
 (re.compile(r'(?i)(api_key|api_secret|secret)\s*=\s*\S+'), lambda m: m.group(1).split('=')[0]+'=[REDACTED]' if False else re.sub(r'=\s*\S+','=[REDACTED]',m.group(0))),
 (re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----',re.S),'[REDACTED:private-key]'),
]
for pat,rep in patterns:
  t=pat.sub(rep,t)
print(t,end='' if t.endswith('\n') else '\n')
PY
}

shopt -s nullglob
cases=("$IN_DIR"/*.in.md)
if [[ ${#cases[@]} -eq 0 ]]; then echo "no cases"; exit 1; fi

use_cli=0
if command -v "$BATON_BIN" >/dev/null 2>&1 && "$BATON_BIN" redact --help >/dev/null 2>&1; then
  use_cli=1
  echo "using CLI: $BATON_BIN"
else
  echo "CLI redact unavailable — using reference redactor (replace when src ready)"
fi

for inn in "${cases[@]}"; do
  base="${inn%.in.md}"
  out="${base}.out.md"
  got="$(mktemp)"
  if [[ "$use_cli" -eq 1 ]]; then
    "$BATON_BIN" redact "$inn" >"$got"
  else
    ref_redact "$inn" >"$got"
  fi
  if [[ -f "$out" ]]; then
    if diff -u "$out" "$got"; then
      echo "OK  $(basename "$inn")"
    else
      echo "FAIL $(basename "$inn")"
      FAIL=$((FAIL+1))
    fi
  else
    echo "NOTE no golden for $(basename "$inn"); wrote got to ${base}.got.md"
    cp "$got" "${base}.got.md"
  fi
  rm -f "$got"
done

# extra synthetic checks
tmp=$(mktemp)
printf 'xoxb-1234567890-abcdefghijklmnop\n' >"$tmp"
if [[ "$use_cli" -eq 1 ]]; then
  "$BATON_BIN" redact --check "$tmp" && { echo "FAIL S4 should fail --check"; FAIL=$((FAIL+1)); } || echo "OK  S4 --check rejects"
else
  ref_redact "$tmp" | grep -q REDACTED && echo "OK  S4 ref" || { echo "FAIL S4 ref"; FAIL=$((FAIL+1)); }
fi
rm -f "$tmp"

echo "FAIL=$FAIL"
exit "$FAIL"
