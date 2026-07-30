import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IdentityCasesController } from './identity-cases.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const casesService = {
    openCase: mockFn(),
    submitEvidence: mockFn(),
    planChecks: mockFn(),
    raiseFraudSignal: mockFn(),
    openManualReview: mockFn(),
    issueAssertion: mockFn(),
    expireSweep: mockFn(),
  };
  return {
    controller: new IdentityCasesController(casesService as any),
    casesService,
  };
}

describe('IdentityCasesController', () => {
  it('delegates open (UC-27-02)', async () => {
    const d = build();
    const dto = { identityVerificationPolicyId: 'p1' };
    await d.controller.open(dto as any, actor);
    expect(d.casesService.openCase).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates submitEvidence (UC-27-03)', async () => {
    const d = build();
    await d.controller.submitEvidence(
      'k1',
      { evidenceTypeConceptId: 'e' },
      actor,
    );
    expect(d.casesService.submitEvidence).toHaveBeenCalledWith(
      'k1',
      { evidenceTypeConceptId: 'e' },
      actor,
    );
  });

  it('delegates planChecks (UC-27-04)', async () => {
    const d = build();
    await d.controller.planChecks('k1', { checks: [] }, actor);
    expect(d.casesService.planChecks).toHaveBeenCalledWith(
      'k1',
      { checks: [] },
      actor,
    );
  });

  it('delegates raiseFraudSignal (UC-27-07)', async () => {
    const d = build();
    await d.controller.raiseFraudSignal('k1', {} as any, actor);
    expect(d.casesService.raiseFraudSignal).toHaveBeenCalledWith(
      'k1',
      {},
      actor,
    );
  });

  it('delegates openManualReview (UC-27-08)', async () => {
    const d = build();
    await d.controller.openManualReview('k1', {} as any, actor);
    expect(d.casesService.openManualReview).toHaveBeenCalledWith(
      'k1',
      {},
      actor,
    );
  });

  it('delegates issueAssertion (UC-27-10)', async () => {
    const d = build();
    await d.controller.issueAssertion(
      'k1',
      { issuerIdentityAuthorityId: 'a' },
      actor,
    );
    expect(d.casesService.issueAssertion).toHaveBeenCalledWith(
      'k1',
      { issuerIdentityAuthorityId: 'a' },
      actor,
    );
  });

  it('delegates expireSweep (UC-27-12)', async () => {
    const d = build();
    await d.controller.expireSweep(actor);
    expect(d.casesService.expireSweep).toHaveBeenCalledWith(actor);
  });
});
