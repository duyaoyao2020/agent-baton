# NUC 真机验收结果 · 2026-10-31 19:21 Asia/Shanghai

机器：mxai-NUC11 · Claude Code 2.1.119 · Codex 0.136.0 · Node 24.14 · `agent-baton` 0.1.0（npm link）

## scripts/nuc-acceptance.sh
**PASS=9 FAIL=0 EXIT=0**

含：fixtures、init、doctor、status --fixture rate85、go codex --print（非空）、remove、doctor 未安装、脏配置拒绝、remove --force。

## 额外核对（跨厂商 / 双触发）
| 项 | 结果 |
|---|---|
| 5h 85% fixture | 提示「快到线了（5h 85%）」 |
| 7d 87% / 5h 20% fixture | 提示「快到线了（7d 87%）」+ Weekly window 文案劝换厂商 |
| rate100 | 指向已有 HANDOFF + `baton go codex` |
| `baton handoff` + `go codex --print` | 提示词含 Rules + 完整 HANDOFF + git；目标 Codex |
| Codex hooks.json | 本机不存在（可选跳过）——不影响 `go codex` |
| remove 后 settings | 无 baton/statusLine 残留，JSON 合法 |

## 未测（需真额度）
- 真实 Claude 会话 statusline → Stop hook → agentFill
- 真 spawn `baton go codex`（无 --print）让 Codex 接话

## 环境收尾
验收结束时已 `baton remove`，`~/.claude/settings.json` 已恢复为用户原配置键集。
代码副本：`/home/mxai/baton`（NUC）；源：`/workspace/baton`（box）。
