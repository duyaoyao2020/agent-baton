// Git context via spawn (no shell). Every call is best-effort.
import path from 'node:path';
import { which, runCapture } from './exec.js';

let gitBin;
function git(args, cwd) {
  if (gitBin === undefined) gitBin = which('git');
  if (!gitBin) return null;
  const r = runCapture(gitBin, args, { cwd, timeout: 10000 });
  return r.status === 0 ? r.stdout : null;
}

export function gitRoot(cwd = process.cwd()) {
  const r = git(['rev-parse', '--show-toplevel'], cwd);
  return r ? path.resolve(r) : null;
}

/** Root where HANDOFF.md lives: git root, else cwd. */
export function projectRoot(cwd = process.cwd()) {
  return gitRoot(cwd) || path.resolve(cwd);
}

export function gitContext(cwd = process.cwd()) {
  const root = gitRoot(cwd);
  if (!root) return { isRepo: false, root: path.resolve(cwd) };
  const hasHead = git(['rev-parse', '--verify', '-q', 'HEAD'], root) !== null;
  const status = git(['status', '--short', '--branch'], root) || '';
  const diffStat = hasHead ? (git(['diff', 'HEAD', '--stat'], root) || '') : (git(['diff', '--cached', '--stat'], root) || '');
  const log = hasHead ? (git(['log', '-5', '--pretty=format:%h %ad %s', '--date=short'], root) || '') : '';
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], root) || '';
  const files = status
    .split('\n')
    .filter((l) => l && !l.startsWith('##'))
    .map((l) => l.slice(3).trim())
    .filter((f) => f && f !== 'HANDOFF.md');
  return { isRepo: true, root, branch, status, diffStat, log, files };
}
