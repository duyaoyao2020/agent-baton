// Shared HANDOFF writer used by `baton handoff`, `baton go`, and the Stop/PreCompact hooks.
import fs from 'node:fs';
import path from 'node:path';
import { p, ensureDir, tsName } from './paths.js';
import { gitContext } from './git.js';
import { renderHandoff, refreshHandoff, hasAutoBlock } from './handoff-template.js';
import { summarizeTranscript, latestTranscriptFor } from './transcript.js';

export function archive(file, tag) {
  try {
    if (!fs.existsSync(file)) return null;
    const dir = ensureDir(p.history());
    const dest = path.join(dir, `${tsName()}-${tag}-HANDOFF.md`);
    fs.copyFileSync(file, dest);
    return dest;
  } catch {
    return null;
  }
}

/**
 * @returns {{file:string, action:'created'|'refreshed'|'skipped'|'overwritten', reason?:string, content:string}}
 */
export function writeHandoff(opts = {}) {
  const cwd = opts.cwd || process.cwd();
  const git = gitContext(cwd);
  const file = path.join(git.root, 'HANDOFF.md');
  const transcriptPath = opts.transcriptPath || (opts.from === 'claude' || !opts.from ? latestTranscriptFor(cwd) : null);
  const ctx = {
    from: opts.from || 'claude',
    to: opts.to || 'codex',
    rateLimits: opts.rateLimits,
    git,
    goal: opts.goal,
    status: opts.status,
    noRedact: opts.noRedact,
    transcript: summarizeTranscript(transcriptPath),
  };
  const exists = fs.existsSync(file);
  if (exists && !opts.force) {
    const cur = fs.readFileSync(file, 'utf8');
    if (!hasAutoBlock(cur)) {
      return { file, action: 'skipped', reason: 'HANDOFF.md exists and was not written by Baton (use --force to replace; old copy goes to ~/.baton/history)', content: cur };
    }
    archive(file, 'pre-refresh');
    const next = refreshHandoff(cur, ctx);
    if (!opts.dryRun) fs.writeFileSync(file, next);
    return { file, action: 'refreshed', content: next };
  }
  if (exists) archive(file, 'pre-overwrite');
  const content = renderHandoff(ctx);
  if (!opts.dryRun) fs.writeFileSync(file, content);
  archive(file, 'snapshot');
  return { file, action: exists ? 'overwritten' : 'created', content };
}
