/* ============================================================================
    Quiet hours (lane P9), as pure functions.

    A window is stored as `{ start: "22:00", end: "07:00" }` in UTC on the
    channel preference row. A window that crosses midnight is read as such,
    which is the usual case and the one a naive comparison would break.
    ========================================================================== */

/** `HH:MM` → minutes since midnight, or `undefined` if malformed. */
function toMinutes(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : undefined;
}

/** The `{start, end}` strings of a stored window, if both are strings. */
function windowOf(
  quietHoursJson: unknown,
): { start: unknown; end: unknown } | undefined {
  if (!quietHoursJson || typeof quietHoursJson !== 'object') return undefined;
  const { start, end } = quietHoursJson as { start?: unknown; end?: unknown };
  return { start, end };
}

/** `true` if `at` falls inside the stored window. */
export function inQuietHours(quietHoursJson: unknown, at: Date): boolean {
  const window = windowOf(quietHoursJson);
  const from = toMinutes(window?.start);
  const to = toMinutes(window?.end);
  if (from === undefined || to === undefined) return false;

  const minutes = at.getUTCHours() * 60 + at.getUTCMinutes();
  return from <= to
    ? minutes >= from && minutes < to
    : minutes >= from || minutes < to;
}

/**
 * The stored window as the preferences screen shows it, or `null`.
 *
 * A malformed window is treated as absent, not as an error: the emitter
 * already ignores it, and a 500 on the preferences screen because of an old
 * badly written row would leave the person unable to fix it.
 */
export function readSilenceHours(
  quietHoursJson: unknown,
): { start: string; end: string } | null {
  const window = windowOf(quietHoursJson);
  return typeof window?.start === 'string' && typeof window.end === 'string'
    ? { start: window.start, end: window.end }
    : null;
}

/**
 * When an in-app notice becomes visible: `now`, or the end of the window if
 * `now` falls inside it (next day when the end already passed today).
 */
export function availableAfterSilence(
  quietHoursJson: unknown,
  now: Date,
): Date {
  if (!inQuietHours(quietHoursJson, now)) return now;
  const end = toMinutes(windowOf(quietHoursJson)?.end);
  if (end === undefined) return now;

  const available = new Date(now);
  available.setUTCHours(Math.floor(end / 60), end % 60, 0, 0);
  if (available <= now) available.setUTCDate(available.getUTCDate() + 1);
  return available;
}
