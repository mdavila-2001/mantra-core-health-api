import { jest } from '@jest/globals';
import { EffectiveSupportAccessService } from './effective-support-access.service';
import { DELEG } from '../delegated_access.concepts';
import { DIR } from '../../directory/directory.concepts';
import { AUTHZ } from '../../authz/authz.concepts';
import { STATUS } from './concept-maps';
import { permissionAtomId, supportPermissionId } from '../domain';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-hospital';

const grant = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  organizationUserAssignmentId: 'eng-ana',
  targetKindConceptId: DELEG.SUPPORT_TARGET_PRACTITIONER,
  practitionerRoleAssignmentId: 'pra-perez',
  expansionModeConceptId: DELEG.SUPPORT_EXPANSION_DYNAMIC,
  statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
  ...overrides,
});

function build(grants: any[]) {
  const access = {
    findEngagements: mockFn().mockResolvedValue([
      {
        assignment: {
          id: 'eng-ana',
          statusConceptId: STATUS.ACTIVE,
          validFrom: new Date('2026-01-01'),
        },
        tenantId: TENANT,
        userId: 'user-ana',
        membershipStatusConceptId: DIR.MEMBERSHIP_ACTIVE,
      },
    ]),
    findRoleAssignmentsOfTenant: mockFn().mockResolvedValue([
      {
        id: 'pra-perez',
        practitionerProfileId: 'prof-perez',
        tenantId: TENANT,
      },
    ]),
    findLocationPairs: mockFn().mockResolvedValue([]),
    findGrantsWithActions: mockFn().mockResolvedValue(grants),
    findRoleAssignments: mockFn().mockResolvedValue(
      new Map([
        ['pra-perez', { id: 'pra-perez', practitionerProfileId: 'prof-perez' }],
      ]),
    ),
    findDelegationsOfEngagements: mockFn().mockResolvedValue([
      { practitionerProfileId: 'prof-perez' },
    ]),
    findCareSpaceIdsWithin: mockFn().mockResolvedValue([]),
  };
  const effective = { replace: mockFn().mockResolvedValue(undefined) };
  const logger = { setContext: mockFn(), info: mockFn() };
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const service = new EffectiveSupportAccessService(
    {} as any,
    access as any,
    effective as any,
    {} as any,
    {} as any,
    {} as any,
    logger as any,
  );
  return { service, effective, access, tx };
}

describe('EffectiveSupportAccessService: concesiones DENY y acciones reemplazadas', () => {
  it('refreshTenant no materializa una concesión DENY (solo las ALLOW dejan filas)', async () => {
    const allow = grant('g-allow');
    const deny = grant('g-deny', { effectConceptId: AUTHZ.EFFECT_DENY });
    const { service, effective, tx } = build([
      { grant: allow, permissionIds: [supportPermissionId('schedule.view')] },
      {
        grant: deny,
        permissionIds: [permissionAtomId('agenda.appointment.view.reason')],
      },
    ]);
    await service.refreshTenant(TENANT, { tx: tx as any });
    const rows = effective.replace.mock.calls[0][3];
    expect(rows.map((r: any) => r.grantId)).toEqual(['g-allow']);
    expect(rows.map((r: any) => r.permissionCode)).toEqual(['schedule.view']);
  });

  it('una acción escrita como átomo conserva su código de átomo en la fila derivada', async () => {
    const { service, effective, tx } = build([
      {
        grant: grant('g-atoms'),
        permissionIds: [permissionAtomId('agenda.appointment.cancel')],
      },
    ]);
    await service.refreshTenant(TENANT, { tx: tx as any });
    const rows = effective.replace.mock.calls[0][3];
    expect(rows.map((r: any) => r.permissionCode)).toEqual([
      'agenda.appointment.cancel',
    ]);
  });

  it('previewForDoctor tampoco cuenta una DENY como acción del doctor', async () => {
    const { service } = build([
      {
        grant: grant('g-deny', { effectConceptId: AUTHZ.EFFECT_DENY }),
        permissionIds: [supportPermissionId('schedule.cancel')],
      },
      {
        grant: grant('g-allow'),
        permissionIds: [supportPermissionId('schedule.view')],
      },
    ]);
    (service as any).em = { fork: () => ({}) };
    const preview = await service.previewForDoctor(TENANT, 'prof-perez');
    expect([...(preview.get('user-ana') ?? [])]).toEqual(['schedule.view']);
  });
});
