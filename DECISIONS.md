# Baton 已拍板决策（2026-10-31）

## 梦梦定名
- 产品名：**Baton**（坚持）
- npm：`agent-baton`
- CLI 命令：`baton`
- 公开 GitHub：等 Cursor 连好 GitHub 再建；此前只本地开发

## 曦曦拍板（吸收队友建议）
- **A. MVP 快乐路径：只保 Claude Code → `baton go codex`。** Cursor 仅 `--print`/剪贴板 stub；`auto`/`watch`/国产 CLI → Pro/v0.2
- **B. 演示：代码 Windows+Linux 双支持；首条 GIF 先在 Linux（本机 box / 真机）录通，Windows 真机由阳阳尽快补一条。** 差异化仍打 Windows，但不阻塞 D2 演示
- **C. 包名：`agent-baton`（已定）**

## 吸收的硬需求（写进 MVP）
- init 检测 Claude Code 版本（statusline rate_limits 所需），不够则提示升级
- HANDOFF 含 Rejected / Open questions；frontmatter schema；密钥过滤默认开
- `baton go --print` / dry-run；`status --fixture` 便于演示
- remove + doctor 一等公民；文案冷静不恐吓
- README 首屏三句差异：①85% 自动写交接 ②仓库内可读 HANDOFF ③Windows；诚实「不做什么」「结构化有损」
- D5 前真实撞线接力 <3 次则推迟 Show HN

## 获客节奏（瑶瑶）
- 一天一主战场；Show HN 当晚两轮闹钟守评，不硬通宵
- 本周必交：init/status/handoff/go + 30s GIF + README；落地页/爱发电/多平台草稿可顺延

## 阳阳认领（2026-10-31）
- 文档：`docs/acceptance-init-doctor-remove.md`、`docs/redaction-test-cases.md`、`docs/dry-run-and-fixtures.md`
- Fixture：`fixtures/rate20.json` / `rate85.json` / `rate100.json`
- 样例：`testdata/redaction/`
- Windows 真机：待梦梦提供/接通 Windows 桌面后再实测；此前先 Linux（NUC）+ CI windows-latest unit

## 环境（阳阳 2026-10-31）
- 联调主战场：**NUC**（Claude 2.1.119 + Codex 0.136）；Mac mini 作对照
- **Grok Bot box 只写代码，不做真撞线联调**（无用户登录态）
- hooks/statusline：**必须用 Node 脚本**，禁止 bash 一行；`os.homedir()`+`path`；spawn 不用 `shell:true`
- remove：backup+manifest(hash)；用户改过则 diff 拒绝盲盖（可 `--force`）；默认留 history；不删仓库 HANDOFF.md
- Windows：暂无真机；验收清单先写，机器由梦梦指定后再测
- 开发用 `status --fixture`；录 GIF 再真撞一次

## 进度
- 2026-10-31 19:11:19：原 Claude Code -p 会话无文件产出已终止；改由执行器写 src。

## 叙事修订（可可竞品周扫 2026-10-31）
来源：`docs/competitor-watch-2026-10-31.md`

**旧三句差异（作废为唯一卖点）**：①85% 自动写交接 ②仓库 HANDOFF ③Windows  
说明：agent-limit-retry 免费版已在 ~90% 自动写 HANDOFF + Windows + 中文；「自动写单」单点不再是差异。

**新胜负手 / README·Show HN 首屏三句：**
1. **跨厂商立刻接着干**：`baton go codex`（同 CLI 等重置 ≠ 马上换一家）
2. **仓库内可读 HANDOFF.md**（非云记忆/非原始对话；正面承认结构化有损）
3. **Windows + 中文 + 盯周额度（7d）与 5h**（平台规则本周偏向周额度）

**主推一行（落地页）：**  
EN: Quota tools warn. Same-CLI tools wait for reset. Baton hands you to Codex with a repo-local handoff — now.  
ZH: 看板只提醒；同 CLI 工具多半等重置；Baton 带着仓库里的交接单，马上换到 Codex（或别的 CLI）接着干。

**获客：** 本周舆情优先 X，其次 HN；Beacon 话术重叠但产品是记忆不是额度交接——评论里要划清。

## 视觉（昕昕）
- Logo 三版草图：`docs/logo/`（v1-double-chevron、v2-prompt-pass、v3-wordmark）；花瓣参考待梦梦定方向后再精修。

## D5 演示焦点（2026-10-31 · 吸收可可实扫）
- 主卖点改为 **跨厂商 `baton go`**，不以「自动写 HANDOFF」为差异（agent-limit-retry 已有）。
- Windows 对标基线：先测 agent-limit-retry + Beacon MSI，再测 Baton（见 `docs/acceptance-windows.md` §0）。
- 真实接力 = 跨到另一家 CLI；≥3 次才准备 Show HN。

## 演示
- 2026-10-31：NUC 录制 docs/demo.gif（fixture→handoff→go --print）PASS；真 spawn/真撞线未做。
