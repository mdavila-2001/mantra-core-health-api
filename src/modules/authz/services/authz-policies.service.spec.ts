import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuthzPoliciesService } from './authz-policies.service';
import { ConflictException } from '../../../common';

const actor = { id: 'priv-1', roles: ['SECURITY_ADMIN'] } as any;
const tenantId = 'tenant-1';

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const policiesRepo = { findByTenantTargetPriority: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AuthzPoliciesService(em as any, policiesRepo as any, logger as any);
  return { service, tx, policiesRepo };
}

describe('AuthzPoliciesService (UC-06-02)', () => {
  it('publishes an access policy', async () => {
    const d = build();
    d.policiesRepo.findByTenantTargetPriority.mockResolvedValue(null);
    const created = { id: 'pol-1', createdAt: new Date('2026-01-03') };
    d.policiesRepo.create.mockReturnValue(created);

    const res = await d.service.create(
      tenantId,
      { name: 'no-export', effect: 'DENY', targetResource: 'patient.record', priority: 10 } as any,
      actor,
    );

    expect(res).toEqual({ id: 'pol-1', status: 'ACTIVE', createdAt: created.createdAt });
    expect(d.tx.flush).toHaveBeenCalled();
  });

  it('rejects a duplicated priority for the same target', async () => {
    const d = build();
    d.policiesRepo.findByTenantTargetPriority.mockResolvedValue({ id: 'pol-x' });
    await expect(
      d.service.create(
        tenantId,
        { name: 'dup', effect: 'ALLOW', targetResource: 'patient.record', priority: 10 } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(d.policiesRepo.create).not.toHaveBeenCalled();
  });

  it('skips the priority check when no priority is given', async () => {
    const d = build();
    d.policiesRepo.create.mockReturnValue({ id: 'pol-2', createdAt: new Date() });
    await d.service.create(tenantId, { name: 'p', effect: 'ALLOW' } as any, actor);
    expect(d.policiesRepo.findByTenantTargetPriority).not.toHaveBeenCalled();
  });
});
