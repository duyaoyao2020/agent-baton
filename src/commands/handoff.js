import { loadState, loadConfig } from '../lib/state.js';
import { writeHandoff } from '../lib/handoff.js';
import { log, ok, warn } from '../lib/ui.js';

export const help = `baton handoff [--from claude] [--to codex] [--goal "..."] [--force] [--print] [--no-redact] [--fixture <file>]
  Write HANDOFF.md at the git root: frontmatter + Goal/Done/Decisions/Rejected/Files/Next/Open questions
  + git status / diff --stat / last 5 commits. Secrets are redacted by default.
  If a Baton HANDOFF.md exists, only its frontmatter and git block are refreshed (your text is kept).`;

export async function run(args) {
  const cfg = loadConfig();
  const state = loadState(args.fixture);
  const res = writeHandoff({
    cwd: process.cwd(), from: args.from || 'claude', to: args.to || cfg.to, goal: args.goal,
    rateLimits: state?.rate_limits, force: args.force, noRedact: args.redact === false,
    dryRun: args.print, status: 'manual',
  });
  if (args.print) { process.stdout.write(res.content); return 0; }
  if (res.action === 'skipped') { log(warn(res.reason)); return 1; }
  log(ok(`HANDOFF.md ${res.action}: ${res.file}`));
  log('  Fill in Decisions / Rejected / Next if they say "(to fill)", then: baton go ' + (args.to || cfg.to));
  return 0;
}
