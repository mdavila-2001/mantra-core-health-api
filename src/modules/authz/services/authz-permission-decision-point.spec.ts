import { jest } from '@jest/globals';
import { AuthzPermissionDecisionPoint } from './authz-permission-decision-point';
import type { AuthzPdpService } from './authz-pdp.service';

const TENANT = '11111111-1111-4111-8111-111111111111';
const RESOURCE = '33333333-3333-4333-8333-333333333333';

describe('AuthzPermissionDecisionPoint', () => {
  function build(decision: 'PERMIT' | 'DENY') {
    const evaluate = jest.fn(async () => ({
      decision,
      reason: decision === 'PERMIT' ? 'allow por rol' : 'deny por defecto',
      effectiveRoleIds: [],
      maskedFields: [],
      cacheKey: 'k',
      ttlSeconds: 300,
    }));
    const pdp = { evaluate } as unknown as AuthzPdpService;
    return { adapter: new AuthzPermissionDecisionPoint(pdp), evaluate };
  }

  it('delega en AuthzPdpService.evaluate sin paciente (no es PHI) y devuelve decisión y motivo', async () => {
    const { adapter, evaluate } = build('PERMIT');
    const actor = { id: 'u1', roles: ['ACCOUNTING_APPROVER'] };
    const verdict = await adapter.decide(
      {
        userId: 'u1',
        tenantId: TENANT,
        resource: 'accounting.journal_transactions.approve',
        action: 'APPROVE',
        resourceId: RESOURCE,
      },
      actor,
    );
    expect(verdict).toEqual({ decision: 'PERMIT', reason: 'allow por rol' });
    expect(evaluate).toHaveBeenCalledWith(
      {
        userId: 'u1',
        tenantId: TENANT,
        resource: 'accounting.journal_transactions.approve',
        action: 'APPROVE',
        resourceId: RESOURCE,
      },
      actor,
    );
    const [dto] = evaluate.mock.calls[0] as unknown as [
      Record<string, unknown>,
    ];
    expect(dto).not.toHaveProperty('patientProfileId');
  });

  it('propaga el DENY y no inventa resourceId', async () => {
    const { adapter, evaluate } = build('DENY');
    const verdict = await adapter.decide(
      {
        userId: 'u1',
        tenantId: TENANT,
        resource: 'a.b.delete',
        action: 'DELETE',
      },
      { id: 'u1', roles: [] },
    );
    expect(verdict.decision).toBe('DENY');
    const [dto] = evaluate.mock.calls[0] as unknown as [
      Record<string, unknown>,
    ];
    expect(dto).not.toHaveProperty('resourceId');
  });

  it('un error del PDP se propaga (la guarda decide fail-closed)', async () => {
    const pdp = {
      evaluate: jest.fn(async () => {
        throw new Error('db down');
      }),
    } as unknown as AuthzPdpService;
    await expect(
      new AuthzPermissionDecisionPoint(pdp).decide(
        {
          userId: 'u1',
          tenantId: TENANT,
          resource: 'a.b.delete',
          action: 'DELETE',
        },
        { id: 'u1', roles: [] },
      ),
    ).rejects.toThrow('db down');
  });
});
