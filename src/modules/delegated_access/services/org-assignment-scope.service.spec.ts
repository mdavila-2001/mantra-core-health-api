import { jest } from '@jest/globals';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { DelegatedAccessErrorReason as R } from '../delegated_access.error-reasons';
import { OrgAssignmentScopeService } from './org-assignment-scope.service';

const TENANT = '11111111-1111-4111-8111-111111111111';
const SITE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER_SITE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const UNIT = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const SPACE = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const BRANCH = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

/** `tx.execute` que contesta según un fragmento del SQL. */
function fakeTx(
  answers: Record<string, unknown[] | ((p: unknown[]) => unknown[])>,
) {
  const execute = (jest.fn as any)(async (sql: string, params: unknown[]) => {
    for (const [needle, answer] of Object.entries(answers)) {
      if (sql.includes(needle)) {
        return typeof answer === 'function' ? answer(params) : answer;
      }
    }
    return [];
  });
  return { tx: { execute } as any, execute };
}

const structure = { resolve: (jest.fn as any)() };
const service = new OrgAssignmentScopeService(structure as any);

const siteRow = [{ id: SITE, practice_id: 'p1', branch_id: BRANCH }];
const unitRow = [
  { id: UNIT, practice_site_id: SITE, practice_id: 'p1', branch_id: BRANCH },
];
const spaceRow = [
  { id: SPACE, practice_site_id: SITE, practice_id: 'p1', branch_id: BRANCH },
];

