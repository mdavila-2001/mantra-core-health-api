import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IdentityCasesService } from './identity-cases.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { IDA } from '../identity_assurance.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const casesRepo = {
    findById: mockFn(),
    create: mockFn(),
    countLiveForSubject: mockFn().mockResolvedValue(0),
    findExpirable: mockFn().mockResolvedValue([]),
  };
  const policiesRepo = { findById: mockFn() };
  const evidenceRepo = { create: mockFn() };
  const checksRepo = {
    create: mockFn(),
    countByCaseAndStatus: mockFn().mockResolvedValue(1),
    findPendingByCase: mockFn().mockResolvedValue([]),
  };
  const fraudRepo = { create: mockFn() };
  const reviewRepo = {
    countOpenByCase: mockFn().mockResolvedValue(0),
    create: mockFn(),
  };
  const assertionsRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IdentityCasesService(
    em as any,
    casesRepo,
    policiesRepo as any,
    evidenceRepo,
    checksRepo as any,
    fraudRepo as any,
    reviewRepo as any,
    assertionsRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    casesRepo,
    policiesRepo,
    evidenceRepo,
    checksRepo,
    fraudRepo,
    reviewRepo,
    assertionsRepo,
  };
}

describe('IdentityCasesService', () => {
  describe('openCase (UC-27-02)', () => {
    it('applies the policy assurance level and opens the case', async () => {
      const d = build();
      d.policiesRepo.findById.mockResolvedValue({
        id: 'p1',
        requiredIdentityAssuranceLevelConceptId: 'IAL2',
      });
      d.casesRepo.create.mockReturnValue({
        id: 'k1',
        statusConceptId: IDA.CASE_OPEN,
        openedAt: new Date(),
        expiresAt: new Date(),
      });
      const res = await d.service.openCase(
        {
          identityVerificationPolicyId: 'p1',
          subjectTypeConceptId: 's',
          subjectEntityId: 'e',
        },
        actor,
      );
      expect(res.status).toBe(IDA.CASE_OPEN);
      expect(d.casesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          requestedAssuranceLevelConceptId: 'IAL2',
          statusConceptId: IDA.CASE_OPEN,
        }),
      );
    });

    it('throws when the policy does not exist', async () => {
      const d = build();
      d.policiesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.openCase(
          {
            identityVerificationPolicyId: 'missing',
            subjectTypeConceptId: 's',
            subjectEntityId: 'e',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('planChecks (UC-27-04)', () => {
    it('rejects planning on a non-open case (precondition)', async () => {
      const d = build();
      d.casesRepo.findById.mockResolvedValue({
        id: 'k1',
        statusConceptId: IDA.CASE_VERIFIED,
      });
      await expect(
        d.service.planChecks(
          'k1',
          { checks: [{ checkTypeConceptId: 'c' }] } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates checks and moves the case to in-verification', async () => {
      const d = build();
      const kase: any = {
        id: 'k1',
        statusConceptId: IDA.CASE_OPEN,
        updatedAt: new Date(),
      };
      d.casesRepo.findById.mockResolvedValue(kase);
      d.checksRepo.create
        .mockReturnValueOnce({ id: 'ch1' })
        .mockReturnValueOnce({ id: 'ch2' });
      const res = await d.service.planChecks(
        'k1',
        {
          checks: [{ checkTypeConceptId: 'a' }, { checkTypeConceptId: 'b' }],
        },
        actor,
      );
      expect(res.checkIds).toEqual(['ch1', 'ch2']);
      expect(kase.statusConceptId).toBe(IDA.CASE_IN_VERIFICATION);
    });
  });

  describe('issueAssertion (UC-27-10)', () => {
    it('rejects when the case is not verified', async () => {
      const d = build();
      d.casesRepo.findById.mockResolvedValue({
        id: 'k1',
        statusConceptId: IDA.CASE_IN_VERIFICATION,
      });
      await expect(
        d.service.issueAssertion(
          'k1',
          { issuerIdentityAuthorityId: 'a1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('issues the assertion and marks the case asserted', async () => {
      const d = build();
      const kase: any = {
        id: 'k1',
        statusConceptId: IDA.CASE_VERIFIED,
        subjectTypeConceptId: 's',
        subjectEntityId: 'e',
        requestedAssuranceLevelConceptId: 'IAL2',
        updatedAt: new Date(),
      };
      d.casesRepo.findById.mockResolvedValue(kase);
      d.assertionsRepo.create.mockReturnValue({
        id: 'as1',
        assertionIdentifier: 'X',
        assuranceLevelConceptId: 'IAL2',
        issuedAt: new Date(),
      });
      const res = await d.service.issueAssertion(
        'k1',
        { issuerIdentityAuthorityId: 'a1' },
        actor,
      );
      expect(res.id).toBe('as1');
      expect(kase.statusConceptId).toBe(IDA.CASE_ASSERTED);
    });
  });

  describe('expireSweep (UC-27-12)', () => {
    it('expires vencidos cases and cancels pending checks', async () => {
      const d = build();
      const kase: any = {
        id: 'k1',
        statusConceptId: IDA.CASE_OPEN,
        updatedAt: new Date(),
      };
      const check: any = {
        id: 'ch1',
        statusConceptId: IDA.CHECK_PENDING,
        updatedAt: new Date(),
      };
      d.casesRepo.findExpirable.mockResolvedValue([kase]);
      d.checksRepo.findPendingByCase.mockResolvedValue([check]);
      const res = await d.service.expireSweep(actor);
      expect(res.expiredCount).toBe(1);
      expect(kase.statusConceptId).toBe(IDA.CASE_EXPIRED);
      expect(check.statusConceptId).toBe(IDA.CHECK_CANCELLED);
    });
  });
});
