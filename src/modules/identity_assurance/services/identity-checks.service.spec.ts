import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IdentityChecksService } from './identity-checks.service';
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
  const checksRepo = {
    findById: mockFn(),
    countOpenRequiredByCase: mockFn().mockResolvedValue(0),
  };
  const attemptsRepo = {
    countByCase: mockFn().mockResolvedValue(0),
    existsCompletedForCase: mockFn().mockResolvedValue(true),
    findLatestByCase: mockFn().mockResolvedValue(null),
    create: mockFn(),
  };
  const resultsRepo = {
    countByCheck: mockFn().mockResolvedValue(0),
    findLatestByCheck: mockFn().mockResolvedValue(null),
    create: mockFn(),
  };
  const casesRepo = { findById: mockFn().mockResolvedValue(null) };
  const assertionsRepo = { create: mockFn(() => ({ id: 'assert-1' })) };
  const effects = { applyVerified: mockFn().mockResolvedValue(undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IdentityChecksService(
    em as any,
    checksRepo as any,
    attemptsRepo,
    resultsRepo,
    casesRepo as any,
    assertionsRepo as any,
    effects as any,
    logger as any,
  );
  return {
    service,
    tx,
    checksRepo,
    attemptsRepo,
    resultsRepo,
    casesRepo,
    assertionsRepo,
    effects,
  };
}

describe('IdentityChecksService', () => {
  describe('recordAttempt (UC-27-05)', () => {
    it('numbers the attempt per case and moves the check to in-progress', async () => {
      const d = build();
      const check: any = {
        id: 'ch1',
        identityVerificationCaseId: 'k1',
        statusConceptId: IDA.CHECK_PENDING,
        updatedAt: new Date(),
      };
      d.checksRepo.findById.mockResolvedValue(check);
      d.attemptsRepo.countByCase.mockResolvedValue(2);
      d.attemptsRepo.create.mockReturnValue({
        id: 'at1',
        attemptNumber: 3,
        outcomeConceptId: IDA.ATTEMPT_SUCCESS,
      });
      const res = await d.service.recordAttempt(
        'ch1',
        { identityAuthorityEndpointId: 'ep1' },
        actor,
      );
      expect(res.attemptNumber).toBe(3);
      expect(check.statusConceptId).toBe(IDA.CHECK_IN_PROGRESS);
      expect(d.attemptsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ attemptNumber: 3 }),
      );
    });

    it('throws when the check does not exist', async () => {
      const d = build();
      d.checksRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.recordAttempt(
          'missing',
          { identityAuthorityEndpointId: 'ep1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('recordResult (UC-27-06)', () => {
    it('requires a completed attempt (precondition)', async () => {
      const d = build();
      d.checksRepo.findById.mockResolvedValue({
        id: 'ch1',
        identityVerificationCaseId: 'k1',
      });
      d.attemptsRepo.existsCompletedForCase.mockResolvedValue(false);
      await expect(
        d.service.recordResult('ch1', { result: 'MATCH' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('appends a versioned result chaining supersede and completes the check', async () => {
      const d = build();
      const check: any = {
        id: 'ch1',
        identityVerificationCaseId: 'k1',
        statusConceptId: IDA.CHECK_IN_PROGRESS,
        updatedAt: new Date(),
      };
      d.checksRepo.findById.mockResolvedValue(check);
      d.resultsRepo.findLatestByCheck.mockResolvedValue({ id: 'r0' });
      d.resultsRepo.countByCheck.mockResolvedValue(1);
      d.resultsRepo.create.mockReturnValue({
        id: 'r1',
        resultVersion: 2,
        resultConceptId: IDA.RESULT_MATCH,
      });
      const res = await d.service.recordResult(
        'ch1',
        { result: 'MATCH' } as any,
        actor,
      );
      expect(res.resultVersion).toBe(2);
      expect(check.statusConceptId).toBe(IDA.CHECK_COMPLETED);
      expect(d.resultsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ supersedesResultId: 'r0', resultVersion: 2 }),
      );
    });
  });

  describe('cierre del caso al registrar el resultado', () => {
    /** Check obligatorio en curso, con su caso abierto detrás. */
    function requiredCheck(d: ReturnType<typeof build>, kase: any) {
      const check: any = {
        id: 'ch1',
        identityVerificationCaseId: kase.id,
        required: true,
        statusConceptId: IDA.CHECK_IN_PROGRESS,
        updatedAt: new Date(),
      };
      d.checksRepo.findById.mockResolvedValue(check);
      d.casesRepo.findById.mockResolvedValue(kase);
      d.resultsRepo.create.mockReturnValue({
        id: 'r1',
        resultVersion: 1,
        resultConceptId: IDA.RESULT_MATCH,
      });
      return check;
    }

    /** Caso abierto mínimo. */
    function openCase(overrides: Record<string, unknown> = {}) {
      return {
        id: 'k1',
        statusConceptId: IDA.CASE_IN_VERIFICATION,
        subjectTypeConceptId: IDA.SUBJECT_PATIENT_IDENTITY,
        subjectEntityId: 'person-1',
        requestedAssuranceLevelConceptId: IDA.ASSURANCE_LEVEL_IAL2,
        updatedAt: new Date(),
        ...overrides,
      } as any;
    }

    it('verifies, asserts and applies the domain effect on the last required check', async () => {
      const d = build();
      const kase = openCase();
      requiredCheck(d, kase);
      d.checksRepo.countOpenRequiredByCase.mockResolvedValue(0);

      const res = await d.service.recordResult(
        'ch1',
        { result: 'MATCH' } as any,
        actor,
      );

      // El caso pasa por VERIFIED y termina en ASSERTED: sin aserción no
      // habilitaría nada, que era justo el vacío que este flujo cierra.
      expect(kase.statusConceptId).toBe(IDA.CASE_ASSERTED);
      expect(d.assertionsRepo.create).toHaveBeenCalled();
      expect(d.effects.applyVerified).toHaveBeenCalledWith(
        d.tx,
        kase,
        actor.id,
      );
      expect(res.caseStatus).toBe(IDA.CASE_ASSERTED);
    });

    it('leaves the case open while another required check is still pending', async () => {
      const d = build();
      const kase = openCase();
      requiredCheck(d, kase);
      d.checksRepo.countOpenRequiredByCase.mockResolvedValue(1);

      const res = await d.service.recordResult(
        'ch1',
        { result: 'MATCH' } as any,
        actor,
      );

      expect(kase.statusConceptId).toBe(IDA.CASE_IN_VERIFICATION);
      expect(d.assertionsRepo.create).not.toHaveBeenCalled();
      expect(res.caseStatus).toBeUndefined();
    });

    it('rejects the case as soon as a required check does not match', async () => {
      const d = build();
      const kase = openCase();
      requiredCheck(d, kase);

      const res = await d.service.recordResult(
        'ch1',
        { result: 'NO_MATCH' } as any,
        actor,
      );

      expect(kase.statusConceptId).toBe(IDA.CASE_REJECTED);
      expect(res.caseStatus).toBe(IDA.CASE_REJECTED);
      // No se espera al resto de checks: un obligatorio fallido ya decide.
      expect(d.checksRepo.countOpenRequiredByCase).not.toHaveBeenCalled();
      expect(d.effects.applyVerified).not.toHaveBeenCalled();
    });

    it('never lets an optional check decide the case', async () => {
      const d = build();
      const kase = openCase();
      const check = requiredCheck(d, kase);
      check.required = false;

      const res = await d.service.recordResult(
        'ch1',
        { result: 'NO_MATCH' } as any,
        actor,
      );

      expect(kase.statusConceptId).toBe(IDA.CASE_IN_VERIFICATION);
      expect(res.caseStatus).toBeUndefined();
    });

    it('does not resurrect a case that already expired', async () => {
      const d = build();
      const kase = openCase({ statusConceptId: IDA.CASE_EXPIRED });
      requiredCheck(d, kase);
      d.checksRepo.countOpenRequiredByCase.mockResolvedValue(0);

      const res = await d.service.recordResult(
        'ch1',
        { result: 'MATCH' } as any,
        actor,
      );

      expect(kase.statusConceptId).toBe(IDA.CASE_EXPIRED);
      expect(d.assertionsRepo.create).not.toHaveBeenCalled();
      expect(res.caseStatus).toBeUndefined();
    });
  });
});
