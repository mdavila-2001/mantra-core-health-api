import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DelegatedAccessEvaluationService } from './delegated-access-evaluation.service';
import {
  DomainException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason } from '../delegated_access.error-reasons';
import { STATUS } from './concept-maps';
import {
  ACTIVE_TENANT,
  buildScope,
  inTenant,
  thrown,
} from './delegation-scope.testing';

const actor = { id: 'authz-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const grantsRepo = {
    findOverdueActive: mockFn().mockResolvedValue([]),
    findActiveMatch: mockFn(),
  };
  const delegatesRepo = {
    findOverdueActive: mockFn().mockResolvedValue([]),
    findById: mockFn(),
  };
  const orgAssignmentsRepo = {
    findOverdueActive: mockFn().mockResolvedValue([]),
    findById: mockFn().mockResolvedValue({
      id: 'org1',
      tenantMembershipId: 'mem1',
    }),
  };
  const setsRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'set1',
      tenantId: ACTIVE_TENANT,
    }),
  };
  const itemsRepo = { findBySetAndPermission: mockFn() };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const scope = buildScope({ setsRepo, delegatesRepo, orgAssignmentsRepo });
  const raw = new DelegatedAccessEvaluationService(
    em as any,
    grantsRepo as any,
    delegatesRepo as any,
    orgAssignmentsRepo as any,
    itemsRepo as any,
    eventsRepo,
    scope.scope,
    logger as any,
  );
  return {
    service: inTenant(raw),
    raw,
    scope,
    setsRepo,
    tx,
    grantsRepo,
    delegatesRepo,
    orgAssignmentsRepo,
    itemsRepo,
    eventsRepo,
  };
}

