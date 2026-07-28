import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IdentityAuthoritiesController } from './identity-authorities.controller';
import { IdentityPoliciesController } from './identity-policies.controller';
import { IdentityChecksController } from './identity-checks.controller';
import { IdentityManualReviewController } from './identity-manual-review.controller';
import { IdentityAssertionsController } from './identity-assertions.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

describe('IdentityAuthoritiesController', () => {
  it('delegates register and addEndpoint (UC-27-01)', async () => {
    const svc = { registerAuthority: mockFn(), addEndpoint: mockFn() };
    const c = new IdentityAuthoritiesController(svc as any);
    await c.register({ authorityCode: 'A' } as any, actor);
    expect(svc.registerAuthority).toHaveBeenCalledWith(
      { authorityCode: 'A' },
      actor,
    );
    await c.addEndpoint('a1', { integrationEndpointId: 'e' } as any, actor);
    expect(svc.addEndpoint).toHaveBeenCalledWith(
      'a1',
      { integrationEndpointId: 'e' },
      actor,
    );
  });
});

describe('IdentityPoliciesController', () => {
  it('delegates create (soporte UC-27-02)', async () => {
    const svc = { createPolicy: mockFn() };
    const c = new IdentityPoliciesController(svc as any);
    await c.create({ policyCode: 'P' } as any, actor);
    expect(svc.createPolicy).toHaveBeenCalledWith({ policyCode: 'P' }, actor);
  });
});

describe('IdentityChecksController', () => {
  it('delegates recordAttempt and recordResult (UC-27-05/06)', async () => {
    const svc = { recordAttempt: mockFn(), recordResult: mockFn() };
    const c = new IdentityChecksController(svc as any);
    await c.recordAttempt('ch1', { identityAuthorityEndpointId: 'e' }, actor);
    expect(svc.recordAttempt).toHaveBeenCalledWith(
      'ch1',
      { identityAuthorityEndpointId: 'e' },
      actor,
    );
    await c.recordResult('ch1', { result: 'MATCH' } as any, actor);
    expect(svc.recordResult).toHaveBeenCalledWith(
      'ch1',
      { result: 'MATCH' },
      actor,
    );
  });
});

describe('IdentityManualReviewController', () => {
  it('delegates decide (UC-27-09)', async () => {
    const svc = { decide: mockFn() };
    const c = new IdentityManualReviewController(svc as any);
    await c.decide('rv1', { decision: 'APPROVED' } as any, actor);
    expect(svc.decide).toHaveBeenCalledWith(
      'rv1',
      { decision: 'APPROVED' },
      actor,
    );
  });
});

describe('IdentityAssertionsController', () => {
  it('delegates revoke (UC-27-11)', async () => {
    const svc = { revoke: mockFn() };
    const c = new IdentityAssertionsController(svc as any);
    await c.revoke('as1', {}, actor);
    expect(svc.revoke).toHaveBeenCalledWith('as1', {}, actor);
  });
});
