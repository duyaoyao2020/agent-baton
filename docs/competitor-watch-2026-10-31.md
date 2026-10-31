# Baton 本周竞品与舆情扫描（2026-10-31）

> 给曦曦 / 阳阳直接用。所有数字都是本次（2026-10-31 19:00 前后，Asia/Shanghai）用 GitHub API、npm API、HN Algolia API、X API 或官网实时读到的；查不到写「未找到」，没把握写「待核实」。star 数会天天变，引用时注明「截至 10-31」。
> 时间已换成 Asia/Shanghai（UTC+8）。

## 0. 一句话结论（先看这里）

1. **最大威胁：agent-limit-retry（就是 HN 49831380 那个 $29 工具）已经做了「90% 自动写 HANDOFF.md」**，免费 MIT 版就有，写明支持 Windows 桌面通知，还有中文 README。Baton「85% 自动交接」**单靠这一点已经不算差异**。Baton 剩下的缝是：**跨厂商接力（Claude→Codex→国产 CLI）一条命令**，再加上 Windows 实测和中文体验。另外它 npm 周下载只有 14，**说明这个需求还没人跑通分发**。
2. **Beacon 火了**：$5.5M 种子轮，发布推 1,566 赞 / 62.8 万曝光，GitHub 2,967 star，**已经出 Windows MSI**，几乎天天发版。它做的是「记忆/技能」，不是「撞线交接」，但「换工具不用重讲」这句话术已经被它占了。
3. **平台规则本周大变**：Anthropic 10-30 改了套餐名（Max 5x→Max，Max 20x→Ultra），**官网写 Ultra「No 5-hour limit（限已验证账户）」**，但周额度只有 10x；OpenAI 先宣布 $200 档从 20x 降到 10x（10-30 生效），10-29 又宣布 Pro 各档额度翻倍。→ 重度用户撞「5 小时线」会变少，**撞「周额度」会变成主要痛点**。Baton 文案要从「5 小时」改成「周额度 + 5 小时」。
4. **跨 CLI 接力的新玩家**：T3 Code（同一个对话线程里切换 Claude/Codex）、agentlog、Memmy、Sesori、runmarq 都在 X 上推「撞线后接着干」。赛道越来越挤，**Baton 的胜负手只能是「自动 + 跨厂商 + Windows/中文」**。

---

## A. 竞品逐个跟踪

> 「对比 Baton」那一栏对照的是 Baton 的定位：**85% 自动让 agent 写交接单 + 一条命令在另一家 CLI 接着干**。

### 总表