describe('DelegatedAccessEvaluationService', () => {
  describe('expirySweep (UC-29-08)', () => {
    it('expires overdue grants, delegations and org assignments', async () => {
      const d = build();
      const grant = {
        id: 'g1',
        practitionerDelegateAssignmentId: 'del1',
        statusConceptId: STATUS.ACTIVE,
        updatedAt: new Date(),
      };
      const delegate = {
        id: 'del1',
        statusConceptId: STATUS.ACTIVE,
        updatedAt: new Date(),
      };
      const org = {
        id: 'o1',
        statusConceptId: STATUS.ACTIVE,
        updatedAt: new Date(),
      };
      d.grantsRepo.findOverdueActive.mockResolvedValue([grant]);
      d.delegatesRepo.findOverdueActive.mockResolvedValue([delegate]);
      d.orgAssignmentsRepo.findOverdueActive.mockResolvedValue([org]);
      const res = await d.service.expirySweep(actor);
      expect(res).toEqual({
        expiredGrants: 1,
        expiredDelegations: 1,
        expiredOrgAssignments: 1,
      });
      expect(grant.statusConceptId).toBe(STATUS.EXPIRED);
      expect(delegate.statusConceptId).toBe(STATUS.EXPIRED);
      expect(org.statusConceptId).toBe(STATUS.EXPIRED);
      expect(d.eventsRepo.record).toHaveBeenCalledTimes(2);
    });

    it('returns zeros when nothing is overdue', async () => {
      const d = build();
      const res = await d.service.expirySweep(actor);
      expect(res).toEqual({
        expiredGrants: 0,
        expiredDelegations: 0,
        expiredOrgAssignments: 0,
      });
    });
  });

  describe('evaluate (UC-29-09)', () => {
    it('throws when the delegation does not exist', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.evaluate(
          {
            practitionerDelegateAssignmentId: 'del1',
            effectiveUserId: 'delegate-user',
            purpose: 'TREATMENT',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('denies when the delegation is not within its validity window', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue({
        id: 'del1',
        delegatedPermissionSetId: 'set1',
        delegateUserAssignmentId: 'org1',
        statusConceptId: STATUS.REVOKED,
      });
      const res = await d.service.evaluate(
        {
          practitionerDelegateAssignmentId: 'del1',
          effectiveUserId: 'delegate-user',
          purpose: 'TREATMENT',
        } as any,
        actor,
      );
      expect(res).toEqual({
        allowed: false,
        requiresStepUp: false,
        reason: 'NO_ACTIVE_DELEGATION',
      });
    });

    it('denies when there is no matching grant', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue({
        id: 'del1',
        delegatedPermissionSetId: 'set1',
        delegateUserAssignmentId: 'org1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.grantsRepo.findActiveMatch.mockResolvedValue(null);
      const res = await d.service.evaluate(
        {
          practitionerDelegateAssignmentId: 'del1',
          effectiveUserId: 'delegate-user',
          purpose: 'TREATMENT',
        } as any,
        actor,
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('NO_MATCHING_GRANT');
    });

    it('requires step-up when the permission item demands it', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue({
        id: 'del1',
        delegatedPermissionSetId: 'set1',
        delegateUserAssignmentId: 'org1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.grantsRepo.findActiveMatch.mockResolvedValue({ id: 'g1' });
      d.itemsRepo.findBySetAndPermission.mockResolvedValue({
        requiresStepUpAuthentication: true,
      });
      const res = await d.service.evaluate(
        {
          practitionerDelegateAssignmentId: 'del1',
          effectiveUserId: 'delegate-user',
          purpose: 'TREATMENT',
          permissionId: 'p1',
        } as any,
        actor,
      );
      expect(res).toEqual({
        allowed: false,
        requiresStepUp: true,
        reason: 'STEP_UP_REQUIRED',
      });
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: DELEG.EVENT_STEP_UP_REQUIRED,
        }),
      );
    });

    it('allows when delegation is active and a grant matches', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue({
        id: 'del1',
        delegatedPermissionSetId: 'set1',
        delegateUserAssignmentId: 'org1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.grantsRepo.findActiveMatch.mockResolvedValue({ id: 'g1' });
      const res = await d.service.evaluate(
        {
          practitionerDelegateAssignmentId: 'del1',
          effectiveUserId: 'delegate-user',
          purpose: 'TREATMENT',
        } as any,
        actor,
      );
      expect(res).toEqual({ allowed: true, requiresStepUp: false });
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: DELEG.EVENT_ACCESS_EVALUATED,
        }),
      );
    });
  });

  describe('sujeto efectivo y tenant (DLG-02)', () => {
    const body = (extra: object = {}) =>
      ({
        practitionerDelegateAssignmentId: 'del1',
        purpose: 'TREATMENT',
        ...extra,
      }) as any;
    const activeDelegate = () => ({
      id: 'del1',
      delegatedPermissionSetId: 'set1',
      delegateUserAssignmentId: 'org1',
      statusConceptId: STATUS.ACTIVE,
    });

    it('Correcto: el propio delegado autenticado se evalúa sin declarar a nadie', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue(activeDelegate());
      d.grantsRepo.findActiveMatch.mockResolvedValue({ id: 'g1' });
      const res = await d.service.evaluate(body(), {
        id: 'delegate-user',
        roles: ['SECURITY_ADMIN'],
      } as any);
      expect(res).toEqual({ allowed: true, requiresStepUp: false });
    });

    it('Error: el actor que no es el delegado no recibe allowed:true aunque haya grant vigente', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue(activeDelegate());
      d.grantsRepo.findActiveMatch.mockResolvedValue({ id: 'g1' });
      const res = await d.service.evaluate(body(), actor);
      expect(res).toEqual({
        allowed: false,
        requiresStepUp: false,
        reason: DelegatedAccessErrorReason.DELEGATED_SUBJECT_MISMATCH,
      });
      expect(d.grantsRepo.findActiveMatch).not.toHaveBeenCalled();
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: DELEG.EVENT_ACCESS_EVALUATED,
          actorUserId: 'authz-1',
        }),
      );
    });

    it('Error: un effectiveUserId que no es el titular de la asignación tampoco se permite', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue(activeDelegate());
      d.grantsRepo.findActiveMatch.mockResolvedValue({ id: 'g1' });
      const res = await d.service.evaluate(
        body({ effectiveUserId: 'otra-persona' }),
        actor,
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe(
        DelegatedAccessErrorReason.DELEGATED_SUBJECT_MISMATCH,
      );
    });

    it('Error: la asignación del delegado en la membresía de otro tenant no habilita', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue(activeDelegate());
      d.grantsRepo.findActiveMatch.mockResolvedValue({ id: 'g1' });
      d.scope.scopeRepo.membershipOf.mockResolvedValue({
        tenantId: 't2',
        userId: 'delegate-user',
      });
      const res = await d.service.evaluate(
        body({ effectiveUserId: 'delegate-user' }),
        actor,
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe(
        DelegatedAccessErrorReason.DELEGATED_SUBJECT_MISMATCH,
      );
    });

    it('Error: una delegación de otro tenant responde 404 idéntico a inexistente y no registra evaluación', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue(null);
      const missing = await thrown(
        d.service.evaluate(body({ effectiveUserId: 'delegate-user' }), actor),
      );
      d.delegatesRepo.findById.mockResolvedValue(activeDelegate());
      d.setsRepo.findById.mockResolvedValue({ id: 'set1', tenantId: 't2' });
      const foreign = await thrown(
        d.service.evaluate(body({ effectiveUserId: 'delegate-user' }), actor),
      );
      expect(foreign).toBeInstanceOf(ResourceNotFoundException);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(foreign.reason).toBe(
        DelegatedAccessErrorReason.DELEGATED_DELEGATION_NOT_FOUND,
      );
      expect(foreign.details).toBeUndefined();
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
      expect(d.grantsRepo.findActiveMatch).not.toHaveBeenCalled();
    });

    it('sin tenant en el contexto no se evalúa', async () => {
      const d = build();
      await expect(
        d.raw.evaluate(body({ effectiveUserId: 'delegate-user' }), actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.delegatesRepo.findById).not.toHaveBeenCalled();
    });
  });
});
