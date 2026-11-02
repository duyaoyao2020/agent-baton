import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadState, loadConfig } from '../lib/state.js';
import { writeHandoff } from '../lib/handoff.js';
import { gitContext } from '../lib/git.js';
import { gitBlock } from '../lib/handoff-template.js';
import { redact } from '../lib/redact.js';
import { which, runInteractive, planSpawn, IS_WINDOWS } from '../lib/exec.js';
import { p, ensureDir, tsName } from '../lib/paths.js';
import { installHint } from '../lib/version-check.js';
import { log, err, ok, warn, dim } from '../lib/ui.js';

export const help = `baton go <codex|claude|cursor> [--print|--dry-run] [--no-redact]
  Build a continuation prompt from HANDOFF.md + git and start the next agent in your repo.
  codex/claude: spawns the CLI with the prompt. A Windows .cmd/.bat shim runs its node script directly so cmd.exe cannot cut the prompt at the first line.
  cursor: copies the prompt to the clipboard (best effort).
  --print / --dry-run: only print the prompt and the command; nothing is started or written.`;

const TARGETS = ['codex', 'claude', 'cursor'];

export function buildPrompt(handoff, git, target, { withGit = false } = {}) {
  return [
    `You are ${target === 'claude' ? 'Claude Code' : target === 'codex' ? 'Codex' : 'the coding agent'}, taking over a coding task through Baton.`,
    'The previous agent paused (usually because its usage limit is close). Its handoff is below; the same file is HANDOFF.md at the repo root.',
    '',
    'Rules:',
    '1. First reply with ONE line: "Continuing: <goal in a few words>. Next: <next step>." Then start working.',
    '2. Do not retry anything listed under "Rejected". Respect "Decisions".',
    '3. The handoff is a lossy summary — if something is unclear, check git log/diff before redoing work.',
    '4. When you stop, update HANDOFF.md (Done / Next / Open questions) so the next agent can continue.',
    '',
    '----- HANDOFF.md -----',
    handoff.trim(),
    '----- end HANDOFF.md -----',
    ...(withGit ? ['', '----- current git context -----', gitBlock(git)] : []),
  ].join('\n');
}

/** One physical line. cmd.exe would otherwise keep only the text before the first newline. */
export function singleLineHandoffPointer(handoffFile, promptFile) {
  const flat = (s) => String(s || '').replace(/[\r\n]+/g, ' ').trim();
  const saved = flat(promptFile);
  const handoff = flat(handoffFile) || 'HANDOFF.md';
  const read = saved ? `Read and follow the full Baton prompt file (rules + handoff) at ${saved}. ` : '';
  return `${read}The handoff is also at ${handoff}. First reply with ONE line: "Continuing: <goal>. Next: <next step>." Then continue. Do not retry anything under "Rejected". When you stop, update HANDOFF.md.`;
}

/**
 * Argv for the next agent. Multi-line prompts never ride on cmd.exe /c:
 * a parsed npm shim is started as `node <script> <full prompt>`; if the shim
 * has no script, the child gets one line that points at the saved prompt file.
 */
export function argvForAgent(bin, prompt, { handoffFile, promptFile, platform } = {}) {
  const opts = platform ? { platform } : undefined;
  const text = String(prompt ?? '');
  const pointer = () => singleLineHandoffPointer(handoffFile, promptFile);
  const plan = planSpawn(bin, [text], opts);
  // cmd.exe /c keeps only the first line of a quoted argument. A parsed npm shim
  // is started as `node <script> <full prompt>` instead. Anything still headed
  // for cmd.exe gets one line that points at the saved prompt file.
  if ((plan.mode === 'node' || plan.mode === 'exe') && text.length > 24000) return planSpawn(bin, [pointer()], opts);
  if (plan.mode === 'cmd' && (/[\r\n]/.test(text) || text.length > 24000)) return planSpawn(bin, [pointer()], opts);
  return plan;
}

