// PreToolUse(Bash): block destructive or release-triggering commands.
import { allow, block, readHookInput } from './lib.mjs';

const RULES = [
  [/\brm\s+-[a-z]*[rf][a-z]*\s+(\/|~)/, 'recursive delete of / or ~'],
  [/supabase\s+db\s+reset\b(?=.*--linked)/, 'supabase db reset --linked (wipes the remote database)'],
  [/\beas\s+submit\b/, 'eas submit (store submission)'],
  [/\beas\s+build\b/, 'eas build (consumes build quota)'],
  [/\beas\s+update\b/, 'eas update (ships an OTA update to users)'],
  [/\bdrop\s+(table|database|schema)\b/i, 'a destructive SQL DROP'],
  [/\bgit\s+push\b.*--force(?!-with-lease)/, 'git push --force'],
];

const input = await readHookInput();
const command = input?.tool_input?.command ?? '';

for (const [pattern, description] of RULES) {
  if (pattern.test(command)) {
    block(
      `Blocked by project safety hook: ${description}. ` +
        'Ask the user to run this themselves if they really want it.',
    );
  }
}

allow();
