import type { FilterQuery } from '@mikro-orm/core';
import type { DiagnosticReports } from '../../clinical/entities';
import {
  visibleWhere,
  type ScopeFilter,
} from '../../clinical/domain/clinical-scope-visibility';

/**
 * Under a SPECIALTIES scope a report the tenant custodies is visible by the
 * account that recorded it, else by its encounter.
 */
export const OWN_REPORT_SCOPE_COLUMNS = {
  user: 'createdByUserId',
  encounter: 'encounterId',
} as const;

/**
 * Reports of the patient custodied by the tenant that the reader may see: the
 * chart list (`GET /diagnostics/patients/:id/orders`) and the read by id use
 * this same predicate. A `null` filter is a FULL scope.
 */
export function ownReportsWhere(
  custodianTenantId: string,
  patientProfileId: string,
  filter: ScopeFilter | null,
): FilterQuery<DiagnosticReports> {
  const base = { custodianTenantId, patientProfileId };
  return filter
    ? { ...base, ...visibleWhere(filter, OWN_REPORT_SCOPE_COLUMNS) }
    : base;
}