describe('OrgAssignmentScopeService.resolve', () => {
  it('exige el objetivo de cada alcance (422 ASSIGNMENT_SCOPE_TARGET_REQUIRED)', async () => {
    const { tx } = fakeTx({});
    for (const [scope, field] of [
      ['PRACTICE', 'practiceId'],
      ['SITE', 'practiceSiteId'],
      ['UNIT', 'clinicalUnitId'],
      ['SPACE', 'careSpaceId'],
    ]) {
      await expect(
        service.resolve(tx, TENANT, 'NURSE', scope, {}),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          reason: R.ASSIGNMENT_SCOPE_TARGET_REQUIRED,
          details: expect.objectContaining({ requiredTarget: field }),
        }),
      });
    }
  });

  it('un objetivo que el alcance no usa es incoherente (422 …_MISMATCH)', async () => {
    const { tx } = fakeTx({});
    await expect(
      service.resolve(tx, TENANT, 'NURSE', 'SITE', {
        practiceSiteId: SITE,
        careSpaceId: SPACE,
      }),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    await expect(
      service.resolve(tx, TENANT, 'NURSE', 'TENANT', { practiceSiteId: SITE }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        reason: R.ASSIGNMENT_SCOPE_TARGET_MISMATCH,
      }),
    });
  });

  it('el jefe de servicio sólo se asigna con alcance de unidad', async () => {
    const { tx } = fakeTx({});
    await expect(
      service.resolve(tx, TENANT, 'UNIT_HEAD', 'SPACE', { careSpaceId: SPACE }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        reason: R.ASSIGNMENT_SCOPE_TARGET_MISMATCH,
      }),
    });
  });

  it('una sede, unidad o espacio que no es del tenant responde el mismo 404', async () => {
    const { tx, execute } = fakeTx({});
    for (const [scope, input] of [
      ['SITE', { practiceSiteId: SITE }],
      ['UNIT', { clinicalUnitId: UNIT }],
      ['SPACE', { careSpaceId: SPACE }],
    ] as const) {
      const failure = await service
        .resolve(tx, TENANT, 'NURSE', scope, input)
        .catch((e: unknown) => e);
      expect(failure).toBeInstanceOf(ResourceNotFoundException);
      expect((failure as any).response.reason).toBe(
        R.DELEGATED_SCOPE_TARGET_NOT_FOUND,
      );
      expect((failure as any).response.details).toBeUndefined();
    }
    // Siempre se pregunta acotando por el tenant del contexto.
    for (const call of execute.mock.calls) {
      expect(call[1]).toContain(TENANT);
    }
  });

  it('farmacia y unidad diagnóstica ajenas también son 404', async () => {
    const { tx } = fakeTx({});
    await expect(
      service.resolve(tx, TENANT, 'STAFF', 'TENANT', { pharmacyId: SITE }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    await expect(
      service.resolve(tx, TENANT, 'STAFF', 'TENANT', {
        diagnosticUnitId: SITE,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('el espacio de otra sede que la indicada es incoherente', async () => {
    const { tx } = fakeTx({
      'from practice.practice_sites': [
        { id: OTHER_SITE, practice_id: 'p1', branch_id: BRANCH },
      ],
      'from practice.care_spaces c': spaceRow,
    });
    await expect(
      service.resolve(tx, TENANT, 'NURSE', 'SPACE', {
        practiceSiteId: OTHER_SITE,
        careSpaceId: SPACE,
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        reason: R.ASSIGNMENT_SCOPE_TARGET_MISMATCH,
      }),
    });
  });

  it('el espacio que no cuelga de la unidad indicada es incoherente', async () => {
    const { tx } = fakeTx({
      'with recursive anc': [],
      'from practice.clinical_units u': unitRow,
      'from practice.care_spaces c': spaceRow,
    });
    await expect(
      service.resolve(tx, TENANT, 'NURSE', 'SPACE', {
        clinicalUnitId: UNIT,
        careSpaceId: SPACE,
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        reason: R.ASSIGNMENT_SCOPE_TARGET_MISMATCH,
      }),
    });
  });

  it('resuelve sede y sucursal de un espacio coherente', async () => {
    const { tx } = fakeTx({ 'from practice.care_spaces c': spaceRow });
    const resolved = await service.resolve(
      tx,
      TENANT,
      'HOUSEKEEPING',
      'SPACE',
      {
        careSpaceId: SPACE,
      },
    );
    expect(resolved).toMatchObject({
      scope: 'SPACE',
      siteId: SITE,
      branchId: BRANCH,
      targets: {
        careSpaceId: SPACE,
        clinicalUnitId: null,
        practiceSiteId: null,
      },
    });
  });

  it('resuelve una unidad con su sede de contexto', async () => {
    const { tx } = fakeTx({
      'from practice.practice_sites': siteRow,
      'from practice.clinical_units u': unitRow,
    });
    const resolved = await service.resolve(tx, TENANT, 'UNIT_HEAD', 'UNIT', {
      practiceSiteId: SITE,
      clinicalUnitId: UNIT,
    });
    expect(resolved.siteId).toBe(SITE);
  });
});

describe('OrgAssignmentScopeService.assertCanManage', () => {
  const actor = { id: 'actor' } as any;
  const grantee = { userId: 'other' };
  const where = { siteId: SITE, branchId: BRANCH };
  const access = (level: string, branches: string[] = []) =>
    ({ level, branchIds: new Set(branches) }) as any;

  it('plataforma y organización otorgan cualquier alcance del tenant', () => {
    expect(() =>
      service.assertCanManage(access('PLATFORM'), where, grantee, actor),
    ).not.toThrow();
    expect(() =>
      service.assertCanManage(
        access('ORG'),
        { siteId: null, branchId: null },
        grantee,
        actor,
      ),
    ).not.toThrow();
  });

  it('la sucursal otorga sobre sus sedes y no sobre las de otra', () => {
    expect(() =>
      service.assertCanManage(
        access('BRANCH_ADMIN', [BRANCH]),
        where,
        grantee,
        actor,
      ),
    ).not.toThrow();
    expect(() =>
      service.assertCanManage(
        access('BRANCH_ADMIN', ['ffffffff-ffff-4fff-8fff-ffffffffffff']),
        where,
        grantee,
        actor,
      ),
    ).toThrow(ResourceNotFoundException);
  });

  it('la sucursal no otorga alcance de organización o de práctica (403)', () => {
    expect(() =>
      service.assertCanManage(
        access('BRANCH_ADMIN', [BRANCH]),
        { siteId: null, branchId: null },
        grantee,
        actor,
      ),
    ).toThrow(InsufficientRoleException);
  });

  it('el administrador de sucursal no se asigna roles a sí mismo', () => {
    expect(() =>
      service.assertCanManage(
        access('BRANCH_ADMIN', [BRANCH]),
        where,
        { userId: 'actor' },
        actor,
      ),
    ).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({
          reason: R.ASSIGNMENT_SELF_NOT_ALLOWED,
        }),
      }),
    );
  });

  it('quien no pertenece al tenant recibe 404; un miembro sin administración, 403', () => {
    expect(() =>
      service.assertCanManage(access('NONE'), where, grantee, actor),
    ).toThrow(ResourceNotFoundException);
    for (const level of ['MEMBER', 'BRANCH_MEMBER']) {
      expect(() =>
        service.assertCanManage(access(level), where, grantee, actor),
      ).toThrow(InsufficientRoleException);
    }
  });
});

describe('OrgAssignmentScopeService.assertNoUnitHeadOverlap', () => {
  it('rechaza con 409 UNIT_HEAD_ALREADY_ASSIGNED si hay un jefe vigente que se solapa', async () => {
    const { tx } = fakeTx({ tstzrange: [{ id: 'x' }] });
    await expect(
      service.assertNoUnitHeadOverlap(tx, UNIT, { from: new Date(), to: null }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deja pasar si no hay solape', async () => {
    const { tx } = fakeTx({ tstzrange: [] });
    await expect(
      service.assertNoUnitHeadOverlap(
        tx,
        UNIT,
        { from: new Date(), to: null },
        'self',
      ),
    ).resolves.toBeUndefined();
  });
});

describe('OrgAssignmentScopeService.membership', () => {
  it('una membresía de otro tenant o inactiva es 404', async () => {
    const { tx, execute } = fakeTx({});
    await expect(
      service.membership(tx, TENANT, 'ffffffff-ffff-4fff-8fff-ffffffffffff'),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(execute.mock.calls[0][0]).toContain('tenant_id = ?');
    expect(execute.mock.calls[0][1]).toContain(TENANT);
  });
});