| # | 竞品 | 最近更新（Asia/Shanghai） | 定价 | Windows | 一句话对比 Baton |
|---|---|---|---|---|---|
| 1 | Skillsync (`skl`) / 开源核心 txcript | txcript 最近提交 10-23；最新 release v0.14.4（09-14） | 开源 $0；**Pro $20/席/月**（年付省 17%）；Team 面议 | txcript 有 Windows 二进制；**`skl plugin` 文档写「Not on Windows yet」**；桌面 app 只有 macOS | 撞线**之后**手动 `skl continue`，不看额度；Baton 是撞线**之前**自动交接 |
| 2 | Agent Archive | 最近 push 10-29；release v0.2.2（10-20） | 开源免费 | **没有 Windows**（README：release 只有 macOS + Linux） | 做备份/归档 + 手动 handoff；这周在忙 Muse 导入，**没往额度触发方向走** |
| 3 | Peras | **v0.5.0（10-30 21:23）**：新增「烧速线」、烧速时不让开新 subagent | CLI MIT 免费；**签名 macOS app €4.99 一次买断**（不变） | CLI 跑在 Node 上；菜单栏 app 只有 macOS 13+；**Windows 没写明，待核实** | 只「暂停/提醒」，**不交接**；是 Baton 前半段（读额度）的强对手 |
| 4 | Pacer (EricAndrechek) | release v0.7.7（10-21）；最近 push 10-30 | 免费开源 | **只有 macOS 15+**（release 只有 .dmg） | 只做配速；v0.7.x 给 subagent 加了 `pacer gate/wait` 「撞线前暂停、重置后再跑」，**不跨厂商** |
| 4b | 另一个同名 Pacer（dkremsa/claude-pacer，HN 50001750） | release v2.2.0（10-16）；push 10-25 | 免费 | 只有 macOS 13+ | 多账号/多 agent 看板，不交接 |
| 5 | agent-limit-retry（autorunfun，HN 49831380） | GitHub v0.4.3（09-25）；npm 最新还是 0.4.2；**一个月没更新** | 免费 MIT；**Pro $29 一次买断**（走 creem.io，14 天内全额退款） | **支持**：0.4.2 修了 Windows 路径问题，桌面通知写了 Windows | **最像 Baton**：90% 写 HANDOFF.md，`SessionStart` 自动接上。但只在同一个 Claude Code 里续跑，**不会切到 Codex**（Codex 只做额度监控、Pro 版的 subagent 恢复） |
| 6 | Beacon (agent-beacon) | **v1.3.51（10-31 08:11）**，几乎天天发版 | 开源免费 + 企业版（价格未找到） | **支持**：x64 MSI + zip | 「记忆/技能蒸馏」，不读额度、不在撞线时交接；但融资和声量最大，话术「换工具不用重讲」重叠 |
| 7a | ccusage | **v20.0.46（10-31 05:18）**，大约每 2–4 天一版 | 免费开源 | 跨平台（npx/bunx） | 只统计用量，支持 18 种 CLI（含 Kimi/Qwen/ZCode）；**Baton 读国产 CLI 用量可以直接参考它** |
| 7b | claude-pace | v0.9.5（09-25）；仓库 updated 10-30 | 免费 | 要 bash + jq；**Windows 官方没写，待核实** | 只做 Claude 状态栏额度显示 |

### 逐个细节与来源

**1. Skillsync / skl**
- 定价页：开源版 $0（txcript）；Pro $20/席/月，5 天免费试用、不用绑卡；Team 面议。来源：https://skillsync.com/pricing
- 官网首页主打「每次提问前搜所有历史会话」「continue in any agent」；支持的 agent 列了 Claude Code、Codex、Cursor、OpenCode、Amp、pi、Grok、Antigravity、Hermes。按钮只有「download for macOS」。来源：https://skillsync.com/
- CLI 文档：`skl continue` 还在；`skl plugin` 那一节写「Not on Windows yet」。来源：https://skillsync.com/docs/cli-reference
- 开源核心 txcript（「Pandoc for AI chats」）：208 star（截至 10-31），最近提交 10-23（修 Codex 导出顺序、重复 session id），release 有 x86_64-pc-windows-msvc。来源：https://github.com/skillsynchq/txcript
- 背景：Launch HN 68 分 / 62 评。https://news.ycombinator.com/item?id=49743049
- **本周没有重大变化**（定价没看到改动；以前也没记过价格，**$20 是这次新核实的**）。

**2. Agent Archive**
- 仓库 https://github.com/wangjohn/agent-archive ：10 star，最近 push 10-29；最新 release v0.2.2（10-20 07:29），资产只有 darwin/linux 的 amd64/arm64。
- README 原话：「Release binaries cover macOS (Intel and Apple Silicon) and Linux (x86-64 and arm64)」，后台任务用 launchd/systemd。→ **还是没有 Windows**。
- CHANGELOG 里「Unreleased」全是 Muse 会话导入。https://github.com/wangjohn/agent-archive/blob/main/CHANGELOG.md
- Show HN 2 分 0 评。https://news.ycombinator.com/item?id=50168300
- **没有重大变化**，热度很低。

