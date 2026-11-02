import { jest } from '@jest/globals';
import { ExternalSystemRepository } from './external-system.repository';
import { INTEG } from '../../../integrations/integrations.concepts';

it('status update is one bound compare-and-set, scoped to tenant, active credential and business snapshot excluding prior telemetry', async () => {
  const em = { execute: jest.fn(async () => []) };
  const lastCheck = {
    status: 'ERROR',
    errorReason: 'AUTH_REJECTED',
    checkedAt: '2026-11-01T18:00:00Z',
  } as const;
  const configJson = {
    kind: 'PHARMACY_EXTERNAL_SYSTEM',
    format: 'ALOVIDA_STANDARD',
    baseUrl: 'https://erp.invalid',
    externalPharmacyCode: 'SYNTHETIC',
  };
  await new ExternalSystemRepository().recordCheck(em as any, {
    tenantId: 'tenant',
    check: { connectionId: 'provider', credentialId: 'credential', configJson },
    lastCheck,
    actorUserId: 'actor',
  });
  expect(em.execute).toHaveBeenCalledTimes(1);
  const [sql, args] = em.execute.mock.calls[0] as any;
  expect(sql).toContain('c.tenant_id = ?');
  expect(sql).toContain(
    "(c.config_json - 'lastCheck') = (?::jsonb - 'lastCheck')",
  );
  expect(sql).toContain(
    "coalesce(c.config_json->'lastCheck'->>'checkedAt', '') <= ?",
  );
  expect(sql).toContain('k.connection_id = c.id');
  expect(sql).toContain('k.id = ?');
  expect(sql).toContain('row_version = c.row_version + 1');
  expect(args).toEqual([
    JSON.stringify(lastCheck),
    'actor',
    'provider',
    'tenant',
    INTEG.CONN_ACTIVE,
    JSON.stringify(configJson),
    lastCheck.checkedAt,
    'credential',
    INTEG.CRED_ACTIVE,
  ]);
});
