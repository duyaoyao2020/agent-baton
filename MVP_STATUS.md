# Baton MVP status — 2026-10-31 (UTC+8)

Package `agent-baton` v0.1.0 · bin `baton` · ESM · Node ≥ 18 · MIT · zero runtime dependencies · local git only (no remote).

## Done
- `baton init` — detects `~/.claude` / `~/.codex`; Claude version gate (≥ 2.1.80 for statusline `rate_limits`, exit 2 and **no writes** if older/missing; `--force` overrides); backup to `~/.baton/backup/<ts>/` + `manifest.json` (paths, pre/post sha256, cli probe, baton_version); copies hook runtime to `~/.baton/runtime` (so `npx` cache eviction can't break hooks); installs statusLine + Stop + PreCompact into Claude user settings, Stop into `~/.codex/hooks.json` **only if it exists**; keeps/chains an existing user statusLine; idempotent; `--dry-run`; refuses invalid JSON.
- `baton remove` — unchanged → restore originals; edited → unified diff + refuse (exit 3); `--force` → strip only Baton entries (keeps user edits) or restore backup if file is no longer valid JSON, keeps a copy of the edited file; keeps history (`--purge-history` to delete); never touches repo `HANDOFF.md`; "nothing to remove" if never installed.
- `baton status` — 5h + 7d bars + local reset time; `--fixture` / `BATON_FIXTURE`; weekly-window hint; `--json`.
- `baton handoff` — HANDOFF.md at git root: frontmatter (baton_version, from, to, created_at, quota_at, quota_at_5h, quota_at_7d, triggered_by 5h|7d|hard_limit|manual, status — per docs/trigger-5h-and-weekly.md) + Goal/Done/Decisions/Rejected/Files/Next/Open questions + git status / diff --stat / last 5 commits; Goal/Done/Next/Files auto-extracted from the latest Claude transcript (≤12h old) when available; redaction on by default; re-runs only refresh frontmatter + `baton:auto` git block (human text kept); won't overwrite a non-Baton HANDOFF.md without `--force`; old copies go to `~/.baton/history`.
- `baton go codex|claude|cursor` — prompt = rules + HANDOFF.md (+ git if HANDOFF is hand-written); `--print`/`--dry-run` print only (no writes); codex/claude spawned without `shell:true` in repo root (Windows `.cmd` shims via explicit `cmd.exe`, long prompts swapped for a short "read HANDOFF.md" pointer); cursor → clipboard (pbcopy/clip.exe/wl-copy/xclip/xsel) or prints; prompt saved to history.
- `baton doctor` — node, claude/codex path+version, rate_limits support, hooks, runtime files, template, manifest, state freshness; exit 1 on problems.
- `baton redact <file>` / `--check` / `--write` — S1–S8 + N1–N3 from docs/redaction-test-cases.md; goldens pass.
- Hooks (pure Node, never fail the host; garbage stdin → exit 0):
  - statusline: saves `~/.baton/state.json`, prints `Baton 5h 60% · 7d 87% · 快到线了，交接单已备好 → baton go codex`.
  - Stop: at ≥85% of 5h **or 7d** → writes skeleton HANDOFF once per window, then (once, guarded by `stop_hook_active`) asks Claude to fill Goal/Done/Decisions/Rejected/Next; later turns just refresh the git block.
  - PreCompact: snapshot to history; writes repo HANDOFF if already over threshold.
- README (EN+ZH) with revised positioning: ① switch vendor now (vs agent-limit-retry resuming same Claude after reset) ② Windows + 中文 ③ weekly 7d watch; honest 不做什么 / lossy / no limit raising / Not affiliated.
- Tests: `npm test` (8 unit tests), `scripts/test-redaction.sh` (FAIL=0 via CLI), `scripts/nuc-acceptance.sh` PASS=9 FAIL=0 (run on box with a sandbox HOME + fake codex).

## Verified on box (Linux, Node 20.19, Claude Code 2.1.312, no codex)
`npm install && npm link`, `baton --help`, `baton doctor` (exit 1: codex missing + not installed in real HOME — expected), `baton status --fixture fixtures/rate85.json`, `baton handoff`, `baton go codex --print`, `baton redact --check` (exit 1 on basic.in.md, 0 on generated HANDOFF.md). init/remove/hook simulation only against sandbox HOMEs (`/tmp/baton-home*`); real `~/.claude/settings.json` untouched.

## Limits / not yet verified
- No real quota hit yet: real Claude statusline payload + Stop-hook `decision:block` fill flow untested against a live session (do on NUC per DECISIONS: box has no user login).
- Codex not installed on box → real `baton go codex` spawn untested (fake codex verified argv/cwd). Codex `hooks.json` format assumed to mirror Claude's (only touched if file already exists).
- Windows: code paths written (PATHEXT lookup, `.cmd` via cmd.exe, clip.exe, os.homedir) but no Windows machine — needs `docs/acceptance-windows.md` run + CI windows-latest.
- `triggered_by: hard_limit` is inferred from ≥100% in statusline data; a hard rate-limit *error* in the transcript is not yet detected.
- Transcript extraction is best-effort (Claude JSONL format may change).
- `agentFill` (one extra Claude turn at threshold) costs a little quota; disable via `~/.baton/config.json` `{"agentFill": false}`. Threshold via `baton init --threshold 80`.
- Not published to npm; no public repo (per decision).

## Next
1. 阳阳: NUC run `scripts/nuc-acceptance.sh` with real Claude 2.1.119 + Codex 0.136, then one real 85% hit → `baton go codex` (D5 gate: ≥3 real handoffs).
2. Windows real-machine pass + GitHub Actions matrix (ubuntu/macos/windows `npm test`) once repo exists.
3. 30s GIF (昕昕 storyboard) after first real hit.
4. `npm publish agent-baton` after Show HN gate; landing page + payments (Founding $29 / 爱发电 ¥29).