**3. Peras**
- 官网 https://peras.vertias.eu/ ：`npx peras-cli setup`；免费、MIT、本地运行；签名 macOS app **€4.99 一次买断**（走 Polar），macOS 13+。三种动作：warn / ask / pause；也支持 Codex（通过 Codex 本地 app-server 读额度）。
- 仓库 https://github.com/Vertias3u/Peras ：4 star；**v0.5.0 发布于 10-30 21:23**：烧速线（`peras set 5h rate 15/5m pause`），烧速期间拒绝开新 subagent（Claude `Agent` / Codex `spawn_agent`），新增 subagent 数量线。
- npm peras-cli：最新 0.5.0；**上周（10-23~10-29）下载 84**。https://www.npmjs.com/package/peras-cli
- Show HN 1 分。https://news.ycombinator.com/item?id=50180215
- **有变化（功能更新）**：Peras 正在往「控制 subagent 烧额度」走，没往交接走。

**4. Pacer**
- 注意：**有两个不同的 Pacer**，原方案把它们混在一起了。
  - EricAndrechek/Pacer（Show HN 2026-08，https://news.ycombinator.com/item?id=49376805 ）：11 star，release v0.7.7（10-21），只有 .dmg，README 写「macOS 15+」。v0.7.6/0.7.7 改的是 `pacer gate` / `pacer wait`：subagent 每步前问一次 Pacer，快撞线就暂停，重置后再继续。https://github.com/EricAndrechek/Pacer/releases
  - dkremsa/claude-pacer（Show HN 10 分 8 评，https://news.ycombinator.com/item?id=50001750 ）：13 star，v2.2.0（10-16），macOS 13+，多账号多 agent（Claude Code/Codex/Cursor/Antigravity）。https://github.com/dkremsa/claude-pacer
- Pacer README 里的对比表还提到 **Token Pacer**（https://tokenpacer.app ，**$29 一次买断**、闭源、macOS、覆盖 Claude/Codex/opencode，主打「Best Next Action：继续/换 agent/等重置」）。→ **新发现的付费竞品**，它在提示「该换 agent 了」，但不帮你交接。
- **没有重大变化**。

**5. agent-limit-retry（autorunfun 的 $29 工具，HN 49831380）**
- 49831380 是一条**评论**，挂在 Show HN「Resume Claude Code subagents killed by a usage limit」下面（2 分，1 条评论）：https://news.ycombinator.com/item?id=49831324
- 仓库 https://github.com/error0702/agent-limit-retry ：1 star，MIT，v0.4.3（09-25 17:00）。官网 https://retry.autorun.fun ：「Get Pro for $29」「One-time payment, full refund within 14 days」，支持 Claude Code、Codex、ZCode。
- 功能（README 原文要点）：status line 读额度 → **90% 时让 agent 写 HANDOFF.md**（目标/已完成/进行中/下一步/坑）→ Stop 钩子提醒一次 → `SessionStart` 新会话自动指向交接单 → 撞线时记录精确重置时间并发桌面通知（macOS/Linux/Windows）→ `alr run` 让无头任务睡到重置后自动 resume。Pro 版负责按 id 唤醒被杀的 subagent。
- 官网新数据：作者 5 个会话里 476 个 subagent 被限额切断，449 个之后没人再管（以前的说法是 6 个会话 449 个）。
- npm 周下载：**14**（10-23~10-29）。https://www.npmjs.com/package/agent-limit-retry
- 有中文 README（README.zh-CN.md）。
- **对 Baton 最关键**：「撞线前自动交接」已经有人免费做了。差别在于它是「同一个 CLI 里等重置再续」，Baton 是「马上换另一家接着干」。

**6. Beacon / agent-beacon**
- 仓库 https://github.com/Asymptote-Labs/agent-beacon ：**2,967 star、264 fork**（截至 10-31），v1.3.51（10-31 08:11），v1.3.49–51 两天发了 3 版。官网 https://beacon.sh
- README 有 macOS / Linux / **Windows（x64 MSI）** 三种安装方式；latest release 里确实有 `BeaconEndpointAgent-1.3.51-x64.msi`。
- X 发布推（@jqdsouza，10-20）：**$5.5M 种子轮**，1,566 赞、324 回复、628,232 曝光。https://x.com/jqdsouza/status/2112552451547001218
- 转发推「Claude Code hits the limit > switch to Codex > spend 20 mins explaining my project again… one command and the next agent picks up」：29 赞 / 27 回复。https://x.com/shiri_shh/status/2112572480129032450
- HN 帖 18 分 14 评。https://news.ycombinator.com/item?id=50182883
- 企业版价格：**未找到**。
- **有重大变化（声量和融资）**：它在营销里直接用了「撞线→换 Codex→重讲 20 分钟」这个场景。

