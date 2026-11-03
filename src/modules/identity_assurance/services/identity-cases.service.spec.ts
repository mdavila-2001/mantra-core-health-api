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
  runWithTenant,
} from '../../../common';
import { IDA } from '../identity_assurance.concepts';
import { IdentityAssuranceErrorReason } from '../identity_assurance.error-reasons';

const T1 = '11111111-1111-4111-8111-111111111111';

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
 * Error que lanza la política de alcance para un caso ajeno o inexistente.
 *
 * @returns Excepción 404 con el `reason` catalogado.
 */
function caseNotAvailable(): ResourceNotFoundException {
  return new ResourceNotFoundException(
    'Caso de verificación no encontrado',
    undefined,
    IdentityAssuranceErrorReason.CASE_NOT_AVAILABLE,
  );
}

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const forked = { id: 'forked-em' };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => forked),
  };
  const casesRepo = {
    findById: mockFn(),
    create: mockFn(),
    countLiveForSubject: mockFn().mockResolvedValue(0),
    findBySubjects: mockFn(),
    findByStatuses: mockFn().mockResolvedValue([]),
    findExpirable: mockFn().mockResolvedValue([]),
  };
  const policiesRepo = { findById: mockFn() };
  const evidenceRepo = {
    create: mockFn(),
    findLatestByCase: mockFn().mockResolvedValue(null),
    findByCase: mockFn().mockResolvedValue([]),
  };
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
  const effects = { applyRevoked: mockFn().mockResolvedValue(undefined) };
  // La política de alcance se prueba aparte (identity-case-scope.service.spec.ts):
  // acá se verifica que el servicio la consulte con el tenant del contexto y
  // que no mute nada cuando ella rechaza.
  const scope = {
    loadAuthorizedCase: mockFn(async (_tx: unknown, id: string) => {
      const kase = await casesRepo.findById(_tx, id);
      if (!kase) throw caseNotAvailable();
      return kase;
    }),
    assertSubjectInTenant: mockFn().mockResolvedValue(undefined),
    assertAuthorityInTenant: mockFn().mockResolvedValue(undefined),
    assertEvidenceReferences: mockFn().mockResolvedValue(undefined),
    filterToTenant: mockFn(async (_tx: unknown, cases: unknown[]) => cases),
  };
  const raw = new IdentityCasesService(
    em as any,
    casesRepo,
    policiesRepo as any,
    evidenceRepo,
    checksRepo as any,
    fraudRepo as any,
    reviewRepo as any,
    assertionsRepo as any,
    effects as any,
    scope as any,
    logger as any,
  );
  return {
    service: scoped(raw, T1),
    rawService: raw,
    scope,
    tx,
    effects,
    forked,
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
  describe('listQueue', () => {
    it('defaults to the states that are waiting for a reviewer', async () => {
      const d = build();
      await d.service.listQueue();
      expect(d.casesRepo.findByStatuses).toHaveBeenCalledWith(
        d.forked,
        [IDA.CASE_IN_VERIFICATION, IDA.CASE_AT_RISK, IDA.CASE_MANUAL_REVIEW],
        200,
        0,
      );
    });

    it('leaves CASE_OPEN out of the default queue', async () => {
      const d = build();
      await d.service.listQueue();
      const [, statuses] = d.casesRepo.findByStatuses.mock.calls[0];
      expect(statuses).not.toContain(IDA.CASE_OPEN);
    });

    it('narrows to a single state when one is requested', async () => {
      const d = build();
      await d.service.listQueue(IDA.CASE_MANUAL_REVIEW, 10);
      expect(d.casesRepo.findByStatuses).toHaveBeenCalledWith(
        d.forked,
        [IDA.CASE_MANUAL_REVIEW],
        200,
        0,
      );
    });

    it('exposes the case status as `status`', async () => {
      const d = build();
      const openedAt = new Date('2026-08-10T12:00:00.000Z');
      d.casesRepo.findByStatuses.mockResolvedValue([
        {
          id: 'k1',
          statusConceptId: IDA.CASE_IN_VERIFICATION,
          subjectTypeConceptId: 's',
          subjectEntityId: 'e',
          identityVerificationPolicyId: 'p1',
          riskScore: '0',
          openedAt,
          expiresAt: undefined,
        },
      ]);
      const res = await d.service.listQueue();
      expect(res.cases).toEqual([
        {
          id: 'k1',
          status: IDA.CASE_IN_VERIFICATION,
          subjectTypeConceptId: 's',
          subjectEntityId: 'e',
          identityVerificationPolicyId: 'p1',
          riskScore: '0',
          openedAt,
          expiresAt: undefined,
        },
      ]);
    });

    it('reads outside the write transaction', async () => {
      const d = build();
      await d.service.listQueue();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });
  });

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

  describe('alcance por tenant (IDA-01)', () => {
    it('listQueue filtra la cola al tenant del contexto y respeta el límite', async () => {
      const d = build();
      const kase = (id: string) => ({
        id,
        statusConceptId: IDA.CASE_IN_VERIFICATION,
        subjectTypeConceptId: 's',
        subjectEntityId: id,
        identityVerificationPolicyId: 'p',
        riskScore: '0',
      });
      d.casesRepo.findByStatuses.mockResolvedValue([
        kase('own-1'),
        kase('foreign'),
        kase('own-2'),
      ]);
      d.scope.filterToTenant.mockImplementation(
        async (_tx: unknown, cases: any[]) =>
          cases.filter((c) => c.id !== 'foreign'),
      );
      const res = await d.service.listQueue(undefined, 1);
      expect(d.scope.filterToTenant).toHaveBeenCalledWith(
        d.forked,
        expect.any(Array),
        T1,
      );
      expect(res.cases.map((c) => c.id)).toEqual(['own-1']);
    });

    it('listQueue sin tenant en el contexto se rechaza (412)', async () => {
      const d = build();
      await expect(d.rawService.listQueue()).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.casesRepo.findByStatuses).not.toHaveBeenCalled();
    });

    it('openCase resuelve el sujeto dentro del tenant y no crea nada si es ajeno', async () => {
      const d = build();
      d.scope.assertSubjectInTenant.mockRejectedValue(
        new ResourceNotFoundException(
          'Sujeto de verificación no encontrado',
          undefined,
          IdentityAssuranceErrorReason.SUBJECT_NOT_AVAILABLE,
        ),
      );
      await expect(
        d.service.openCase(
          {
            identityVerificationPolicyId: 'p1',
            subjectTypeConceptId: 's',
            subjectEntityId: 'e-t2',
          } as any,
          actor,
        ),
      ).rejects.toMatchObject({
        reason: IdentityAssuranceErrorReason.SUBJECT_NOT_AVAILABLE,
      });
      expect(d.scope.assertSubjectInTenant).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ subjectEntityId: 'e-t2' }),
        T1,
      );
      expect(d.policiesRepo.findById).not.toHaveBeenCalled();
      expect(d.casesRepo.create).not.toHaveBeenCalled();
    });

    it('getCaseDetail de un caso ajeno responde 404 uniforme y no lee evidencia', async () => {
      const d = build();
      d.casesRepo.findById.mockResolvedValue(null);
      await expect(d.service.getCaseDetail('k-t2')).rejects.toMatchObject({
        reason: IdentityAssuranceErrorReason.CASE_NOT_AVAILABLE,
      });
      expect(d.scope.loadAuthorizedCase).toHaveBeenCalledWith(
        d.forked,
        'k-t2',
        T1,
      );
      expect(d.evidenceRepo.findByCase).not.toHaveBeenCalled();
    });

    it('cada mutación por UUID de caso consulta la política con el tenant y no escribe si rechaza', async () => {
      const d = build();
      d.scope.loadAuthorizedCase.mockRejectedValue(caseNotAvailable());
      const calls: Array<() => Promise<unknown>> = [
        () => d.service.submitEvidence('k-t2', {} as any, actor),
        () => d.service.planChecks('k-t2', { checks: [] } as any, actor),
        () => d.service.raiseFraudSignal('k-t2', {} as any, actor),
        () => d.service.openManualReview('k-t2', {} as any, actor),
        () => d.service.issueAssertion('k-t2', {} as any, actor),
      ];
      for (const call of calls) {
        await expect(call()).rejects.toMatchObject({
          reason: IdentityAssuranceErrorReason.CASE_NOT_AVAILABLE,
        });
      }
      expect(d.scope.loadAuthorizedCase).toHaveBeenCalledTimes(calls.length);
      for (const [, id, tenantId] of d.scope.loadAuthorizedCase.mock.calls) {
        expect(id).toBe('k-t2');
        expect(tenantId).toBe(T1);
      }
      expect(d.evidenceRepo.create).not.toHaveBeenCalled();
      expect(d.checksRepo.create).not.toHaveBeenCalled();
      expect(d.fraudRepo.create).not.toHaveBeenCalled();
      expect(d.reviewRepo.create).not.toHaveBeenCalled();
      expect(d.assertionsRepo.create).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('submitEvidence valida archivo, consentimiento y autoridad en la misma cadena', async () => {
      const d = build();
      const kase: any = {
        id: 'k1',
        statusConceptId: IDA.CASE_OPEN,
        subjectTypeConceptId: 's',
        subjectEntityId: 'e',
        updatedAt: new Date(),
      };
      d.casesRepo.findById.mockResolvedValue(kase);
      d.evidenceRepo.create.mockResolvedValue({
        id: 'ev1',
        verificationStatusConceptId: 'x',
        createdAt: new Date(),
      });
      const dto: any = {
        evidenceTypeConceptId: 't',
        issuerAuthorityId: 'auth-1',
        evidenceFileId: 'file-1',
        collectedUnderConsentId: 'consent-1',
      };
      await d.service.submitEvidence('k1', dto, actor);
      expect(d.scope.assertAuthorityInTenant).toHaveBeenCalledWith(
        d.tx,
        'auth-1',
        T1,
      );
      expect(d.scope.assertEvidenceReferences).toHaveBeenCalledWith(
        d.tx,
        kase,
        dto,
        T1,
      );
    });

    it('submitEvidence con archivo ajeno no persiste la evidencia', async () => {
      const d = build();
      d.casesRepo.findById.mockResolvedValue({
        id: 'k1',
        statusConceptId: IDA.CASE_OPEN,
      });
      d.scope.assertEvidenceReferences.mockRejectedValue(
        new ResourceNotFoundException(
          'Archivo de evidencia no encontrado',
          undefined,
          IdentityAssuranceErrorReason.EVIDENCE_FILE_NOT_AVAILABLE,
        ),
      );
      await expect(
        d.service.submitEvidence(
          'k1',
          { evidenceFileId: 'file-t2' } as any,
          actor,
        ),
      ).rejects.toMatchObject({
        reason: IdentityAssuranceErrorReason.EVIDENCE_FILE_NOT_AVAILABLE,
      });
      expect(d.evidenceRepo.create).not.toHaveBeenCalled();
    });

    it('expireSweep de un SECURITY_ADMIN barre sólo los casos de su tenant', async () => {
      const d = build();
      const own: any = { id: 'own', statusConceptId: IDA.CASE_OPEN };
      const foreign: any = { id: 'foreign', statusConceptId: IDA.CASE_OPEN };
      d.casesRepo.findExpirable.mockResolvedValue([own, foreign]);
      d.scope.filterToTenant.mockResolvedValue([own]);
      const res = await d.service.expireSweep(actor);
      expect(res.caseIds).toEqual(['own']);
      expect(own.statusConceptId).toBe(IDA.CASE_EXPIRED);
      expect(foreign.statusConceptId).toBe(IDA.CASE_OPEN);
    });

    it('expireSweep de la identidad de servicio SYSTEM barre todos los tenants sin exigir contexto', async () => {
      const d = build();
      const a: any = { id: 'a', statusConceptId: IDA.CASE_OPEN };
      const b: any = { id: 'b', statusConceptId: IDA.CASE_OPEN };
      d.casesRepo.findExpirable.mockResolvedValue([a, b]);
      const res = await d.rawService.expireSweep({
        id: 'svc',
        roles: ['SYSTEM'],
      } as any);
      expect(res.expiredCount).toBe(2);
      expect(d.scope.filterToTenant).not.toHaveBeenCalled();
    });
  });
});
