import { jest } from '@jest/globals';
import { CONCEPTS, SEED } from '../constants/concepts';
import { DIR } from '../../modules/directory/directory.concepts';
import { TenantMemberships } from '../../modules/directory/entities';
import { UserGlobalRoles } from '../../modules/iam/entities';
import { ROLE_CONCEPT_BY_CODE } from '../../modules/iam/domain/role-mapping';
import {
  PersonalSpaceMembershipsSeedService,
  personalSpaceMembershipId,
} from './personal-space-memberships-seed.service';

const PAT = ROLE_CONCEPT_BY_CODE.PATIENT;
const PRAC = ROLE_CONCEPT_BY_CODE.PRACTITIONER;

interface Fixture {
  roles: { userId: string; roleConceptId: string; stateConceptId: string }[];
  memberships: { userId: string; tenantId: string }[];
}

/** EntityManager en memoria: sólo lo que el paso usa. */
function fakeEm(fx: Fixture) {
  const created: Record<string, unknown>[] = [];
  const em = {
    findOne: jest.fn(async () => ({ id: 'seed' })),
    create: jest.fn((entity: unknown, data: Record<string, unknown>) => {
      if (entity === TenantMemberships) created.push(data);
      return data;
    }),
    flush: jest.fn(async () => undefined),
    clear: jest.fn(),
    find: jest.fn(async (entity: unknown, where: Record<string, any>) => {
      if (entity === UserGlobalRoles) {
        return fx.roles.filter(
          (r) => r.stateConceptId === where.stateConceptId,
        );
      }
      if (entity === TenantMemberships) {
        const ids: string[] | undefined = where.userId?.$in;
        return fx.memberships.filter((m) => !ids || ids.includes(m.userId));
      }
      return [];
    }),
  };
  return { em, created };
}

function build(fx: Fixture) {
  const { em, created } = fakeEm(fx);
  const orm = { em: { fork: () => em } } as unknown as ConstructorParameters<
    typeof PersonalSpaceMembershipsSeedService
  >[0];
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as ConstructorParameters<
    typeof PersonalSpaceMembershipsSeedService
  >[1];
  const service = new PersonalSpaceMembershipsSeedService(orm, logger);
  return { service, created };
}

const role = (userId: string, roleConceptId: string) => ({
  userId,
  roleConceptId,
  stateConceptId: CONCEPTS.STATE_ACTIVE,
});

describe('PersonalSpaceMembershipsSeedService', () => {
  it('da la membresía del espacio personal a un paciente sin ninguna', async () => {
    const { service, created } = build({
      roles: [role('pat-1', PAT)],
      memberships: [],
    });

    const result = await service.run();

    expect(result).toMatchObject({
      created: 1,
      alreadyMember: 0,
      needsReview: 0,
    });
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      id: personalSpaceMembershipId('pat-1'),
      userId: 'pat-1',
      tenantId: SEED.tenantId,
      tenantRoleConceptId: DIR.ROLE_STAFF,
      statusConceptId: DIR.MEMBERSHIP_ACTIVE,
      accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
    });
  });

  it('no toca a quien ya tiene una membresía en otra organización', async () => {
    const { service, created } = build({
      roles: [role('prac-1', PRAC)],
      memberships: [{ userId: 'prac-1', tenantId: 'org-A' }],
    });

    const result = await service.run();

    expect(result).toMatchObject({ created: 0, alreadyMember: 1 });
    expect(created).toHaveLength(0);
  });

  it('no reactiva una membresía suspendida o revocada: cualquier fila cuenta', async () => {
    // El adaptador de lectura filtra por estado; el paso mira la existencia de
    // cualquier fila, así que una suspensión (que sigue siendo una fila) no se
    // reemplaza por una activa.
    const { service, created } = build({
      roles: [role('pat-2', PAT)],
      memberships: [{ userId: 'pat-2', tenantId: SEED.tenantId }],
    });

    const result = await service.run();

    expect(result).toMatchObject({ created: 0, alreadyMember: 1 });
    expect(created).toHaveLength(0);
  });

  it('una cuenta con rol personal y un rol administrativo global va a revisión manual', async () => {
    const { service, created } = build({
      roles: [role('mixed-1', PRAC), role('mixed-1', 'some-admin-concept')],
      memberships: [],
    });

    const result = await service.run();

    expect(result).toMatchObject({ created: 0, needsReview: 1 });
    expect(created).toHaveLength(0);
  });

  it('ignora cuentas sin rol personal (un administrador sin organización no recibe contexto)', async () => {
    const { service, created } = build({
      roles: [role('admin-1', 'some-admin-concept')],
      memberships: [],
    });

    const result = await service.run();

    expect(result).toMatchObject({
      created: 0,
      alreadyMember: 0,
      needsReview: 0,
    });
    expect(created).toHaveLength(0);
  });

  it('ignora roles revocados', async () => {
    const { service, created } = build({
      roles: [{ ...role('pat-3', PAT), stateConceptId: 'revoked' }],
      memberships: [],
    });

    const result = await service.run();

    expect(result.created).toBe(0);
    expect(created).toHaveLength(0);
  });

  it('es idempotente: la segunda pasada ya no crea nada', async () => {
    const fx: Fixture = { roles: [role('pat-4', PAT)], memberships: [] };
    const first = build(fx);
    await first.service.run();
    // Lo que el paso escribió queda visible en la siguiente lectura.
    fx.memberships.push({ userId: 'pat-4', tenantId: SEED.tenantId });

    const second = build(fx);
    const result = await second.service.run();

    expect(result).toMatchObject({ created: 0, alreadyMember: 1 });
    expect(second.created).toHaveLength(0);
  });

  it('el id determinista depende sólo de la persona', () => {
    expect(personalSpaceMembershipId('x')).toBe(personalSpaceMembershipId('x'));
    expect(personalSpaceMembershipId('x')).not.toBe(
      personalSpaceMembershipId('y'),
    );
  });
});
