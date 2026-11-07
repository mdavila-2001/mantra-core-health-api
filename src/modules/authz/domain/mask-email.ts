/**
 * Masks a login subject for display in the admin directory.
 *
 * Only an email-shaped subject (contains a single `@`) is masked and returned.
 * Anything else (a national id used as login, a federated subject) returns
 * `null`: documents must never leave this endpoint, not even masked.
 *
 * Example: `maria.perez@clinica.org` -> `m***@c***.org`.
 */
export function maskEmail(subject: string | null | undefined): string | null {
  if (!subject) return null;
  const parts = subject.trim().split('@');
  if (parts.length !== 2) return null;
  const [local, domain] = parts;
  const dot = domain.lastIndexOf('.');
  if (!local || dot < 1 || dot === domain.length - 1) return null;
  return `${local[0]}***@${domain[0]}***${domain.slice(dot)}`;
}
