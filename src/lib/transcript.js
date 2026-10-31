// Best-effort extraction from a Claude Code transcript (JSONL). Never throws.
import fs from 'node:fs';
import path from 'node:path';
import { p } from './paths.js';

function textOf(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.filter((c) => c && c.type === 'text' && typeof c.text === 'string').map((c) => c.text).join('\n');
  }
  return '';
}

function isNoise(t) {
  return !t || /^<(command-|local-command|system-reminder)/.test(t.trim()) || t.startsWith('Caveat:');
}

export function summarizeTranscript(file, { maxBytes = 4 * 1024 * 1024 } = {}) {
  const out = { firstUser: null, lastUser: null, lastAssistant: null, files: [], file };
  try {
    if (!file || !fs.existsSync(file)) return out;
    const st = fs.statSync(file);
    const fd = fs.openSync(file, 'r');
    const start = Math.max(0, st.size - maxBytes);
    const buf = Buffer.alloc(st.size - start);
    fs.readSync(fd, buf, 0, buf.length, start);
    fs.closeSync(fd);
    const files = new Set();
    for (const line of buf.toString('utf8').split('\n')) {
      if (!line.trim()) continue;
      let j;
      try { j = JSON.parse(line); } catch { continue; }
      const msg = j.message || {};
      if (j.type === 'user' && !j.isMeta) {
        const t = textOf(msg.content);
        if (!isNoise(t)) {
          if (!out.firstUser) out.firstUser = t.trim();
          out.lastUser = t.trim();
        }
      } else if (j.type === 'assistant') {
        const t = textOf(msg.content);
        if (t.trim()) out.lastAssistant = t.trim();
        if (Array.isArray(msg.content)) {
          for (const c of msg.content) {
            if (c && c.type === 'tool_use' && c.input) {
              const fp = c.input.file_path || c.input.notebook_path || c.input.path;
              if (fp && /^(Edit|Write|MultiEdit|NotebookEdit)$/.test(c.name || '')) files.add(fp);
            }
          }
        }
      }
    }
    out.files = [...files];
  } catch { /* best effort */ }
  return out;
}

/** Claude stores transcripts in ~/.claude/projects/<cwd with non-alnum → '-'>/<session>.jsonl */
export function latestTranscriptFor(cwd, maxAgeMs = 12 * 3600 * 1000) {
  try {
    const dir = path.join(p.claudeProjects(), path.resolve(cwd).replace(/[^A-Za-z0-9]/g, '-'));
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl'))
      .map((f) => ({ f: path.join(dir, f), m: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    return files[0] && Date.now() - files[0].m < maxAgeMs ? files[0].f : null;
  } catch {
    return null;
  }
}

export function clip(s, n = 600) {
  if (!s) return s;
  const one = s.replace(/\r/g, '');
  return one.length > n ? `${one.slice(0, n)}…` : one;
}
