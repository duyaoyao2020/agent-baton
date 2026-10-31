// Hook helpers: read JSON from stdin with a timeout; hooks must never break the host agent.
export function readStdinJson(timeoutMs = 2000) {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve({});
    let data = '';
    const done = () => {
      try { resolve(data.trim() ? JSON.parse(data) : {}); } catch { resolve({}); }
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
