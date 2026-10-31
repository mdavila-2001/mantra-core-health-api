import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { MikroORM, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import * as delegated from '../../src/modules/delegated_access/entities';
import {
  CareSpaces,
  HealthcareServices,
  PracticeSites,
  Practices,
  PractitionerRoleAssignments,
} from '../../src/modules/practice/entities';
import { TenantMemberships } from '../../src/modules/directory/entities';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import { CONCEPTS, ResourceNotFoundException } from '../../src/common';
import { runWithTenant } from '../../src/common';
import {
  AccessReviewRepository,
  DelegatedPermissionSetsRepository,
  DelegationScopeRepository,
  GovernanceQueriesRepository,
  OrganizationUserAssignmentsRepository,
  PractitionerDelegateAssignmentsRepository,
} from '../../src/modules/delegated_access/repositories';
import { DelegationScopeService } from '../../src/modules/delegated_access/services/delegation-scope.service';
import { OrgUserAssignmentsService } from '../../src/modules/delegated_access/services/org-user-assignments.service';
import { IamStepUpService } from '../../src/modules/iam/application/services/iam-step-up.service';
import { SecurityEventsRepository } from '../../src/modules/iam/infrastructure/repositories/security-events.repository';
import { IamErrorReason } from '../../src/modules/iam/iam.error-reasons';

/**
 * Revisión de seguridad del gobierno de accesos, ronda 1, contra PostgreSQL REAL
 * conectado como `mantra_app` (sin BYPASSRLS): lo que un doble no puede probar.
 *
 *   A-M1  vínculos y delegaciones: RLS por organización, disparador de tenant y guardas del servicio
 *   A-B2  `access_decision_log`: sin UPDATE/DELETE/TRUNCATE ni para la aplicación ni para el dueño
 *   A-B6  `support_access_allowed` respeta un DENY
 *   B-B3  el ítem de revisión se bloquea (FOR UPDATE): el segundo decisor espera y ve la decisión del primero
 *   B-B10 verificaciones paralelas del segundo factor: el cerrojo por persona serializa contador y consumo
 *   B-B12 barridos con exclusión mutua (cerrojo consultivo de la base)
 *
 * Es opt-in (`SEG1_TEST=1`) porque exige una base PROPIA con el modelo, los parches (incluido v4273),
 * el hospital piloto (04, 07, 09) y el rol `mantra_app` con LOGIN. Receta:
 *
 *   createdb seg1 && psql -d seg1 -f SQL/apply_all.sql && psql -d seg1 -f SQL/apply_deferred.sql
 *   for p in SQL/patches/*.sql; do psql -d seg1 -f $p; done          # incluye 2026-08-05_tenant_rls.sql y v4273
 *   psql -d seg1 -v demo_accounts=1 -f salud-db/demo/04-hospital-piloto.sql   # y 07, 09
 *   psql -d seg1 -c "alter role mantra_app login"
 *
 * Se apunta con `SEG1_DB_HOST/PORT/NAME`, `SEG1_ADMIN_USER` (superusuario que siembra; por defecto
 * `postgres`) y `SEG1_APP_USER` (por defecto `mantra_app`). Nunca la base compartida ni el puerto 5432.
 */
const describeSeg = process.env.SEG1_TEST === '1' ? describe : describe.skip;

const HOST = process.env.SEG1_DB_HOST ?? '127.0.0.1';
const PORT = Number(process.env.SEG1_DB_PORT ?? 5611);
const DB = process.env.SEG1_DB_NAME ?? 'seg1';
const ADMIN_USER = process.env.SEG1_ADMIN_USER ?? 'postgres';
const APP_USER = process.env.SEG1_APP_USER ?? 'mantra_app';

/** Anclas del hospital piloto sembrado por 04/07/09. */
const HOSPITAL = '830e47e1-8e82-50ff-99c0-bfed0a7971a4';
const CONSULTORIO = 'a52f851c-e5c2-5a32-b99e-a4993ff5a287';
const ANA_BOND = '9f1761b6-e456-5a99-bf11-d14b05077d4f';
const ANA_USER = 'bc643859-d89d-582e-86fa-fb3f6819ee29';
/** El Dr. Pérez: revisa y decide los ítems de Ana (la persona revisada no puede decidir los suyos). */
const PEREZ_USER = '6a796b91-f7db-5160-97b8-f38ed8614f95';
const ROSA_BOND = 'fa601b88-ccf6-5360-aea4-52a889a0d5a7';
const PEREZ_ROLE = 'f4e4d910-002f-5a42-a3fa-8696220f940b';
const ANA_GRANT = '656e1227-25d4-5369-bf7d-7a87b9cfa812';

const ENTITIES = [
  ...Object.values(delegated),
  CareSpaces,
  HealthcareServices,
  PracticeSites,
  Practices,
  PractitionerRoleAssignments,
  TenantMemberships,
] as any[];

const logger: any = {
  setContext: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};
const ROLLBACK = new Error('rollback');
const id = (): string => randomUUID();

describeSeg(
  'Revisión de seguridad del gobierno, ronda 1 (base real, como mantra_app)',
  () => {
    let admin: pg.Client;
    let app: pg.Client;
    let orm: MikroORM;
    const before = process.env.RLS_ENFORCE;

    /** Corre `fn` en una transacción de la aplicación con el contexto de la organización; revierte salvo `commit`. */
    async function inTenant<T>(
      tenant: string,
      fn: (tx: any) => Promise<T>,
      commit = false,
    ): Promise<T> {
      let out: T | undefined;
      try {
        await orm.em.fork().transactional(async (tx) => {
          await tx.execute(
            "select set_config('app.system_context', 'false', true)",
          );
          await tx.execute(
            "select set_config('app.current_tenant_id', ?, true)",
            [tenant],
          );
          out = await fn(tx);
          if (!commit) throw ROLLBACK;
        });
      } catch (e) {
        if (e !== ROLLBACK) throw e;
      }
      return out as T;
    }

    /** Sentencias del rol de la aplicación (cliente `pg`) con el contexto de una organización, en una transacción que se revierte. */
    async function asApp<T>(
      tenant: string,
      fn: (c: pg.Client) => Promise<T>,
    ): Promise<T> {
      await app.query('begin');
      try {
        await app.query(
          "select set_config('app.current_tenant_id', $1, true)",
          [tenant],
        );
        return await fn(app);
      } finally {
        await app.query('rollback');
      }
    }

    beforeAll(async () => {
      admin = new pg.Client({
        host: HOST,
        port: PORT,
        user: ADMIN_USER,
        database: DB,
      });
      await admin.connect();
      app = new pg.Client({
        host: HOST,
        port: PORT,
        user: APP_USER,
        database: DB,
      });
      await app.connect();
      orm = await MikroORM.init({
        driver: PostgreSqlDriver,
        host: HOST,
        port: PORT,
        user: APP_USER,
        dbName: DB,
        entities: ENTITIES,
        metadataProvider: ReflectMetadataProvider,
        allowGlobalContext: true,
        discovery: { warnWhenNoEntities: false },
        forceUtcTimezone: true,
      });
      process.env.RLS_ENFORCE = 'true';
    });

    afterAll(async () => {
      if (before === undefined) delete process.env.RLS_ENFORCE;
      else process.env.RLS_ENFORCE = before;
      await orm?.close(true);
      await app?.end();
      await admin?.end();
    });

    // ──────────────────────────────────────────────────────────────── A-M1
    describe('A-M1: vínculos y delegaciones aislados por organización', () => {
      it('con el contexto del hospital, mantra_app NO ve ni actualiza los vínculos ni las delegaciones del consultorio', async () => {
        for (const table of [
          'organization_user_assignments',
          'practitioner_delegate_assignments',
        ]) {
          const own = await admin.query(
            `select count(*)::int as n from delegated_access.${table} where tenant_id = $1`,
            [HOSPITAL],
          );
          const foreign = await admin.query(
            `select count(*)::int as n from delegated_access.${table} where tenant_id = $1`,
            [CONSULTORIO],
          );
          expect(foreign.rows[0].n).toBeGreaterThan(0);
          const seen = await asApp(HOSPITAL, (c) =>
            c.query(`select tenant_id from delegated_access.${table}`),
          );
          expect(seen.rows.length).toBe(own.rows[0].n);
          expect(seen.rows.every((r) => r.tenant_id === HOSPITAL)).toBe(true);
          const touched = await asApp(HOSPITAL, (c) =>
            c.query(
              `update delegated_access.${table} set updated_at = updated_at where tenant_id = $1`,
              [CONSULTORIO],
            ),
          );
          expect(touched.rowCount).toBe(0);
        }
      });

      it('sin organización en el contexto, mantra_app no ve ninguna fila (falla cerrado)', async () => {
        const seen = await asApp('', (c) =>
          c.query(
            'select 1 from delegated_access.organization_user_assignments',
          ),
        );
        expect(seen.rows.length).toBe(0);
      });

      it('el disparador rechaza un tenant distinto del de la membresía (23514) y un nodo de alcance de otra organización (23514)', async () => {
        await admin.query('begin');
        try {
          await admin.query('savepoint a');
          await expect(
            admin.query(
              `insert into delegated_access.organization_user_assignments
               (id, tenant_id, tenant_membership_id, assignment_role_concept_id, access_scope_concept_id, status_concept_id, created_at, updated_at)
             select gen_random_uuid(), $1, tenant_membership_id, assignment_role_concept_id, access_scope_concept_id, status_concept_id, now(), now()
               from delegated_access.organization_user_assignments where id = $2`,
              [CONSULTORIO, ANA_BOND],
            ),
          ).rejects.toMatchObject({ code: '23514' });
          await admin.query('rollback to savepoint a');
          await expect(
            admin.query(
              `insert into delegated_access.organization_user_assignments
               (id, tenant_id, tenant_membership_id, assignment_role_concept_id, access_scope_concept_id, status_concept_id, practice_site_id, created_at, updated_at)
             select gen_random_uuid(), a.tenant_id, a.tenant_membership_id, a.assignment_role_concept_id, a.access_scope_concept_id, a.status_concept_id,
                    (select ps.id from practice.practice_sites ps join practice.practices p on p.id = ps.practice_id where p.tenant_id = $1 limit 1), now(), now()
               from delegated_access.organization_user_assignments a where a.id = $2`,
              [CONSULTORIO, ANA_BOND],
            ),
          ).rejects.toMatchObject({ code: '23514' });
        } finally {
          await admin.query('rollback');
        }
      });

      it('scopeNodeTenant resuelve el tenant de cada tipo de nodo con SQL válido contra el esquema real (y null si no existe)', async () => {
        const repo = new DelegationScopeRepository();
        const first = async (sql: string, params: unknown[]): Promise<string> =>
          (await admin.query(sql, params)).rows[0].id as string;
        const practiceB = await first(
          'select id from practice.practices where tenant_id = $1 limit 1',
          [CONSULTORIO],
        );
        const siteB = await first(
          `select ps.id from practice.practice_sites ps join practice.practices p on p.id = ps.practice_id
          where p.tenant_id = $1 limit 1`,
          [CONSULTORIO],
        );
        const spaceB = await first(
          `select c.id from practice.care_spaces c join practice.practice_sites ps on ps.id = c.practice_site_id
           join practice.practices p on p.id = ps.practice_id where p.tenant_id = $1 limit 1`,
          [CONSULTORIO],
        );
        // Desde el consultorio, cada nodo propio resuelve a su organización.
        await inTenant(CONSULTORIO, async (tx) => {
          expect(await repo.scopeNodeTenant(tx, 'practice', practiceB)).toBe(
            CONSULTORIO,
          );
          expect(await repo.scopeNodeTenant(tx, 'practice_site', siteB)).toBe(
            CONSULTORIO,
          );
          expect(await repo.scopeNodeTenant(tx, 'care_space', spaceB)).toBe(
            CONSULTORIO,
          );
        });
        await inTenant(HOSPITAL, async (tx) => {
          // Desde el hospital esos mismos ids ni se ven (la práctica tiene RLS): `null` = 404 uniforme.
          expect(
            await repo.scopeNodeTenant(tx, 'practice', practiceB),
          ).toBeNull();
          expect(
            await repo.scopeNodeTenant(tx, 'practice_site', siteB),
          ).toBeNull();
          expect(
            await repo.scopeNodeTenant(tx, 'care_space', spaceB),
          ).toBeNull();
          // y un id inexistente de cualquier tipo también es `null` (el SQL de los seis tipos es válido).
          for (const kind of [
            'practice',
            'practice_site',
            'clinical_unit',
            'care_space',
            'diagnostic_unit',
            'pharmacy',
          ] as const) {
            expect(await repo.scopeNodeTenant(tx, kind, id())).toBeNull();
          }
          expect(await repo.userHasMembership(tx, ANA_USER, HOSPITAL)).toBe(
            true,
          );
          expect(await repo.userHasMembership(tx, ANA_USER, CONSULTORIO)).toBe(
            false,
          );
        });
      });

      describe('OrgUserAssignmentsService con la base real', () => {
        function service(): OrgUserAssignmentsService {
          const orgRepo = new OrganizationUserAssignmentsRepository();
          const delegatesRepo = new PractitionerDelegateAssignmentsRepository();
          const scope = new DelegationScopeService(
            new DelegatedPermissionSetsRepository(),
            delegatesRepo,
            orgRepo,
            new DelegationScopeRepository(),
          );
          return new OrgUserAssignmentsService(
            orm.em,
            orgRepo,
            delegatesRepo,
            scope,
            logger,
          );
        }
        const actor = { id: ANA_USER, roles: ['SECURITY_ADMIN'] } as any;

        it('crear sobre la membresía de OTRA organización responde 404 y no escribe', async () => {
          const foreignMembership = (
            await admin.query(
              'select tenant_membership_id from delegated_access.organization_user_assignments where id = $1',
              [ROSA_BOND],
            )
          ).rows[0].tenant_membership_id as string;
          const before = (
            await admin.query(
              'select count(*)::int as n from delegated_access.organization_user_assignments',
            )
          ).rows[0].n;
          await expect(
            inTenant(HOSPITAL, () =>
              runWithTenant(HOSPITAL, () =>
                service().createAssignment(
                  foreignMembership,
                  { role: 'STAFF' },
                  actor,
                ),
              ),
            ),
          ).rejects.toBeInstanceOf(ResourceNotFoundException);
          const after = (
            await admin.query(
              'select count(*)::int as n from delegated_access.organization_user_assignments',
            )
          ).rows[0].n;
          expect(after).toBe(before);
        });

        it('un espacio de atención de OTRA organización en el cuerpo responde 404 y no escribe', async () => {
          const spaceB = (
            await admin.query(
              `select c.id from practice.care_spaces c join practice.practice_sites ps on ps.id = c.practice_site_id
               join practice.practices p on p.id = ps.practice_id where p.tenant_id = $1 limit 1`,
              [CONSULTORIO],
            )
          ).rows[0].id as string;
          const ownMembership = (
            await admin.query(
              'select tenant_membership_id from delegated_access.organization_user_assignments where id = $1',
              [ANA_BOND],
            )
          ).rows[0].tenant_membership_id as string;
          const before = (
            await admin.query(
              'select count(*)::int as n from delegated_access.organization_user_assignments',
            )
          ).rows[0].n;
          await expect(
            inTenant(HOSPITAL, () =>
              runWithTenant(HOSPITAL, () =>
                service().createAssignment(
                  ownMembership,
                  { role: 'NURSE', careSpaceId: spaceB },
                  actor,
                ),
              ),
            ),
          ).rejects.toBeInstanceOf(ResourceNotFoundException);
          const after = (
            await admin.query(
              'select count(*)::int as n from delegated_access.organization_user_assignments',
            )
          ).rows[0].n;
          expect(after).toBe(before);
        });

        it('suspender el vínculo de OTRA organización responde 404 y no cambia nada', async () => {
          await expect(
            inTenant(HOSPITAL, () =>
              runWithTenant(HOSPITAL, () =>
                service().updateAssignment(ROSA_BOND, { suspend: true }, actor),
              ),
            ),
          ).rejects.toBeInstanceOf(ResourceNotFoundException);
          const row = await admin.query(
            'select status_concept_id, suspended_at from delegated_access.organization_user_assignments where id = $1',
            [ROSA_BOND],
          );
          expect(row.rows[0].status_concept_id).toBe(CONCEPTS.STATE_ACTIVE);
          expect(row.rows[0].suspended_at).toBeNull();
        });
      });
    });

    // ──────────────────────────────────────────────────────────────── A-B2
    describe('A-B2: access_decision_log es WORM también para la aplicación y para el dueño', () => {
      it('mantra_app no tiene UPDATE, DELETE ni TRUNCATE', async () => {
        const r = await admin.query(
          `select has_table_privilege($1, 'delegated_access.access_decision_log', 'UPDATE') as upd,
                has_table_privilege($1, 'delegated_access.access_decision_log', 'DELETE') as del,
                has_table_privilege($1, 'delegated_access.access_decision_log', 'TRUNCATE') as trunc,
                has_table_privilege($1, 'delegated_access.access_decision_log', 'INSERT') as ins`,
          [APP_USER],
        );
        expect(r.rows[0]).toEqual({
          upd: false,
          del: false,
          trunc: false,
          ins: true,
        });
      });

      it('UPDATE, DELETE y TRUNCATE de la aplicación se rechazan por privilegio (42501)', async () => {
        for (const sql of [
          'update delegated_access.access_decision_log set reason_code = reason_code',
          'delete from delegated_access.access_decision_log',
          'truncate delegated_access.access_decision_log',
        ]) {
          await app.query('begin');
          await app.query(
            "select set_config('app.system_context', 'true', true)",
          );
          await expect(app.query(sql)).rejects.toMatchObject({ code: '42501' });
          await app.query('rollback');
        }
      });

      it('el dueño de la tabla tampoco puede vaciarla (23001, disparador de sentencia)', async () => {
        await admin.query('begin');
        await expect(
          admin.query('truncate delegated_access.access_decision_log'),
        ).rejects.toMatchObject({ code: '23001' });
        await admin.query('rollback');
      });
    });

    // ──────────────────────────────────────────────────────────────── A-B6
    describe('A-B6: support_access_allowed respeta un DENY', () => {
      const call = (c: pg.Client) =>
        c.query(
          'select delegated_access.support_access_allowed($1, $2, $3, $4, null, null) as ok',
          [ANA_USER, HOSPITAL, 'schedule.walk_in', PEREZ_ROLE],
        );

      it('permite con la concesión ALLOW; niega con un DENY vivo y cuando la concesión pasa a DENY sin refrescar la derivada', async () => {
        expect((await call(admin)).rows[0].ok).toBe(true);
        await admin.query('begin');
        try {
          const deny = id();
          await admin.query(
            `insert into delegated_access.support_scope_grants
             (id, tenant_id, organization_user_assignment_id, target_kind_concept_id, practitioner_role_assignment_id,
              expansion_mode_concept_id, valid_from, status_concept_id, created_at, updated_at, effect_concept_id)
           select $1, tenant_id, organization_user_assignment_id, target_kind_concept_id, practitioner_role_assignment_id,
                  expansion_mode_concept_id, now() - interval '1 minute', status_concept_id, now(), now(), $3
             from delegated_access.support_scope_grants where id = $2`,
            [deny, ANA_GRANT, 'b038e546-a6ba-5848-9cd2-04b02ccb22b0'],
          );
          await admin.query(
            `insert into delegated_access.support_grant_actions (id, tenant_id, support_scope_grant_id, permission_id, created_at)
           select gen_random_uuid(), $1, $2, id, now() from authz.permissions where code = 'schedule.walk_in'`,
            [HOSPITAL, deny],
          );
          expect((await call(admin)).rows[0].ok).toBe(false);
          await admin.query(
            'delete from delegated_access.support_grant_actions where support_scope_grant_id = $1',
            [deny],
          );
          await admin.query(
            'delete from delegated_access.support_scope_grants where id = $1',
            [deny],
          );
          expect((await call(admin)).rows[0].ok).toBe(true);
          await admin.query(
            'update delegated_access.support_scope_grants set effect_concept_id = $1 where id = $2',
            ['b038e546-a6ba-5848-9cd2-04b02ccb22b0', ANA_GRANT],
          );
          expect((await call(admin)).rows[0].ok).toBe(false);
        } finally {
          await admin.query('rollback');
        }
      });
    });

    // ──────────────────────────────────────────────────────────────── B-B12
    describe('B-B12: exclusión mutua de los barridos', () => {
      it('mientras un barrido tiene el cerrojo, otro con la misma clave no corre; con otra clave sí; al soltarlo, vuelve a poder', async () => {
        const queries = new GovernanceQueriesRepository();
        let release!: () => void;
        const gate = new Promise<void>((r) => (release = r));
        let startedFirst!: () => void;
        const first = new Promise<void>((r) => (startedFirst = r));
        const holder = queries.withExclusiveLock(
          orm.em,
          'seg1:daily',
          async () => {
            startedFirst();
            await gate;
            return 'primero';
          },
        );
        await first;
        const second = await queries.withExclusiveLock(
          orm.em,
          'seg1:daily',
          async () => 'segundo',
        );
        expect(second).toEqual({ acquired: false });
        const other = await queries.withExclusiveLock(
          orm.em,
          'seg1:otra',
          async () => 'otra',
        );
        expect(other).toEqual({ acquired: true, value: 'otra' });
        release();
        expect(await holder).toEqual({ acquired: true, value: 'primero' });
        const again = await queries.withExclusiveLock(
          orm.em,
          'seg1:daily',
          async () => 'de nuevo',
        );
        expect(again).toEqual({ acquired: true, value: 'de nuevo' });
      });
    });

    // ──────────────────────────────────────────────────────────────── B-B10
    describe('B-B10: ráfaga paralela contra el contador de intentos del paso extra', () => {
      function stepUp(consumed: { n: number }, failures: number[]) {
        const real = new SecurityEventsRepository();
        const eventsRepo = {
          record: () => {
            failures.push(Date.now());
          },
          countFailedMfaSince: async () => failures.length,
          // El cerrojo es el REAL (pg_advisory_xact_lock sobre la base).
          withMfaAttemptLock: <T>(
            em: any,
            userId: string,
            work: () => Promise<T>,
          ) => real.withMfaAttemptLock(em, userId, work),
        };
        const totp = {
          consume: async () => {
            consumed.n += 1;
            await new Promise((r) => setTimeout(r, 25));
            return { valid: false };
          },
        };
        const mfaRepo = {
          findVerifiedByUser: async () => [
            {
              id: 'f1',
              secretEncrypted: 'cifrado',
              stateConceptId: CONCEPTS.STATE_VERIFIED,
            },
          ],
        };
        const usersRepo = {
          findById: async () => ({
            lastLoginAt: new Date(Date.now() - 3600_000),
          }),
        };
        const store = {
          assertAvailable: async () => undefined,
          stamp: async () => ({ verifiedAt: new Date(), ttlMinutes: 10 }),
        };
        return new IamStepUpService(
          orm.em as any,
          mfaRepo as any,
          totp as any,
          eventsRepo as any,
          usersRepo as any,
          store as any,
          logger,
        );
      }

      it('20 peticiones simultáneas no prueban más códigos que los intentos que quedan antes del bloqueo', async () => {
        const consumed = { n: 0 };
        const failures: number[] = [];
        const service = stepUp(consumed, failures);
        const actor = {
          id: id(),
          sessionId: 'sid-seg1',
          roles: ['USER'],
        } as any;
        const results = await Promise.allSettled(
          Array.from({ length: 20 }, () =>
            service.verify(actor, { code: '000000' }),
          ),
        );
        const blocked = results.filter(
          (r) =>
            r.status === 'rejected' &&
            (r.reason as any).reason ===
              IamErrorReason.STEP_UP_ATTEMPTS_EXCEEDED,
        ).length;
        expect(consumed.n).toBeLessThanOrEqual(5);
        expect(consumed.n + blocked).toBe(20);
      });
    });

    // ──────────────────────────────────────────────────────────────── B-B3 / B-B2
    describe('B-B3: el ítem de revisión se bloquea al decidir', () => {
      const ACTIVE = CONCEPTS.STATE_ACTIVE;
      const NOW = new Date();
      const stamps = { created_at: NOW, updated_at: NOW };
      const campaign = id();
      const item = id();

      beforeAll(async () => {
        await admin.query("set session_replication_role = 'replica'");
        await admin.query(
          `insert into delegated_access.access_review_campaigns
           (id, tenant_id, name, kind_concept_id, scope_json, scope_schema_version, due_at, uncertified_action_concept_id, status_concept_id, created_at, updated_at)
         values ($1, $2, 'Campaña seg1', $3, '{}', 1, $4, $5, $6, $7, $7)`,
          [
            campaign,
            HOSPITAL,
            DELEG.REVIEW_KIND_PERIODIC,
            new Date(Date.now() + 14 * 86400_000),
            DELEG.UNCERTIFIED_ESCALATE,
            DELEG.REVIEW_CAMPAIGN_OPEN,
            NOW,
          ],
        );
        await admin.query(
          `insert into delegated_access.access_review_items
           (id, tenant_id, access_review_campaign_id, organization_user_assignment_id, reviewer_user_id, reviewer_kind_concept_id,
            evidence_json, evidence_hash, due_at, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, '{}', $7, $8, $9, $9)`,
          [
            item,
            HOSPITAL,
            campaign,
            ANA_BOND,
            PEREZ_USER,
            DELEG.REVIEWER_KIND_ADMIN,
            'a'.repeat(64),
            new Date(Date.now() + 14 * 86400_000),
            NOW,
          ],
        );
        await admin.query("set session_replication_role = 'origin'");
        void ACTIVE;
        void stamps;
      });

      afterAll(async () => {
        await admin.query("set session_replication_role = 'replica'");
        await admin.query(
          'delete from delegated_access.access_review_items where id = $1',
          [item],
        );
        await admin.query(
          'delete from delegated_access.access_review_campaigns where id = $1',
          [campaign],
        );
        await admin.query("set session_replication_role = 'origin'");
      });

      it('el segundo decisor espera al primero y ve su decisión (no repite el efecto)', async () => {
        const repo = new AccessReviewRepository();
        const events: string[] = [];
        let releaseFirst!: () => void;
        const gate = new Promise<void>((r) => (releaseFirst = r));
        let firstHolds!: () => void;
        const holding = new Promise<void>((r) => (firstHolds = r));

        const first = inTenant(
          HOSPITAL,
          async (tx) => {
            const row = await repo.lockItem(tx, HOSPITAL, item);
            events.push('1:lock');
            repo.decide(row!, {
              decisionConceptId: DELEG.REVIEW_ITEM_CERTIFIED,
              decidedByUserId: PEREZ_USER,
              comment: 'primero',
              now: new Date(),
            });
            await tx.flush();
            firstHolds();
            await gate;
            events.push('1:commit');
          },
          true,
        );
        await holding;
        const second = inTenant(HOSPITAL, async (tx) => {
          const row = await repo.lockItem(tx, HOSPITAL, item);
          events.push(
            `2:lock:${row?.decisionConceptId === DELEG.REVIEW_ITEM_CERTIFIED ? 'ya-decidido' : 'pendiente'}`,
          );
        });
        // el segundo no avanza mientras el primero tiene el bloqueo
        await new Promise((r) => setTimeout(r, 400));
        expect(events).toEqual(['1:lock']);
        releaseFirst();
        await Promise.all([first, second]);
        expect(events).toEqual(['1:lock', '1:commit', '2:lock:ya-decidido']);
      });

      it('deshacer una decisión anotada de antemano devuelve el ítem a PENDING sin romper el CHECK de coherencia', async () => {
        const repo = new AccessReviewRepository();
        await inTenant(
          HOSPITAL,
          async (tx) => {
            const row = await repo.lockItem(tx, HOSPITAL, item);
            expect(row!.decisionConceptId).toBe(DELEG.REVIEW_ITEM_CERTIFIED);
            repo.undecide(row!, PEREZ_USER, new Date());
            await tx.flush();
            expect(
              await repo.countUndecidedOfEngagement(
                tx,
                HOSPITAL,
                campaign,
                ANA_BOND,
              ),
            ).toBe(1);
          },
          true,
        );
        const r = await admin.query(
          'select decision_concept_id, decided_at, decided_by_user_id, decision_comment_text from delegated_access.access_review_items where id = $1',
          [item],
        );
        expect(r.rows[0]).toMatchObject({
          decision_concept_id: DELEG.REVIEW_ITEM_PENDING,
          decided_at: null,
          decided_by_user_id: null,
          decision_comment_text: null,
        });
      });
    });
  },
);
