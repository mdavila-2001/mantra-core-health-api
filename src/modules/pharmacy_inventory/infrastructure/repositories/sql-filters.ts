/** A `where` clause (`?` placeholders) and its positional parameters. */
export interface SqlFilters {
  readonly where: string;
  readonly params: unknown[];
}

/**
 * Builds a parameterized `where` from fixed clauses plus optional ones, each
 * paired with the value it binds. An optional clause is added only when its
 * value is defined, so no filter value is ever concatenated into the SQL.
 * `plain` holds static clauses without parameters, added when enabled.
 */
export function buildSqlFilters(
  fixed: readonly [clause: string, value: unknown][],
  optional: readonly [value: unknown, clause: string][] = [],
  plain: readonly [enabled: boolean, clause: string][] = [],
): SqlFilters {
  const clauses: string[] = [];
  const params: unknown[] = [];
  for (const [clause, value] of fixed) {
    clauses.push(clause);
    params.push(value);
  }
  for (const [value, clause] of optional) {
    if (value === undefined) continue;
    clauses.push(clause);
    params.push(value);
  }
  for (const [enabled, clause] of plain) {
    if (enabled) clauses.push(clause);
  }
  return { where: `where ${clauses.join(' and ')}`, params };
}
