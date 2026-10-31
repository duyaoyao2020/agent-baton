// ~/.baton/state.json — written by the statusline hook, read by status/handoff/stop.
import fs from 'node:fs';
import path from 'node:path';
import { p, readJson, writeJson } from './paths.js';

export const DEFAULT_THRESHOLD = 85;
export const STALE_MS = 15 * 60 * 1000;

export function loadConfig() {
  const c = readJson(p.config(), {}) || {};
  return {
    threshold: Number(c.threshold) > 0 ? Number(c.threshold) : DEFAULT_THRESHOLD,
    agentFill: c.agentFill !== false, // ask the running agent to fill HANDOFF once at threshold
    to: c.to || 'codex',
    chainStatusLine: c.chainStatusLine || null,
  };
}

/** Normalise resets_at (epoch seconds | epoch ms | ISO string) to ISO. */
export function toIso(v) {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'number' || /^\d+$/.test(String(v))) {
    const n = Number(v);
    return new Date(n < 1e12 ? n * 1000 : n).toISOString();
  }
  const d = new Date(v);
  return isNaN(d) ? null : d.toISOString();
}

export function normalizeRateLimits(rl) {
  if (!rl || typeof rl !== 'object') return null;
  const win = (w) => (w && typeof w === 'object' && w.used_percentage !== undefined
    ? { used_percentage: Number(w.used_percentage), resets_at: toIso(w.resets_at) }
    : null);
  const out = { five_hour: win(rl.five_hour), seven_day: win(rl.seven_day) };
  return out.five_hour || out.seven_day ? out : null;
}

export function loadFixture(file) {
  const abs = path.resolve(file);
  const j = JSON.parse(fs.readFileSync(abs, 'utf8'));
  return {
    source: `fixture:${path.basename(abs)}`,
    updated_at: new Date().toISOString(),
    rate_limits: normalizeRateLimits(j.rate_limits || j),
    fixture: true,
  };
}

/** Resolve state: --fixture > BATON_FIXTURE > ~/.baton/state.json */
export function loadState(fixture) {
  const f = fixture || process.env.BATON_FIXTURE;
  if (f) return loadFixture(f);
  const s = readJson(p.state(), null);
  if (!s) return null;
  return { ...s, source: s.source || 'statusline', rate_limits: normalizeRateLimits(s.rate_limits) };
}

export function saveState(s) {
  writeJson(p.state(), s);
}

export function peak(rl) {
  if (!rl) return null;
  const vals = [rl.five_hour?.used_percentage, rl.seven_day?.used_percentage].filter((x) => Number.isFinite(x));
  return vals.length ? Math.max(...vals) : null;
}

/** Which window is hottest — weekly matters as much as the 5-hour one. */
export function hottest(rl) {
  if (!rl) return null;
  const a = rl.five_hour?.used_percentage ?? -1, b = rl.seven_day?.used_percentage ?? -1;
  if (a < 0 && b < 0) return null;
  return b > a ? { window: '7d', pct: b, resets_at: rl.seven_day.resets_at } : { window: '5h', pct: a, resets_at: rl.five_hour?.resets_at };
}

export function isStale(s) {
  if (!s || s.fixture) return false;
  const t = Date.parse(s.updated_at || '');
  return !Number.isFinite(t) || Date.now() - t > STALE_MS;
}

export function fmtReset(iso) {
  if (!iso) return '—';
  const t = Date.parse(iso);
  const diff = t - Date.now();
  const local = new Date(t);
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())} ${pad(local.getHours())}:${pad(local.getMinutes())}`;
  if (diff <= 0) return `${stamp} (already reset)`;
  const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000);
  const d = Math.floor(h / 24);
  return `${stamp} (in ${d ? `${d}d ${h % 24}h` : `${h}h ${m}m`})`;
}
