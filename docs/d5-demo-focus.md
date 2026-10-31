# D5 演示与联调焦点（阳阳 ← 可可实扫）

## 改什么
| 旧强调 | 新强调 |
|---|---|
| 85%/90% 自动写交接单 | **跨厂商** `baton go codex`（Claude→Codex） |
| 和看板类比「我们也会提醒」 | 和 agent-limit-retry 比：**我们换厂牌，他们等重置** |
| 和 Beacon 比记忆 | Beacon=记忆/技能；我们=撞线瞬间接力 |

## 联调通过线（与指标模板一致）
1. `status --fixture rate85` 可演示触发逻辑（开发）  
2. 真机：写出合格 HANDOFF（含 Rejected / Open questions / schema）  
3. `go codex`（或 `--print` 评审后真 go）让 Codex 1 分钟内接着改  
4. 累计 **真实跨厂商接力 ≥3** → 才进 Show HN 准备  
5. Windows：对标跑完 agent-limit-retry + Beacon MSI 后，再录 Baton 一条

## NUC 脚本
`scripts/nuc-acceptance.sh` 已含 `go codex --print`；MVP_STATUS 出现后优先看该步是否非空且含交接要点。
