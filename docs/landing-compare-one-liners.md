# 落地页对比文案（提醒 vs 自动交接）

> 2026-10-31 · 可可 · 配合昕昕：首屏真终端 GIF + slogan + `npx`；**本表放第二屏**，禁渐变 AI 广告风  
> 副标可用昕昕句：**额度撞线，无损接力**（并诚实加半句：不搬原始对话，只搬结构化交接）

---

## 主推一行（第二屏表头下的那句）

**EN:** Quotas tools warn you. Baton writes the handoff and hands the baton over.  
**ZH:** 额度工具负责提醒；Baton 负责写好交接单，并把接力棒递出去。

备用更短：  
**EN:** Reminder → still stuck. Baton → `baton go codex`.  
**ZH:** 光提醒解决不了撞线；Baton 让你一条命令换 CLI 接着写。

---

## 对比表（可直接进落地页）

|  | 额度看板（Pacer / Peras / ccusage…） | 会话续写 / 备份（Skillsync / Agent Archive…） | **Baton** |
|---|---|---|---|
| 核心动作 | 告诉你快没了 / 该减速 | 事后挑会话、`continue`、云备份 | **≥85% 自动写 `HANDOFF.md` → `baton go <cli>`** |
| 时机 | 提醒时你还要自己决定下一步 | 多在撞线后手动触发 | **撞线前自动准备** |
| 交接物 | 无（或让 agent「自己控速」） | 会话记录 / 备份包 | **仓库内可审的结构化 markdown** |
| Windows | 菜单栏类多为 macOS | 视产品 | **CLI 跨平台，Windows 一等公民** |
| 云 / 隐私 | 多为本地 | 部分含云同步 | **默认全本地；不上传对话** |
| 一句话定位 | Reminder | Continue / archive | **Auto handoff at the limit** |

表下脚注一行：  
*We don't claim lossless chat transfer. We claim the goal, decisions, and next steps survive.*  
*我们不承诺原始对话无损；我们承诺目标、关键决定与下一步还在。*

---

## 首屏 slogan 候选（与对比表配套）

1. Hit your Claude Code limit? `baton go codex` — keep working, nothing critical lost.  
2. 额度见底？一条命令，换 Codex 接着写。  
3. （昕昕副标）额度撞线，无损接力。

CTA 旁小字：`npx agent-baton init` · MIT 核心开源 · 与 Anthropic / OpenAI 无关

---

## 「为什么不是 X」三句（FAQ / 评论可复制）

- **vs Peras/Pacer：** They show the bar; we run the handoff when the bar turns red.  
- **vs Skillsync `skl continue`：** We auto-write a repo-local handoff at 85% before you're locked out; we're not a session search product.  
- **vs $29 resume-subagents：** That tool resumes subagents after a kill; we cross *vendors* (Claude Code → Codex). Both can coexist.


---

## 2026-10-31 修订（竞品扫描后）

主推一行改为强调**跨厂商立刻接着干**，不要只说自动写单：

**EN:** Quota tools warn. Same-CLI tools wait for reset. Baton hands you to Codex (or another CLI) with a repo-local handoff — now.  
**ZH:** 看板只提醒；同 CLI 工具多半等重置；Baton 带着仓库里的交接单，**马上换到 Codex（或别的 CLI）接着干**。

对比表请加一行「跨厂商」：agent-limit-retry = 同 CLI 等重置；Baton = `baton go <other>`。


## 触发文案（周额度 + 5h · 对齐阳阳）

| 场景 | EN | ZH |
|---|---|---|
| 触发条件 | Watches **5-hour and weekly** bars; ~85% on either writes `HANDOFF.md` | 同时盯 **5 小时与周额度**；任一到约 85% 就写交接单 |
| 痛点句 | Hit a weekly cap (not just the 5h window)? Hand off before you're locked out. | 不只是五小时窗——**周额度**撞线前也能交接 |
| FAQ | Why weekly? Provider plans just shifted; weekly limits are the new wall for heavy users. | 套餐规则在变，重度用户更常撞的是周额度 |

首屏可加小字：`5h + weekly · local-only`