function copyToClipboard(text) {
  const cands = IS_WINDOWS ? [['clip.exe', []]] : process.platform === 'darwin' ? [['pbcopy', []]]
    : [['wl-copy', []], ['xclip', ['-selection', 'clipboard']], ['xsel', ['--clipboard', '--input']]];
  for (const [bin, a] of cands) {
    const f = which(bin.replace(/\.exe$/, '')) || (IS_WINDOWS ? which(bin) : null);
    if (!f) continue;
    const r = spawnSync(f, a, { input: text, timeout: 3000 });
    if (r.status === 0) return bin;
  }
  return null;
}

export async function run(args) {
  const target = args._[0];
  if (!TARGETS.includes(target)) { err(`Usage: ${help.split('\n')[0]}`); return 2; }
  const dry = args.print || args.dryRun;
  const cfg = loadConfig();
  const state = loadState(args.fixture);
  const git = gitContext(process.cwd());
  const file = path.join(git.root, 'HANDOFF.md');

  // Make sure there is a handoff (in --print mode, render it in memory only).
  const res = writeHandoff({ cwd: process.cwd(), from: args.from || 'claude', to: target, rateLimits: state?.rate_limits, dryRun: dry, status: fs.existsSync(file) ? undefined : 'go-skeleton' });
  const handoff = res.action === 'skipped' || dry ? res.content : fs.readFileSync(file, 'utf8');
  let prompt = buildPrompt(handoff, git, target, { withGit: res.action === 'skipped' });
  if (args.redact !== false) prompt = redact(prompt);

  const bin = target === 'cursor' ? null : which(target);
  const shownCmd = target === 'cursor' ? '(clipboard → paste into Cursor Agent)' : `${bin || target} "<prompt above>"   (cwd: ${git.root})`;

  if (dry) {
    process.stdout.write(prompt + '\n');
    process.stdout.write(`\n# baton go ${target} --print: would run → ${shownCmd}\n`);
    if (!fs.existsSync(file)) process.stdout.write('# (HANDOFF.md does not exist yet; it would be written first)\n');
    if (target !== 'cursor' && !bin) {
      process.stdout.write(`# \`${target}\` is not on PATH — nothing would be started. ${installHint(target)}\n`);
    } else if (bin && IS_WINDOWS && /\.(cmd|bat)$/i.test(bin)) {
      const plan = planSpawn(bin, [prompt]);
      if (plan.mode === 'node' || plan.mode === 'exe') {
        process.stdout.write(`# windows: would run \`${plan.file}\` directly so cmd.exe cannot cut the prompt at the first line\n`);
      } else {
        process.stdout.write('# windows: .cmd/.bat shim has no node script; a one-line pointer would be passed instead of the multi-line prompt\n');
      }
    }
    return 0;
  }

  if (res.action === 'created') log(ok(`Wrote ${file} (skeleton — the next agent will see what's missing)`));
  const hist = path.join(ensureDir(p.history()), `${tsName()}-go-${target}-prompt.md`);
  fs.writeFileSync(hist, prompt);

  if (target === 'cursor') {
    const via = copyToClipboard(prompt);
    if (via) log(ok(`Prompt copied to clipboard (${via}). Open Cursor Agent in ${git.root} and paste.`));
    else { log(warn('No clipboard tool found — prompt below (also saved to ' + hist + '):')); process.stdout.write(prompt + '\n'); }
    return 0;
  }
  if (!bin) {
    err(`\`${target}\` is not on PATH. ${installHint(target)}`);
    err(dim(`Prompt saved to ${hist} — or run: baton go ${target} --print`));
    return 127;
  }
  const planned = argvForAgent(bin, prompt, { handoffFile: file, promptFile: hist });
  log(ok(`Handing off to ${target} in ${git.root} — 任务不丢，接着写。`));
  return runInteractive(planned.file, planned.args, { cwd: git.root });
}
