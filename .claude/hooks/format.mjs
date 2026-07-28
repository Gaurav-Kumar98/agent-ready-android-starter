// PostToolUse(Write|Edit|MultiEdit): format and auto-fix the file that changed.
// Formatting failures are never fatal — this hook only tidies up.
import { spawnSync } from 'node:child_process';

import { allow, readHookInput } from './lib.mjs';

const input = await readHookInput();
const filePath = input?.tool_input?.file_path ?? '';

if (!/\.(ts|tsx|js|jsx|mjs|json)$/.test(filePath)) {
  allow();
}

const run = (bin, args) =>
  spawnSync(bin, args, { stdio: 'ignore', shell: process.platform === 'win32' });

run('npx', ['prettier', '--write', filePath]);
run('npx', ['eslint', '--fix', filePath]);

allow();
