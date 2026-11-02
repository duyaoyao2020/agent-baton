import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { planSpawn, spawnArgv } from '../src/lib/exec.js';
import { argvForAgent } from '../src/commands/go.js';
import { fileURLToPath } from 'node:url';
import { parseJson, readJsonStrict, stripBom } from '../src/lib/json.js';
import { readJson } from '../src/lib/paths.js';
import { loadFixture } from '../src/lib/state.js';
import { parseStdinPayload } from '../src/hooks/_io.js';
import { normalizeLf, refreshHandoff, renderHandoff } from '../src/lib/handoff-template.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOM = Buffer.from([0xEF, 0xBB, 0xBF]);

function tmp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function isolatedEnv(dir) {
  const pathDir = path.join(dir, 'path');
  fs.mkdirSync(pathDir, { recursive: true });
  const env = {
    ...process.env,
    PATH: pathDir,
    Path: pathDir,
    BATON_HOME: path.join(dir, 'baton'),
    CLAUDE_CONFIG_DIR: path.join(dir, 'claude'),
    CODEX_HOME: path.join(dir, 'codex'),
    HOME: dir,
    USERPROFILE: dir,
    NO_COLOR: '1',
  };
  delete env.BATON_FIXTURE;
  return env;
}

function runBaton(args, { cwd, env } = {}) {
  return spawnSync(process.execPath, [path.join(ROOT, 'bin', 'baton.js'), ...args], {
    encoding: 'utf8',
    cwd,
    env,
  });
}

async function capture(fn) {
  const origOut = process.stdout.write;
  const origErr = process.stderr.write;
  let out = '';
  let err = '';
  const wrap = (which) => function (chunk, enc, cb) {
    const text = typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString(typeof enc === 'string' ? enc : 'utf8');
    if (which === 'out') out += text;
    else err += text;
    const done = typeof enc === 'function' ? enc : cb;
    if (typeof done === 'function') done();
    return true;
  };
  process.stdout.write = wrap('out');
  process.stderr.write = wrap('err');
  try {
    return { result: await fn(), out, err };
  } finally {
    process.stdout.write = origOut;
    process.stderr.write = origErr;
  }
}

test('parseJson strips a leading UTF-8 BOM', () => {
  assert.equal(stripBom('\uFEFF{"a":1}'), '{"a":1}');
  assert.equal(stripBom('\uFEFF\uFEFF{"a":1}'), '{"a":1}');
  assert.equal(stripBom('{"a":1}'), '{"a":1}');
  assert.deepEqual(parseJson('\uFEFF{"a":1,"b":[2]}'), { a: 1, b: [2] });
});

