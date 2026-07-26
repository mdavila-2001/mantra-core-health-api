import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IdentityPoliciesService } from './identity-policies.service';
import { CONCEPTS } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

describe('IdentityPoliciesService', () => {
  it('creates an active, currently-effective policy (soporte UC-27-02)', async () => {
    const tx = { flush: mockFn().mockResolvedValue(undefined) };
    const em = { transactional: mockFn((cb: any) => cb(tx)) };
    const policiesRepo = {
      create: mockFn().mockReturnValue({ id: 'p1', policyCode: 'POL', statusConceptId: CONCEPTS.STATE_ACTIVE, createdAt: new Date() }),
    };
    const logger = { setContext: mockFn(), info: mockFn() };
    const service = new IdentityPoliciesService(em as any, policiesRepo as any, logger as any);

    const res = await service.createPolicy(
      {
        policyCode: 'POL',
        subjectTypeConceptId: 's',
        transactionRiskConceptId: 'r',
        requiredIdentityAssuranceLevelConceptId: 'IAL2',
      } as any,
      actor,
    );
    expect(res.id).toBe('p1');
    expect(policiesRepo.create).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ versionNumber: 1, statusConceptId: CONCEPTS.STATE_ACTIVE }),
    );
  });
});
