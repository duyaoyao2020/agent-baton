// Calm output: green/amber only, no red alarms. Honours NO_COLOR.
const color = process.stdout.isTTY && !process.env.NO_COLOR;
const wrap = (code) => (s) => (color ? `\x1b[${code}m${s}\x1b[0m` : String(s));
export const green = wrap('32');
export const amber = wrap('33');
export const dim = wrap('2');
export const bold = wrap('1');

export function bar(pct, width = 20) {
  const n = Math.max(0, Math.min(width, Math.round((pct / 100) * width)));
  return '█'.repeat(n) + '░'.repeat(width - n);
}
export const ok = (s) => `${green('✓')} ${s}`;
export const warn = (s) => `${amber('!')} ${s}`;
export const no = (s) => `${amber('✗')} ${s}`;
export const log = (...a) => process.stdout.write(a.join(' ') + '\n');
export const err = (...a) => process.stderr.write(a.join(' ') + '\n');
