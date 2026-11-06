import { randomUUID } from 'node:crypto';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { CONCEPTS } from '../../src/common';
import * as iamEntities from '../../src/modules/iam/entities';
import { UserRoleAssignments } from '../../src/modules/authz/entities';
import { UserRoleAssignmentsRepository } from '../../src/modules/authz/repositories';
import { AuthzEffectiveRolesService } from '../../src/modules/authz/services/authz-effective-roles.service';
import { AuthzBusinessRolesAdapter } from '../../src/modules/iam/infrastructure/adapters/authz-business-roles.adapter';
import * as repositories from '../../src/modules/iam/infrastructure/repositories';
import { IamUsersService } from '../../src/modules/iam/application/services/iam-users.service';

/** Repositorios y transacción reales; fixtures sintéticos revertidos al terminar cada caso. */
describe('Baja IAM y revocación authz (PostgreSQL)', () => {
  let orm: MikroORM;
  const rollback = new Error('rollback synthetic fixtures');
  const sql = (em: EntityManager, query: string, params: unknown[] = []) =>
    em
      .getConnection()
      .execute(query, params, 'all', em.getTransactionContext());

  beforeAll(async () => {
    orm = await MikroORM.init({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5434),
      dbName: process.env.DB_NAME ?? 'mantra_redesa_health',
      user: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? '',
      entities: [...Object.values(iamEntities), UserRoleAssignments],
      metadataProvider: TsMorphMetadataProvider,
    });
  });
  afterAll(async () => {
    await orm?.close(true);
  });

  async function fixture(em: EntityManager) {
    const source = randomUUID(),
      system = randomUUID(),
      version = randomUUID();
    const actorId = randomUUID(),
      userId = randomUUID(),
      roleId = randomUUID();
    await sql(
      em,
      `insert into terminology.terminology_sources(id,code,name,created_at,updated_at) values (?, ?, 'Synthetic lifecycle', now(),now())`,
      [source, source],
    );
    await sql(
      em,
      `insert into terminology.code_systems(id,source_id,internal_code,name,canonical_url,created_at,updated_at) values (?, ?, ?, 'Synthetic lifecycle', ?, now(),now())`,
      [system, source, system, `urn:test:${system}`],
    );
    await sql(
      em,
      `insert into terminology.code_system_versions(id,code_system_id,version,created_at,updated_at) values (?, ?, 'test', now(),now())`,
      [version, system],
    );
    const concepts = [
      CONCEPTS.USER_ACTIVE,
      CONCEPTS.USER_LOCKED,
      CONCEPTS.STATE_ACTIVE,
      CONCEPTS.STATE_REVOKED,
      CONCEPTS.ROLE_USER,
      CONCEPTS.LOCK_REASON_MANUAL,
      CONCEPTS.LOCKOUT_ACTIVE,
      CONCEPTS.SEC_ACCOUNT_LOCK,
      CONCEPTS.OUTCOME_SUCCESS,
    ];
    for (const id of new Set(concepts)) {
      await sql(
        em,
        `insert into terminology.catalog_concepts(id,code_system_version_id,code,display,created_at,updated_at) values (?, ?, ?, 'Synthetic lifecycle',now(),now()) on conflict(id) do nothing`,
        [id, version, id],
      );
    }
    for (const id of [actorId, userId]) {
      await sql(
        em,
        `insert into iam.users(id,status_concept_id,display_name,created_at,updated_at) values (?, ?, 'Synthetic lifecycle',now(),now())`,
        [id, CONCEPTS.USER_ACTIVE],
      );
    }
    await sql(
      em,
      `insert into authz.roles(id,code,name,is_system,is_assignable,state_concept_id,created_at,updated_at) values (?, ?, 'Synthetic lifecycle',false,true,?,now(),now())`,
      [roleId, roleId, CONCEPTS.STATE_ACTIVE],
    );
    for (const [user, from] of [
      [userId, null],
      [userId, new Date(Date.now() + 86400000)],
      [actorId, null],
    ] as const) {
      await sql(
        em,
        `insert into authz.user_role_assignments(id,user_id,role_id,status_concept_id,valid_from,created_at,updated_at) values (?, ?, ?, ?, ?,now(),now())`,
        [randomUUID(), user, roleId, CONCEPTS.STATE_ACTIVE, from],
      );
    }
    return { actorId, userId };
  }

  function service(
    em: EntityManager,
    businessRoles: AuthzBusinessRolesAdapter,
  ) {
    return new IamUsersService(
      em,
      new repositories.UsersRepository(),
      new repositories.CredentialsRepository(),
      new repositories.UserGlobalRolesRepository(),
      new repositories.SessionsRepository(),
      new repositories.RefreshTokensRepository(),
      new repositories.AccountLockoutsRepository(),
      new repositories.SecurityEventsRepository(),
      {} as never,
      { setContext() {}, info() {} } as never,
      businessRoles,
    );
  }

  it('persiste la baja, revoca asignaciones actuales y futuras, conserva otro usuario y es idempotente', async () => {
    await expect(
      orm.em.fork().transactional(async (em) => {
        const { actorId, userId } = await fixture(em);
        const adapter = new AuthzBusinessRolesAdapter(
          new AuthzEffectiveRolesService(new UserRoleAssignmentsRepository()),
        );
        const users = service(em, adapter);
        const actor = { id: actorId, roles: ['SECURITY_ADMIN'] };
        expect(
          await users.deactivate(userId, 'Synthetic test', actor),
        ).toMatchObject({ state: 'DEACTIVATED', changed: true });
        const rows = await sql(
          em,
          'select user_id, status_concept_id, updated_by_user_id from authz.user_role_assignments where user_id in (?,?)',
          [userId, actorId],
        );
        expect(rows.filter((r: any) => r.user_id === userId)).toEqual([
          expect.objectContaining({
            status_concept_id: CONCEPTS.STATE_REVOKED,
            updated_by_user_id: actorId,
          }),
          expect.objectContaining({
            status_concept_id: CONCEPTS.STATE_REVOKED,
            updated_by_user_id: actorId,
          }),
        ]);
        expect(rows.find((r: any) => r.user_id === actorId)).toMatchObject({
          status_concept_id: CONCEPTS.STATE_ACTIVE,
        });
        const [stored] = await sql(
          em,
          'select status_concept_id from iam.users where id=?',
          [userId],
        );
        expect(stored.status_concept_id).toBe(CONCEPTS.USER_LOCKED);
        const [event] = await sql(
          em,
          "select detail_json->>'action' as action from iam.security_events where user_id=?",
          [userId],
        );
        expect(event.action).toBe('DEACTIVATE');
        expect(
          await users.deactivate(userId, 'Synthetic retry', actor),
        ).toMatchObject({ changed: false });
        throw rollback;
      }),
    ).rejects.toBe(rollback);
  });

  it('un fallo al revocar authz revierte estado, bloqueo y evento de seguridad', async () => {
    await expect(
      orm.em.fork().transactional(async (em) => {
        const { actorId, userId } = await fixture(em);
        const failure = new Error('synthetic authz failure');
        const adapter = new AuthzBusinessRolesAdapter(
          new AuthzEffectiveRolesService(new UserRoleAssignmentsRepository()),
        );
        adapter.revokeAllForUser = async () => {
          throw failure;
        };
        await expect(
          service(em, adapter).deactivate(userId, 'Synthetic test', {
            id: actorId,
            roles: ['SECURITY_ADMIN'],
          }),
        ).rejects.toBe(failure);
        const [user] = await sql(
          em,
          'select status_concept_id from iam.users where id=?',
          [userId],
        );
        expect(user.status_concept_id).toBe(CONCEPTS.USER_ACTIVE);
        const [events] = await sql(
          em,
          'select count(*)::int as n from iam.security_events where user_id=?',
          [userId],
        );
        expect(events.n).toBe(0);
        const [lockouts] = await sql(
          em,
          'select count(*)::int as n from iam.account_lockouts where user_id=?',
          [userId],
        );
        expect(lockouts.n).toBe(0);
        throw rollback;
      }),
    ).rejects.toBe(rollback);
  });
});
