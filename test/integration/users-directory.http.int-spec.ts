import { randomUUID } from 'node:crypto';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import {
  EntityManager,
  MikroORM,
  PostgreSqlDriver,
} from '@mikro-orm/postgresql';
import {
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
  type INestApplication,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { Client } from 'pg';
import request from 'supertest';
import { CONCEPTS } from '../../src/common';
import { RolesGuard } from '../../src/common/auth/roles.guard';
import { TenantScopeGuard } from '../../src/common/auth/tenant-scope.guard';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { createGlobalValidationPipe } from '../../src/common/http/validation-pipe';
import { TenantContextInterceptor } from '../../src/common/tenant/tenant-context.interceptor';
import { TracingService } from '../../src/observability';
import { AuthzUsersDirectoryController } from '../../src/modules/authz/controllers/authz-users-directory.controller';
import { UsersDirectoryReadAdapter } from '../../src/modules/authz/infrastructure/users-directory-read.adapter';
import { USERS_DIRECTORY_READ } from '../../src/modules/authz/ports/users-directory-read.port';
import { AuthzUsersDirectoryService } from '../../src/modules/authz/services/authz-users-directory.service';
import { AuditLog } from '../../src/modules/audit/entities';
import { AuditLogRepository } from '../../src/modules/audit/repositories';
import { AuditTrailService } from '../../src/modules/audit/services';
import { DIR } from '../../src/modules/directory/directory.concepts';
import {
  assertPermanentResidueTarget,
  resolveResetTarget,
} from './disposable-database';
import { rowInserter } from './support/row-inserter';

/**
 * `GET /authz/users/directory` through HTTP, against a real PostgreSQL.
 *
 * Real: `TenantScopeGuard`, `RolesGuard`, `TenantContextInterceptor`, the global
 * `ValidationPipe` and `AllExceptionsFilter`, the controller, the service, the
 * SQL adapter and the audit chain (`audit.audit_log`).
 * Replaced: JWT authentication only. `FakeAuth` reads the actor from the
 * `x-test-actor` header, so the real `JwtAuthGuard` and session store are not
 * exercised here.
 */
class FakeAuth implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const raw = req.headers['x-test-actor'];
    if (!raw) throw new UnauthorizedException();
    req.user = JSON.parse(String(raw));
    return true;
  }
}