**7. ccusage / claude-pace**
- ccusage https://github.com/ccusage/ccusage ：19,274 star（截至 10-31），v20.0.46（10-31 05:18）；npm 周下载 **212,107**（10-23~10-29）。支持 Claude Code、Codex、OpenCode、Amp、Kimi、Qwen、Gemini CLI、ZCode、Grok Build CLI 等 18 种。https://github.com/ccusage/ccusage/blob/main/apps/ccusage/README.md
- claude-pace https://github.com/Astro-Han/claude-pace ：245 star，v0.9.5（09-25），需要 Claude Code 2.1.80+、jq；npm 周下载 32。
- **没有重大变化**。

### 本次新发现、原表没有的同类工具（建议加进竞品表）

| 工具 | 做什么 | 来源 |
|---|---|---|
| agent-usage-guard | Claude Code mod：拦住 subagent 扇出、大上下文提示、重试循环，防止烧光窗口；88 star | https://github.com/rbartoli/agent-usage-guard ；Show HN 28 分 12 评 https://news.ycombinator.com/item?id=50198936 |
| Fuel Gauge | 让 Claude 知道自己的 5h/周额度，95% 硬停 | https://github.com/LuisPCFialho/claude-fuel-gauge ；https://news.ycombinator.com/item?id=50086277 |
| Token Pacer | $29 闭源 macOS，「该不该换 agent」建议 | https://tokenpacer.app |
| T3 Code | 同一个线程里在 Claude Code/Codex/Cursor 等之间切换，用自己的订阅（X 用户描述，**功能待核实**） | https://x.com/HimanshuRawal05/status/2116019935424184755 |
| agentlog | 本地搜索 Claude Code/Codex/Copilot CLI 会话日志，让接手的 agent 自己去查 | https://x.com/qwerty__cs/status/2115386548325884020 |
| Sesori | 撞线后在重置时自动续跑（Claude Code、Pi） | https://x.com/sesori_ai/status/2115473171549987040 |
| runmarq | 托盘 ETA；新加了「撞线后重置时后台自动续跑」 | https://github.com/arjunpundeer7/runmarq ；https://x.com/arjunpundeer15/status/2114368665605099648 |
| jaynshare | 多账号路由/共享订阅（**有 ToS 风险，Baton 别碰**） | https://github.com/jaynlabs/jaynshare |
| damli40 的开源工具（名字未找到） | 在 HN 49904074 下回复：hooks 边干边存交接，撞线后去另一个 agent 输入「Continue.」 | https://news.ycombinator.com/item?id=49919704 |

---

## B. HN 舆情（近 30 天：2026-10-01 ~ 10-31）

方法：HN Algolia `search?tags=story&numericFilters=created_at_i>2026-10-01`，搜了 13 个关键词（claude code limit / usage limit / codex limit / handoff agent / weekly limit / claude max 等），再逐条读 item 详情。分数和评论数截至 10-31 19:00 左右。

