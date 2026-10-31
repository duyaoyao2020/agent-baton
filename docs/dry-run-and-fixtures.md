# dry-run / fixture 约定

## CLI

```text
baton status --fixture fixtures/rate85.json
baton go codex --print          # 只打印首条提示词与将执行的命令，不 spawn
baton go codex --dry-run        # 同 --print（别名）
BATON_FIXTURE=fixtures/rate85.json baton status
```

## 行为

- `--fixture`：不读真 statusline；用于 GIF、CI、未撞线时的 handoff 触发演练。
- `--print`：组装 HANDOFF.md + git diff --stat + 最近提交，stdout 输出；exit 0；不启动 codex。
- 录 GIF：先 fixture 走通画面，最后再用真额度撞一次（D5 闸门：真实接力 ≥3 次才 Show HN）。

## Windows

无真机前：CI 用 `windows-latest` 跑 unit（path/redact/fixture 解析）。真机到位后按 `docs/acceptance-init-doctor-remove.md` 全套过一遍并录像。
