#!/usr/bin/env node
import { main } from '../src/cli.js';

main(process.argv.slice(2)).then(
  (code) => { process.exitCode = typeof code === 'number' ? code : 0; },
  (err) => {
    process.stderr.write(`baton: ${err && err.message ? err.message : err}\n`);
    if (process.env.BATON_DEBUG) process.stderr.write(`${err && err.stack}\n`);
    process.exitCode = 1;
  }
);
