// Stop: refuse to finish a turn while TypeScript is broken.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { allow, block, readHookInput } from './lib.mjs';

// A quality gate, not a safety guard, and the payload is what breaks the loop:
// without `stop_hook_active` a hard block would re-enter forever, so a missing
// payload has to let the turn end. See readHookInput in ./lib.mjs.
const input = await readHookInput({ required: false });

// Already re-entered once because of this hook — let the turn end so we do not
// loop forever on an error Claude cannot fix.
if (input?.stop_hook_active === true) {
  allow();
}

// Invoked as `node <tsc entry>` rather than `npx tsc` with a shell, so no
// argument goes through shell word-splitting. Both the entry and the working
// directory are resolved from this file, so the right tsconfig.json is picked
// up no matter where the hook was invoked from.
const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const tsc = fileURLToPath(new URL('../../node_modules/typescript/bin/tsc', import.meta.url));
if (!existsSync(tsc)) {
  allow();
}

const result = spawnSync(process.execPath, [tsc, '--noEmit'], {
  encoding: 'utf8',
  cwd: projectRoot,
});

if (result.status !== 0) {
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim().split('\n').slice(0, 30);
  block(`TypeScript errors remain — fix before finishing:\n${output.join('\n')}`);
}

allow();
