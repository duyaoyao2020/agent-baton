# scripts

| 脚本 | 作用 | 跑在哪 |
|---|---|---|
| `nuc-acceptance.sh` | init/doctor/fixture/go --print/remove 全链路 | **NUC**（CLI 就绪后） |
| `test-redaction.sh` | 密钥过滤用例；无 CLI 时用参考实现 | box 或 NUC |

```bash
# box 上可先跑过滤用例
./scripts/test-redaction.sh

# NUC：CLI link 后
BATON_BIN=baton ./scripts/nuc-acceptance.sh
```