| # | 标题 | 分 | 评 | 日期 | 链接 | 一句话痛点 |
|---|---|---|---|---|---|---|
| 1 | Show HN: agent-usage-guard – a Claude Code mod to protect your usage window | 28 | 12 | 10-23 | https://news.ycombinator.com/item?id=50198936 | 「几分钟就把整个窗口烧光，好几次」→ 想在发送前拦一下 |
| 2 | OpenAI halved the allowance of the $200 plan to 10x | 23 | 9 | 10-01 | https://news.ycombinator.com/item?id=49919026 | 10-30 起 $200 档从 20x 降到 10x；评论说「这是一波潮流」（trae 也砍了） |
| 3 | Open-source, cross-harness memory for AI agents（Beacon） | 18 | 14 | 10-21 | https://news.ycombinator.com/item?id=50182883 | 「每次用完不稳定的额度就换 agent，要重讲任务」；反方：「我用一个 markdown 文件就行」 |
| 4 | OpenAI: We are doubling all usage limits for all Pro 100/200/500 tiers | 16 | 1 | 10-30 | https://news.ycombinator.com/item?id=50292524 | 额度政策朝令夕改（评论：「OpenAI is such a mess」） |
| 5 | Anthropic is renaming their Max plans | 13 | 8 | 10-31 | https://news.ycombinator.com/item?id=50307370 | 「Ultra 顶替 Max 20x，但只给 10x 周额度，是变相降级」；还有人撞了 5h 线后直接改用 API |
| 6 | Claude Agents SDK will no longer use subscription; API credits included in plans | 6 | 6 | 10-08 | https://news.ycombinator.com/item?id=49997654 | `claude -p`/SDK 的计费口径反复变，工作流要重搭 |
| 7 | Ask HN: Kimi Code hit its 5-hour limit after $1.37 of API usage | 10 | 4 | 10-24 | https://news.ycombinator.com/item?id=50222093 | **国产 CLI 也有 5 小时墙**，几分钟烧完 → Baton 的中文/国产 CLI 用户画像成立 |
| 8 | Ask HN: Antrophic tightened usage limits? | 5 | 0 | 10-30 | https://news.ycombinator.com/item?id=50294644 | Max 用户 2 个中等会话就用掉 50% 周额度，在考虑别家 |
| 9 | Tell HN: Claude is using my limits even though it's infra is failing | 4 | 5 | 10-31 | https://news.ycombinator.com/item?id=50313539 | 任务半路失败「没有 resume，只有 retry」，重试烧掉 80% 额度 |
| 10 | Ask HN: Claude gets over my 5h limit today in 10 minutes? | 3 | 3 | 10-24 | https://news.ycombinator.com/item?id=50211479 | 同样的用法 10 分钟就到 30–70% |

**指定复查**

| 帖子 | 现状（10-31） | 要点 |
|---|---|---|
| 49904074 Ask HN: How do you handle hitting AI coding agent usage limits? | 1 分，3 条评论（09-30 11:35） | 楼主要「切换时不丢上下文」；**damli40 已经在下面推了自己的开源交接工具（49919704）**，Baton 回复时要说清楚和它的区别 https://news.ycombinator.com/item?id=49904074 |
| 50182883 Beacon | 18 分，14 评 | 有人反驳「markdown 文件就行」；也有人说「markdown 在多个工具之间会不同步」，这正是 Baton 交接单的卖点 https://news.ycombinator.com/item?id=50182883 |
| 49831380 autorunfun 评论 | 挂在 49831324（2 分，1 评） | 见竞品 #5 https://news.ycombinator.com/item?id=49831380 |
| Agent Archive Show HN | 2 分，0 评 | https://news.ycombinator.com/item?id=50168300 |
| Peras Show HN | 1 分，0 评 | https://news.ycombinator.com/item?id=50180215 |

**HN 解读**：「额度/撞线」类 Show HN 普遍只有 1–28 分。**HN 不是这个品类的主要获客渠道**（最高的 agent-usage-guard 才 28 分）。真正的流量在 X（见 C 节，Beacon 一条推 62 万曝光）。

---

## C. X 舆情（用 x MCP 实时搜的）

**局限**：X API 搜索按相关度排，每次最多 40 条；只看英文/公开帖；点赞数截至 10-31 19:10 左右；不代表全量。

