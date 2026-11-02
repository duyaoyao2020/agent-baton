#!/usr/bin/env node
import { main } from '../src/cli.js';

let code = 0;
try {
  const result = await main(process.argv.slice(2));
  code = typeof result === 'number' ? result : 0;
} catch (err) {
  process.stderr.write(`baton: ${err && err.message ? err.message : err}\n`);
  if (process.env.BATON_DEBUG) process.stderr.write(`${err && err.stack}\n`);
  code = 1;
}
// Exit explicitly. Assigning only process.exitCode from a trailing .then was
// reported as exit 0 on Windows PowerShell 5.1 after doctor had printed failures.
process.exitCode = code;
process.exit(code);
