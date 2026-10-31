/** Resolves active practices belonging to a tenant, and a practice's tenant. */
export interface InsurancePracticeTenantLookupPort {
  findActivePracticeIdsForTenant(tenantId: string): Promise<string[]>;

  /**
   * The tenant that owns a practice, or `null` if the practice does not exist.
   * The patient's objection (carril 16) has no tenant context of its own, so
   * the events it publishes are stamped with the practice's tenant.
   */
  findTenantOfPractice(practiceId: string): Promise<string | null>;
}

export const INSURANCE_PRACTICE_TENANT_LOOKUP_PORT = Symbol(
  'INSURANCE_PRACTICE_TENANT_LOOKUP_PORT',
);
