// Stop: refuse to finish a turn while TypeScript is broken.
import { spawnSync } from 'node:child_process';

import { allow, block, readHookInput } from './lib.mjs';

const input = await readHookInput();

// Already re-entered once because of this hook — let the turn end so we do not
// loop forever on an error Claude cannot fix.
if (input?.stop_hook_active === true) {
  allow();
}

const result = spawnSync('npx', ['tsc', '--noEmit'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim().split('\n').slice(0, 30);
  block(`TypeScript errors remain — fix before finishing:\n${output.join('\n')}`);
}

allow();
