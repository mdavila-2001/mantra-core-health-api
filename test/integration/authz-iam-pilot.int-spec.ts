import { randomUUID } from 'node:crypto';
import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { CONCEPTS } from '../../src/common';
import { AUTHZ } from '../../src/modules/authz/authz.concepts';
import * as entities from '../../src/modules/authz/entities';
import * as repo from '../../src/modules/authz/repositories';
import { AuthzPdpService } from '../../src/modules/authz/services/authz-pdp.service';
import { IamGlobalRolesAdapter } from '../../src/modules/authz/infrastructure/iam-global-roles.adapter';
import { AuthzClinicalRolesSeedService } from '../../src/common/seed/authz-clinical-roles-seed.service';
import { AuthzPlatformPermissionsSeedService } from '../../src/common/seed/authz-platform-permissions-seed.service';
import { PILOT_PERMISSION_DEFINITIONS } from '../../src/modules/authz/authz.permission-pilot.seed';
import { clinicalRoleId } from '../../src/modules/authz/authz.seed';
import {
  isDisposableDatabaseName,
  resolveResetTarget,
} from './disposable-database';

describe('IAM global → PDP y semillas del piloto (PostgreSQL)', () => {
  let orm: MikroORM;
  let service: AuthzPdpService;
  const userId = randomUUID(),
    tenantId = randomUUID();
  const logger = { setContext() {}, info() {}, warn() {} };
  const sql = (text: string, args: unknown[] = []) =>
    orm.em.fork().getConnection().execute(text, args);
  const query = {
    userId,
    tenantId,
    resource: 'authz.users_role_assignments.delete',
    action: 'DELETE' as const,
  };
  const actor = { id: userId, roles: ['SECURITY_ADMIN'] };

  beforeAll(async () => {
    const target = resolveResetTarget(process.env);
    if (!isDisposableDatabaseName(target.database))
      throw new Error('Se requiere una base descartable');
    orm = await MikroORM.init({
      host: target.host,
      port: target.port,
      dbName: target.database,
      user: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? '',
      entities: Object.values(entities),
      metadataProvider: TsMorphMetadataProvider,
    });
    const source = randomUUID(),
      system = randomUUID(),
      version = randomUUID();
    await sql(
      "insert into terminology.terminology_sources(id,code,name,created_at,updated_at) values(?::uuid,?,'Synthetic IAM PDP',now(),now())",
      [source, source],
    );
    await sql(
      "insert into terminology.code_systems(id,source_id,internal_code,name,canonical_url,created_at,updated_at) values(?::uuid,?::uuid,?,'Synthetic IAM PDP',?,now(),now())",
      [system, source, system, `urn:test:${system}`],
    );
    await sql(
      "insert into terminology.code_system_versions(id,code_system_id,version,created_at,updated_at) values(?::uuid,?::uuid,'test',now(),now())",
      [version, system],
    );
    for (const id of new Set([
      ...Object.values(AUTHZ),
      CONCEPTS.STATE_ACTIVE,
      CONCEPTS.STATE_REVOKED,
      CONCEPTS.USER_ACTIVE,
      CONCEPTS.USER_LOCKED,
      CONCEPTS.ROLE_SECURITY_ADMIN,
    ]))
      await sql(
        "insert into terminology.catalog_concepts(id,code_system_version_id,code,display,created_at,updated_at) values(?::uuid,?::uuid,?,'Synthetic IAM PDP',now(),now()) on conflict(id) do nothing",
        [id, version, id],
      );
    await sql(
      "insert into iam.users(id,status_concept_id,display_name,created_at,updated_at) values(?::uuid,?::uuid,'Synthetic global actor',now(),now())",
      [userId, CONCEPTS.USER_ACTIVE],
    );
    const rolesSeed = new AuthzClinicalRolesSeedService(orm, logger as never);
    const permissionSeed = new AuthzPlatformPermissionsSeedService(
      orm,
      logger as never,
    );
    await rolesSeed.run();
    await permissionSeed.run();
    expect((await rolesSeed.run()).inserted).toBe(0);
    expect((await permissionSeed.run()).inserted).toBe(0);
    service = new AuthzPdpService(
      orm.em.fork(),
      new repo.RolesRepository(),
      new repo.RolePermissionsRepository(),
      new repo.PermissionsRepository(),
      new repo.UserRoleAssignmentsRepository(),
      new repo.UserPermissionGrantsRepository(),
      new repo.AccessPoliciesRepository(),
      new repo.ClinicalAccessGrantsRepository(),
      new repo.CareRelationshipsRepository(),
      new repo.PatientLegalRepresentationsRepository(),
      new repo.ResourceScopeGrantsRepository(),
      new repo.FieldPermissionsRepository(),
      logger as never,
      new IamGlobalRolesAdapter(),
    );
  });
  afterAll(async () => {
    await orm?.close(true);
  });

  it('materializa once permisos, rechazos APPROVE y descriptor no asignable; la segunda pasada no inserta', async () => {
    const codes = PILOT_PERMISSION_DEFINITIONS.map((p) => p[0]);
    const rows = await sql(
      'select code,action_concept_id,allow_direct_user_grant from authz.permissions where code in (select jsonb_array_elements_text(?::jsonb))',
      [JSON.stringify(codes)],
    );
    expect(rows).toHaveLength(11);
    expect(rows.every((r) => r.allow_direct_user_grant === false)).toBe(true);
    expect(
      rows
        .filter((r) => String(r.code).endsWith('.reject'))
        .every((r) => r.action_concept_id === AUTHZ.ACTION_APPROVE),
    ).toBe(true);
    const [role] = await sql(
      'select is_assignable from authz.roles where id=?::uuid',
      [clinicalRoleId('SECURITY_ADMIN')],
    );
    expect(role.is_assignable).toBe(false);
  });

  it('no confía en el claim; permite la concesión IAM activa y deja de permitir tras revocarla', async () => {
    expect((await service.evaluate(query, actor)).decision).toBe('DENY');
    await sql(
      'insert into iam.user_global_roles(id,user_id,role_concept_id,state_concept_id,created_at,updated_at) values(?::uuid,?::uuid,?::uuid,?::uuid,now(),now())',
      [
        randomUUID(),
        userId,
        CONCEPTS.ROLE_SECURITY_ADMIN,
        CONCEPTS.STATE_ACTIVE,
      ],
    );
    expect((await service.evaluate(query, actor)).decision).toBe('PERMIT');
    await sql(
      'update iam.user_global_roles set state_concept_id=?::uuid where user_id=?::uuid',
      [CONCEPTS.STATE_REVOKED, userId],
    );
    expect((await service.evaluate(query, actor)).decision).toBe('DENY');
  });

  it('cuenta inactiva no hereda y un DENY individual prevalece sobre el rol global', async () => {
    await sql(
      'update iam.user_global_roles set state_concept_id=?::uuid where user_id=?::uuid',
      [CONCEPTS.STATE_ACTIVE, userId],
    );
    await sql(
      'update iam.users set status_concept_id=?::uuid where id=?::uuid',
      [CONCEPTS.USER_LOCKED, userId],
    );
    expect((await service.evaluate(query, actor)).decision).toBe('DENY');
    await sql(
      'update iam.users set status_concept_id=?::uuid where id=?::uuid',
      [CONCEPTS.USER_ACTIVE, userId],
    );
    const em = orm.em.fork();
    const permission = await em.findOneOrFail(entities.Permissions, {
      code: query.resource,
    });
    new repo.UserPermissionGrantsRepository().create(em, {
      userId,
      permissionId: permission.id,
      effectConceptId: AUTHZ.EFFECT_DENY,
      scopeConceptId: AUTHZ.SCOPE_GLOBAL,
      reason: 'Synthetic deny',
      actorUserId: userId,
    });
    await em.flush();
    expect((await service.evaluate(query, actor)).decision).toBe('DENY');
  });
});
