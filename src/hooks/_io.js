import { parseJson, stripBom } from '../lib/json.js';

// Hook helpers: read JSON from stdin with a timeout; hooks must never break the host agent.

/** Parse a hook stdin payload. Empty → {}. A leading UTF-8 BOM is ignored. */
export function parseStdinPayload(data) {
  const text = stripBom(String(data ?? '')).trim();
  if (!text) return {};
  return parseJson(text);
}

export function readStdinJson(timeoutMs = 2000) {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve({});
    let data = '';
    const done = () => {
      try { resolve(parseStdinPayload(data)); } catch { resolve({}); }
    };
    const t = setTimeout(done, timeoutMs);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => { clearTimeout(t); done(); });
    process.stdin.on('error', () => { clearTimeout(t); resolve({}); });
  });
}

export function safeMain(fn) {
  fn().catch((e) => {
    if (process.env.BATON_DEBUG) process.stderr.write(`baton hook: ${e && e.stack}\n`);
  }).finally(() => { process.exitCode = 0; });
}
