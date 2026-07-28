// Shared helpers for the project hooks.
//
// These hooks deliberately depend on nothing but Node, which is already
// required to run the app. An earlier version shelled out to `jq`; when `jq`
// was missing the command substitution produced an empty string, every guard
// fell through to `exit 0`, and the hooks silently allowed what they were
// written to block. Failing open is the one thing a safety hook must never do.
import { Buffer } from 'node:buffer';
import process from 'node:process';

/**
 * Reads the hook payload from stdin.
 *
 * Guards must pass `required: true` (the default). A guard that cannot read its
 * payload cannot prove the action is safe, so *no payload at all* has to block
 * exactly like an unparseable one — an empty stdin is the same silent
 * fail-open the `jq` version had, just with a different cause. Hooks that only
 * tidy up (formatting) or gate quality rather than safety pass
 * `required: false`, because blocking a turn on a plumbing failure is worse
 * than skipping the tidy-up.
 */
export async function readHookInput({ required = true } = {}) {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    if (!required) {
      return {};
    }
    block('Hook received no payload on stdin, so it cannot verify this action is safe.');
  }
  try {
    return JSON.parse(raw);
  } catch {
    // A payload we cannot parse means we cannot prove the action is safe.
    if (!required) {
      return {};
    }
    block('Hook received malformed JSON on stdin.');
  }
}

/** Blocks the tool call and shows `message` to Claude. */
export function block(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

/** Allows the tool call. */
export function allow() {
  process.exit(0);
}
