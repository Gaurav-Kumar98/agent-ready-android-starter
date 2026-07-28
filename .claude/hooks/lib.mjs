// Shared helpers for the project hooks.
//
// These hooks deliberately depend on nothing but Node, which is already
// required to run the app. An earlier version shelled out to `jq`; when `jq`
// was missing the command substitution produced an empty string, every guard
// fell through to `exit 0`, and the hooks silently allowed what they were
// written to block. Failing open is the one thing a safety hook must never do.

/** Reads the hook payload from stdin. Returns {} if there is nothing to read. */
export async function readHookInput() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    // A payload we cannot parse means we cannot prove the action is safe.
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
