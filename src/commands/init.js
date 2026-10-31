import fs from 'node:fs';
import path from 'node:path';
import { p, PKG_ROOT, claudeDir, codexDir, ensureDir, readJson, writeJson, VERSION, batonHome } from '../lib/paths.js';
import { createBackup, finalizeBackup, loadInstall, saveInstall, loadManifest } from '../lib/backup.js';
import * as claudeHooks from '../lib/hooks-claude.js';
import * as codexHooks from '../lib/hooks-codex.js';
import { detectCli, claudeSupportsRateLimits, MIN_CLAUDE_FOR_RATE_LIMITS, installHint, nodeOk } from '../lib/version-check.js';
import { log, err, ok, warn, no, bold, dim } from '../lib/ui.js';

export const help = `baton init [--dry-run] [--force] [--threshold 85] [--to codex]
  Install Baton's statusline + Stop + PreCompact hooks into Claude Code user settings
  (and ~/.codex/hooks.json if that file already exists). Backs up first to ~/.baton/backup/<ts>/.
  Idempotent. --force skips the Claude version check.`;

function copyRuntime() {
  const dest = p.runtime();
  fs.rmSync(dest, { recursive: true, force: true });
  ensureDir(dest);
  fs.cpSync(path.join(PKG_ROOT, 'src'), path.join(dest, 'src'), { recursive: true });
  fs.copyFileSync(path.join(PKG_ROOT, 'package.json'), path.join(dest, 'package.json'));
  fs.cpSync(path.join(PKG_ROOT, 'templates'), path.join(dest, 'templates'), { recursive: true });
  return dest;
}

function readJsonStrict(file) {
  if (!fs.existsSync(file)) return {};
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`${file} is not valid JSON (${e.message}). Baton won't touch it — fix it first.`);
  }
}

export async function run(args) {
  const node = nodeOk();
  if (!node.ok) { err(no(`Node ${node.version} is too old; Baton needs Node >= 18.`)); return 2; }

  const claude = detectCli('claude');
  const codex = detectCli('codex');
  const cli = { claude: { path: claude.path, version: claude.version }, codex: { path: codex.path, version: codex.version } };

  if (!claude.found && !fs.existsSync(claudeDir())) {
    err(no('Claude Code not found (no `claude` on PATH, no ~/.claude).'));
    err(`  ${installHint('claude')}`);
    return 2;
  }
  if (!claudeSupportsRateLimits(claude)) {
    const why = claude.found ? `Claude Code ${claude.version || '(unknown version)'} is older than ${MIN_CLAUDE_FOR_RATE_LIMITS}` : '`claude` is not on PATH';
    if (!args.force) {
      err(no(`${why} — the statusline needs rate_limits (added in ${MIN_CLAUDE_FOR_RATE_LIMITS}). Nothing was changed.`));
      err(`  ${installHint('claude')}`);
      err('  (Override with `baton init --force` if you know what you are doing.)');
      return 2;
    }
    log(warn(`${why}; continuing because of --force.`));
  }

  const settingsFile = p.claudeSettings();
  const codexFile = p.codexHooks();
  const settings = readJsonStrict(settingsFile);
  const codexExists = fs.existsSync(codexFile);
  const codexCfg = codexExists ? readJsonStrict(codexFile) : null;

  const cInst = claudeHooks.install(settings);
  const xInst = codexExists ? codexHooks.install(codexCfg) : { changed: false };
  const prev = loadInstall();

  if (args.dryRun) {
    log(bold('baton init --dry-run (no files written)'));
    log(`  Claude settings: ${settingsFile} → ${cInst.changed ? 'would add statusLine/Stop/PreCompact' : 'already installed'}`);
    if (cInst.chainStatusLine) log(`  Your existing statusLine would be kept and shown before Baton's: ${cInst.chainStatusLine.command}`);
    log(`  Codex hooks: ${codexExists ? `${codexFile} → ${xInst.changed ? 'would add Stop' : 'already installed'}` : 'no ~/.codex/hooks.json — skipped'}`);
    log(`  Runtime copy: ${p.runtime()}`);
    log(`  Backup: ${prev ? prev.backup_dir + ' (existing)' : path.join(p.backupRoot(), '<ts>')}`);
    log(dim(`\n${JSON.stringify(cInst.settings, null, 2)}`));
    return 0;
  }

  if (!cInst.changed && !xInst.changed && prev) {
    copyRuntime();
    log(ok(`Already installed (backup: ${prev.backup_dir}). Runtime refreshed to v${VERSION}.`));
    return 0;
  }

  // Backup BEFORE writing anything. Re-use the original backup if we were installed before (keeps the true originals).
  let dir, manifest;
  if (prev && prev.backup_dir && loadManifest(prev.backup_dir)) {
    dir = prev.backup_dir; manifest = loadManifest(dir);
    if (codexExists && !manifest.files.some((f) => f.path === codexFile)) {
      const extra = createBackup([codexFile], cli);
      manifest.files.push(...extra.manifest.files.map((f) => ({ ...f, backup: f.backup && path.join(dir, path.basename(f.backup)) })));
      for (const f of extra.manifest.files) if (f.backup) fs.copyFileSync(f.backup, path.join(dir, path.basename(f.backup)));
      fs.rmSync(extra.dir, { recursive: true, force: true });
    }
  } else {
    ({ dir, manifest } = createBackup([settingsFile, ...(codexExists ? [codexFile] : [])], cli));
  }

  copyRuntime();
  const cfg = readJson(p.config(), {}) || {};
  if (cInst.chainStatusLine) cfg.chainStatusLine = cInst.chainStatusLine;
  if (args.threshold) cfg.threshold = Number(args.threshold);
  if (args.to) cfg.to = args.to;
  writeJson(p.config(), cfg);

  if (cInst.changed) { ensureDir(path.dirname(settingsFile)); writeJson(settingsFile, cInst.settings); }
  if (xInst.changed) writeJson(codexFile, xInst.cfg);
  finalizeBackup(dir, manifest);
  saveInstall({ baton_version: VERSION, installed_at: new Date().toISOString(), backup_dir: dir, baton_home: batonHome() });

  log(ok(`Backed up to ${dir}`));
  log(ok(`Claude Code: statusLine + Stop + PreCompact → ${settingsFile}`));
  if (cInst.chainStatusLine) log(ok(`Kept your statusLine (shown before Baton's): ${cInst.chainStatusLine.command}`));
  log(codexExists ? ok(`Codex: Stop hook → ${codexFile}`) : dim(`  Codex: no ${path.join(codexDir(), 'hooks.json')} — skipped (not needed for \`baton go codex\`).`));
  if (!codex.found) log(warn(`\`codex\` not on PATH — \`baton go codex\` will need it. ${installHint('codex')}`));
  log('');
  log(`At ${cfg.threshold || 85}% of the 5-hour OR 7-day window, Baton writes HANDOFF.md at your repo root when Claude finishes a turn.`);
  log('Then: `baton go codex` — keep working. Check anytime: `baton status`, `baton doctor`. Undo: `baton remove`.');
  if (process.platform === 'win32') log(dim('Windows: if PowerShell blocks npx, run from cmd.exe: npx agent-baton init'));
  return 0;
}
