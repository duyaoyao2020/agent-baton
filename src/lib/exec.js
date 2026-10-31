// Cross-platform executable lookup + spawn WITHOUT shell:true.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, spawn } from 'node:child_process';

const isWin = process.platform === 'win32';

/** Find an executable on PATH (honours PATHEXT on Windows, like where.exe). */
export function which(name) {
  const dirs = (process.env.PATH || '').split(path.delimiter).filter(Boolean);
  const exts = isWin ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';').filter(Boolean) : [''];
  for (const dir of dirs) {
    for (const ext of exts) {
      const cand = path.join(dir, name + ext);
      try {
        const st = fs.statSync(cand);
        if (st.isFile()) {
          if (!isWin) fs.accessSync(cand, fs.constants.X_OK);
          return cand;
        }
      } catch { /* keep looking */ }
    }
  }
  return null;
}

function isCmdShim(file) {
  return isWin && /\.(cmd|bat)$/i.test(file);
}

/** Build [command, args] — .cmd/.bat shims on Windows go through cmd.exe explicitly (still no shell:true). */
export function resolveSpawn(file, args) {
  if (isCmdShim(file)) {
    return [process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', file, ...args]];
  }
  return [file, args];
}

export function runCapture(file, args, opts = {}) {
  const [cmd, a] = resolveSpawn(file, args);
  const r = spawnSync(cmd, a, { encoding: 'utf8', timeout: opts.timeout ?? 8000, cwd: opts.cwd, windowsHide: true });
  return { status: r.status, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim(), error: r.error };
}

export function runInteractive(file, args, opts = {}) {
  const [cmd, a] = resolveSpawn(file, args);
  return new Promise((resolve) => {
    const child = spawn(cmd, a, { stdio: 'inherit', cwd: opts.cwd });
    child.on('error', (e) => { process.stderr.write(`baton: failed to start ${file}: ${e.message}\n`); resolve(127); });
    child.on('exit', (code) => resolve(code ?? 0));
  });
}

export const IS_WINDOWS = isWin;