- **量**：`("rate limit" OR "usage limit" OR "weekly limit") (claude OR codex)` 近 7 天共 **1,766 条**；每天大约 214–228 条，**10-29 是 316 条，10-30 是 377 条**（OpenAI 额度翻倍 + Anthropic 改套餐名那两天）。
- **代表帖**

| 帖子 | 互动 | 痛点/信号 |
|---|---|---|
| @jqdsouza Beacon 发布 https://x.com/jqdsouza/status/2112552451547001218 | 1,566 赞 / 324 回复 / 62.8 万曝光 | 「换工具要重讲」这个痛点能引爆 |
| @shiri_shh https://x.com/shiri_shh/status/2112572480129032450 | 29 赞 / 27 回复 / 24 收藏 | 「撞线→换 Codex→花 20 分钟重讲→又撞线→换回去」，**直接是 Baton 的落地页文案** |
| @LDT0545「Codex 用户撞线后换 Claude Code 还是收工？」https://x.com/LDT0545/status/2113269643381289164 | 9 赞 / 27 回复 / 6,012 曝光 | 适合做调研、在楼里回复 |
| @AlexChhk 回复 https://x.com/AlexChhk/status/2113288342184087682 | 1 赞 | 「换过去后前 10 分钟都在重读 repo；**撞线前写个短交接就省了大半**」= Baton 的核心主张，有用户自发说出来 |
| @HimanshuRawal05 https://x.com/HimanshuRawal05/status/2116019935424184755 | 6 赞 / 12 回复 | 以前用 AGENTS.md + 交接文件，现在改用 T3 Code 在同一线程切换 → **竞品信号** |
| @itsdannyyt https://x.com/itsdannyyt/status/2114156744180117965 | 2 赞 / 9 回复 | 「想直接买重置，不想再切到另一个账号」 |
| @ayushjjw https://x.com/ayushjjw/status/2114292914448924731 | 2 赞 | 9 个并行 Claude Code 会话同时撞线、一起停 |
| @LDT0545 https://x.com/LDT0545/status/2116319993050861660 | 2 赞 | 「差点砍 Codex Pro 200 额度，结果全部翻倍」 |

- **建议 X 监控关键词**：`"hit the limit" "switch to codex"`、`"re-explaining" claude codex`、`"weekly limit" claude`、`"handoff" AGENTS.md`、`Ultra "5-hour"`。中文渠道（即刻/小红书）这次**没查**，X API 覆盖不到。

---

## D. Baton 本周行动建议（5 条）

1. **改定位文案，别再把「85% 自动交接」当唯一卖点**：agent-limit-retry 免费版已经做了 90% 交接。主文案改成「**撞线 → 一条命令换到 Codex/Kimi/Qwen 接着干（Windows 也行）**」。对比表里明确写：它是「同一个 CLI 里等重置」，Baton 是「马上换一家」。
2. **把「周额度」加进触发条件**：Ultra 官方说取消 5 小时限制（限已验证账户），OpenAI 又把 Pro 翻倍，重度用户以后更多是撞周线。`baton` 要同时监控 `seven_day`，周额度快到线时提示「切到另一家」。落地页加一句「周额度剩 X% 时就交接」。
3. **抢 Windows + 中文 + 国产 CLI**：本周核实下来，Agent Archive、两个 Pacer、Peras app、Skillsync plugin 都没有 Windows；Beacon 和 agent-limit-retry 有。**请阳阳本周在 Windows 上实测 agent-limit-retry 和 Beacon**，作为 Baton 的对标基线。Kimi Code 的 5 小时墙帖（50222093）可以当中文用户场景的证据。读国产 CLI 用量参考 ccusage 的实现。
4. **获客渠道以 X 为主**：HN 同类帖最高 28 分；X 上 @shiri_shh / @LDT0545 那类「撞线了你怎么办」的帖有 27 条回复。D7 发 Show HN 照旧，但**主力是在 X 上发 30 秒 GIF（撞线→baton→Codex 接着干）**，并在 @LDT0545 那类讨论下真诚回复（注明作者身份，不刷屏）。
5. **回复 49904074 前先装 damli40 的工具和 agent-limit-retry 跑一遍**，回复里写清三点差异：不调云端模型、跨厂商、支持 Windows。**不要碰多账号轮换**（jaynshare 那类），在 README 写明「不轮换账号、不绕过额度」，和 agent-limit-retry 一样，拿来建立信任。

