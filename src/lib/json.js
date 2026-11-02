// JSON reads that survive a leading UTF-8 BOM (U+FEFF).
// PowerShell 5.1 `Set-Content -Encoding UTF8` and `Out-File -Encoding utf8` write one,
// and JSON.parse rejects it as illegal JSON.
import fs from 'node:fs';

/** Drop every leading U+FEFF. Other characters, including later BOMs, stay put. */
export function stripBom(text) {
  if (typeof text !== 'string' || text.length === 0) return text;
  let i = 0;
  while (text.charCodeAt(i) === 0xFEFF) i += 1;
  return i ? text.slice(i) : text;
}

export function parseJson(text) {
  return JSON.parse(stripBom(text));
}

/** Missing or empty file → {}. Invalid JSON throws and names the file; the caller must not overwrite it. */
export function readJsonStrict(file) {
  if (!fs.existsSync(file)) return {};
  const raw = stripBom(fs.readFileSync(file, 'utf8'));
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`${file} is not valid JSON (${e.message}). Baton won't touch it — fix it first.`);
  }
}
