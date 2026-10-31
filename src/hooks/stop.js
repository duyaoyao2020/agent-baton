#!/usr/bin/env node
// Stop hook. At >= threshold (default 85%, 5h OR 7d window) write a skeleton HANDOFF.md once per window,
// then (optionally, once) ask the running agent to fill in Decisions/Rejected/Next itself.
import path from 'node:path';
import { readStdinJson, safeMain } from './_io.js';
import { loadConfig, loadState, saveState, hottest, isStale } from '../lib/state.js';
import { writeHandoff } from '../lib/handoff.js';
import { projectRoot } from '../lib/git.js';
import { p, writeJson } from '../lib/paths.js';

safeMain(async () => {
  const agent = process.argv.includes('--agent') ? process.argv[process.argv.indexOf('--agent') + 1] : 'claude';
  const input = await readStdinJson();
  const cwd = input.cwd || process.cwd();

  if (agent === 'codex') {
    writeJson(path.join(p.history(), 'codex-last.json'), { at: new Date().toISOString(), cwd, session_id: input.session_id || null });
    return;
  }

  const cfg = loadConfig();
  const state = loadState(process.env.BATON_FIXTURE);
  if (!state || isStale(state)) return;
  const hot = hottest(state.rate_limits);
  if (!hot || hot.pct < cfg.threshold) return;

  const root = projectRoot(cwd);
  const key = `${hot.window}|${hot.resets_at || ''}|${root}`;
  const handoffs = state.handoffs || {};
  const first = !handoffs[key];

  const res = writeHandoff({
    cwd, from: 'claude', to: cfg.to, rateLimits: state.rate_limits,
    transcriptPath: input.transcript_path, status: 'auto-skeleton',
  });
  if (!state.fixture) {
    handoffs[key] = { at: new Date().toISOString(), file: res.file, action: res.action };
    saveState({ ...state, handoffs });
  }

  if (!first) return;
  const rel = path.relative(cwd, res.file) || 'HANDOFF.md';
  const soft = `快到线了，交接单已备好（${hot.window} ${Math.round(hot.pct)}%）：${rel} · 换手：baton go ${cfg.to}`;
  if (res.action === 'skipped') {
    process.stdout.write(JSON.stringify({ systemMessage: `Baton: 快到线了（${hot.window} ${Math.round(hot.pct)}%）。已有手写 HANDOFF.md，未覆盖；可运行 baton handoff --force。` }) + '\n');
    return;
  }
  if (cfg.agentFill && !input.stop_hook_active) {
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: `Baton: usage is at ${Math.round(hot.pct)}% of the ${hot.window} window. A skeleton handoff was written to ${res.file}. ` +
        'Please spend one short turn filling its Goal / Done / Decisions / Rejected (don\'t retry) / Next / Open questions sections ' +
        'from this session (keep it concise, no secrets, do not edit the baton:auto block), then stop. Another agent (e.g. Codex) will continue from it.',
      systemMessage: soft,
    }) + '\n');
  } else {
    process.stdout.write(JSON.stringify({ systemMessage: soft }) + '\n');
  }
});
