#!/usr/bin/env node
// PreCompact hook: context is about to be compacted → snapshot a handoff into ~/.baton/history.
// If quota is already >= threshold, also write/refresh HANDOFF.md in the repo.
import fs from 'node:fs';
import path from 'node:path';
import { readStdinJson, safeMain } from './_io.js';
import { loadConfig, loadState, hottest, isStale } from '../lib/state.js';
import { writeHandoff } from '../lib/handoff.js';
import { p, ensureDir, tsName } from '../lib/paths.js';

safeMain(async () => {
  const input = await readStdinJson();
  const cwd = input.cwd || process.cwd();
  const cfg = loadConfig();
  const state = loadState(process.env.BATON_FIXTURE);
  const hot = state && !isStale(state) ? hottest(state.rate_limits) : null;
  const over = hot && hot.pct >= cfg.threshold;
  const res = writeHandoff({
    cwd, from: 'claude', to: cfg.to, rateLimits: state?.rate_limits,
    transcriptPath: input.transcript_path, archiveRefresh: false, status: over ? 'auto-skeleton' : 'precompact-snapshot', dryRun: !over,
  });
  if (!over) {
    fs.writeFileSync(path.join(ensureDir(p.history()), `${tsName()}-precompact-HANDOFF.md`), res.content);
  }
});