describe('GET /authz/users/directory (HTTP, real database)', () => {
  const mark = randomUUID().slice(0, 8);
  const ids: Record<string, string> = {};
  let db: Client;
  let orm: MikroORM;
  let app: INestApplication;
  let insert: ReturnType<typeof rowInserter>['insert'];
  let cleanup: ReturnType<typeof rowInserter>['cleanup'];

  const actor = (over: Record<string, unknown>) => ({
    id: randomUUID(),
    roles: ['SECURITY_ADMIN'],
    tenantIds: [] as string[],
    ...over,
  });
  const get = (a: Record<string, unknown>, query = '', tenant?: string) => {
    const req = request(app.getHttpServer())
      .get(`/authz/users/directory${query}`)
      .set('x-test-actor', JSON.stringify(a));
    return tenant ? req.set('x-tenant-id', tenant) : req;
  };
  /** This run's rows only: other data in the database is not ours. */
  const mine = (items: Array<{ displayName: string }>) =>
    items.filter((i) => i.displayName.startsWith(mark));
  const auditRows = async (userId: string) =>
    (
      await db.query(
        'select action, tenant_id from audit.audit_log where user_id = $1',
        [userId],
      )
    ).rows;

  beforeAll(async () => {
    // The audit chain is insert-only: this suite leaves rows, so it refuses any
    // database that is not declared disposable.
    assertPermanentResidueTarget(resolveResetTarget(process.env), process.env);
    db = new Client({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    await db.connect();
    ({ insert, cleanup } = rowInserter(db, mark));

    const tenant = (label: string, type: string) =>
      insert('directory.tenants', {
        code: `${mark}-${label}`,
        tenant_type_concept_id: type,
        legal_name: `${mark}-${label}`,
      });
    const user = (label: string) =>
      insert('iam.users', {
        status_concept_id: CONCEPTS.USER_ACTIVE,
        display_name: `${mark}-${label}`,
      });
    const member = (userId: string, tenantId: string) =>
      insert('directory.tenant_memberships', {
        user_id: userId,
        tenant_id: tenantId,
        status_concept_id: DIR.MEMBERSHIP_ACTIVE,
        end_date: null,
      });
    ids.a = await tenant('a', CONCEPTS.TENANT_TYPE_PHARMACY);
    ids.b = await tenant('b', CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER);
    ids.aPharm = await user('a1-pharmacist');
    ids.aPlain = await user('a2-plain');
    ids.aThird = await user('a3-third');
    ids.bLab = await user('b1-lab');
    ids.root = await user('c1-root');
    for (const [u, t] of [
      [ids.aPharm, ids.a],
      [ids.aPlain, ids.a],
      [ids.aThird, ids.a],
      [ids.bLab, ids.b],
    ])
      await member(u, t);
    await insert('iam.user_global_roles', {
      user_id: ids.root,
      role_concept_id: CONCEPTS.ROLE_SUPERADMIN,
      state_concept_id: CONCEPTS.STATE_ACTIVE,
    });
    await insert('iam.authentication_credentials', {
      user_id: ids.aPharm,
      method_concept_id: CONCEPTS.CRED_PASSWORD,
      external_subject: `maria.${mark}@clinica.org`,
      secret_hash: 'HASH-MUST-NOT-LEAK',
      state_concept_id: CONCEPTS.STATE_ACTIVE,
    });
    await insert('iam.authentication_credentials', {
      user_id: ids.aPlain,
      method_concept_id: CONCEPTS.CRED_PASSWORD,
      external_subject: `DOC-${mark}`,
      state_concept_id: CONCEPTS.STATE_ACTIVE,
    });

    orm = await MikroORM.init({
      driver: PostgreSqlDriver,
      entities: [AuditLog],
      metadataProvider: ReflectMetadataProvider,
      metadataCache: { enabled: false },
      allowGlobalContext: true,
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      dbName: process.env.DB_NAME,
      connect: true,
    });
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthzUsersDirectoryController],
      providers: [
        { provide: EntityManager, useFactory: () => orm.em },
        UsersDirectoryReadAdapter,
        {
          provide: USERS_DIRECTORY_READ,
          useExisting: UsersDirectoryReadAdapter,
        },
        AuthzUsersDirectoryService,
        AuditTrailService,
        AuditLogRepository,
        TracingService,
        {
          provide: PinoLogger,
          useValue: {
            setContext: () => undefined,
            error: () => undefined,
            warn: () => undefined,
            info: () => undefined,
            debug: () => undefined,
          },
        },
        // Same order as AuthModule: authentication, tenant resolution, roles.
        { provide: APP_GUARD, useClass: FakeAuth },
        { provide: APP_GUARD, useClass: TenantScopeGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
      ],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(createGlobalValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await cleanup();
    await orm?.close();
    await db.end();
  });

  describe('Success', () => {
    it('platform SUPERADMIN sees every organization, with the exact contract', async () => {
      const res = await get(
        actor({ roles: ['SUPERADMIN'] }),
        '?limit=100',
      ).expect(200);
      expect(res.body.scope).toBe('PLATFORM');
      const names = mine(res.body.items).map((i: any) => i.displayName);
      expect(names).toEqual(
        expect.arrayContaining([
          `${mark}-a1-pharmacist`,
          `${mark}-b1-lab`,
          `${mark}-c1-root`,
        ]),
      );
      const root = res.body.items.find((i: any) => i.id === ids.root);
      expect(root.globalRoles).toEqual(['SUPERADMIN']);
      expect(root.permissions.unrestricted).toBe(true);
      const pharm = res.body.items.find((i: any) => i.id === ids.aPharm);
      expect(Object.keys(pharm).sort()).toEqual(
        [
          'displayName',
          'globalRoles',
          'id',
          'lastLoginAt',
          'maskedEmail',
          'mfaStatusConceptId',
          'permissions',
          'roles',
          'statusConceptId',
          'type',
        ].sort(),
      );
      expect(pharm.type).toBe('PHARMACY');
      expect(pharm.maskedEmail).toBe('m***@c***.org');
      const plain = res.body.items.find((i: any) => i.id === ids.aPlain);
      expect(plain.maskedEmail).toBeNull();
    });

    it('never puts a secret, a document or a full email on the wire', async () => {
      const res = await get(actor({ roles: ['SUPERADMIN'] }), '?limit=100');
      const text = JSON.stringify(res.body);
      expect(text).not.toContain('HASH-MUST-NOT-LEAK');
      expect(text).not.toContain(`maria.${mark}@clinica.org`);
      expect(text).not.toContain(`DOC-${mark}`);
    });

    it('an organization admin sees only that organization', async () => {
      const res = await get(actor({ tenantIds: [ids.a] })).expect(200);
      expect(res.body.scope).toBe('TENANT');
      const found = mine(res.body.items).map((i: any) => i.id);
      expect(found.sort()).toEqual([ids.aPharm, ids.aPlain, ids.aThird].sort());
      expect(found).not.toContain(ids.bLab);
      expect(found).not.toContain(ids.root);
    });

    it('a member of two organizations chooses one with X-Tenant-Id', async () => {
      const a = actor({ tenantIds: [ids.a, ids.b] });
      const res = await get(a, '', ids.b).expect(200);
      expect(mine(res.body.items).map((i: any) => i.id)).toEqual([ids.bLab]);
    });

    it('pages by cursor without repeats and ends with a null cursor', async () => {
      const a = actor({ tenantIds: [ids.a] });
      const seen: string[] = [];
      let cursor: string | null = null;
      for (let guard = 0; guard < 50; guard += 1) {
        const res = await get(
          a,
          `?limit=1${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
        ).expect(200);
        expect(res.body.items.length).toBeLessThanOrEqual(1);
        seen.push(...res.body.items.map((i: any) => i.id));
        cursor = res.body.nextCursor;
        if (!cursor) break;
      }
      expect(cursor).toBeNull();
      expect(new Set(seen).size).toBe(seen.length);
      expect(seen.sort()).toEqual([ids.aPharm, ids.aPlain, ids.aThird].sort());
    });

    it('filters by type and by role through the query string', async () => {
      const a = actor({ tenantIds: [ids.a] });
      const byType = await get(a, '?type=PHARMACY').expect(200);
      expect(byType.body.items.every((i: any) => i.type === 'PHARMACY')).toBe(
        true,
      );
      const none = await get(a, '?roleCode=NO_SUCH_ROLE_X').expect(200);
      expect(none.body.items).toEqual([]);
      expect(none.body.nextCursor).toBeNull();
    });
  });

  describe('Authorization and tenant', () => {
    it('401 without a session', async () => {
      await request(app.getHttpServer())
        .get('/authz/users/directory')
        .expect(401);
    });

    it('403 ROLE_INSUFFICIENT for a role without access', async () => {
      const res = await get(
        actor({ roles: ['PATIENT'], tenantIds: [ids.a] }),
      ).expect(403);
      expect(res.body.reason).toBe('ROLE_INSUFFICIENT');
    });

    it('403 ROLE_INSUFFICIENT for a SUPERADMIN scoped to one tenant (not a platform wildcard)', async () => {
      const res = await get(
        actor({
          roles: ['SUPERADMIN'],
          scopedRoles: { [ids.a]: ['SUPERADMIN'] },
          tenantIds: [ids.a],
        }),
      ).expect(403);
      expect(res.body.reason).toBe('ROLE_INSUFFICIENT');
    });

    it('403 ROLE_INSUFFICIENT when SECURITY_ADMIN was granted for another organization only', async () => {
      const res = await get(
        actor({
          scopedRoles: { [ids.a]: ['SECURITY_ADMIN'] },
          tenantIds: [ids.a, ids.b],
        }),
        '',
        ids.b,
      ).expect(403);
      expect(res.body.reason).toBe('ROLE_INSUFFICIENT');
    });

    it('403 TENANT_REQUIRED without any organization', async () => {
      const res = await get(actor({ tenantIds: [] })).expect(403);
      expect(res.body.reason).toBe('TENANT_REQUIRED');
    });

    it('403 TENANT_AMBIGUOUS with several organizations and no header', async () => {
      const res = await get(actor({ tenantIds: [ids.a, ids.b] })).expect(403);
      expect(res.body.reason).toBe('TENANT_AMBIGUOUS');
    });

    it('403 TENANT_MEMBERSHIP_REQUIRED for an organization the actor is not in', async () => {
      const res = await get(actor({ tenantIds: [ids.a] }), '', ids.b).expect(
        403,
      );
      expect(res.body.reason).toBe('TENANT_MEMBERSHIP_REQUIRED');
    });
  });

  describe('Validation errors', () => {
    const admin = () => actor({ tenantIds: [ids.a] });
    it.each([
      ['limit=0'],
      ['limit=101'],
      ['limit=abc'],
      ['limit=1.5'],
      ['type=BOGUS'],
      ['status=not-a-uuid'],
      ['roleCode=lowercase'],
    ])('400 VALIDATION_FAILED for %s', async (query) => {
      const res = await get(admin(), `?${query}`).expect(400);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('400 for a parameter the endpoint does not declare (there is no free-text search)', async () => {
      const res = await get(admin(), '?q=maria').expect(400);
      expect(res.body.code).toBe('VALIDATION_FAILED');
      expect(res.body.reason).toBe('VALIDATION_PIPE_REJECTED');
    });

    it('400 INVALID_CURSOR for a well-formed cursor that is not ours', async () => {
      const foreign = Buffer.from(JSON.stringify({ x: 1 })).toString(
        'base64url',
      );
      const res = await get(admin(), `?cursor=${foreign}`).expect(400);
      expect(res.body.reason).toBe('INVALID_CURSOR');
    });

    it('400 INVALID_CURSOR for a corrupt cursor', async () => {
      const res = await get(admin(), '?cursor=%25%25not-base64').expect(400);
      expect(res.body.reason).toBe('INVALID_CURSOR');
    });
  });

  describe('Audit', () => {
    it('seals every successful query in audit.audit_log, with the organization', async () => {
      const a = actor({ tenantIds: [ids.a] });
      await get(a).expect(200);
      await get(a).expect(200);
      const rows = await auditRows(a.id);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual({
        action: 'USERS_DIRECTORY_QUERIED',
        tenant_id: ids.a,
      });
    });

    it('seals a platform query with no organization', async () => {
      const root = actor({ roles: ['SUPERADMIN'] });
      await get(root).expect(200);
      expect(await auditRows(root.id)).toEqual([
        { action: 'USERS_DIRECTORY_QUERIED', tenant_id: null },
      ]);
    });

    it('leaves no seal when the request is refused', async () => {
      const denied = actor({ roles: ['PATIENT'], tenantIds: [ids.a] });
      const invalid = actor({ tenantIds: [ids.a] });
      await get(denied).expect(403);
      await get(invalid, '?limit=0').expect(400);
      expect(await auditRows(denied.id)).toEqual([]);
      expect(await auditRows(invalid.id)).toEqual([]);
    });
  });
});
