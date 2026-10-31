import { parseArgs } from './lib/args.js';
import { VERSION } from './lib/paths.js';

const COMMANDS = ['init', 'remove', 'status', 'handoff', 'go', 'doctor', 'redact'];

const HELP = `Baton v${VERSION} — Hit Claude limit? \`baton go codex\` — keep working.
额度撞线？一条命令换 Codex 接着写，任务不丢。

Usage: baton <command> [options]

  init                  install statusline + Stop/PreCompact hooks (backs up first)
  status                5-hour + weekly (7d) usage and reset times   [--fixture <file>]
  handoff               write/refresh HANDOFF.md at the git root (secrets redacted)
  go <codex|claude|cursor>  hand the task to another agent now        [--print]
  doctor                check install, CLIs, versions, quota state
  remove                undo init (restores backups, keeps history)  [--force]
  redact <file>         redact secrets; --check <file> exits 1 if any remain

Options: -h, --help   --version
Not affiliated with Anthropic, OpenAI, or Anysphere.`;

const STRINGS = ['fixture', 'from', 'to', 'goal', 'threshold'];
const BOOLEANS = ['redact'];

export async function main(argv) {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    if (cmd === 'help' && rest[0] && COMMANDS.includes(rest[0])) return main([rest[0], '--help']);
    process.stdout.write(HELP + '\n');
    return 0;
  }
  if (cmd === '--version' || cmd === '-v' || cmd === 'version') { process.stdout.write(`${VERSION}\n`); return 0; }
  if (!COMMANDS.includes(cmd)) {
    process.stderr.write(`baton: unknown command "${cmd}"\n\n${HELP}\n`);
    return 2;
  }
  const mod = await import(`./commands/${cmd}.js`);
  const args = parseArgs(rest, { strings: STRINGS, booleans: BOOLEANS });
  if (args.help) { process.stdout.write(mod.help + '\n'); return 0; }
  return mod.run(args);
}
