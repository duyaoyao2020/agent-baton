import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { redact, findSecrets } from '../src/lib/redact.js';
import { install, strip, installedState } from '../src/lib/hooks-claude.js';
import { normalizeRateLimits, hottest, toIso } from '../src/lib/state.js';
import { cmpVersion } from '../src/lib/version-check.js';
import { parseArgs } from '../src/lib/args.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(ROOT, 'testdata', 'redaction');

for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.in.md'))) {
  test(`redact golden ${f}`, () => {
    const out = fs.readFileSync(path.join(dir, f.replace('.in.md', '.out.md')), 'utf8');
    assert.equal(redact(fs.readFileSync(path.join(dir, f), 'utf8')), out);
  });
}

test('redact: private key block, no false positives', () => {
  assert.equal(redact('-----BEGIN OPENSSH PRIVATE KEY-----\nabc\n-----END OPENSSH PRIVATE KEY-----'), '[REDACTED:private-key]');
  const keep = 'sha 3f2a9c1 https://www.npmjs.com/package/agent-baton sk-lol author=Bob';
  assert.equal(redact(keep), keep);
  assert.equal(findSecrets(keep).length, 0);
});

test('hooks-claude: install is idempotent and strip restores user config', () => {
  const user = { statusLine: { type: 'command', command: 'echo me' }, hooks: { Stop: [{ hooks: [{ type: 'command', command: 'echo u' }] }] } };
  const a = install(user);
  assert.deepEqual(installedState(a.settings), { statusline: true, stop: true, precompact: true });
  assert.equal(a.chainStatusLine.command, 'echo me');
  const b = install(a.settings);
  assert.equal(b.changed, false);
  assert.equal(b.settings.hooks.Stop.length, 2);
  assert.deepEqual(strip(b.settings, a.chainStatusLine), user);
});

test('state: epoch seconds → ISO, hottest prefers weekly when higher', () => {
  assert.equal(toIso(1738425600), '2025-02-01T16:00:00.000Z');
  const rl = normalizeRateLimits({ five_hour: { used_percentage: 40, resets_at: 1 }, seven_day: { used_percentage: 90, resets_at: 2 } });
  assert.equal(hottest(rl).window, '7d');
});

test('version compare', () => {
  assert.ok(cmpVersion('2.1.312', '2.1.80') > 0);
  assert.ok(cmpVersion('2.1.79', '2.1.80') < 0);
});

test('args', () => {
  const a = parseArgs(['codex', '--print', '--fixture', 'x.json', '--no-redact'], { strings: ['fixture'], booleans: ['redact'] });
  assert.deepEqual(a, { _: ['codex'], print: true, fixture: 'x.json', redact: false });
});
