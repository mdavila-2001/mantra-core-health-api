import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AccessRequestsService } from './access-requests.service';
import {
  ConflictException,
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

const actor = { id: 'approver-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const requestsRepo = {
    findById: mockFn(),
    findOpenDuplicate: mockFn().mockResolvedValue(null),
    create: mockFn(),
  };
  const delegatesRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'del1',
      delegatedPermissionSetId: 'set1',
      statusConceptId: STATUS.ACTIVE,
    }),
  };
  const orgAssignmentsRepo = { findById: mockFn() };
  const setsRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'set1',
      tenantId: ACTIVE_TENANT,
      statusConceptId: STATUS.ACTIVE,
    }),
  };
  const grantsRepo = { create: mockFn() };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const scope = buildScope({ setsRepo, delegatesRepo, orgAssignmentsRepo });
  const raw = new AccessRequestsService(
    em as any,
    requestsRepo as any,
    delegatesRepo as any,
    grantsRepo as any,
    eventsRepo,
    logger as any,
    scope.scope,
  );
  return {
    service: inTenant(raw),
    raw,
    scope,
    tx,
    requestsRepo,
    delegatesRepo,
    setsRepo,
    grantsRepo,
    eventsRepo,
  };
}

describe('AccessRequestsService', () => {
  describe('requestAccess (UC-29-04)', () => {
    it('opens a request and records ACCESS_REQUESTED', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue({
        id: 'del1',
        delegatedPermissionSetId: 'set1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.requestsRepo.create.mockReturnValue({
        id: 'r1',
        statusConceptId: DELEG.REQUEST_OPEN,
        createdAt: new Date(),
      });
      const res = await d.service.requestAccess(
        'del1',
        { requestedPermissionId: 'p1' },
        actor,
      );
      expect(res.id).toBe('r1');
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: DELEG.EVENT_ACCESS_REQUESTED,
        }),
      );
    });

    it('rejects when the delegation is not active (precondition)', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue({
        id: 'del1',
        delegatedPermissionSetId: 'set1',
        statusConceptId: STATUS.REVOKED,
      });
      await expect(
        d.service.requestAccess(
          'del1',
          { requestedPermissionId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicate pending request (conflict)', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue({
        id: 'del1',
        delegatedPermissionSetId: 'set1',
        statusConceptId: STATUS.ACTIVE,
      });
      d.requestsRepo.findOpenDuplicate.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.requestAccess(
          'del1',
          { requestedPermissionId: 'p1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('decide (UC-29-05)', () => {
    it('throws when the request does not exist', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.decide('r1', { decision: 'APPROVED' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects deciding a request that is not open (precondition)', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'r1',
        statusConceptId: DELEG.REQUEST_CLOSED,
      });
      await expect(
        d.service.decide('r1', { decision: 'APPROVED' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('approves and emits a scoped grant', async () => {
      const d = build();
      const request: any = {
        id: 'r1',
        statusConceptId: DELEG.REQUEST_OPEN,
        practitionerDelegateAssignmentId: 'del1',
        patientProfileId: 'pat1',
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      d.grantsRepo.create.mockReturnValue({ id: 'g1' });
      const res = await d.service.decide(
        'r1',
        { decision: 'APPROVED' } as any,
        actor,
      );
      expect(request.statusConceptId).toBe(DELEG.REQUEST_CLOSED);
      expect(request.decisionConceptId).toBe(DELEG.DECISION_APPROVED);
      expect(res).toEqual({
        requestId: 'r1',
        decision: 'APPROVED',
        grantId: 'g1',
      });
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: DELEG.EVENT_ACCESS_APPROVED,
        }),
      );
    });

    it('denies without emitting a grant', async () => {
      const d = build();
      const request = {
        id: 'r1',
        statusConceptId: DELEG.REQUEST_OPEN,
        practitionerDelegateAssignmentId: 'del1',
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      const res = await d.service.decide(
        'r1',
        { decision: 'DENIED' } as any,
        actor,
      );
      expect(res).toEqual({
        requestId: 'r1',
        decision: 'DENIED',
        grantId: undefined,
      });
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: DELEG.EVENT_ACCESS_DENIED,
        }),
      );
    });
  });
  describe('alcance por organización (A6)', () => {
    const NOT_FOUND = {
      message: 'Delegación no encontrada',
      reason: DelegatedAccessErrorReason.DELEGATED_DELEGATION_NOT_FOUND,
    };

    it('requestAccess: una delegación de otra organización responde 404 uniforme y no abre solicitud', async () => {
      const d = build();
      d.setsRepo.findById.mockResolvedValue({
        id: 'set9',
        tenantId: 't2',
        statusConceptId: STATUS.ACTIVE,
      });
      const err = await thrown(
        d.service.requestAccess('del1', { requestedPermissionId: 'p1' }, actor),
      );
      expect(err).toBeInstanceOf(ResourceNotFoundException);
      expect(err.message).toBe(NOT_FOUND.message);
      expect(err.reason).toBe(NOT_FOUND.reason);
      expect(d.requestsRepo.create).not.toHaveBeenCalled();
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
    });

    it('requestAccess: un encuentro de otra organización responde 404 y no abre solicitud', async () => {
      const d = build();
      d.scope.scopeRepo.encounterScope.mockResolvedValue({
        tenantId: 't2',
        patientProfileId: 'pat-1',
      });
      const err = await thrown(
        d.service.requestAccess(
          'del1',
          {
            requestedPermissionId: 'p1',
            patientProfileId: 'pat-1',
            encounterId: 'enc-9',
          },
          actor,
        ),
      );
      expect(err).toBeInstanceOf(ResourceNotFoundException);
      expect(err.reason).toBe(
        DelegatedAccessErrorReason.DELEGATED_ENCOUNTER_NOT_FOUND,
      );
      expect(d.requestsRepo.create).not.toHaveBeenCalled();
    });

    it('requestAccess: un paciente inexistente responde 404 y no abre solicitud', async () => {
      const d = build();
      d.scope.scopeRepo.patientExists.mockResolvedValue(false);
      const err = await thrown(
        d.service.requestAccess(
          'del1',
          { requestedPermissionId: 'p1', patientProfileId: 'pat-x' },
          actor,
        ),
      );
      expect(err).toBeInstanceOf(ResourceNotFoundException);
      expect(err.reason).toBe(
        DelegatedAccessErrorReason.DELEGATED_PATIENT_NOT_FOUND,
      );
      expect(d.requestsRepo.create).not.toHaveBeenCalled();
    });

    it('requestAccess: sin organización en el contexto no abre nada', async () => {
      const d = build();
      await expect(
        d.raw.requestAccess('del1', { requestedPermissionId: 'p1' }, actor),
      ).rejects.toBeDefined();
      expect(d.requestsRepo.create).not.toHaveBeenCalled();
    });

    it('decide: una solicitud de otra organización responde 404 uniforme aunque esté cerrada, sin grant ni evento', async () => {
      const d = build();
      d.setsRepo.findById.mockResolvedValue({
        id: 'set9',
        tenantId: 't2',
        statusConceptId: STATUS.ACTIVE,
      });
      const request: any = {
        id: 'r1',
        statusConceptId: DELEG.REQUEST_CLOSED,
        practitionerDelegateAssignmentId: 'del1',
        patientProfileId: 'pat-1',
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      const err = await thrown(
        d.service.decide('r1', { decision: 'APPROVED' } as any, actor),
      );
      // Mismo 404 que una inexistente: no revela que el id existe (ni su estado).
      expect(err).toBeInstanceOf(ResourceNotFoundException);
      expect(err.message).toBe(NOT_FOUND.message);
      expect(err.reason).toBe(NOT_FOUND.reason);
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
      expect(request.statusConceptId).toBe(DELEG.REQUEST_CLOSED);
    });

    it('decide: aprobar con un encuentro de otra organización responde 404 y no emite grant', async () => {
      const d = build();
      d.scope.scopeRepo.encounterScope.mockResolvedValue({
        tenantId: 't2',
        patientProfileId: 'pat-1',
      });
      const request: any = {
        id: 'r1',
        statusConceptId: DELEG.REQUEST_OPEN,
        practitionerDelegateAssignmentId: 'del1',
        patientProfileId: 'pat-1',
      };
      d.requestsRepo.findById.mockResolvedValue(request);
      const err = await thrown(
        d.service.decide(
          'r1',
          { decision: 'APPROVED', encounterId: 'enc-9' } as any,
          actor,
        ),
      );
      expect(err).toBeInstanceOf(ResourceNotFoundException);
      expect(err.reason).toBe(
        DelegatedAccessErrorReason.DELEGATED_ENCOUNTER_NOT_FOUND,
      );
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
    });

    it('decide: aprobar con un encuentro que no es del paciente de la solicitud responde 404 y no emite grant', async () => {
      const d = build();
      d.scope.scopeRepo.encounterScope.mockResolvedValue({
        tenantId: ACTIVE_TENANT,
        patientProfileId: 'otro-paciente',
      });
      d.requestsRepo.findById.mockResolvedValue({
        id: 'r1',
        statusConceptId: DELEG.REQUEST_OPEN,
        practitionerDelegateAssignmentId: 'del1',
        patientProfileId: 'pat-1',
        encounterId: 'enc-1',
      });
      const err = await thrown(
        d.service.decide('r1', { decision: 'APPROVED' } as any, actor),
      );
      expect(err).toBeInstanceOf(ResourceNotFoundException);
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
    });

    it('decide: aprobar para un paciente inexistente responde 404 y no emite grant', async () => {
      const d = build();
      d.scope.scopeRepo.patientExists.mockResolvedValue(false);
      d.requestsRepo.findById.mockResolvedValue({
        id: 'r1',
        statusConceptId: DELEG.REQUEST_OPEN,
        practitionerDelegateAssignmentId: 'del1',
        patientProfileId: 'pat-x',
      });
      const err = await thrown(
        d.service.decide('r1', { decision: 'APPROVED' } as any, actor),
      );
      expect(err).toBeInstanceOf(ResourceNotFoundException);
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
    });

    it('decide: denegar no necesita probar el destino pero sí la organización', async () => {
      const d = build();
      d.scope.scopeRepo.patientExists.mockResolvedValue(false);
      d.requestsRepo.findById.mockResolvedValue({
        id: 'r1',
        statusConceptId: DELEG.REQUEST_OPEN,
        practitionerDelegateAssignmentId: 'del1',
        patientProfileId: 'pat-x',
      });
      const res = await d.service.decide(
        'r1',
        { decision: 'DENIED' } as any,
        actor,
      );
      expect(res.decision).toBe('DENIED');
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
    });

    it('decide: con toda la cadena en la organización se emite el grant', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'r1',
        statusConceptId: DELEG.REQUEST_OPEN,
        practitionerDelegateAssignmentId: 'del1',
        patientProfileId: 'pat-1',
        encounterId: 'enc-1',
      });
      d.grantsRepo.create.mockReturnValue({ id: 'g1' });
      const res = await d.service.decide(
        'r1',
        { decision: 'APPROVED' } as any,
        actor,
      );
      expect(res.grantId).toBe('g1');
    });

    it('decide: sin organización en el contexto no decide nada', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'r1',
        statusConceptId: DELEG.REQUEST_OPEN,
        practitionerDelegateAssignmentId: 'del1',
      });
      await expect(
        d.raw.decide('r1', { decision: 'APPROVED' } as any, actor),
      ).rejects.toBeDefined();
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
    });
  });
});
