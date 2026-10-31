// Detect Claude Code / Codex and whether Claude exposes statusline rate_limits (added in v2.1.80).
import { which, runCapture } from './exec.js';

export const MIN_CLAUDE_FOR_RATE_LIMITS = '2.1.80';
export const MIN_NODE_MAJOR = 18;

export function parseVersion(s) {
  const m = String(s || '').match(/(\d+)\.(\d+)\.(\d+)/);
  return m ? m.slice(1, 4).map(Number) : null;
}

export function cmpVersion(a, b) {
  const x = parseVersion(a), y = parseVersion(b);
  if (!x || !y) return NaN;
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

export function detectCli(name) {
  const file = which(name);
  if (!file) return { name, found: false, path: null, version: null };
  const r = runCapture(file, ['--version']);
  const v = parseVersion(r.stdout || r.stderr);
  return { name, found: true, path: file, version: v ? v.join('.') : null, raw: r.stdout || r.stderr };
}

export function claudeSupportsRateLimits(info) {
  if (!info || !info.found || !info.version) return false;
  return cmpVersion(info.version, MIN_CLAUDE_FOR_RATE_LIMITS) >= 0;
}

export function nodeOk() {
  const major = Number(process.versions.node.split('.')[0]);
  return { ok: major >= MIN_NODE_MAJOR, version: process.versions.node };
}

export function installHint(name) {
  if (name === 'claude') {
    return process.platform === 'win32'
      ? 'Install/upgrade Claude Code: npm i -g @anthropic-ai/claude-code  (then check: where.exe claude)'
      : 'Install/upgrade Claude Code: npm i -g @anthropic-ai/claude-code  (or: claude update; check: command -v claude)';
  }
  if (name === 'codex') {
    return process.platform === 'win32'
      ? 'Install Codex CLI: npm i -g @openai/codex  (then check: where.exe codex)'
      : 'Install Codex CLI: npm i -g @openai/codex  (check: command -v codex)';
  }
  return '';
}
