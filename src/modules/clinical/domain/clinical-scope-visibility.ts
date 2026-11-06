/**
 * Practitioners (and what they recorded for one patient) whose records a
 * SPECIALTIES scope may show.
 *
 * Built once per read by `ClinicalScopeFilterService`: practitioners who hold an
 * active specialty among the authorised ones, their accounts (for sections that
 * only store `recorded_by_user_id`) and the patient's encounters they lead (for
 * records with no responsible of their own).
 */
export interface ScopeFilter {
  readonly profileIds: readonly string[];
  readonly userIds: readonly string[];
  readonly encounterIds: readonly string[];
}

/** Which columns of a section identify who is responsible for the row. */
export interface VisibilityColumns {
  /** Column with the responsible practitioner profile id. */
  readonly profile?: string;
  /** Column with the responsible account (`*_by_user_id`). */
  readonly user?: string;
  /** Column with the encounter, used when the row has no responsible. */
  readonly encounter?: string;
}

type Clause = Record<string, unknown>;

/**
 * SQL predicate (MikroORM object syntax) of the rows a SPECIALTIES scope sees:
 *
 * - rows the `always` clauses allow (IPS sections),
 * - rows whose responsible practitioner/account is in the filter,
 * - rows with no responsible whose encounter is led by one of them.
 *
 * Rows that match none are hidden, so an unattributable record is never shown
 * by accident. The predicate is applied in SQL so `limit` and `truncated` stay
 * truthful.
 */
export function visibleWhere(
  filter: ScopeFilter,
  columns: VisibilityColumns,
  always: readonly Clause[] = [],
): Clause {
  const clauses: Clause[] = [...always];
  if (columns.profile && filter.profileIds.length > 0) {
    clauses.push({ [columns.profile]: { $in: [...filter.profileIds] } });
  }
  if (columns.user && filter.userIds.length > 0) {
    clauses.push({ [columns.user]: { $in: [...filter.userIds] } });
  }
  if (columns.encounter && filter.encounterIds.length > 0) {
    const unattributed: Clause = {};
    if (columns.profile) unattributed[columns.profile] = null;
    if (columns.user) unattributed[columns.user] = null;
    unattributed[columns.encounter] = { $in: [...filter.encounterIds] };
    clauses.push(unattributed);
  }
  // `id IS NULL` never holds: nothing is visible.
  return clauses.length > 0 ? { $or: clauses } : { id: null };
}
