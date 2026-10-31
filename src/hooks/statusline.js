#!/usr/bin/env node
// Claude Code statusLine command. Records rate_limits to ~/.baton/state.json and prints one calm line.
import { spawnSync } from 'node:child_process';
import { readStdinJson, safeMain } from './_io.js';
import { loadConfig, normalizeRateLimits, saveState, loadState, hottest } from '../lib/state.js';

function runChained(chain, input) {
  if (!chain || !chain.command) return '';
  // The user's own statusline is a shell string by definition; run it through the platform shell explicitly (no shell:true).
  const [cmd, args] = process.platform === 'win32'
    ? [process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', chain.command]]
    : ['/bin/sh', ['-c', chain.command]];
  const r = spawnSync(cmd, args, { input, encoding: 'utf8', timeout: 3000, windowsHide: true });
  return (r.stdout || '').trim();
}

safeMain(async () => {
  const input = await readStdinJson();
  const cfg = loadConfig();
  const rl = normalizeRateLimits(input.rate_limits);
  const prev = loadState() || {};
  const state = {
    ...prev,
    source: 'statusline',
    updated_at: new Date().toISOString(),
    session_id: input.session_id || prev.session_id || null,
    cwd: input.workspace?.current_dir || input.cwd || prev.cwd || null,
    model: input.model?.display_name || input.model?.id || null,
    claude_version: input.version || prev.claude_version || null,
    rate_limits: rl || prev.rate_limits || null,
    rate_limits_seen: Boolean(rl),
  };
  delete state.fixture;
  saveState(state);

  const own = (() => {
    const h = hottest(state.rate_limits);
    const r = state.rate_limits;
    if (!h) return 'Baton · waiting for rate_limits';
    const fh = r?.five_hour ? `5h ${Math.round(r.five_hour.used_percentage)}%` : '';
    const sd = r?.seven_day ? `7d ${Math.round(r.seven_day.used_percentage)}%` : '';
    const nums = [fh, sd].filter(Boolean).join(' · ');
    if (h.pct >= cfg.threshold) {
      const ready = state.handoffs && Object.keys(state.handoffs).length;
      return ready ? `Baton ${nums} · 快到线了，交接单已备好 → baton go ${cfg.to}` : `Baton ${nums} · 快到线了，本轮结束会写好交接单`;
    }
    return `Baton ${nums}`;
  })();
  const chained = runChained(cfg.chainStatusLine, JSON.stringify(input));
  process.stdout.write(chained ? `${chained}  ${own}\n` : `${own}\n`);
});
