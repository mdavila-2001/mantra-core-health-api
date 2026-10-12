/** Resolves active practices belonging to a tenant. */
export interface InsurancePracticeTenantLookupPort {
  findActivePracticeIdsForTenant(tenantId: string): Promise<string[]>;
}

export const INSURANCE_PRACTICE_TENANT_LOOKUP_PORT = Symbol(
  'INSURANCE_PRACTICE_TENANT_LOOKUP_PORT',
);
