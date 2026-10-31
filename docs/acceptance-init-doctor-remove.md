# 验收标准：init / doctor / remove

> 阳阳认领 · 2026-10-31 · MVP（Claude→Codex）

## `baton init`

| # | 给定 | 期望 |
|---|---|---|
| I1 | 已装 Claude Code ≥ 支持 `rate_limits` 的版本，且无 baton hooks | 写入 hooks/statusline 助手；打印备份路径；exit 0 |
| I2 | Claude 版本过旧或不存在 | 明确提示升级/安装；**不写**损坏配置；exit ≠ 0 |
| I3 | 已 init 过一次，再跑 init | 幂等：不叠两份 hook；可提示 already installed |
| I4 | 用户已有自定义 hooks | 合并或插入 baton 段前先备份；不删用户其它 hook |
| I5 | 备份目录 | `~/.baton/backup/<iso-ts>/` 含原配置副本 + `manifest.json`（paths、sha256、baton_version、cli 探测结果） |

## `baton doctor`

| # | 给定 | 期望 |
|---|---|---|
| D1 | 正常安装 | 报告：claude/codex 路径与版本、hooks 在位、HANDOFF 模板可读、backup manifest 存在；exit 0 |
| D2 | hooks 被手动删掉 | 非 0；指出缺失项与修复建议（`baton init`） |
| D3 | PATH 找不到 claude 或 codex | 非 0；分平台提示（Linux/`where.exe`） |
| D4 | `BATON_FIXTURE=...` 或 `--fixture` | 仍能跑通 status 相关检查 |

## `baton remove`

| # | 给定 | 期望 |
|---|---|---|
| R1 | init 后配置未被用户改 | 恢复备份；hooks 中无 baton；doctor 报未安装；exit 0 |
| R2 | 用户改过 hooks（hash ≠ manifest 记录的 post-init hash） | 打印 unified diff；**默认拒绝覆盖**；exit ≠ 0 |
| R3 | R2 + `--force` | 恢复备份并警告；exit 0 |
| R4 | 默认 | 保留 `~/.baton/history/`；不删除仓库内 `HANDOFF.md` |
| R5 | `--purge-history` | 才删除 history |
| R6 | 从未 init | 友好提示 nothing to remove；exit 0 |

## 手工联调（NUC Linux）

1. 空项目：`init` → `doctor` → `status --fixture fixtures/rate85.json` → 触发/模拟写 HANDOFF → `go codex --print` → `remove` → `doctor`。
2. 再 `init`，手改 hooks 一字段 → `remove` 应失败 → `remove --force` 成功。
