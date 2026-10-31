// Codex ~/.codex/hooks.json — only touched if the file already exists (Codex hooks are opt-in upstream).
import { p } from './paths.js';
import { hookCommand, isBatonCmd } from './hooks-claude.js';

export function codexHooksPath() {
  return p.codexHooks();
}

function has(groups) {
  return Array.isArray(groups) && groups.some((g) => Array.isArray(g?.hooks) && g.hooks.some((h) => isBatonCmd(h?.command)));
}

export function installedState(cfg) {
  return { stop: has(cfg?.hooks?.Stop) };
}

export function install(cfg) {
  const c = structuredClone(cfg || {});
  c.hooks = c.hooks && typeof c.hooks === 'object' ? c.hooks : {};
  if (has(c.hooks.Stop)) return { cfg: c, changed: false };
  c.hooks.Stop = [...(c.hooks.Stop || []), { hooks: [{ type: 'command', command: hookCommand('stop.js', '--agent codex'), timeout: 30 }] }];
  return { cfg: c, changed: true };
}

export function strip(cfg) {
  const c = structuredClone(cfg || {});
  if (c.hooks?.Stop) {
    c.hooks.Stop = c.hooks.Stop
      .map((g) => (Array.isArray(g?.hooks) ? { ...g, hooks: g.hooks.filter((h) => !isBatonCmd(h?.command)) } : g))
      .filter((g) => !Array.isArray(g?.hooks) || g.hooks.length);
    if (!c.hooks.Stop.length) delete c.hooks.Stop;
  }
  return c;
}
