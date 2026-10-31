# Show HN 正文草稿（Baton）

> 状态：草稿 · 2026-10-31 · 可可供稿 · 曦曦可改  
> 包名：`agent-baton` · CLI 命令：`baton` · 产品名：Baton  

> ⚠️ **2026-10-31 竞品扫描后修订**：agent-limit-retry 免费版已在 ~90% 自动写 HANDOFF（同 CLI 等重置）。发帖时三句差异化请改用下方「修订版」，勿再把「自动写交接」当成唯一卖点。详见 `/workspace/baton-competitor-watch-2026-10-31.md`。

> **发帖闸门**：D5 前真实接力成功 ≥3 次，否则推迟（见 DECISIONS）  
> 发帖时机：美西周二/三上午 ≈ 北京时间晚上 11 点后；发后 4 小时内在线回评  
> 规则自查：https://news.ycombinator.com/showhn.html —— 必须能直接试用、尽量免注册、不能只丢落地页、不能刷票

---

## 建议标题（三选一，发前再定）

1. `Show HN: Baton – auto-handoff from Claude Code to Codex when you hit the limit`
2. `Show HN: Baton – at 85% quota, write a handoff and `baton go codex``
3. `Show HN: agent-baton – keep coding in Codex when Claude Code rate-limits you`

推荐 **1**（痛点句最直）。

---

## 正文（英文，可直接贴）

Hi HN —

I'm building **Baton** (`npx agent-baton` → CLI command `baton`).

**Problem.** I run Claude Code and Codex side by side. When the 5-hour Claude window fills up, I either wait, upgrade, or paste context into another CLI and lose the thread. Ask HN threads (and my own nights) keep hitting the same wall: switching harnesses without losing the *task*.

**What Baton does (MVP, local-only):**

1. Reads Claude Code rate limits from the official statusline JSON — **both the 5-hour window and the weekly cap** (`used_percentage` / `resets_at`).
2. At ~85% on **either** the 5h or the 7-day bar (or on a hard rate-limit error), a Stop/PreCompact hook asks the *current* agent to write a structured `HANDOFF.md` into the repo (Goal / Done / Decisions / Rejected / Files / Next / Open questions) — not a raw chat dump.
3. `baton go codex` (or `claude` / `cursor`) composes that handoff + `git diff --stat` into the first prompt and launches the target CLI.

Try: `npx agent-baton init` then `baton status` / `baton go codex`  
Repo: *(public URL TBD — 梦梦连好 GitHub 后填)*  
Demo GIF: *(README 首屏 30s 真终端)*

### How this is different (the only three lines that matter) — 修订版

1. **Cross-vendor, now** — `baton go codex` (or Kimi/Qwen later) keeps you coding in *another* CLI instead of sleeping until reset (unlike same-CLI resume tools).
2. **Handoff lives in the repo as readable markdown** you can audit; we don't ship raw transcripts to a cloud memory product.
3. **Windows is a first-class path**, and we watch **weekly + 5h** limits (platform rules just shifted toward weekly caps).

*(Note: auto-writing HANDOFF near the limit is no longer unique — say so honestly if asked.)*

### What Baton does *not* do

- Does **not** raise your limits, rotate accounts, or scrape private APIs / OAuth tokens.
- Does **not** upload your code or chats (license check is the only optional outbound; `BATON_OFFLINE=1` supported).
- Does **not** replace Skillsync-style long-term session search or Agent Archive-style cloud backup — different job.
- v0.1 happy path is **Claude Code → Codex** only; Cursor is clipboard-assist; no tray app yet.

### Honest ask

If you've hit the limit mid-task: does a structured `HANDOFF.md` + one command beat copy-paste for you? Which target do you switch to most (Codex / Cursor / something else)?

Happy to take critical feedback — especially “this is just `skl continue` with extra steps.”

---

## 中文对照（V2EX / 即刻可改短）

Claude Code 五小时额度见底时，我要么干等，要么升配，要么把上下文糊进 Codex——任务线程常断。

**Baton**：额度到约 85% 时，用官方 hooks 让当前 agent 在仓库里写好结构化 `HANDOFF.md`，再 `baton go codex` 一条命令接着干。本地运行；不提高额度、不轮换账号、不碰 OAuth。

和「额度看板」的差别：看板只提醒；我们做提醒之后那一步。和「会话续写」类工具的差别：撞线前自动写单 + 仓库内可审 markdown + Windows 同级支持。

安装：`npx agent-baton init`（公开仓链接待补）

---

## 发帖检查清单

- [ ] 标题无夸张词；正文有「我是作者」
- [ ] 可 `npx` 试用；GIF 或 asciinema 在 README
- [ ] 「不做什么」已写；合规一句已写
- [ ] D5 闸门已过（真实接力 ≥3）
- [ ] 三句差异化未改成功能清单
- [ ] 仓库 / npm 链接已替换 TBD
- [ ] 发后闹钟：+30min / +2h / +4h 回评（配合瑶瑶作息建议，非通宵）



---

## 触发策略备忘（2026-10-31 · 对齐阳阳 D5）

平台规则本周起更偏向「周额度」：触发阈值必须同时盯 **5h + 7d**，任一 ≥85% 即写 HANDOFF；文案勿只写「五小时见底」。
