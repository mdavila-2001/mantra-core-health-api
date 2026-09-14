import {
  IdentityEvidenceEligibilityService,
  type IdentityEligibilityFacts,
} from './identity-evidence-eligibility.service';
import type { ResolvedIdentityLifecycleRule } from '../identity-evidence-lifecycle.config';

const config: ResolvedIdentityLifecycleRule = {
  configRevision: 'synthetic',
  retentionPeriodDays: 10,
  evidenceTypeConceptId: 'synthetic-type',
  allowedCaseStatusConceptIds: ['synthetic-terminal'],
  rule: {
    tenantId: 'synthetic-tenant',
    evidenceTypeConceptCode: 'SYNTHETIC',
    operation: 'PURGE',
    retentionPolicyCode: 'SYNTHETIC',
    expectedRowVersion: 1,
    expectedDispositionConceptCode: 'SYNTHETIC',
    entityRegistryId: 'synthetic-registry',
    baseEvent: 'case.completedAt',
    allowedCaseStatusConceptCodes: ['SYNTHETIC_TERMINAL'],
    additionalWaitSeconds: 60,
    fieldRules: [],
    metadataDisposition: 'REMOVE',
    preserveProfile: 'CASE_ANCHOR_WORM_TECHNICAL_REVISION',
    storageDisposition: 'PURGE',
    authorizationRevision: 'synthetic-test-only',
  },
};
const facts: IdentityEligibilityFacts = {
  tenantId: 'synthetic-tenant',
  ownerResolved: true,
  evidence: {
    evidenceTypeConceptId: 'synthetic-type',
    createdAt: new Date('2020-01-01'),
    expiresAt: new Date('2020-01-02'),
  },
  case: {
    statusConceptId: 'synthetic-terminal',
    createdAt: new Date('2020-01-01'),
    completedAt: new Date('2020-01-03'),
  },
  hold: 'CLEAR',
  references: 'CLEAR',
  now: new Date('2020-01-13T00:01:00Z'),
};
const service = new IdentityEvidenceEligibilityService();
describe('identity eligibility — synthetic policy, no legal duration assigned', () => {
  it('denies missing configuration', () =>
    expect(service.evaluate(undefined, facts)).toEqual({
      eligible: false,
      reasonCode: 'MISSING_CONFIGURATION',
    }));
  it('uses only the explicit event plus period and additional wait', () => {
    expect(service.evaluate(config, facts)).toEqual({
      eligible: true,
      eligibleAt: facts.now,
    });
    expect(
      service.evaluate(config, {
        ...facts,
        now: new Date('2020-01-13T00:00:59Z'),
      }),
    ).toEqual({ eligible: false, reasonCode: 'CUTOFF_NOT_REACHED' });
  });
  it('does not use expires_at when the configured event is missing', () => {
    expect(
      service.evaluate(config, {
        ...facts,
        case: { ...facts.case, completedAt: undefined },
      }),
    ).toEqual({ eligible: false, reasonCode: 'CUTOFF_UNKNOWN' });
  });
  it.each(['ACTIVE', 'UNKNOWN'] as const)('denies %s hold', (hold) =>
    expect(service.evaluate(config, { ...facts, hold }).eligible).toBe(false),
  );
  it.each(['BLOCKED', 'UNKNOWN'] as const)(
    'denies %s references',
    (references) =>
      expect(service.evaluate(config, { ...facts, references }).eligible).toBe(
        false,
      ),
  );
  it('denies mismatched owner, tenant, type and case state', () => {
    expect(
      service.evaluate(config, { ...facts, ownerResolved: false }).eligible,
    ).toBe(false);
    expect(
      service.evaluate(config, { ...facts, tenantId: 'other' }).eligible,
    ).toBe(false);
    expect(
      service.evaluate(config, {
        ...facts,
        evidence: { ...facts.evidence, evidenceTypeConceptId: 'other' },
      }).eligible,
    ).toBe(false);
    expect(
      service.evaluate(config, {
        ...facts,
        case: { ...facts.case, statusConceptId: 'functional-expired' },
      }).eligible,
    ).toBe(false);
  });
});
