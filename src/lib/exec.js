// Cross-platform executable lookup + spawn WITHOUT shell:true.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, spawn } from 'node:child_process';
import { stripBom } from './json.js';

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

function hasBreak(args) {
  return (args || []).some((a) => /[\r\n]/.test(String(a)));
}

export function isCmdShim(file, platform = process.platform) {
  return platform === 'win32' && typeof file === 'string' && /\.(cmd|bat)$/i.test(file);
}

function comSpec() {
  return process.env.ComSpec || 'cmd.exe';
}

/** Expand %~dp0 / %dp0% the way an npm .cmd shim does, relative to the shim file. */
function expandShimPath(raw, shimFile) {
  const shimDir = path.dirname(path.resolve(shimFile));
  const prefix = shimDir.endsWith(path.sep) ? shimDir : shimDir + path.sep;
  let s = String(raw).trim().replace(/%~dp0/gi, prefix).replace(/%dp0%/gi, prefix);
  s = s.replace(/[\\/]/g, path.sep);
  if (!path.isAbsolute(s)) s = path.resolve(shimDir, s);
  return path.normalize(s);
}

function isLauncherExe(raw) {
  const base = raw.replace(/%~dp0/gi, '').replace(/%dp0%/gi, '');
  return /(?:^|[\\/])(?:node|cmd)\.exe$/i.test(base);
}

/**
 * npm's Windows bin shim is a .cmd that cmd.exe interprets. Pull out the real
 * node script (or non-node exe) so we can CreateProcess it directly.
 * Returns null when the shim isn't a recognizable launcher or the target is missing.
 */
export function readCmdShimTarget(file) {
  let text;
  try { text = stripBom(fs.readFileSync(file, 'utf8')); } catch { return null; }
  const quoted = [...text.matchAll(/"([^"\r\n]*)"/g)].map((m) => m[1]);
  const bare = [...text.matchAll(/(?:^|[\s=])([^\s"']+\.(?:js|mjs|cjs|exe))\b/gi)].map((m) => m[1]);
  const scripts = [];
  const exes = [];
  for (const raw of [...quoted, ...bare]) {
    if (!raw || /%_prog%/i.test(raw) || isLauncherExe(raw)) continue;
    const resolved = expandShimPath(raw, file);
    let st;
    try { st = fs.statSync(resolved); } catch { continue; }
    if (!st.isFile()) continue;
    if (/\.(js|mjs|cjs)$/i.test(resolved)) scripts.push(resolved);
    else if (/\.exe$/i.test(resolved)) exes.push(resolved);
  }
  const shimDir = path.dirname(path.resolve(file));
  const localNode = path.join(shimDir, 'node.exe');
  const node = fs.existsSync(localNode) ? localNode : process.execPath;
  if (scripts.length) return { script: scripts[scripts.length - 1], node, kind: 'js' };
  if (exes.length) return { exe: exes[exes.length - 1], kind: 'exe' };
  return null;
}

/**
 * Final [file, args] for spawn, without shell:true.
 * A multi-line arg aimed at a .cmd/.bat is NOT handed to cmd.exe: cmd /c keeps
 * only the first line. When the shim names a node script, spawn node directly.
 */
export function planSpawn(file, args, opts = {}) {
  const platform = opts.platform || process.platform;
  const list = [...(args || [])];
  if (isCmdShim(file, platform) && hasBreak(list)) {
    const target = readCmdShimTarget(file);
    if (target?.kind === 'js') return { file: target.node, args: [target.script, ...list], mode: 'node' };
    if (target?.kind === 'exe') return { file: target.exe, args: list, mode: 'exe' };
    return { file: comSpec(), args: ['/d', '/s', '/c', file, ...list], mode: 'cmd' };
  }
  if (isCmdShim(file, platform)) {
    return { file: comSpec(), args: ['/d', '/s', '/c', file, ...list], mode: 'cmd' };
  }
  return { file, args: list, mode: 'direct' };
}

/** Like planSpawn, but refuses to put a newline on cmd.exe's command line. */
export function spawnArgv(file, args, opts) {
  const plan = planSpawn(file, args, opts);
  if (plan.mode === 'cmd' && hasBreak(args)) {
    throw new Error(`refusing to pass a multi-line argument through cmd.exe: ${file}`);
  }
  return plan;
}

/** Build [command, args]. .cmd/.bat go through cmd.exe only when every arg is one line. */
export function resolveSpawn(file, args) {
  const plan = spawnArgv(file, args);
  return [plan.file, plan.args];
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
