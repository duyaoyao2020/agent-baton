// Claude Code user settings (~/.claude/settings.json): statusLine + Stop + PreCompact, all pure-node scripts.
import { p } from './paths.js';

const MARK = /runtime[\\/]src[\\/]hooks[\\/](statusline|stop|precompact)\.js/;

export function hookCommand(name, extra = '') {
  return `node "${p.runtimeHook(name)}"${extra ? ` ${extra}` : ''}`;
}

export function isBatonCmd(cmd) {
  return typeof cmd === 'string' && MARK.test(cmd);
}

function hasBatonHook(groups) {
  return Array.isArray(groups) && groups.some((g) => Array.isArray(g?.hooks) && g.hooks.some((h) => isBatonCmd(h?.command)));
}

export function installedState(settings) {
  const s = settings || {};
  return {
    statusline: isBatonCmd(s.statusLine?.command),
    stop: hasBatonHook(s.hooks?.Stop),
    precompact: hasBatonHook(s.hooks?.PreCompact),
  };
}

/** Returns { settings, chainStatusLine, changed } — never removes user hooks. */
export function install(settings) {
  const s = structuredClone(settings || {});
  let changed = false;
  let chainStatusLine = null;
  if (!isBatonCmd(s.statusLine?.command)) {
    if (s.statusLine && s.statusLine.command) chainStatusLine = s.statusLine; // keep user's statusline, render it before ours
    s.statusLine = { type: 'command', command: hookCommand('statusline.js'), padding: s.statusLine?.padding ?? 0 };
    changed = true;
  }
  s.hooks = s.hooks && typeof s.hooks === 'object' ? s.hooks : {};
  if (!hasBatonHook(s.hooks.Stop)) {
    s.hooks.Stop = [...(s.hooks.Stop || []), { hooks: [{ type: 'command', command: hookCommand('stop.js'), timeout: 30 }] }];
    changed = true;
  }
  if (!hasBatonHook(s.hooks.PreCompact)) {
    s.hooks.PreCompact = [...(s.hooks.PreCompact || []), { hooks: [{ type: 'command', command: hookCommand('precompact.js'), timeout: 30 }] }];
    changed = true;
  }
  return { settings: s, chainStatusLine, changed };
}

/** Surgically remove Baton entries, keep everything else. */
export function strip(settings, chainStatusLine) {
  const s = structuredClone(settings || {});
  if (isBatonCmd(s.statusLine?.command)) {
    if (chainStatusLine) s.statusLine = chainStatusLine;
    else delete s.statusLine;
  }
  if (s.hooks && typeof s.hooks === 'object') {
    for (const ev of Object.keys(s.hooks)) {
      if (!Array.isArray(s.hooks[ev])) continue;
      s.hooks[ev] = s.hooks[ev]
        .map((g) => (Array.isArray(g?.hooks) ? { ...g, hooks: g.hooks.filter((h) => !isBatonCmd(h?.command)) } : g))
        .filter((g) => !Array.isArray(g?.hooks) || g.hooks.length);
      if (!s.hooks[ev].length) delete s.hooks[ev];
    }
    if (!Object.keys(s.hooks).length) delete s.hooks;
  }
  return s;
}

export function settingsPath() {
  return p.claudeSettings();
}
