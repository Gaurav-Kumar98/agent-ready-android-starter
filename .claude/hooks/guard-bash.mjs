// PreToolUse(Bash): block destructive or release-triggering commands.
import { allow, block, readHookInput } from './lib.mjs';

// Only the genuine catastrophes: an `rm` whose *whole target* is the filesystem
// root or the home directory. The target has to end there — matching a bare
// leading `/` blocks every absolute path, including routine cleanups this repo
// actually prescribes, like deleting a stub NDK or `android/app/.cxx`.
const RM_ROOT = /\brm\s+(?:-\S+\s+)*["']?(?:~?\/\*|~\/|~|\/|\$HOME\/?\*?)["']?\s*(?:$|[;&|])/;

const RULES = [
  [RM_ROOT, 'recursive delete of / or ~'],
  [
    /supabase\s+db\s+reset\b(?=.*--linked)/,
    'supabase db reset --linked (wipes the remote database)',
  ],
  [/\beas\s+submit\b/, 'eas submit (store submission)'],
  [/\beas\s+build\b/, 'eas build (consumes build quota)'],
  [/\beas\s+update\b/, 'eas update (ships an OTA update to users)'],
  [/\bdrop\s+(table|database|schema)\b/i, 'a destructive SQL DROP'],
  // `-f` is the same command with fewer characters, so it has to match too.
  // `--force-with-lease` stays allowed: it refuses to clobber unseen commits.
  [/\bgit\s+push\b.*(?:--force(?!-with-lease)|\s-[a-zA-Z]*f\b)/, 'git push --force'],
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
