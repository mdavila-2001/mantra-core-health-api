export type CoverageValidity =
  'CURRENT' | 'UPCOMING' | 'EXPIRED' | 'INACTIVE' | 'UNKNOWN';

export interface CoveragePeriod {
  readonly statusCode?: string | null;
  readonly activeCode: string;
  readonly effectiveFrom?: string | null;
  readonly effectiveTo?: string | null;
}

/** Civil dates are compared without passing through a UTC timestamp. */
export function patientCoverageValidity(
  referenceDate: string,
  periods: readonly CoveragePeriod[],
): CoverageValidity {
  if (
    periods.some(
      (period) => period.statusCode && period.statusCode !== period.activeCode,
    )
  )
    return 'INACTIVE';
  const starts = periods.flatMap((period) =>
    period.effectiveFrom ? [period.effectiveFrom] : [],
  );
  const ends = periods.flatMap((period) =>
    period.effectiveTo ? [period.effectiveTo] : [],
  );
  if (ends.some((date) => date < referenceDate)) return 'EXPIRED';
  if (starts.some((date) => date > referenceDate)) return 'UPCOMING';
  if (
    periods.some((period) => !period.statusCode) ||
    starts.length + ends.length === 0
  )
    return 'UNKNOWN';
  return 'CURRENT';
}

export function patientCoverageReferenceDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
