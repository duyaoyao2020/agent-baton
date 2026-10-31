# Baton

**Hit Claude limit? `baton go codex` — keep working.**
额度撞线？一条命令换 Codex 接着写，任务不丢。

![Baton demo: status → handoff → go codex](docs/demo.gif)

```bash
npx agent-baton init      # installs a statusline + Stop/PreCompact hooks (backs up first)
baton status              # 5-hour AND weekly (7d) usage
baton go codex            # hand the task to Codex now, with HANDOFF.md + git context
```

## Why Baton (3 things)

1. **Switch vendor now, don't wait for the reset.** Retry tools resume the *same* Claude session after the window resets. Baton hands the task to **another vendor** right away: `baton go codex`. The handoff is a plain `HANDOFF.md` at your repo root (Goal / Done / Decisions / Rejected / Next / Open questions + git context) that you can read and edit.
2. **Windows + 中文 first-class.** Hooks and statusline are pure Node (no bash one-liners), paths via `os.homedir()`, no `shell:true`. Messages are calm: 「快到线了，交接单已备好」.
3. **Watches the weekly (7d) quota, not only the 5-hour window.** When the weekly window is the tight one, waiting a few hours won't help — switching will.

When either window reaches 85% (configurable), Baton writes a skeleton `HANDOFF.md` at the end of Claude's turn and asks Claude once to fill in the human parts.

## 中文速览

- **现在就换厂商**：不是等额度重置后回到同一个 Claude，而是 `baton go codex` 立刻接力。
- **Windows + 中文**：纯 Node 钩子，Windows 可用；提示语冷静不吓人。
- **看周额度（7d）**：不只盯 5 小时窗口；周额度见底时，等重置没用，换手才有用。
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
