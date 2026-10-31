import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AccessRequestsService } from './access-requests.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { STATUS } from './concept-maps';
import {
  ACTIVE_TENANT,
  buildScope,
  inTenant,
  thrown,
} from './delegation-scope.testing';

const DOCTOR = {
  id: 'doc-user',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'prof-perez',
} as any;
const ADMIN = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const ANA = { id: 'user-ana', roles: ['SUPPORT_STAFF'] } as any;

const delegate = (overrides: Record<string, unknown> = {}): any => ({
  id: 'del1',
  practitionerRoleAssignmentId: 'ra-perez',
  delegatedPermissionSetId: 'set1',
  statusConceptId: STATUS.ACTIVE,
  acceptedAt: new Date(),
  ...overrides,
});

/** Construye el servicio con la política de alcance real y repositorios en doble. */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const requestsRepo = {
    findById: mockFn(),
    findOpenDuplicate: mockFn().mockResolvedValue(null),
    create: mockFn(),
  };
  const delegatesRepo = { findById: mockFn().mockResolvedValue(delegate()) };
  const setsRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'set1',
      tenantId: ACTIVE_TENANT,
      statusConceptId: STATUS.ACTIVE,
    }),
  };
  const grantsRepo = { create: mockFn() };
  const eventsRepo = { record: mockFn() };
  const access = {
    findEngagements: mockFn().mockResolvedValue([
      { assignment: { id: 'eng-ana' }, tenantId: ACTIVE_TENANT },
    ]),
    findDelegationsOfEngagements: mockFn().mockResolvedValue([
      { delegate: delegate(), practitionerProfileId: 'prof-perez' },
    ]),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const { scope, scopeRepo } = buildScope({
    setsRepo,
    delegatesRepo,
    orgAssignmentsRepo: { findById: mockFn() },
  });
  scopeRepo.roleAssignmentPractitioner =
    mockFn().mockResolvedValue('prof-perez');
  const raw = new AccessRequestsService(
    em as any,
    requestsRepo as any,
    delegatesRepo as any,
    grantsRepo as any,
    eventsRepo,
    logger as any,
    scope,
    access as any,
  );
  return {
    service: inTenant(raw),
    raw,
    tx,
    requestsRepo,
    delegatesRepo,
    setsRepo,
    grantsRepo,
    eventsRepo,
    access,
    scopeRepo,
  };
}

