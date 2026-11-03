# Baton

<p align="center">
  <img src="docs/logo/v3-wordmark.jpg" alt="Baton" width="280" />
</p>

**Not a memory bank — a relay baton.**
**不是记忆库，是接力棒。**

**Hit the weekly cap? `baton go codex` — keep working.**
额度撞线，无损接力。零账号，一条命令换 Codex 接着写，不用把项目重讲一遍。

![Baton demo: status → handoff → go codex](docs/demo-amber.gif)

```bash
npx agent-baton init      # no signup; installs a statusline + Stop/PreCompact hooks (backs up first)
baton status              # 5-hour AND weekly (7d) usage
baton go codex            # hand the task to Codex now, with HANDOFF.md + git context
```

**Repo:** [github.com/duyaoyao2020/agent-baton](https://github.com/duyaoyao2020/agent-baton) (`main`)

## Relay, not a memory layer / 接力，不是记忆层

「换工具不用重讲」可以是两种产品。一种是**共享记忆 / 知识层**：装端点、注册账号、云和定价。Baton 是**撞线那一刻的本地接力棒**：零账号，`npx`，一条 `baton go`。

A memory layer keeps a knowledge store: install an endpoint, register, then cloud and pricing. Baton passes the current task across when a quota hits — on your machine, no signup.

| | Memory / knowledge layer | **Baton** |
|---|---|---|
| Shape | Shared memory you keep filling | Relay baton, passed when the quota bites |
| Setup | Install an endpoint + register an account | Zero account. `npx agent-baton init` |
| Where it lives | Cloud, with pricing | On your machine. A `HANDOFF.md` in the repo. |
| How you continue | The next agent reads the memory bank | `baton go codex` (or `claude` / `cursor`) |
| What crosses over | A knowledge layer | The task: goal, decisions, next steps |

无损接力指的是**任务**还在（目标、决定、下一步），不是把整段对话搬进记忆库。
The handoff is lossless for the *task*. It is not a copy of the raw chat.

## Why Baton (3 things)

1. **Weekly (7d) quota is the real wall — switch vendor when it bites.** Anthropic's verified **Ultra** ($200, ex-Max 20x) no longer has a 5-hour session limit; **weekly limits remain**. Pro / Max (and unverified Ultra) still hit 5h. When the week is the tight window, waiting a few hours won't help — `baton go codex` will. Source: [Claude.ai, 2026-10-31](https://x.com/claudeai/status/2116220869479428500).
2. **Cross-vendor now, not same-CLI retry after reset.** Retry tools resume the *same* Claude after the window resets. Baton hands the task to **another vendor** right away. The handoff is a plain `HANDOFF.md` at your repo root (Goal / Done / Decisions / Rejected / Next / Open questions + git context) that you can read and edit. Best fit: dual-sub users (Claude + Codex) and non-Ultra plans.
3. **Zero account. Windows, macOS, and Linux. 中文.** Hooks and statusline are pure Node (no bash one-liners), paths via `os.homedir()`, no `shell:true`. The same `npx` flow runs on all three. Messages are calm, in Chinese: 「快到线了，交接单已备好」. This README is the Chinese doc as well as the English one.

When either window reaches 85% (configurable), Baton writes a skeleton `HANDOFF.md` at the end of Claude's turn and asks Claude once to fill in the human parts. **Do not pitch Ultra users on a 5h cliff** — pitch weekly + cross-vendor.

## 中文速览

- **不是记忆库，是接力棒。** 零账号；撞线瞬间 `baton go`。不装记忆端点、不注册、不上云。
- **主打周额度（7d）+ 跨厂商**：已验证 Ultra 取消 5 小时限额，周限额仍在；Pro/Max 仍有 5h。周额度见底时，等几小时没用，换 Codex 才有用。
- **现在就换厂商**：不是等额度重置后回到同一个 Claude，而是 `baton go codex` 立刻接力（双订阅 / 非 Ultra 画像更准）。
- **Windows、macOS、Linux** 都能跑；中文提示和这份中文说明写在一起。
- 交接单 `HANDOFF.md` 就在仓库根目录，人能看、能改、能审。任务无损接力；原始对话不搬家。

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

Windows console: PowerShell 5.1 often garbles `✗` and `—`. Windows Terminal, or a UTF-8 code page (`chcp 65001`), shows them correctly.

## What Baton does NOT do / 不做什么

- It is **not** a shared memory or knowledge layer. No endpoint, no account, no cloud pricing. 不是记忆库。
- It does **not** raise or bypass any limit. 不提额、不绕限。
- It does not proxy, store, or upload your code or prompts. Everything stays on your machine (`~/.baton`, your repo).
- The handoff is **structured**. Goal, decisions, and next steps cross over so you don't re-explain the project; the raw conversation does not. The next agent should check git when unsure. 任务无损接力；原始对话不搬家。
- No auto-switching daemon, no team dashboard (not in this MVP).
- `rate_limits` is only sent by Claude Code for Claude.ai Pro/Max plans; API-key users get no quota numbers.

## Privacy

Local only. No telemetry. Secret redaction (API keys, GitHub/Slack/AWS tokens, private keys, `*_SECRET=` values) runs before anything is written to `HANDOFF.md` or passed to another agent — it is heuristic and does not replace "don't paste secrets into chats". 过滤为启发式，不能替代「别把密钥贴进对话」。

## Uninstall

`baton remove` (add `--purge-history` to delete `~/.baton/history`). Windows: if PowerShell blocks `npx`, use `cmd.exe`.

---

MIT. **Not affiliated with Anthropic, OpenAI, or Anysphere.** Claude, Codex and Cursor are trademarks of their owners.
