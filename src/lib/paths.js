// All filesystem locations Baton touches. os.homedir() + path only — no shell, no ~ expansion.
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function readPkg() {
  try {
    return JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8'));
  } catch {
    return { name: 'agent-baton', version: '0.0.0' };
  }
}
export const VERSION = readPkg().version;

export function home() {
  return os.homedir();
}

/** ~/.baton (override: BATON_HOME) */
export function batonHome() {
  return process.env.BATON_HOME ? path.resolve(process.env.BATON_HOME) : path.join(home(), '.baton');
}
/** ~/.claude (override: CLAUDE_CONFIG_DIR, which Claude Code itself honours) */
export function claudeDir() {
  return process.env.CLAUDE_CONFIG_DIR ? path.resolve(process.env.CLAUDE_CONFIG_DIR) : path.join(home(), '.claude');
}
/** ~/.codex (override: CODEX_HOME, which Codex itself honours) */
export function codexDir() {
  return process.env.CODEX_HOME ? path.resolve(process.env.CODEX_HOME) : path.join(home(), '.codex');
}

export const p = {
  claudeSettings: () => path.join(claudeDir(), 'settings.json'),
  claudeProjects: () => path.join(claudeDir(), 'projects'),
  codexHooks: () => path.join(codexDir(), 'hooks.json'),
  state: () => path.join(batonHome(), 'state.json'),
  install: () => path.join(batonHome(), 'install.json'),
  config: () => path.join(batonHome(), 'config.json'),
  backupRoot: () => path.join(batonHome(), 'backup'),
  history: () => path.join(batonHome(), 'history'),
  runtime: () => path.join(batonHome(), 'runtime'),
  runtimeHook: (name) => path.join(batonHome(), 'runtime', 'src', 'hooks', name),
  template: () => path.join(PKG_ROOT, 'templates', 'HANDOFF.md'),
};

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Windows-safe ISO timestamp for directory names. */
export function tsName(d = new Date()) {
  return d.toISOString().replace(/[:.]/g, '-');
}

export function readJson(file, fallback = undefined) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

export function writeJson(file, obj) {
  ensureDir(path.dirname(file));
  const tmp = `${file}.baton-tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n');
  fs.renameSync(tmp, file);
}