test('readJson and readJsonStrict accept BOM-prefixed settings.json bytes', () => {
  const dir = tmp('baton-bom-');
  try {
    const file = path.join(dir, 'settings.json');
    const body = Buffer.from('{"env":{"FOO":"bar"},"hooks":{}}\n', 'utf8');
    fs.writeFileSync(file, Buffer.concat([BOM, body]));
    assert.deepEqual(readJson(file), { env: { FOO: 'bar' }, hooks: {} });
    assert.deepEqual(readJsonStrict(file), { env: { FOO: 'bar' }, hooks: {} });

    const empty = path.join(dir, 'empty.json');
    fs.writeFileSync(empty, Buffer.concat([BOM, Buffer.from('\n', 'utf8')]));
    assert.deepEqual(readJsonStrict(empty), {});
    assert.deepEqual(readJsonStrict(path.join(dir, 'missing.json')), {});

    const bad = path.join(dir, 'bad.json');
    fs.writeFileSync(bad, Buffer.concat([BOM, Buffer.from('{', 'utf8')]));
    assert.equal(readJson(bad, null), null);
    assert.throws(() => readJsonStrict(bad), /not valid JSON/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('loadFixture and hook stdin accept a leading BOM', () => {
  const dir = tmp('baton-fix-');
  try {
    const file = path.join(dir, 'rate.json');
    fs.writeFileSync(file, Buffer.concat([
      BOM,
      Buffer.from(JSON.stringify({
        rate_limits: {
          five_hour: { used_percentage: 12, resets_at: 1700000000 },
          seven_day: { used_percentage: 3, resets_at: 1700000001 },
        },
      })),
    ]));
    const state = loadFixture(file);
    assert.equal(state.fixture, true);
    assert.equal(state.rate_limits.five_hour.used_percentage, 12);
    assert.deepEqual(parseStdinPayload('\uFEFF{"cwd":"C:\\\\repo"}'), { cwd: 'C:\\repo' });
    assert.deepEqual(parseStdinPayload(''), {});
    assert.deepEqual(parseStdinPayload('\uFEFF'), {});
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('settings readers go through the BOM-stripping helper', () => {
  const files = [
    'src/lib/paths.js',
    'src/lib/state.js',
    'src/commands/init.js',
    'src/commands/remove.js',
    'src/hooks/_io.js',
    'src/lib/transcript.js',
  ];
  for (const f of files) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert.equal(src.includes('JSON.parse'), false, `${f} should call parseJson or readJsonStrict`);
  }
  assert.match(fs.readFileSync(path.join(ROOT, 'src/lib/json.js'), 'utf8'), /FEFF/);
});

test('init --dry-run parses a PowerShell-style BOM settings.json', async () => {
  const dir = tmp('baton-init-');
  const claude = path.join(dir, 'claude');
  fs.mkdirSync(claude);
  fs.writeFileSync(path.join(claude, 'settings.json'), Buffer.concat([
    BOM,
    Buffer.from('{"env":{"FOO":"from-bom"}}\n', 'utf8'),
  ]));
  const keys = ['CLAUDE_CONFIG_DIR', 'CODEX_HOME', 'BATON_HOME'];
  const prev = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  process.env.CLAUDE_CONFIG_DIR = claude;
  process.env.CODEX_HOME = path.join(dir, 'codex');
  process.env.BATON_HOME = path.join(dir, 'baton');
  try {
    const { run } = await import('../src/commands/init.js');
    const { result, out, err } = await capture(() => run({ force: true, dryRun: true }));
    assert.equal(result, 0, err + out);
    assert.match(out, /from-bom/);
  } finally {
    for (const k of keys) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('baton doctor exits 1 when checks fail', () => {
  const dir = tmp('baton-doc-');
  try {
    const r = runBaton(['doctor'], { cwd: dir, env: isolatedEnv(dir) });
    assert.equal(r.status, 1, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
    assert.match(r.stdout, /codex not on PATH/);
    assert.match(r.stdout, /problem\(s\)/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('go --print names a missing codex on PATH', () => {
  const dir = tmp('baton-go-');
  try {
    const r = runBaton(['go', 'codex', '--print'], { cwd: dir, env: isolatedEnv(dir) });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /`codex` is not on PATH/);
    assert.match(r.stdout, /@openai\/codex/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('go --print does not warn when codex is on PATH', () => {
  const dir = tmp('baton-go-ok-');
  try {
    const env = isolatedEnv(dir);
    const name = process.platform === 'win32' ? 'codex.cmd' : 'codex';
    const file = path.join(env.PATH, name);
    if (process.platform === 'win32') fs.writeFileSync(file, '@echo off\r\necho 9.9.9\r\n');
    else {
      fs.writeFileSync(file, '#!/bin/sh\necho 9.9.9\n');
      fs.chmodSync(file, 0o755);
    }
    const r = runBaton(['go', 'codex', '--print'], { cwd: dir, env });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(/not on PATH/.test(r.stdout), false, r.stdout);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function npmCmdShim(scriptRel) {
  const winRel = scriptRel.replace(/[\\/]/g, '\\');
  return [
    '@ECHO off',
    'GOTO start',
    ':find_dp0',
    'SET dp0=%~dp0',
    'EXIT /b',
    ':start',
    'SETLOCAL',
    'CALL :find_dp0',
    'IF EXIST "%dp0%\\node.exe" (',
    '  SET "_prog=%dp0%\\node.exe"',
    ') ELSE (',
    '  SET "_prog=node"',
    '  SET PATHEXT=%PATHEXT:;.JS;=;%',
    ')',
    `endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  "%dp0%\\${winRel}" %*`,
    '',
  ].join('\r\n');
}

function legacyCmdShim(scriptRel) {
  const winRel = scriptRel.replace(/[\\/]/g, '\\');
  return [
    '@IF EXIST "%~dp0\\node.exe" (',
    `  "%~dp0\\node.exe"  "%~dp0\\${winRel}" %*`,
    ') ELSE (',
    '  @SETLOCAL',
    '  @SET PATHEXT=%PATHEXT:;.JS;=;%',
    `  node  "%~dp0\\${winRel}" %*`,
    ')',
    '',
  ].join('\r\n');
}

test('windows .cmd shim delivers the full multi-line prompt, not the first line', () => {
  const dir = tmp('baton-shim-');
  try {
    const prompt = [
      'You are Codex, taking over through Baton.',
      'Rules:',
      '1. First reply with ONE line: "Continuing: goal".',
      '----- HANDOFF.md -----',
      'Goal: do not drop this line',
      'path: C:\\repo\\src',
      '----- end HANDOFF.md -----',
    ].join('\n');
    const handoffFile = path.join(dir, 'HANDOFF.md');
    const promptFile = path.join(dir, 'prompt.md');
    const layouts = [
      ['codex.cmd', 'node_modules/@openai/codex/bin/codex.js', npmCmdShim],
      ['codex-old.cmd', 'node_modules/codex/bin.js', legacyCmdShim],
    ];
    for (const [shimName, rel, shimBody] of layouts) {
      const script = path.join(dir, ...rel.split('/'));
      fs.mkdirSync(path.dirname(script), { recursive: true });
      fs.writeFileSync(script, 'process.stdout.write(process.argv[2] ?? "");\n');
      const shim = path.join(dir, shimName);
      fs.writeFileSync(shim, shimBody(rel));
      const plan = argvForAgent(shim, prompt, { handoffFile, promptFile, platform: 'win32' });
      const viaExec = spawnArgv(shim, [prompt], { platform: 'win32' });
      assert.equal(plan.mode, 'node', shimName);
      assert.equal(plan.file, process.execPath);
      assert.equal(path.resolve(plan.args[0]), path.resolve(script));
      assert.equal(plan.args[1], prompt);
      assert.deepEqual(plan.args, viaExec.args);
      assert.notEqual(path.basename(plan.file).toLowerCase(), 'cmd.exe');
      // The old launch put the raw multi-line string on cmd.exe /c, which keeps line 1 only.
      const legacy = ['/d', '/s', '/c', shim, prompt];
      assert.equal(legacy.at(-1).includes('\n'), true);
      assert.notEqual(legacy.at(-1).split('\n').length, 1);

      const child = spawnSync(plan.file, plan.args, { encoding: 'utf8' });
      assert.equal(child.status, 0, child.stderr);
      assert.equal(child.stdout, prompt);
      assert.ok(child.stdout.includes('do not drop this line'));
      assert.notEqual(child.stdout, prompt.split('\n')[0]);

      const again = planSpawn(plan.file, plan.args);
      assert.equal(again.mode, 'direct');
      assert.deepEqual(again.args, plan.args);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('windows .cmd shim without a node script gets a single-line pointer', () => {
  const dir = tmp('baton-shim-plain-');
  try {
    const shim = path.join(dir, 'codex.cmd');
    fs.writeFileSync(shim, '@echo off\r\necho hello %*\r\n');
    const prompt = 'Rules:\nGoal: do not drop this line\n';
    const promptFile = path.join(dir, 'full-prompt.md');
    const handoffFile = path.join(dir, 'HANDOFF.md');
    assert.throws(() => spawnArgv(shim, [prompt], { platform: 'win32' }), /multi-line argument through cmd\.exe/);
    const plan = argvForAgent(shim, prompt, { handoffFile, promptFile, platform: 'win32' });
    assert.equal(plan.mode, 'cmd');
    assert.equal(path.basename(plan.file).toLowerCase(), 'cmd.exe');
    const pointer = plan.args.at(-1);
    assert.equal(pointer.includes('\n') || pointer.includes('\r'), false);
    assert.ok(pointer.includes(promptFile));
    assert.ok(pointer.includes(handoffFile));
    assert.equal(plan.args.includes(prompt), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('unix launch still passes the multi-line prompt straight through', () => {
  const prompt = 'Rules:\nGoal: stay\n';
  const plan = planSpawn('/usr/bin/codex', [prompt], { platform: 'linux' });
  assert.equal(plan.mode, 'direct');
  assert.equal(plan.file, '/usr/bin/codex');
  assert.equal(plan.args[0], prompt);
  const exe = planSpawn('C:\\Tools\\codex.exe', [prompt], { platform: 'win32' });
  assert.equal(exe.mode, 'direct');
  assert.equal(exe.args[0], prompt);
});

test('HANDOFF rendering normalizes CRLF and gitattributes pins LF', () => {
  assert.equal(normalizeLf('a\r\nb\rc\n'), 'a\nb\nc\n');
  const rendered = renderHandoff(
    { git: { isRepo: false }, noRedact: true, goal: 'Ship it' },
    '# HANDOFF\r\n\r\n## Goal\r\n{{goal}}\r\n',
  );
  assert.equal(rendered.includes('\r'), false);
  assert.match(rendered, /## Goal\nShip it/);

  const existing = [
    '---',
    'baton_version: 0.0.0',
    'from: claude',
    'to: codex',
    'created_at: 2020-01-01T00:00:00.000Z',
    '---',
    '',
    '# HANDOFF',
    '',
    '## Goal',
    'keep me',
    '',
    '<!-- baton:auto:start -->',
    'old',
    '<!-- baton:auto:end -->',
    '',
  ].join('\r\n');
  const refreshed = refreshHandoff(existing, { git: { isRepo: false }, noRedact: true, to: 'codex' });
  assert.equal(refreshed.includes('\r'), false);
  assert.match(refreshed, /keep me/);
  assert.match(refreshed, /Not a git repository/);

  const template = fs.readFileSync(path.join(ROOT, 'templates', 'HANDOFF.md'));
  assert.equal(template.includes(0x0d), false);
  const attrs = fs.readFileSync(path.join(ROOT, '.gitattributes'), 'utf8');
  assert.match(attrs, /^templates\/HANDOFF\.md[^\n]*eol=lf/m);
  assert.match(attrs, /^testdata\/\*\*[^\n]*eol=lf/m);
  assert.equal(/^\* text=auto eol=lf/m.test(attrs), false);
});
