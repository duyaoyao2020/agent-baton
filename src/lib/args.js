// Tiny argv parser: --flag, --key value, --key=value, positionals.
export function parseArgs(argv, { booleans = [], strings = [] } = {}) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') { out._.push(...argv.slice(i + 1)); break; }
    if (a.startsWith('--')) {
      let [k, v] = a.slice(2).split(/=(.*)/s, 2);
      const key = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (k.startsWith('no-') && booleans.includes(k.slice(3))) { out[k.slice(3).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = false; continue; }
      if (strings.includes(k)) {
        if (v === undefined) v = argv[++i];
        if (v === undefined) throw new Error(`--${k} needs a value`);
        out[key] = v;
      } else {
        out[key] = v === undefined ? true : v !== 'false';
      }
    } else if (a === '-h') out.help = true;
    else out._.push(a);
  }
  return out;
}
