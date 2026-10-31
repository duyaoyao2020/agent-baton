import fs from 'node:fs';
import path from 'node:path';
import { loadState, loadConfig, isStale, hottest, fmtReset } from '../lib/state.js';
import { projectRoot } from '../lib/git.js';
import { log, bar, green, amber, dim, bold } from '../lib/ui.js';

export const help = `baton status [--fixture fixtures/rate85.json] [--json]
  Show 5-hour and 7-day (weekly) usage + reset times from ~/.baton/state.json
  (written by Baton's statusline). BATON_FIXTURE=<file> works too.`;

export async function run(args) {
  const state = loadState(args.fixture);
  const cfg = loadConfig();
  if (args.json) { log(JSON.stringify(state, null, 2)); return state ? 0 : 1; }
  if (!state || !state.rate_limits) {
    log('No quota data yet.');
    log(dim('Baton learns your usage from Claude Code\'s statusline after `baton init` and one Claude turn'));
    log(dim('(rate_limits is only sent for Claude.ai Pro/Max plans). Demo: baton status --fixture fixtures/rate85.json'));
    return 1;
  }
  const rl = state.rate_limits;
  log(bold(`Baton status`) + dim(`  · source: ${state.source}${state.updated_at && !state.fixture ? ` · updated ${state.updated_at}` : ''}`));
  log('');
  log(`  ${'window'.padEnd(10)}${'used'.padEnd(28)}resets`);
  for (const [label, w] of [['5-hour', rl.five_hour], ['7-day', rl.seven_day]]) {
    if (!w) { log(`  ${label.padEnd(10)}${dim('n/a')}`); continue; }
    const pct = Math.round(w.used_percentage);
    const c = pct >= cfg.threshold ? amber : green;
    log(`  ${label.padEnd(10)}${c(bar(pct))} ${c(String(pct).padStart(3) + '%')}   ${fmtReset(w.resets_at)}`);
  }
  log('');
  if (isStale(state)) log(dim('  (state is older than 15 min — open Claude Code to refresh)'));
  const hot = hottest(rl);
  const handoff = path.join(projectRoot(), 'HANDOFF.md');
  if (hot && hot.pct >= cfg.threshold) {
    if (fs.existsSync(handoff)) log(amber(`  快到线了，交接单已备好 · ${handoff}`) + `\n  Next: baton go ${cfg.to}`);
    else log(amber(`  快到线了（${hot.window} ${Math.round(hot.pct)}%）· 交接单会在本轮结束时写好；现在就写：baton handoff`));
    if (hot.window === '7d') log(dim('  Weekly window is the tight one — waiting for the 5-hour reset will not help much; switching vendor will.'));
  } else if (hot) {
    log(green(`  All good — handoff triggers at ${cfg.threshold}% of either window.`));
  }
  return 0;
}
