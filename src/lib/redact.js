// Heuristic secret redaction (docs/redaction-test-cases.md). Default ON for HANDOFF + go prompts.
// Heuristic only — it does not replace "don't paste secrets into chats".

const KEY = '[REDACTED:key]';

// High-confidence token patterns (S1–S5). Order matters: specific before generic.
export const KEY_PATTERNS = [
  { id: 'anthropic', re: /sk-ant-[A-Za-z0-9_-]{10,}/g },
  { id: 'openai-proj', re: /sk-proj-[A-Za-z0-9_-]{10,}/g },
  { id: 'openai', re: /\bsk-[A-Za-z0-9_-]{20,}/g },
  { id: 'github', re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/g },
  { id: 'github-pat', re: /\bgithub_pat_[A-Za-z0-9_]{20,}/g },
  { id: 'slack', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/g },
  { id: 'aws', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { id: 'google', re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
];

const PRIVATE_KEY_BLOCK = /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/g;
const PRIVATE_KEY_HEADER = /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/;

// S8: NAME=value where NAME looks secret-ish.
const SECRET_NAME = '[A-Za-z0-9_.-]*(?:api[_-]?key|apikey|secret|token|passw(?:or)?d|private[_-]?key|access[_-]?key|credential)[A-Za-z0-9_]*';
const ASSIGN = new RegExp(`\\b(${SECRET_NAME})(\\s*=\\s*)("[^"\\n]*"|'[^'\\n]*'|[^\\s"'\\n]+)`, 'gi');
const JSON_ASSIGN = new RegExp(`("${SECRET_NAME}"\\s*:\\s*)"([^"\\n]*)"`, 'gi');

// S6: fenced blocks that are the *content* of env/credential files.
const SENSITIVE_FILE = /(^|[\\/\s`'"(])(\.env(\.[A-Za-z0-9_-]+)?|credentials\.json|\.npmrc|\.netrc|id_rsa|id_ed25519)\b/i;

function stripSensitiveFences(text) {
  const lines = text.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)(```+|~~~+)(.*)$/);
    if (m) {
      const info = m[3];
      const prev = out.length ? out[out.length - 1] : '';
      const sensitive = /^\s*(env|dotenv)\b/i.test(info) || SENSITIVE_FILE.test(info) || SENSITIVE_FILE.test(prev);
      // find closing fence
      let j = i + 1;
      while (j < lines.length && !lines[j].trimStart().startsWith(m[2])) j++;
      if (sensitive && j < lines.length) {
        out.push(lines[i]);
        out.push('[REDACTED:sensitive-file-content]');
        out.push(lines[j]);
        i = j;
        continue;
      }
    }
    out.push(lines[i]);
  }
  return out.join('\n');
}

export function redact(text) {
  let t = String(text);
  t = t.replace(PRIVATE_KEY_BLOCK, '[REDACTED:private-key]');
  t = stripSensitiveFences(t);
  for (const { re } of KEY_PATTERNS) t = t.replace(re, KEY);
  t = t.replace(JSON_ASSIGN, (all, pre, val) => (val.startsWith('[REDACTED') || val === '' ? all : `${pre}"[REDACTED]"`));
  t = t.replace(ASSIGN, (all, name, eq, val) => {
    const bare = val.replace(/^["']|["']$/g, '');
    if (bare.startsWith('[REDACTED') || bare === '' || /^\$\{?[A-Za-z_]/.test(bare)) return all; // keep refs like $TOKEN
    return `${name}${eq}[REDACTED]`;
  });
  return t;
}

/** Findings that remain after redaction would be needed (for --check). High-confidence only. */
export function findSecrets(text) {
  const t = String(text);
  const findings = [];
  const lines = t.split('\n');
  lines.forEach((line, idx) => {
    for (const { id, re } of KEY_PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line))) {
        const start = m.index, end = m.index + m[0].length;
        if (!findings.some((f) => f.line === idx + 1 && f.start < end && start < f.end)) {
          findings.push({ line: idx + 1, kind: id, sample: mask(m[0]), start, end });
        }
      }
    }
    if (PRIVATE_KEY_HEADER.test(line)) findings.push({ line: idx + 1, kind: 'private-key', sample: '-----BEGIN … PRIVATE KEY-----' });
    ASSIGN.lastIndex = 0;
    let a;
    while ((a = ASSIGN.exec(line))) {
      const bare = a[3].replace(/^["']|["']$/g, '');
      if (!bare.startsWith('[REDACTED') && bare && !/^\$\{?[A-Za-z_]/.test(bare)) {
        findings.push({ line: idx + 1, kind: 'assignment', sample: `${a[1]}=${mask(bare)}` });
      }
    }
  });
  return findings.map(({ start, end, ...f }) => f);
}

function mask(s) {
  return s.length <= 8 ? '****' : `${s.slice(0, 4)}…${s.slice(-2)}`;
}
