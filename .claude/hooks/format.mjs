// PostToolUse(Write|Edit|MultiEdit): format and auto-fix the file that changed.
// Formatting failures are never fatal — this hook only tidies up.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { allow, readHookInput } from './lib.mjs';

// Tidy-up, not a safety guard: a missing payload skips formatting rather than
// blocking the turn. See readHookInput in ./lib.mjs.
const input = await readHookInput({ required: false });
const filePath = input?.tool_input?.file_path ?? '';

if (!/\.(ts|tsx|js|jsx|mjs|json)$/.test(filePath)) {
  allow();
}

/**
 * Run a CLI through its JS entrypoint on the current `node`.
 *
 * Not `npx` with `shell: true`: Node does not quote arguments when a shell is
 * involved, so a path containing a space arrives as two arguments and the tool
 * silently formats the wrong file (or nothing) — and a filename containing `&`
 * or `;` would execute. Resolving relative to this file rather than cwd keeps
 * it working whatever directory the hook is invoked from.
 */
const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

const run = (relativeEntry, args) => {
  const entry = fileURLToPath(new URL(`../../${relativeEntry}`, import.meta.url));
  if (!existsSync(entry)) {
    return;
  }
  spawnSync(process.execPath, [entry, ...args], { stdio: 'ignore', cwd: projectRoot });
};

run('node_modules/prettier/bin/prettier.cjs', ['--write', filePath]);
run('node_modules/eslint/bin/eslint.js', ['--fix', filePath]);

allow();
