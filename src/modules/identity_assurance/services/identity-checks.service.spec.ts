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
  runWithTenant,
} from '../../../common';
import { IDA } from '../identity_assurance.concepts';
import { IDENTITY_CARD_VERTICAL } from '../identity_assurance.seed';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const system = { id: 'worker-1', roles: ['SYSTEM'] } as any;
const T1 = 'tenant-1';

/**
 * Ejecuta cada método del servicio dentro del contexto de tenant, como lo hace
 * `TenantContextInterceptor` en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant activo del contexto.
 * @returns Proxy que fija el tenant en cada llamada.
 */
function scoped<S extends object>(service: S, tenantId: string): S {
  return new Proxy(service, {
    get(target, key) {
      const value = (target as any)[key];
      return typeof value === 'function'
        ? (...args: unknown[]) =>
            runWithTenant(tenantId, () => value.apply(target, args))
        : value;
    },
  });
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const checksRepo = {
    findById: mockFn(),
    findDispatchable: mockFn().mockResolvedValue([]),
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
  // La política de alcance se prueba aparte (identity-case-scope.service.spec.ts):
  // acá se verifica que el servicio la consulte con el tenant del contexto.
  const scope = {
    findAuthorizedCase: mockFn().mockResolvedValue({ id: 'k1' }),
    filterToTenant: mockFn(async (_tx: unknown, cases: unknown[]) => cases),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const raw = new IdentityChecksService(
    em as any,
    checksRepo as any,
    attemptsRepo,
    resultsRepo,
    casesRepo as any,
    assertionsRepo as any,
    authorityEndpointsRepo as any,
    effects as any,
    scope as any,
    logger as any,
  );
  return {
    service: scoped(raw, T1),
    rawService: raw,
    scope,
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
    function checkWithAttemptInFlight(
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
      checkWithAttemptInFlight(d, attempt);

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
      checkWithAttemptInFlight(d, attempt);

      await d.service.recordResult('ch1', { result: 'NO_MATCH' } as any, actor);

      // El desenlace mide si la autoridad contestó, no qué contestó.
      expect(attempt.outcomeConceptId).toBe(IDA.ATTEMPT_SUCCESS);
      expect(attempt.completedAt).toBeInstanceOf(Date);
    });

    it('no reescribe la fecha de cierre de un intento ya completado', async () => {
      const d = build();
      const completed = new Date('2026-08-01T10:00:00.000Z');
      const attempt: Record<string, unknown> = {
        id: 'at1',
        outcomeConceptId: IDA.ATTEMPT_SUCCESS,
        completedAt: completed,
      };
      checkWithAttemptInFlight(d, attempt);

      await d.service.recordResult('ch1', { result: 'MATCH' } as any, actor);

      expect(attempt.completedAt).toBe(completed);
    });

    it('no resucita un intento que falló al despacharse', async () => {
      const d = build();
      const attempt: Record<string, unknown> = {
        id: 'at1',
        outcomeConceptId: IDA.ATTEMPT_FAILED,
        completedAt: new Date('2026-08-01T10:00:00.000Z'),
      };
      checkWithAttemptInFlight(d, attempt);

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

  describe('alcance por tenant (el check hereda el tenant de su caso)', () => {
    const ownCheck = () => ({
      id: 'ch1',
      identityVerificationCaseId: 'k1',
      required: true,
      statusConceptId: IDA.CHECK_IN_PROGRESS,
      updatedAt: new Date(),
    });

    it('rechaza con 404 el resultado de un check cuyo caso es de otro tenant, sin mutar nada', async () => {
      const d = build();
      const check: any = ownCheck();
      d.checksRepo.findById.mockResolvedValue(check);
      d.scope.findAuthorizedCase.mockResolvedValue(null);

      await expect(
        d.service.recordResult('ch1', { result: 'MATCH' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);

      expect(d.scope.findAuthorizedCase).toHaveBeenCalledWith(d.tx, 'k1', T1);
      expect(check.statusConceptId).toBe(IDA.CHECK_IN_PROGRESS);
      expect(d.resultsRepo.create).not.toHaveBeenCalled();
      expect(d.assertionsRepo.create).not.toHaveBeenCalled();
      expect(d.effects.applyVerified).not.toHaveBeenCalled();
    });

    it('rechaza con 404 el intento sobre un check de otro tenant, sin mutar nada', async () => {
      const d = build();
      const check: any = ownCheck();
      d.checksRepo.findById.mockResolvedValue(check);
      d.scope.findAuthorizedCase.mockResolvedValue(null);

      await expect(
        d.service.recordAttempt(
          'ch1',
          { identityAuthorityEndpointId: 'ep1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);

      expect(check.statusConceptId).toBe(IDA.CHECK_IN_PROGRESS);
      expect(d.attemptsRepo.create).not.toHaveBeenCalled();
    });

    it('responde igual para un check ajeno que para uno inexistente', async () => {
      const foreign = build();
      foreign.checksRepo.findById.mockResolvedValue(ownCheck());
      foreign.scope.findAuthorizedCase.mockResolvedValue(null);
      const missing = build();
      missing.checksRepo.findById.mockResolvedValue(null);
      const body = { identityAuthorityEndpointId: 'ep1' } as any;

      const a = await foreign.service
        .recordAttempt('ch1', body, actor)
        .catch((e) => e);
      const b = await missing.service
        .recordAttempt('ch1', body, actor)
        .catch((e) => e);

      expect(a).toBeInstanceOf(ResourceNotFoundException);
      expect(a.message).toBe(b.message);
      expect(a.getStatus()).toBe(b.getStatus());
    });

    it('exige tenant a un actor que no es SYSTEM', async () => {
      const d = build();
      d.checksRepo.findById.mockResolvedValue(ownCheck());

      // Sin contexto de tenant: se llama al servicio sin el proxy.
      await expect(
        d.rawService.recordResult('ch1', { result: 'MATCH' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.resultsRepo.create).not.toHaveBeenCalled();
    });

    it('SYSTEM opera entre tenants: no consulta el alcance ni exige tenant', async () => {
      const d = build();
      const check: any = ownCheck();
      d.checksRepo.findById.mockResolvedValue(check);
      d.attemptsRepo.create.mockReturnValue({
        id: 'at1',
        attemptNumber: 1,
        outcomeConceptId: IDA.ATTEMPT_SUCCESS,
      });

      await expect(
        d.rawService.recordAttempt(
          'ch1',
          { identityAuthorityEndpointId: 'ep1' } as any,
          system,
        ),
      ).resolves.toMatchObject({ attemptNumber: 1 });
      expect(d.scope.findAuthorizedCase).not.toHaveBeenCalled();
    });

    it('listDispatchable deja a un SECURITY_ADMIN sólo los checks de casos de su tenant', async () => {
      const d = build();
      const mine = {
        ...ownCheck(),
        checkTypeConceptId: IDA.CHECK_TYPE_IDENTITY_CARD,
      };
      const theirs = {
        ...ownCheck(),
        id: 'ch2',
        identityVerificationCaseId: 'k2',
        checkTypeConceptId: IDA.CHECK_TYPE_IDENTITY_CARD,
      };
      d.checksRepo.findDispatchable.mockResolvedValue([mine, theirs]);
      d.casesRepo.findById.mockImplementation(async (_tx: any, id: string) => ({
        id,
      }));
      d.scope.filterToTenant.mockImplementation(
        async (_tx: any, cases: any[]) => cases.filter((k) => k.id === 'k1'),
      );

      const res = await d.service.listDispatchable(actor);

      expect(d.scope.filterToTenant).toHaveBeenCalledWith(
        expect.anything(),
        [{ id: 'k1' }, { id: 'k2' }],
        T1,
      );
      expect(res.checks.map((c) => c.id)).toEqual(['ch1']);
    });

    it('listDispatchable entrega a SYSTEM los checks de todos los tenants', async () => {
      const d = build();
      const a = {
        ...ownCheck(),
        checkTypeConceptId: IDA.CHECK_TYPE_IDENTITY_CARD,
      };
      const b = {
        ...ownCheck(),
        id: 'ch2',
        identityVerificationCaseId: 'k2',
        checkTypeConceptId: IDA.CHECK_TYPE_IDENTITY_CARD,
      };
      d.checksRepo.findDispatchable.mockResolvedValue([a, b]);

      const res = await d.rawService.listDispatchable(system);

      expect(d.scope.filterToTenant).not.toHaveBeenCalled();
      expect(res.checks.map((c) => c.id)).toEqual(['ch1', 'ch2']);
    });

    it('listDispatchable no deja que los checks más antiguos de otro tenant llenen el lote del actor', async () => {
      const d = build();
      const row = (id: string, caseId: string) => ({
        ...ownCheck(),
        id,
        identityVerificationCaseId: caseId,
        checkTypeConceptId: IDA.CHECK_TYPE_IDENTITY_CARD,
      });
      // Lote de 2: la primera página es toda de otro tenant, la segunda trae
      // los dos checks propios.
      d.checksRepo.findDispatchable.mockImplementation(
        async (_em: any, _s: any, _limit: number, offset = 0) =>
          offset === 0
            ? [row('x1', 'kx1'), row('x2', 'kx2')]
            : [row('m1', 'k1'), row('m2', 'k2')],
      );
      d.casesRepo.findById.mockImplementation(async (_tx: any, id: string) => ({
        id,
      }));
      d.scope.filterToTenant.mockImplementation(
        async (_tx: any, cases: any[]) =>
          cases.filter((k) => !k.id.startsWith('kx')),
      );

      const res = await d.service.listDispatchable(actor, 2);

      expect(res.checks.map((c) => c.id)).toEqual(['m1', 'm2']);
      expect(d.checksRepo.findDispatchable).toHaveBeenCalledTimes(2);
    });

    it('un SYSTEM acotado a un tenant (scopedRoles) no barre entre tenants', async () => {
      const d = build();
      d.checksRepo.findDispatchable.mockResolvedValue([]);
      const scopedSystem = {
        id: 'worker-2',
        roles: ['SYSTEM'],
        scopedRoles: { [T1]: ['SYSTEM'] },
      } as any;

      await d.service.listDispatchable(scopedSystem);

      // Pasó por el filtro de tenant en vez de saltarlo como el SYSTEM global.
      expect(d.checksRepo.findDispatchable).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        50,
        0,
      );
      const noTenant = d.rawService.listDispatchable(scopedSystem);
      await expect(noTenant).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });
  });
});
