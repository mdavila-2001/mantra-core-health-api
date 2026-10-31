import { jest } from '@jest/globals';
import { AccessRequestsService } from './access-requests.service';
import { DELEG } from '../delegated_access.concepts';
import { STATUS } from './concept-maps';
import { permissionAtomId, supportPermissionId } from '../domain';
import {
  ACTIVE_TENANT,
  buildScope,
  inTenant,
  thrown,
} from './delegation-scope.testing';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const ANA = { id: 'user-ana', roles: ['SUPPORT_STAFF'] } as any;
const dto = {
  tenantId: ACTIVE_TENANT,
  practitionerProfileId: 'prof-perez',
  patientProfileId: 'pat-1',
  reasonText: 'Necesito el motivo para reprogramar',
};
const delegate: any = {
  id: 'del1',
  practitionerRoleAssignmentId: 'ra-perez',
  delegatedPermissionSetId: 'set1',
  statusConceptId: STATUS.ACTIVE,
  acceptedAt: new Date(),
};

function build(permissionIds: string[], decision?: any) {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const requestsRepo = {
    findById: mockFn(),
    findOpenDuplicate: mockFn().mockResolvedValue(null),
    create: mockFn().mockReturnValue({
      id: 'r1',
      statusConceptId: DELEG.REQUEST_OPEN,
      createdAt: new Date(),
    }),
  };
  const delegatesRepo = { findById: mockFn().mockResolvedValue(delegate) };
  const setsRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'set1',
      tenantId: ACTIVE_TENANT,
      statusConceptId: STATUS.ACTIVE,
    }),
  };
  const access = {
    findEngagements: mockFn().mockResolvedValue([
      { assignment: { id: 'eng-ana' }, tenantId: ACTIVE_TENANT },
    ]),
    findDelegationsOfEngagements: mockFn().mockResolvedValue([
      { delegate, practitionerProfileId: 'prof-perez' },
    ]),
    findGrantsWithActions: mockFn().mockResolvedValue([
      {
        grant: { id: 'g1' },
        permissionIds,
        actions: permissionIds.map((permissionId) => ({
          permissionId,
          supersededAt: null,
        })),
      },
    ]),
  };
  const policy = {
    can: mockFn().mockResolvedValue(
      decision ?? { allowed: true, effect: 'PERMIT', reason: 'ALLOWED' },
    ),
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
    { create: mockFn() } as any,
    { record: mockFn() } as any,
    logger as any,
    scope,
    access as any,
    policy as any,
  );
  return { service: inTenant(raw), policy, access, requestsRepo };
}

describe('AccessRequestsService.requestAsSupport: átomo patients.clinical.request_temporary_access (§8.2 #14)', () => {
  it('quien tiene permisos solo como ALIAS lo tiene implícito: no se pregunta a la política (no regresión)', async () => {
    const d = build([supportPermissionId('schedule.view')]);
    await expect(d.service.requestAsSupport(dto, ANA)).resolves.toMatchObject({
      id: 'r1',
    });
    expect(d.policy.can).not.toHaveBeenCalled();
  });

  it('quien tiene permisos escritos como ÁTOMOS necesita el átomo de pedir acceso: la política decide, con el paciente y el motivo', async () => {
    const d = build([
      permissionAtomId('agenda.appointment.view'),
      permissionAtomId('patients.clinical.request_temporary_access'),
    ]);
    await expect(d.service.requestAsSupport(dto, ANA)).resolves.toMatchObject({
      id: 'r1',
    });
    const [input] = d.policy.can.mock.calls[0];
    expect(input).toMatchObject({
      userId: 'user-ana',
      tenantId: ACTIVE_TENANT,
      action: 'patients.clinical.request_temporary_access',
      practitionerProfileId: 'prof-perez',
      context: {
        patientProfileId: 'pat-1',
        proof: { reasonText: dto.reasonText },
      },
    });
  });

  it('sin el átomo (la política niega) no se abre la solicitud: 403', async () => {
    const d = build([permissionAtomId('agenda.appointment.view')], {
      allowed: false,
      effect: 'DENY',
      reason: 'ACTION_NOT_GRANTED',
    });
    const error: any = await thrown(d.service.requestAsSupport(dto, ANA));
    expect(error.getStatus()).toBe(403);
    expect(d.requestsRepo.create).not.toHaveBeenCalled();
  });

  it('un desafío de la política (p. ej. segundo paso) se traduce a su 403 estable', async () => {
    const d = build(
      [permissionAtomId('patients.clinical.request_temporary_access')],
      {
        allowed: false,
        effect: 'CHALLENGE',
        reason: 'STEP_UP_REQUIRED',
        challenge: {
          kind: 'STEP_UP',
          details: { maxAgeMinutes: 10, enrolled: true },
        },
      },
    );
    const error: any = await thrown(d.service.requestAsSupport(dto, ANA));
    expect(error.getStatus()).toBe(403);
    expect(error.reason).toBe('STEP_UP_REQUIRED');
  });
});
