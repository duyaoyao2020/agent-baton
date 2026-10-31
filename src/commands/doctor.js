import fs from 'node:fs';
import { p, readJson, VERSION } from '../lib/paths.js';
import { loadInstall, loadManifest } from '../lib/backup.js';
import * as claudeHooks from '../lib/hooks-claude.js';
import * as codexHooks from '../lib/hooks-codex.js';
import { detectCli, claudeSupportsRateLimits, MIN_CLAUDE_FOR_RATE_LIMITS, installHint, nodeOk } from '../lib/version-check.js';
import { loadState, isStale, hottest } from '../lib/state.js';
import { log, ok, warn, no, bold, dim } from '../lib/ui.js';

export const help = `baton doctor [--fixture <file>]
  Check node, claude/codex on PATH + versions, hooks installed, runtime + template, backup manifest,
  and quota state freshness. Exit 0 = ready for Claude → Codex handoff.`;

export async function run(args) {
  let bad = 0;
  const fail = (s) => { bad++; log(no(s)); };
  log(bold(`Baton doctor · agent-baton v${VERSION} · ${process.platform}`));

  const n = nodeOk();
  n.ok ? log(ok(`node ${n.version}`)) : fail(`node ${n.version} (< 18)`);

  const claude = detectCli('claude');
  if (!claude.found) fail(`claude not on PATH — ${installHint('claude')}`);
  else if (!claudeSupportsRateLimits(claude)) fail(`claude ${claude.version || '?'} at ${claude.path} — needs >= ${MIN_CLAUDE_FOR_RATE_LIMITS} for rate_limits. ${installHint('claude')}`);
  else log(ok(`claude ${claude.version} (${claude.path}) — rate_limits supported`));

  const codex = detectCli('codex');
  codex.found ? log(ok(`codex ${codex.version || '?'} (${codex.path})`)) : fail(`codex not on PATH — ${installHint('codex')}`);

  const settings = readJson(p.claudeSettings(), null);
  const st = claudeHooks.installedState(settings);
  const inst = loadInstall();
  if (st.statusline && st.stop && st.precompact) log(ok(`Claude hooks installed (statusLine, Stop, PreCompact) in ${p.claudeSettings()}`));
  else if (!inst && !st.statusline && !st.stop && !st.precompact) fail('Baton is not installed — run: baton init');
  else fail(`Claude hooks incomplete: ${Object.entries(st).filter(([, v]) => !v).map(([k]) => k).join(', ')} missing — run: baton init`);

  if (fs.existsSync(p.codexHooks())) {
    const cs = codexHooks.installedState(readJson(p.codexHooks(), {}));
    cs.stop ? log(ok('Codex Stop hook installed')) : log(warn('~/.codex/hooks.json exists but has no Baton hook (optional) — baton init adds it'));
  } else log(dim('  Codex hooks.json not present (optional)'));

  if (inst) {
    for (const h of ['statusline.js', 'stop.js', 'precompact.js']) {
      if (!fs.existsSync(p.runtimeHook(h))) fail(`runtime hook missing: ${p.runtimeHook(h)} — run: baton init`);
    }
    loadManifest(inst.backup_dir) ? log(ok(`backup manifest: ${inst.backup_dir}`)) : fail(`backup manifest missing in ${inst.backup_dir}`);
  }
  fs.existsSync(p.template()) ? log(ok('HANDOFF template readable')) : fail(`template missing: ${p.template()}`);

  const state = loadState(args.fixture);
  if (!state) log(warn('no quota state yet — open Claude Code once after init (Pro/Max plans send rate_limits)'));
  else if (isStale(state)) log(warn(`quota state is stale (updated ${state.updated_at}) — fine if Claude Code isn't running`));
  else {
    const h = hottest(state.rate_limits);
    log(ok(`quota state fresh (${state.source}${h ? `, hottest ${h.window} ${Math.round(h.pct)}%` : ''})`));
  }

  log('');
  log(bad ? no(`${bad} problem(s). Fix the items above, then run baton doctor again.`) : ok('Ready: Claude Code → baton go codex'));
  return bad ? 1 : 0;
}
