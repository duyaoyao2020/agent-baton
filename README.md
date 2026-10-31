# Baton

<p align="center">
  <img src="docs/logo/v3-wordmark.jpg" alt="Baton" width="280" />
</p>

**Hit Claude limit? `baton go codex` — keep working.**
额度撞线？一条命令换 Codex 接着写，任务不丢。

![Baton demo: status → handoff → go codex](docs/demo-amber.gif)

```bash
npx agent-baton init      # installs a statusline + Stop/PreCompact hooks (backs up first)
baton status              # 5-hour AND weekly (7d) usage
baton go codex            # hand the task to Codex now, with HANDOFF.md + git context
```

**Repo:** [github.com/duyaoyao2020/agent-baton](https://github.com/duyaoyao2020/agent-baton) (`main`)

## Why Baton (3 things)

1. **Weekly (7d) quota is the real wall — switch vendor when it bites.** Anthropic's verified **Ultra** ($200, ex-Max 20x) no longer has a 5-hour session limit; **weekly limits remain**. Pro / Max (and unverified Ultra) still hit 5h. When the week is the tight window, waiting a few hours won't help — `baton go codex` will. Source: [Claude.ai, 2026-10-31](https://x.com/claudeai/status/2116220869479428500).
2. **Cross-vendor now, not same-CLI retry after reset.** Retry tools resume the *same* Claude after the window resets. Baton hands the task to **another vendor** right away. The handoff is a plain `HANDOFF.md` at your repo root (Goal / Done / Decisions / Rejected / Next / Open questions + git context) that you can read and edit. Best fit: dual-sub users (Claude + Codex) and non-Ultra plans.
3. **Windows + 中文 first-class.** Hooks and statusline are pure Node (no bash one-liners), paths via `os.homedir()`, no `shell:true`. Messages are calm: 「快到线了，交接单已备好」.

When either window reaches 85% (configurable), Baton writes a skeleton `HANDOFF.md` at the end of Claude's turn and asks Claude once to fill in the human parts. **Do not pitch Ultra users on a 5h cliff** — pitch weekly + cross-vendor.

## 中文速览

- **主打周额度（7d）+ 跨厂商**：已验证 Ultra 取消 5 小时限额，周限额仍在；Pro/Max 仍有 5h。周额度见底时，等几小时没用，换 Codex 才有用。
- **现在就换厂商**：不是等额度重置后回到同一个 Claude，而是 `baton go codex` 立刻接力（双订阅 / 非 Ultra 画像更准）。
- **Windows + 中文**：纯 Node 钩子，Windows 可用；提示语冷静不吓人。
- 交接单 `HANDOFF.md` 就在仓库根目录，人能看、能改、能审。

## Commands

| Command | What it does |
|---|---|
| `baton init [--dry-run]` | Back up `~/.claude/settings.json` (and `~/.codex/hooks.json` if present) to `~/.baton/backup/<ts>/`, then add statusLine + Stop + PreCompact. Keeps your own statusline. Needs Claude Code ≥ 2.1.80 (statusline `rate_limits`). |
| `baton status [--fixture f.json]` | 5h + 7d usage and reset times. |
| `baton handoff` | Write/refresh `HANDOFF.md` at the git root. Secrets redacted by default. |
| `baton go codex\|claude\|cursor [--print]` | Start the next agent with the handoff. `cursor` copies the prompt to the clipboard. `--print` only prints. |
| `baton doctor` | Check CLIs, versions, hooks, backups, quota state. |
| `baton remove [--force]` | Restore your original config. If you edited it after init, shows a diff and refuses unless `--force`. Never deletes `HANDOFF.md`. |
| `baton redact --check FILE` | Exit 1 if likely secrets remain. |

## What Baton does NOT do / 不做什么

- It does **not** raise or bypass any limit. 不提额、不绕限。
- It does not proxy, store, or upload your code or prompts. Everything stays on your machine (`~/.baton`, your repo).
- The handoff is **structured and lossy** — a summary, not the full conversation. The next agent should check git when unsure. 结构化交接是有损的。
- No auto-switching daemon, no team dashboard (not in this MVP).
- `rate_limits` is only sent by Claude Code for Claude.ai Pro/Max plans; API-key users get no quota numbers.

## Privacy

Local only. No telemetry. Secret redaction (API keys, GitHub/Slack/AWS tokens, private keys, `*_SECRET=` values) runs before anything is written to `HANDOFF.md` or passed to another agent — it is heuristic and does not replace "don't paste secrets into chats". 过滤为启发式，不能替代「别把密钥贴进对话」。

## Uninstall

`baton remove` (add `--purge-history` to delete `~/.baton/history`). Windows: if PowerShell blocks `npx`, use `cmd.exe`.

---

MIT. **Not affiliated with Anthropic, OpenAI, or Anysphere.** Claude, Codex and Cursor are trademarks of their owners.
