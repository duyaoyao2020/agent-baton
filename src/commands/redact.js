import fs from 'node:fs';
import { redact, findSecrets } from '../lib/redact.js';
import { log, err, ok, no } from '../lib/ui.js';

export const help = `baton redact <file|->            print the redacted text to stdout
baton redact --check <file>      exit 1 if high-confidence secrets remain (for CI / before sharing)
baton redact --write <file>      redact the file in place
  Heuristic only — it does not replace "don't paste secrets into chats".`;

export async function run(args) {
  const file = typeof args.check === 'string' ? args.check : typeof args.write === 'string' ? args.write : args._[0];
  if (!file) { err(help); return 2; }
  const text = file === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(file, 'utf8');
  if (args.check) {
    const f = findSecrets(text);
    if (!f.length) { log(ok(`${file}: no high-confidence secrets found`)); return 0; }
    err(no(`${file}: ${f.length} possible secret(s):`));
    for (const x of f) err(`  line ${x.line}: ${x.kind}  ${x.sample}`);
    err('Fix with: baton redact --write ' + file);
    return 1;
  }
  const out = redact(text);
  if (args.write) { fs.writeFileSync(file, out); log(ok(`Redacted ${file}`)); return 0; }
  process.stdout.write(out);
  return 0;
}
