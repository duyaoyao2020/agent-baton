# 密钥过滤用例（默认开启）

> 写 HANDOFF / 拼 `go` 提示词前必须跑同一套 redact。

## 必须打码或剥离

| ID | 输入片段 | 期望 |
|---|---|---|
| S1 | `sk-ant-api03-aaaaaaaa` | 替换为 `[REDACTED:openai-or-ant-key]` 类标记 |
| S2 | `sk-proj-xxxx` / `sk-xxxx`（≥20） | 打码 |
| S3 | `ghp_` / `gho_` / `github_pat_` 前缀 token | 打码 |
| S4 | `xoxb-` / `xoxp-` Slack | 打码 |
| S5 | `AKIA[0-9A-Z]{16}` AWS key id | 打码 |
| S6 | 文件名/路径含 `.env`、`.env.local`、`credentials.json` 的**内容块** | 不写入正文；Files touched 可留路径名 |
| S7 | `-----BEGIN OPENSSH PRIVATE KEY-----` 块 | 整块剥离 |
| S8 | `api_key=...` / `API_SECRET=...` 赋值行 | 值打码 |

## 不应误伤

| ID | 输入 | 期望 |
|---|---|---|
| N1 | 普通 git SHA、短 hex | 保留 |
| N2 | 公开 URL、npm 包名 | 保留 |
| N3 | `sk-` 后不足长度的玩笑字符串 | 保留或仅警告 |

## 命令

- `baton redact --check HANDOFF.md`：若仍含高置信密钥 → exit ≠ 0（CI 用）
- 单测：`testdata/redaction/*.in.md` → `*.out.md`

## 免责

README 一句：过滤为启发式，不能替代「别把密钥贴进对话」。
