import { jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../common/constants/concepts';
import { GovernanceRepository } from '../system_ops/repositories/governance.repository';
import { EntityRegistry } from '../system_ops/entities/entity_registry.entity';
import { SYSOPS } from '../system_ops/system_ops.concepts';
import {
  DEFAULT_IDENTITY_LIFECYCLE_CONFIG,
  IdentityLifecycleConfigResolver,
  type IdentityLifecycleConfig,
  type IdentityLifecycleRule,
} from './identity-evidence-lifecycle.config';

const rule: IdentityLifecycleRule = {
  tenantId: 'synthetic-tenant',
  evidenceTypeConceptCode: 'SYNTHETIC_TYPE',
  operation: 'PURGE',
  retentionPolicyCode: 'SYNTHETIC_POLICY',
  expectedRowVersion: 1,
  expectedDispositionConceptCode: 'SYNTHETIC_DISPOSITION',
  entityRegistryId: 'synthetic-registry',
  baseEvent: 'case.completedAt',
  allowedCaseStatusConceptCodes: ['SYNTHETIC_TERMINAL'],
  additionalWaitSeconds: 0,
  fieldRules: [],
  metadataDisposition: 'REMOVE',
  preserveProfile: 'CASE_ANCHOR_WORM_TECHNICAL_REVISION',
  storageDisposition: 'PURGE',
  authorizationRevision: 'synthetic-test-only',
};
function build(
  config: IdentityLifecycleConfig = {
    schemaVersion: 1,
    revision: 'synthetic-v1',
    enabled: true,
    rules: [rule],
  },
) {
  const repo = new GovernanceRepository();
  const policy = {
    rowVersion: 1,
    retentionPeriodDays: 1,
    stateConceptId: CONCEPTS.STATE_ACTIVE,
    dispositionConceptId: SYSOPS.DISPOSITION_DELETE,
  };
  jest
    .spyOn(repo, 'findRetentionPolicyByCode')
    .mockImplementation(async () => policy as never);
  const find = jest
    .fn<(entity: unknown, criteria: { code?: string }) => Promise<unknown[]>>()
    .mockImplementation(async (entity, criteria) =>
      entity === EntityRegistry
        ? [{ id: 'synthetic-registry', stateConceptId: CONCEPTS.STATE_ACTIVE }]
        : [
            {
              id:
                criteria.code === 'SYNTHETIC_DISPOSITION'
                  ? SYSOPS.DISPOSITION_DELETE
                  : criteria.code,
              stateConceptId: CONCEPTS.STATE_ACTIVE,
            },
          ],
    );
  const tx = { find } as unknown as EntityManager;
  const resolver = new IdentityLifecycleConfigResolver(repo, config);
  return {
    policy,
    find,
    resolve: () =>
      resolver.resolve(tx, 'synthetic-tenant', 'SYNTHETIC_TYPE', 'PURGE'),
  };
}
describe('configuration binding — no seeds, DB or real evidence', () => {
  it('ships disabled with no enabling policy', async () => {
    const test = build(DEFAULT_IDENTITY_LIFECYCLE_CONFIG);
    await expect(test.resolve()).rejects.toThrow('MISSING_CONFIGURATION');
    expect(test.find).not.toHaveBeenCalled();
  });
  it('binds exact registry, policy version and concepts', async () => {
    await expect(build().resolve()).resolves.toMatchObject({
      retentionPeriodDays: 1,
      evidenceTypeConceptId: 'SYNTHETIC_TYPE',
    });
  });
  it('denies duplicate type/operation rules', async () => {
    await expect(
      build({
        schemaVersion: 1,
        revision: 'test',
        enabled: true,
        rules: [rule, rule],
      }).resolve(),
    ).rejects.toThrow('MISSING_OR_DUPLICATE_BINDING');
  });
  it('does not treat a registry default as an explicit rule', async () => {
    await expect(
      build({
        schemaVersion: 1,
        revision: 'test',
        enabled: true,
        rules: [],
      }).resolve(),
    ).rejects.toThrow('MISSING_OR_DUPLICATE_BINDING');
  });
  it('denies stale policy and missing period', async () => {
    const stale = build();
    stale.policy.rowVersion = 2;
    await expect(stale.resolve()).rejects.toThrow('RETENTION_POLICY_INVALID');
    const missing = build();
    missing.policy.retentionPeriodDays = NaN;
    await expect(missing.resolve()).rejects.toThrow('RETENTION_POLICY_INVALID');
  });
  it('denies duplicate registry records rather than choosing the first', async () => {
    const test = build();
    test.find.mockResolvedValue([{ id: 'one' }, { id: 'two' }]);
    await expect(test.resolve()).rejects.toThrow('REGISTRY_BINDING_INVALID');
  });
});
