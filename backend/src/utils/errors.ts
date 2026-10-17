/**
 * @deprecated Unused. Use `src/types/errors` (or `src/types` for `AppError`).
 *
 * This module previously defined its own `AppError` with the signature
 * `(message, statusCode, code)` — the reverse of the canonical
 * `(code, message, statusCode, details)` in `src/types/index.ts`. Importing it
 * would have silently swapped the code and message arguments, producing
 * responses with a human-readable "code" and a machine code in "message".
 *
 * Nothing referenced it. It is kept only as a re-export so that any stray
 * import resolves to the canonical classes instead of a divergent copy, and it
 * can be deleted outright once the GitHub App can remove files.
 */

export * from '../types/errors';
