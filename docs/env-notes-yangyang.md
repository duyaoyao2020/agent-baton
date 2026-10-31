# Baton 本机/环境侧结论（阳阳 → 曦曦，抄可可/Xi）

> 2026-10-31 实测只读：NUC11 + Mac mini 已装 Claude Code / Codex；**当前无 Windows 机器可连**，Windows 节为经验清单，待有 Win 再补实测。  
> 梦梦已拍板：产品名 **Baton**，npm/包名 **`agent-baton`**（`baton` 在 npm 上已被 2013 占坑 `0.0.0`）。

---

## 0. 本机现状（已查）

| 机器 | Claude Code | Codex CLI | Node | 备注 |
|---|---|---|---|---|
| **NUC11**（Linux，在线） | ✅ 2.1.119，`~/.local/bin/claude`；有 `~/.claude/settings.json` + `backups/` | ✅ 0.136.0；`~/.codex/` 活跃（auth/config/logs） | Node 24 / npm 11 | **最适合做 Linux 联调机** |
| **Mac mini**（在线） | ✅ 2.1.251 | ✅ 有 `~/.codex/`（体积很大、今天还有写入） | Node 24 / npm 11 | 可做第二路径；竞品 GUI 已占 Mac，演示差异别押这里 |
| **Windows** | ❌ 列表里无 Win 桌面 | — | — | 差异化关键，需梦梦指定一台或装虚机后再测 |
| Grok Bot box | 无用户登录态 | — | — | **不要**当撞线联调环境 |

`npm view baton` → 已占用；用 **`agent-baton`** 正确。

---

## 1. Windows：`npx` / hooks / statusline 预期坑（待真机验证）

1. **路径**  
   - 用户目录：`%USERPROFILE%\.claude\`、`%USERPROFILE%\.codex\`（不要写死 `/Users` 或假定 `HOME` 在 Git Bash 与 cmd 一致）。  
   - Node `os.homedir()` + `path.join`；所有 spawn 用 `pathToFileURL` / 绝对路径。  
   - 权限：OneDrive「受控文件夹访问」可能拦对 `.claude` 的写入 → `init` 失败时提示「以普通用户写用户目录，勿要管理员」。

2. **PowerShell vs cmd vs Git Bash**  
   - `npx agent-baton init`：PowerShell 执行策略可能拦脚本；文档写清 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` 或用 `cmd /c npx ...`。  
   - Hook 命令：Claude/Codex hooks 常期望可执行字符串；Windows 上优先 `node path\to\hook.js`，**不要**依赖 `sh -c`。  
   - 换行：hooks 配置与 HANDOFF.md 统一 `\n`，读写用显式 encoding `utf8`。

3. **读 statusline / rate_limits**  
   - 方案依赖 Claude statusline stdin JSON；Windows 上若 statusline 命令是 bash 一行，会直接挂 → **statusline 助手必须是 node 脚本**（跨平台）。  
   - 测法：`agent-baton status --fixture` 先通，再接真 statusline。

4. **`baton go` 拉起 CLI**  
   - `claude`/`codex` 若只在用户 PATH，服务/计划任务里没有 → doctor 检查 `where.exe claude`。  
   - 避免 `shell: true` 拼用户可控字符串；参数数组 spawn。

---

## 2. Mac mini / NUC 做「撞线→接力」联调：方便吗？

**结论：方便，优先 NUC；Mac 作对照。**

- 两边都已有 Claude Code（≥2.1.80 要求满足）+ Codex + Node，具备写 hooks、跑 `go` 的前提。  
- **配额**：真撞线要耗 5h 窗口；联调请用 **fixture 模拟 85%/100%**，只在录 GIF 当天用真额度撞一次。  
- **建议流程（NUC）**  
  1. 建演示用小仓库（勿用生产密钥仓）  
  2. `npx agent-baton init` → `doctor` → 人造 85% → 确认写出 HANDOFF.md  
  3. `agent-baton go codex`（或 `--print` 只看提示词）  
  4. `remove` 后 diff 配置，确认恢复  
- Mac mini 同样可跑；Deskflow 已通，键鼠可跨 Mac↔NUC，适合一边改一边看。  
- **不要**在 bot box 上联调（无订阅登录）。

---

## 3. `remove` 怎样才算「干净」

验收清单（写入测试计划）：

1. `init` 前把 `settings.json` / `hooks.json`（及 statusline 相关字段）拷到 `~/.baton/backup/<ts>/`，并写 `manifest.json`（原路径、hash、baton 版本）。  
2. `remove`：若当前文件 hash == manifest 里「baton 写入后 hash」→ 整文件恢复备份；若用户事后改过 → **打印 unified diff，退出码非 0，不盲盖**（可加 `--force`）。  
3. 清掉 `~/.baton/state.json` 触发器状态；**默认保留** `~/.baton/history/`（用户交接记录），加 `--purge-history` 才删。  
4. 不删除用户的 `HANDOFF.md`（仓库文件），只提示路径。  
5. `doctor` 在 remove 后应报「未安装 hooks」。

NUC 上 Claude 已有 `~/.claude/backups/`，说明官方/工具也在做备份——我们的备份目录仍要独立，避免和 Claude 自带备份缠在一起。

---

## 4. 给曦曦的行动建议

1. README/`init` 文案统一包名 **`agent-baton`**（产品名仍 Baton）。  
2. 联调排期：先 NUC Linux 闭环 → 再找 Windows 真机补第 1 节。  
3. 我可认领：NUC 上 init/doctor/remove 验收脚本 + dry-run/fixture；Win 机到位后再补矩阵。

