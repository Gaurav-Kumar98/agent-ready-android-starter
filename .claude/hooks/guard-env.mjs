// PreToolUse(Write|Edit|MultiEdit): never let an edit touch a .env file.
// .env.example is the one committed env file and is safe to edit.
import { allow, block, readHookInput } from './lib.mjs';

const input = await readHookInput();
const filePath = input?.tool_input?.file_path ?? '';
const name = filePath.replace(/\\/g, '/').split('/').pop() ?? '';

if (name === '.env.example') {
  allow();
}

if (/^\.env(\..+)?$/.test(name)) {
  block(
    'Blocked: never edit .env files directly. Tell the user which variable to add instead ' +
      '(see .env.example for the documented list).',
  );
}

allow();
