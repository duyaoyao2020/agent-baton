// ~/.baton/backup/<ts>/ + manifest.json (paths, sha256 pre/post, baton_version, cli probe).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { p, ensureDir, tsName, writeJson, readJson, VERSION } from './paths.js';

export function sha256File(file) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  } catch {
    return null;
  }
}

function safeName(file) {
  return file.replace(/^[A-Za-z]:/, '').replace(/[\\/]+/g, '__').replace(/^_+/, '');
}

export function createBackup(files, cli) {
  const dir = ensureDir(path.join(p.backupRoot(), tsName()));
  const entries = files.map((file) => {
    const existed = fs.existsSync(file);
    const backup = existed ? path.join(dir, `${safeName(file)}.orig`) : null;
    if (existed) fs.copyFileSync(file, backup);
    return { path: file, existed, backup, pre_sha256: existed ? sha256File(file) : null, post_sha256: null, post_copy: null };
  });
  const manifest = { baton_version: VERSION, created_at: new Date().toISOString(), platform: process.platform, cli, files: entries };
  writeJson(path.join(dir, 'manifest.json'), manifest);
  return { dir, manifest };
}

export function finalizeBackup(dir, manifest) {
  for (const e of manifest.files) {
    if (fs.existsSync(e.path)) {
      e.post_sha256 = sha256File(e.path);
      e.post_copy = path.join(dir, `${safeName(e.path)}.post`);
      fs.copyFileSync(e.path, e.post_copy);
    }
  }
  writeJson(path.join(dir, 'manifest.json'), manifest);
  return manifest;
}

export function loadManifest(dir) {
  return readJson(path.join(dir, 'manifest.json'), null);
}

/** Minimal unified-ish line diff (LCS), no deps. */
export function lineDiff(aText, bText, aName = 'expected', bName = 'current') {
  const a = aText.split('\n'), b = bText.split('\n');
  const n = a.length, m = b.length;
  if (n * m > 4e6) return `--- ${aName}\n+++ ${bName}\n(files too large to diff)`;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [`--- ${aName}`, `+++ ${bName}`];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { i++; j++; continue; }
    if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) out.push(`+${b[j++]}`);
    else out.push(`-${a[i++]}`);
  }
  return out.join('\n');
}

export function loadInstall() {
  return readJson(p.install(), null);
}
export function saveInstall(obj) {
  writeJson(p.install(), obj);
}
