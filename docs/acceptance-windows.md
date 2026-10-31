# Windows 真机验收清单（待梦梦接通 Win 桌面）

> 阳阳 · 2026-10-31（按可可竞品实扫修订）  
> 代码双支持；本清单不阻塞 Linux GIF。  
> **演示重点（D5）**：跨厂商 `baton go codex`，不是「会不会自动写单」（agent-limit-retry 已有 90% 写 HANDOFF）。

## 0. 对标基线（本周 Windows 必测两项）

测 Baton 前/后各记一行，填进 `docs/windows-baseline-log.md`（首次跑时创建）。

### 0.1 agent-limit-retry（同 CLI 续跑对照）
- 仓库：https://github.com/error0702/agent-limit-retry  
- 官网：https://retry.autorun.fun  
- 关注点：
  - [ ] `npx`/`npm i -g` 在 Win 是否顺利（其 0.4.2 曾修 Win 路径）
  - [ ] 90% 是否写出 HANDOFF.md；桌面通知是否弹出
  - [ ] **确认不会** `go` 到 Codex（预期：只同 Claude 等重置 / SessionStart 续）
  - [ ] 与 Baton 并装时 hooks 是否互相踩脚（记冲突表现）
- 对标结论句（填空）：Baton 多出来的是 ________（应为「一条命令跨到 Codex」）。

### 0.2 Beacon Windows MSI
- 仓库/发布：https://github.com/Asymptote-Labs/agent-beacon（资产名类似 `BeaconEndpointAgent-*-x64.msi`）
- 关注点：
  - [ ] MSI 能否静默/正常装完；托盘/服务是否起来
  - [ ] 它解决的是记忆/技能，**不是**额度触发交接——演示话术不要撞车
  - [ ] 若同机装 Baton：是否抢终端/权限；卸载是否干净
- 对标结论句：Beacon = 记忆层；Baton = 撞线瞬间跨厂商接力。

## 1. 环境预备
- [ ] Windows 10/11，Node 20+，Git for Windows
- [ ] Claude Code（含 statusline rate_limits）+ Codex CLI，`where claude` / `where codex` 有结果
- [ ] PowerShell 与 cmd 至少各一轮
- [ ] 执行策略：`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` 或 `cmd /c npx ...`

## 2. Baton 安装与快乐路径（演示核）
- [ ] `npx agent-baton init`（或本地 bin）；备份在 `%USERPROFILE%\.baton\backup\<ts>\`
- [ ] `baton doctor` 路径正确
- [ ] `baton status --fixture` 用仓库 `fixtures\rate85.json`
- [ ] **`baton go codex --print`** 输出含 HANDOFF 要点 + 将启动的 codex 命令（**录像主镜头**）
- [ ] （可选）真 `baton go codex` 一次，Codex 首轮能复述任务
- [ ] hooks 为 **node** 脚本，非 bash
- [ ] `baton redact --check` 对密钥样例失败

## 3. remove
- [ ] 干净：`remove` → doctor 未安装
- [ ] 脏配置：无 `--force` 拒绝；`--force` 成功

## 4. D5 闸门对齐（联调定义）
指标模板：`真实接力成功` = 撞线或 ≥85% → 合格 HANDOFF → **另一家 CLI** 1 分钟内能接着改。  
- [ ] Linux（NUC）累计 ≥3 次跨厂商成功，才准备 Show HN  
- [ ] Windows 至少 **1** 次 `go codex --print` 或真 go 录像（差异化素材）  
- [ ] 话术禁止主打「我们会自动写 HANDOFF」（竞品已有）；主打 **Claude 撞线 → 一条命令 Codex 接着干**  
- [ ] 文案同时提 **周额度 + 5 小时**（Anthropic/OpenAI 套餐变动，见竞品扫描 §0.3）

## 5. 未接通 Win 前
- CI `windows-latest`：path / redact / fixture 解析 unit  
- 不宣称「已在 Windows 真机验证」直到 §0–§3 勾完
