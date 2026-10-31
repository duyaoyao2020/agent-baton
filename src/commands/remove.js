import fs from 'node:fs';
import path from 'node:path';
import { p, readJson, writeJson, tsName } from '../lib/paths.js';
import { loadInstall, loadManifest, sha256File, lineDiff } from '../lib/backup.js';
import * as claudeHooks from '../lib/hooks-claude.js';
import * as codexHooks from '../lib/hooks-codex.js';
import { log, err, ok, warn, no } from '../lib/ui.js';

export const help = `baton remove [--force] [--purge-history]
  Restore your original Claude/Codex config from ~/.baton/backup.
  If you edited a config after init, Baton shows the diff and refuses; --force then removes only
  Baton's entries (keeping your edits) — or restores the backup if the file no longer parses.
  Keeps ~/.baton/history and never deletes HANDOFF.md in your repos.`;

export async function run(args) {
  const inst = loadInstall();
  const manifest = inst && loadManifest(inst.backup_dir);
  if (!inst || !manifest) {
    log(ok('Nothing to remove — Baton is not installed.'));
    return 0;
  }
  const cfg = readJson(p.config(), {}) || {};
  const dirty = [];
  for (const e of manifest.files) {
    const cur = sha256File(e.path);
    if (cur !== null && e.post_sha256 && cur !== e.post_sha256) dirty.push(e);
  }
  if (dirty.length && !args.force) {
    for (const e of dirty) {
      const expected = e.post_copy && fs.existsSync(e.post_copy) ? fs.readFileSync(e.post_copy, 'utf8') : '';
      err(no(`${e.path} changed since \`baton init\`:`));
      err(lineDiff(expected, fs.readFileSync(e.path, 'utf8'), `${e.path} (after baton init)`, `${e.path} (now)`));
    }
    err('\nNot overwriting your edits. Re-run with `baton remove --force` to strip only Baton entries (a copy of the current file is kept in the backup dir).');
    return 3;
  }

  for (const e of manifest.files) {
    const exists = fs.existsSync(e.path);
    const isDirty = dirty.includes(e);
    if (isDirty) {
      const keep = path.join(inst.backup_dir, `${path.basename(e.path)}.user-edited-${tsName()}`);
      fs.copyFileSync(e.path, keep);
      let parsed = null;
      try { parsed = JSON.parse(fs.readFileSync(e.path, 'utf8')); } catch { /* fallthrough */ }
      if (parsed) {
        const stripped = e.path === p.codexHooks() ? codexHooks.strip(parsed) : claudeHooks.strip(parsed, cfg.chainStatusLine);
        writeJson(e.path, stripped);
        log(warn(`${e.path}: removed Baton entries, kept your edits (copy: ${keep})`));
        continue;
      }
      log(warn(`${e.path}: no longer valid JSON — restoring the pre-init backup (your current file: ${keep})`));
    }
    if (e.existed && e.backup && fs.existsSync(e.backup)) {
      fs.copyFileSync(e.backup, e.path);
      log(ok(`Restored ${e.path}`));
    } else if (!e.existed && exists) {
      fs.rmSync(e.path, { force: true });
      log(ok(`Removed ${e.path} (did not exist before init)`));
    }
  }

  fs.rmSync(p.runtime(), { recursive: true, force: true });
  fs.rmSync(p.install(), { force: true });
  fs.rmSync(p.config(), { force: true });
  fs.rmSync(p.state(), { force: true });
  if (args.purgeHistory) {
    fs.rmSync(p.history(), { recursive: true, force: true });
    log(ok('Purged ~/.baton/history'));
  } else {
    log(ok(`Kept history: ${p.history()}`));
  }
  log(ok(`Backups kept: ${inst.backup_dir}. HANDOFF.md files in your repos were not touched.`));
  return 0;
}
