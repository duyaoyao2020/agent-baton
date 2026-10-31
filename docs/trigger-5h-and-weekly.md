# 触发口径：5 小时 + 周额度

> 2026-10-31 · 对齐阳阳 D5 / 竞品扫描建议 #2 · 可可

## 产品行为
- `baton status` / hooks 同时读 statusline 里的 **five_hour** 与 **seven_day**（字段名以 Claude Code 实际 JSON 为准）。
- **任一** `used_percentage` ≥ 85% → 下一 Stop/PreCompact 写 `HANDOFF.md`。
- 硬性 rate_limit 错误（含周额度耗尽）→ 立即补写。
- 交接单 frontmatter 必须带：`quota_at_5h`、`quota_at_7d`、`triggered_by`（`5h` | `7d` | `hard_limit`）。

## 文案
- 中文：「五小时或周额度见底前，自动写好交接，一条命令换 CLI。」
- 英文："Before a 5h *or weekly* lockout — handoff, then `baton go`."
- 禁止只说「五小时」而不提周额度（套餐规则 2026-10 末已偏向周帽）。

## 演示（D5）
真实接力成功 = 触发后 **跨到另一家 CLI**（默认 Codex）能接着改；同 CLI 等重置不算进 ≥3 闸门。