---

## E. 每日指标表模板（阳阳要的）

建议放在 Google Sheet 或 `baton-metrics.csv`，每天 22:00（Asia/Shanghai）填一次。

| 日期 | GitHub star（累计） | 新增 star | npm 周下载* | 安装数（`baton init` 匿名计数，可选、需用户同意） | 落地页 UV | 邮件/等待名单 | 付费数（当日） | 累计 MRR ($) | X 曝光 | X 互动 | HN 分/评 | 即刻/小红书互动 | 用户反馈/bug 数 | 备注（发了什么） |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-01 | | | | | | | | | | | | | | |

\* npm 周下载接口：`https://api.npmjs.org/downloads/point/last-week/<包名>`；star：`https://api.github.com/repos/<owner>/<repo>`（`stargazers_count`）。

**竞品对照行（每周一更新一次，基线是本次读数）**

| 竞品 | star（10-31） | npm 周下载（10-23~29） |
|---|---|---|
| ccusage | 19,274 | 212,107 |
| agent-beacon | 2,967 | 不适用（MSI/包管理器） |
| claude-pace | 245 | 32 |
| txcript (Skillsync) | 208 | 未查 |
| agent-usage-guard | 88 | 未查 |
| dkremsa/claude-pacer | 13 | — |
| EricAndrechek/Pacer | 11 | — |
| Agent Archive | 10 | — |
| Peras | 4 | 84 |
| agent-limit-retry | 1 | 14 |

**验证闸门建议**（沿用原方案）：14 天内 star ≥ 100、或者等待名单 ≥ 50、或者 ≥ 3 个人主动问价，三个满足任何一个就继续；都不满足就按原方案第 8 节转向。

---

生成时间：2026-10-31 19:15（Asia/Shanghai）

## 数据来源清单

- 竞品官网：https://skillsync.com/ ｜ https://skillsync.com/pricing ｜ https://skillsync.com/docs/cli-reference ｜ https://peras.vertias.eu/ ｜ https://retry.autorun.fun ｜ https://tokenpacer.app ｜ https://beacon.sh
- GitHub：https://github.com/skillsynchq/txcript ｜ https://github.com/wangjohn/agent-archive ｜ https://github.com/Vertias3u/Peras ｜ https://github.com/EricAndrechek/Pacer ｜ https://github.com/dkremsa/claude-pacer ｜ https://github.com/error0702/agent-limit-retry ｜ https://github.com/Asymptote-Labs/agent-beacon ｜ https://github.com/ccusage/ccusage ｜ https://github.com/Astro-Han/claude-pace ｜ https://github.com/rbartoli/agent-usage-guard ｜ https://github.com/LuisPCFialho/claude-fuel-gauge ｜ https://github.com/arjunpundeer7/runmarq ｜ https://github.com/jaynlabs/jaynshare （数据来自 api.github.com 的 repos / releases / commits 接口）
- npm：https://api.npmjs.org/downloads/point/last-week/{peras-cli,agent-limit-retry,ccusage,claude-pace} ｜ https://registry.npmjs.org/
- 官方定价：https://claude.com/pricing （Max $100、Ultra $200、「No 5-hour limit for verified accounts」）
- HN（Algolia API https://hn.algolia.com/api/v1/ ）：49904074、49919704、50182883、49831380、49831324、50168300、50180215、50001750、49376805、49743049、50198936、49919026、50292524、50307370、50308221、49997654、50222093、50294644、50313539、50211479、50086277（链接都是 https://news.ycombinator.com/item?id=<id>）
- X（x MCP，search_posts_all / get_posts_counts_recent / get_posts_by_ids）：上文 C 节列出的各条 x.com 链接
