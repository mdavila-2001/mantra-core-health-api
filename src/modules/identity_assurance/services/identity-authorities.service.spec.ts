import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' sin las tipificaciones estrictas de @jest/globals.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IdentityAuthoritiesService } from './identity-authorities.service';
import { CONCEPTS, ResourceNotFoundException } from '../../../common';
import { IDA } from '../identity_assurance.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const authoritiesRepo = { create: mockFn(), findById: mockFn() };
  const endpointsRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IdentityAuthoritiesService(
    em as any,
    authoritiesRepo as any,
    endpointsRepo as any,
    logger as any,
  );
  return { service, tx, authoritiesRepo, endpointsRepo };
}

describe('IdentityAuthoritiesService', () => {
  it('registers an authority in active state (UC-27-01)', async () => {
    const d = build();
    d.authoritiesRepo.create.mockReturnValue({
      id: 'a1',
      authorityCode: 'REG',
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      createdAt: new Date('2026-01-01'),
    });
    const res = await d.service.registerAuthority(
      { tenantId: 't1', authorityCode: 'REG', name: 'Registro', authorityTypeConceptId: 'c1' } as any,
      actor,
    );
    expect(res.id).toBe('a1');
    expect(res.status).toBe(CONCEPTS.STATE_ACTIVE);
    expect(d.authoritiesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ verificationStatusConceptId: IDA.AUTHORITY_VERIFIED }),
    );
    expect(d.tx.flush).toHaveBeenCalled();
  });

  it('rejects adding an endpoint to a missing authority (UC-27-01)', async () => {
    const d = build();
    d.authoritiesRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.addEndpoint('missing', { integrationEndpointId: 'e1', capabilityConceptId: 'c1' } as any, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.endpointsRepo.create).not.toHaveBeenCalled();
  });
});
