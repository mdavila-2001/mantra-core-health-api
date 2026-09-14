import { describe, it, expect } from '@jest/globals';
import {
  fixtureRows,
  fixtureSpec,
  syntheticId,
  registryTables,
  createIdentityFixture,
} from './identity-evidence-fixture';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { StoragePublicationService } from '../../src/common/storage/storage-publication.service';

describe('7.2 synthetic fixture construction (no DB/storage I/O)', () => {
  it('contains only deterministic synthetic IDs, minimal values and canonical table/column names', () => {
    const rows = fixtureRows((code) => `resolved:${code}`);
    expect(rows).toHaveLength(20);
    expect(new Set(rows.map((r) => r.values.id)).size).toBe(rows.length);
    expect(
      rows.every((r) =>
        String(r.values.id).startsWith('07200000-0000-4000-8000-000000000'),
      ),
    ).toBe(true);
    expect(
      rows.filter((r) => r.table === 'audit.identity_verification_access_log'),
    ).toHaveLength(5);
    expect(
      rows
        .filter((r) => r.table === 'directory.tenant_memberships')
        .map((r) => r.values.tenant_id),
    ).toEqual(fixtureSpec.tenantIds);
    expect(
      rows
        .filter(
          (r) => r.table === 'identity_assurance.identity_verification_cases',
        )
        .map((r) => r.values.id),
    ).toEqual(fixtureSpec.graphs.map((g) => g.caseId));
    expect(
      rows.find((r) => r.table === 'system_ops.legal_holds')?.values.ends_at,
    ).toBeNull();
    expect(registryTables).toHaveLength(8);
    expect(syntheticId(911)).toBe('07200000-0000-4000-8000-000000000911');
  });
  it('has no cleanup/reset path and rejects unaccredited environments before accessing a DB', async () => {
    await expect(
      createIdentityFixture(
        {} as EntityManager,
        {} as StoragePublicationService,
      ),
    ).rejects.toThrow('SYNTHETIC_FIXTURE_ENVIRONMENT_UNPROVEN');
  });
});
