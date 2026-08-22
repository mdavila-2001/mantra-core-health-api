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
import { IDENTITY_CARD_VERTICAL } from '../identity_assurance.seed';

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
    findRequiredByCase: mockFn().mockResolvedValue([]),
  };
  const attemptsRepo = {
    countByCase: mockFn().mockResolvedValue(0),
    existsCompletedForCase: mockFn().mockResolvedValue(true),
    findLatestCompletedByCase: mockFn().mockResolvedValue({
      identityAuthorityEndpointId: 'authority-endpoint-1',
    }),
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
  const authorityEndpointsRepo = {
    findById: mockFn().mockResolvedValue({
      identityAuthorityId: 'authority-1',
    }),
  };
  const effects = { applyVerified: mockFn().mockResolvedValue(undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IdentityChecksService(
    em as any,
    checksRepo as any,
    attemptsRepo,
    resultsRepo,
    casesRepo as any,
    assertionsRepo as any,
    authorityEndpointsRepo as any,
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
    authorityEndpointsRepo,
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

    /** Check en curso cuyo intento sigue esperando el veredicto. */
    function checkConIntentoEnVuelo(
      d: ReturnType<typeof build>,
      attempt: Record<string, unknown>,
    ) {
      d.checksRepo.findById.mockResolvedValue({
        id: 'ch1',
        identityVerificationCaseId: 'k1',
        statusConceptId: IDA.CHECK_IN_PROGRESS,
        updatedAt: new Date(),
      });
      d.attemptsRepo.findLatestByCase.mockResolvedValue(attempt);
      // Espeja la base: sólo cuenta como completado el que tiene fecha de cierre.
      d.attemptsRepo.existsCompletedForCase.mockImplementation(() =>
        Promise.resolve(Boolean(attempt.completedAt)),
      );
      d.resultsRepo.create.mockReturnValue({
        id: 'r1',
        resultVersion: 1,
        resultConceptId: IDA.RESULT_MATCH,
      });
    }

    // H-01: el worker asienta un intento PENDIENTE al despachar y vuelve luego
    // con el veredicto. Si ese segundo paso no cierra el intento, la
    // precondición no se cumple nunca y el paciente se queda sin aserción.
    it('cierra el intento en vuelo, y así el veredicto deja de rechazarse (H-01)', async () => {
      const d = build();
      const attempt: Record<string, unknown> = {
        id: 'at1',
        outcomeConceptId: IDA.ATTEMPT_PENDING,
        completedAt: undefined,
      };
      checkConIntentoEnVuelo(d, attempt);

      await expect(
        d.service.recordResult('ch1', { result: 'MATCH' } as any, actor),
      ).resolves.toMatchObject({ checkStatus: IDA.CHECK_COMPLETED });

      expect(attempt.completedAt).toBeInstanceOf(Date);
      expect(attempt.outcomeConceptId).toBe(IDA.ATTEMPT_SUCCESS);
    });

    it('cierra el intento como exitoso aunque el veredicto sea negativo', async () => {
      const d = build();
      const attempt: Record<string, unknown> = {
        id: 'at1',
        outcomeConceptId: IDA.ATTEMPT_PENDING,
        completedAt: undefined,
      };
      checkConIntentoEnVuelo(d, attempt);

      await d.service.recordResult('ch1', { result: 'NO_MATCH' } as any, actor);

      // El desenlace mide si la autoridad contestó, no qué contestó.
      expect(attempt.outcomeConceptId).toBe(IDA.ATTEMPT_SUCCESS);
      expect(attempt.completedAt).toBeInstanceOf(Date);
    });

    it('no reescribe la fecha de cierre de un intento ya completado', async () => {
      const d = build();
      const completadoEl = new Date('2026-08-01T10:00:00.000Z');
      const attempt: Record<string, unknown> = {
        id: 'at1',
        outcomeConceptId: IDA.ATTEMPT_SUCCESS,
        completedAt: completadoEl,
      };
      checkConIntentoEnVuelo(d, attempt);

      await d.service.recordResult('ch1', { result: 'MATCH' } as any, actor);

      expect(attempt.completedAt).toBe(completadoEl);
    });

    it('no resucita un intento que falló al despacharse', async () => {
      const d = build();
      const attempt: Record<string, unknown> = {
        id: 'at1',
        outcomeConceptId: IDA.ATTEMPT_FAILED,
        completedAt: new Date('2026-08-01T10:00:00.000Z'),
      };
      checkConIntentoEnVuelo(d, attempt);

      await d.service.recordResult('ch1', { result: 'MATCH' } as any, actor);

      expect(attempt.outcomeConceptId).toBe(IDA.ATTEMPT_FAILED);
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
      expect(d.assertionsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          issuerIdentityAuthorityId: 'authority-1',
        }),
      );
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

  describe('settleManualApproval (UC-27-09 · H-01)', () => {
    it('closes the open required checks with a positive immutable result and asserts the case', async () => {
      const d = build();
      const kase: any = {
        id: 'k1',
        statusConceptId: IDA.CASE_MANUAL_REVIEW,
        subjectTypeConceptId: IDA.SUBJECT_PATIENT_IDENTITY,
        subjectEntityId: 'person-1',
        updatedAt: new Date(),
      };
      const check: any = {
        id: 'ch1',
        identityVerificationCaseId: 'k1',
        checkTypeConceptId: IDA.CHECK_TYPE_IDENTITY_CARD,
        required: true,
        statusConceptId: IDA.CHECK_IN_PROGRESS,
        updatedAt: new Date(),
      };
      d.checksRepo.findRequiredByCase.mockResolvedValue([check]);

      const res = await d.service.settleManualApproval(
        d.tx as any,
        kase,
        actor,
      );

      expect(d.resultsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          identityCheckId: 'ch1',
          resultConceptId: IDA.RESULT_MATCH,
          checkedByActorTypeConceptId: IDA.ACTOR_TYPE_SYSTEM,
          checkedByActorId: 'admin-1',
        }),
      );
      expect(check.statusConceptId).toBe(IDA.CHECK_COMPLETED);
      expect(d.assertionsRepo.create).toHaveBeenCalled();
      expect(d.effects.applyVerified).toHaveBeenCalledWith(
        d.tx,
        kase,
        'admin-1',
      );
      expect(kase.statusConceptId).toBe(IDA.CASE_ASSERTED);
      expect(res).toBe(IDA.CASE_ASSERTED);
    });

    it('resolves the issuing authority through the check vertical when no attempt completed', async () => {
      const d = build();
      // Escenario real de la aprobación manual: el worker nunca despachó.
      d.attemptsRepo.findLatestCompletedByCase.mockResolvedValue(null);
      const kase: any = {
        id: 'k1',
        statusConceptId: IDA.CASE_IN_VERIFICATION,
        subjectTypeConceptId: IDA.SUBJECT_PATIENT_IDENTITY,
        subjectEntityId: 'person-1',
        updatedAt: new Date(),
      };
      const check: any = {
        id: 'ch1',
        identityVerificationCaseId: 'k1',
        checkTypeConceptId: IDA.CHECK_TYPE_IDENTITY_CARD,
        required: true,
        statusConceptId: IDA.CHECK_PENDING,
        updatedAt: new Date(),
      };
      d.checksRepo.findRequiredByCase.mockResolvedValue([check]);

      await d.service.settleManualApproval(d.tx as any, kase, actor);

      expect(d.authorityEndpointsRepo.findById).toHaveBeenCalledWith(
        d.tx,
        IDENTITY_CARD_VERTICAL.authorityEndpointId,
      );
      expect(kase.statusConceptId).toBe(IDA.CASE_ASSERTED);
    });

    it('refuses to resurrect an expired case left behind by the expire sweep', async () => {
      const d = build();
      // UC-27-12 expiró el caso y canceló sus checks, pero la revisión quedó
      // abierta: aprobarla ahora debe morir antes de escribir resultado alguno.
      const kase: any = {
        id: 'k1',
        statusConceptId: IDA.CASE_EXPIRED,
        subjectTypeConceptId: IDA.SUBJECT_PATIENT_IDENTITY,
        subjectEntityId: 'person-1',
        updatedAt: new Date(),
      };
      const check: any = {
        id: 'ch1',
        identityVerificationCaseId: 'k1',
        checkTypeConceptId: IDA.CHECK_TYPE_IDENTITY_CARD,
        required: true,
        statusConceptId: IDA.CHECK_CANCELLED,
        updatedAt: new Date(),
      };
      d.checksRepo.findRequiredByCase.mockResolvedValue([check]);

      await expect(
        d.service.settleManualApproval(d.tx as any, kase, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);

      expect(d.resultsRepo.create).not.toHaveBeenCalled();
      expect(d.assertionsRepo.create).not.toHaveBeenCalled();
    });

    it('keeps failing when neither an attempt nor a vertical can name the issuer', async () => {
      const d = build();
      d.attemptsRepo.findLatestCompletedByCase.mockResolvedValue(null);
      d.checksRepo.findRequiredByCase.mockResolvedValue([]);
      const kase: any = {
        id: 'k1',
        statusConceptId: IDA.CASE_IN_VERIFICATION,
        updatedAt: new Date(),
      };

      await expect(
        d.service.settleManualApproval(d.tx as any, kase, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