describe('AccessRequestsService', () => {
  describe('requestAccess (UC-29-04)', () => {
    it('abre la solicitud y registra ACCESS_REQUESTED', async () => {
      const d = build();
      d.requestsRepo.create.mockReturnValue({
        id: 'r1',
        statusConceptId: DELEG.REQUEST_OPEN,
        createdAt: new Date(),
      });
      const res = await d.service.requestAccess(
        'del1',
        { requestedPermissionId: 'p1' },
        ADMIN,
      );
      expect(res.id).toBe('r1');
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: DELEG.EVENT_ACCESS_REQUESTED,
        }),
      );
    });

    it('A6: una delegación de otra organización responde como inexistente', async () => {
      const d = build();
      d.setsRepo.findById.mockResolvedValue({
        id: 'set1',
        tenantId: 'otra-org',
        statusConceptId: STATUS.ACTIVE,
      });
      await expect(
        d.service.requestAccess('del1', { requestedPermissionId: 'p1' }, ADMIN),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.requestsRepo.create).not.toHaveBeenCalled();
    });

    it('A6: un paciente o encuentro ajenos al tenant no se pueden pedir', async () => {
      const d = build();
      d.scopeRepo.encounterScope.mockResolvedValue({
        tenantId: 'otra-org',
        patientProfileId: 'pat-1',
      });
      await expect(
        d.service.requestAccess(
          'del1',
          { requestedPermissionId: 'p1', encounterId: 'enc-ajeno' },
          ADMIN,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rechaza una delegación inactiva', async () => {
      const d = build();
      d.delegatesRepo.findById.mockResolvedValue(
        delegate({ statusConceptId: STATUS.REVOKED }),
      );
      await expect(
        d.service.requestAccess('del1', { requestedPermissionId: 'p1' }, ADMIN),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza una solicitud pendiente equivalente', async () => {
      const d = build();
      d.requestsRepo.findOpenDuplicate.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.requestAccess('del1', { requestedPermissionId: 'p1' }, ADMIN),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('requestAsSupport (caso 10: Ana pide acceso temporal a una historia)', () => {
    const dto = {
      tenantId: ACTIVE_TENANT,
      practitionerProfileId: 'prof-perez',
      patientProfileId: 'pat-1',
      reasonText: 'Necesito el motivo para reprogramar',
    };

    it('abre la solicitud sobre su delegación aceptada con el doctor', async () => {
      const d = build();
      d.requestsRepo.create.mockReturnValue({
        id: 'r1',
        statusConceptId: DELEG.REQUEST_OPEN,
        createdAt: new Date(),
      });
      const res = await d.service.requestAsSupport(dto, ANA);
      expect(res.id).toBe('r1');
      const [[, data]] = d.requestsRepo.create.mock.calls;
      expect(data.practitionerDelegateAssignmentId).toBe('del1');
      expect(data.patientProfileId).toBe('pat-1');
      expect(d.access.findEngagements).toHaveBeenCalledWith(expect.anything(), {
        userId: 'user-ana',
        tenantId: ACTIVE_TENANT,
      });
    });

    it('sin vínculo en esa organización responde 403', async () => {
      const d = build();
      d.access.findEngagements.mockResolvedValue([]);
      await expect(d.service.requestAsSupport(dto, ANA)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('un doctor que no la aceptó (o que no es el suyo) responde como inexistente', async () => {
      const d = build();
      d.access.findDelegationsOfEngagements.mockResolvedValue([
        {
          delegate: delegate({ acceptedAt: undefined }),
          practitionerProfileId: 'prof-perez',
        },
      ]);
      await expect(d.service.requestAsSupport(dto, ANA)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('un paciente que no existe responde como inexistente y no abre nada', async () => {
      const d = build();
      d.scopeRepo.patientExists.mockResolvedValue(false);
      await expect(d.service.requestAsSupport(dto, ANA)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      expect(d.requestsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('decide (UC-29-05)', () => {
    const openRequest = (): any => ({
      id: 'r1',
      statusConceptId: DELEG.REQUEST_OPEN,
      practitionerDelegateAssignmentId: 'del1',
      patientProfileId: 'pat-1',
    });

    it('la solicitud inexistente responde 404', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.decide('r1', { decision: 'APPROVED' } as any, DOCTOR),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('una solicitud cerrada no se decide otra vez', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        id: 'r1',
        statusConceptId: DELEG.REQUEST_CLOSED,
      });
      await expect(
        d.service.decide('r1', { decision: 'APPROVED' } as any, DOCTOR),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('el doctor titular aprueba y se emite el permiso acotado', async () => {
      const d = build();
      const request = openRequest();
      d.requestsRepo.findById.mockResolvedValue(request);
      d.grantsRepo.create.mockReturnValue({ id: 'g1' });
      const res = await d.service.decide(
        'r1',
        { decision: 'APPROVED' } as any,
        DOCTOR,
      );
      expect(request.statusConceptId).toBe(DELEG.REQUEST_CLOSED);
      expect(request.decisionConceptId).toBe(DELEG.DECISION_APPROVED);
      expect(res).toEqual({
        requestId: 'r1',
        decision: 'APPROVED',
        grantId: 'g1',
      });
    });

    it('A6: la administración NO decide en lugar del doctor (ni se auto-aprueba)', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue(openRequest());
      const failure = await thrown(
        d.service.decide('r1', { decision: 'APPROVED' } as any, ADMIN),
      );
      expect(failure).toBeInstanceOf(ResourceNotFoundException);
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
    });

    it('A6: un doctor que no es el titular de la delegación responde 404', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue(openRequest());
      const otro = { ...DOCTOR, practitionerProfileId: 'prof-otro' };
      await expect(
        d.service.decide('r1', { decision: 'APPROVED' } as any, otro),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('A-M1: una solicitud CERRADA de otra organización responde 404, no 412 (no revela su estado)', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue({
        ...openRequest(),
        statusConceptId: DELEG.REQUEST_CLOSED,
      });
      d.setsRepo.findById.mockResolvedValue({
        id: 'set1',
        tenantId: 'otra-org',
        statusConceptId: STATUS.ACTIVE,
      });
      const err = await thrown(
        d.service.decide('r1', { decision: 'APPROVED' } as any, DOCTOR),
      );
      expect(err).toBeInstanceOf(ResourceNotFoundException);
    });

    it('A6: una solicitud cuya delegación es de otra organización responde como inexistente', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue(openRequest());
      d.setsRepo.findById.mockResolvedValue({
        id: 'set1',
        tenantId: 'otra-org',
        statusConceptId: STATUS.ACTIVE,
      });
      await expect(
        d.service.decide('r1', { decision: 'APPROVED' } as any, DOCTOR),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('A6: al aprobar valida el paciente y el encuentro contra el tenant', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue(openRequest());
      d.scopeRepo.patientExists.mockResolvedValue(false);
      await expect(
        d.service.decide('r1', { decision: 'APPROVED' } as any, DOCTOR),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
    });

    it('deniega sin emitir permiso', async () => {
      const d = build();
      d.requestsRepo.findById.mockResolvedValue(openRequest());
      const res = await d.service.decide(
        'r1',
        { decision: 'DENIED' } as any,
        DOCTOR,
      );
      expect(res).toEqual({
        requestId: 'r1',
        decision: 'DENIED',
        grantId: undefined,
      });
      expect(d.grantsRepo.create).not.toHaveBeenCalled();
    });
  });
});
