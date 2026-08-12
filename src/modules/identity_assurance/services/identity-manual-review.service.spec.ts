import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IdentityManualReviewService } from './identity-manual-review.service';
import { PreconditionFailedException } from '../../../common';
import { IDA } from '../identity_assurance.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const reviewRepo = { findById: mockFn() };
  const casesRepo = { findById: mockFn() };
  const fraudRepo = { resolveOpenForCase: mockFn().mockResolvedValue(0) };
  // Simula el efecto real: cerrar checks y dejar el caso asertado (H-01).
  const checksService = {
    settleManualApproval: mockFn(async (_tx: any, kase: any) => {
      kase.statusConceptId = IDA.CASE_ASSERTED;
      kase.completedAt = new Date();
      return kase.statusConceptId;
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IdentityManualReviewService(
    em as any,
    reviewRepo as any,
    casesRepo as any,
    fraudRepo as any,
    checksService as any,
    logger as any,
  );
  return { service, tx, reviewRepo, casesRepo, fraudRepo, checksService };
}

describe('IdentityManualReviewService', () => {
  it('approves the review, verifies the case and closes fraud signals (UC-27-09)', async () => {
    const d = build();
    const review: any = {
      id: 'rv1',
      identityVerificationCaseId: 'k1',
      statusConceptId: IDA.REVIEW_OPEN,
      assignedToUserId: 'admin-1',
      updatedAt: new Date(),
    };
    const kase: any = {
      id: 'k1',
      statusConceptId: IDA.CASE_MANUAL_REVIEW,
      updatedAt: new Date(),
    };
    d.reviewRepo.findById.mockResolvedValue(review);
    d.casesRepo.findById.mockResolvedValue(kase);
    const res = await d.service.decide(
      'rv1',
      { decision: 'APPROVED' } as any,
      actor,
    );
    // H-01: aprobar delega el cierre de checks + aserción al camino existente,
    // y el caso termina ASSERTED, no VERIFIED a mano.
    expect(d.checksService.settleManualApproval).toHaveBeenCalledWith(
      d.tx,
      kase,
      actor,
    );
    expect(res.caseStatus).toBe(IDA.CASE_ASSERTED);
    expect(review.statusConceptId).toBe(IDA.REVIEW_DECIDED);
    expect(d.fraudRepo.resolveOpenForCase).toHaveBeenCalledWith(
      d.tx,
      'k1',
      IDA.FRAUD_OPEN,
      IDA.FRAUD_RESOLVED,
    );
  });

  it('rejects the case directly, without closing checks nor issuing an assertion', async () => {
    const d = build();
    const review: any = {
      id: 'rv1',
      identityVerificationCaseId: 'k1',
      statusConceptId: IDA.REVIEW_OPEN,
      assignedToUserId: 'admin-1',
      updatedAt: new Date(),
    };
    const kase: any = {
      id: 'k1',
      statusConceptId: IDA.CASE_MANUAL_REVIEW,
      updatedAt: new Date(),
    };
    d.reviewRepo.findById.mockResolvedValue(review);
    d.casesRepo.findById.mockResolvedValue(kase);
    const res = await d.service.decide(
      'rv1',
      { decision: 'REJECTED' } as any,
      actor,
    );
    expect(res.caseStatus).toBe(IDA.CASE_REJECTED);
    expect(kase.completedAt).toBeInstanceOf(Date);
    expect(d.checksService.settleManualApproval).not.toHaveBeenCalled();
  });

  it('rejects deciding a review assigned to another reviewer', async () => {
    const d = build();
    d.reviewRepo.findById.mockResolvedValue({
      id: 'rv1',
      identityVerificationCaseId: 'k1',
      statusConceptId: IDA.REVIEW_OPEN,
      assignedToUserId: 'someone-else',
    });
    await expect(
      d.service.decide('rv1', { decision: 'APPROVED' } as any, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });
});
