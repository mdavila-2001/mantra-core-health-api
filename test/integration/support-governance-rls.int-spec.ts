import 'dotenv/config';
import { createHash, randomUUID } from 'node:crypto';
import pg from 'pg';
import { MikroORM, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { CONCEPTS } from '../../src/common/constants/concepts';
import * as delegated from '../../src/modules/delegated_access/entities';
import {
  CareSpaces,
  HealthcareServices,
  PracticeSites,
  Practices,
  PractitionerLocationAssignments,
  PractitionerRoleAssignments,
} from '../../src/modules/practice/entities';
import { TenantMemberships } from '../../src/modules/directory/entities';
import { Users } from '../../src/modules/iam/entities';
import {
  AppointmentBookings,
  BookableSlots,
} from '../../src/modules/scheduling/entities';
import { ConversationAssignments } from '../../src/modules/community/entities';
import {
  WorkflowInstances,
  WorkflowTasks,
} from '../../src/modules/workflow/entities';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import { AUTHZ } from '../../src/modules/authz/authz.concepts';
import { COMM } from '../../src/modules/community/community.concepts';
import {
  AccessAnomaliesRepository,
  AccessDecisionLogRepository,
  AccessReviewRepository,
  DelegatedPermissionSetItemsRepository,
  DelegatedPermissionSetsRepository,
  EffectiveSupportAccessRepository,
  FourEyesRepository,
  GovernanceRulesRepository,
  GrantUsageStatsRepository,
  HandoverWorkRepository,
  LifecycleRepository,
  PatientRestrictionFlagsRepository,
  PractitionerDelegateAssignmentsRepository,
  SodRepository,
  SupportAccessRepository,
  SupportDirectoryRepository,
} from '../../src/modules/delegated_access/repositories';
import { SupportAdminDirectory } from '../../src/modules/delegated_access/services/support-admin-directory';
import { TeamAdminPolicy } from '../../src/modules/delegated_access/services/team-admin.policy';
import { EffectiveSupportAccessService } from '../../src/modules/delegated_access/services/effective-support-access.service';
import { mapGovernanceDbError } from '../../src/modules/delegated_access/services/governance-db-errors';
import { SupportInboxRepository } from '../../src/modules/community/repositories/support-inbox.repository';

/**
 * Gobierno de accesos (modelo v4.2.72) contra PostgreSQL REAL, conectado como
 * `mantra_app` (sin BYPASSRLS) con `RLS_ENFORCE=true`. Extiende
 * `support-me-rls.int-spec.ts` (AC-9) y prueba lo que solo se había probado con
 * dobles: el aislamiento de las 12 tablas nuevas (AC-9), el cuatro ojos
 * (AC-10: `23514` real al autoaprobar, 10 consumos simultáneos → 1 éxito,
 * aprobación vencida), la bitácora WORM, los únicos parciales, los disparadores
 * `sod_rules_only_stricter` y `access_review_reviewer_not_subject`, la derivada
 * `effective_support_access` (SQL y TS iguales, sin `DENY` ni acciones
 * reemplazadas) y los repositorios de campañas, anomalías, ciclo de vida y
 * traspaso (incluido `HandoverWorkRepository`, que toca community, workflow y
 * scheduling).
 *
 * Es opt-in (`SUPPORT_GOV_RLS_TEST=1`) porque exige una base PROPIA y LIMPIA con
 * el modelo v4.2.72 y el hospital piloto sembrado: nunca la base compartida ni el
 * puerto 5432. Receta (la misma que usa el modelo; con el rol `mantra_app` con LOGIN):
 *
 *   createdb gov_rls
 *   psql -d gov_rls -f SQL/apply_all.sql && psql -d gov_rls -f SQL/apply_deferred.sql
 *   psql -d gov_rls -f SQL/patches/2026-08-05_tenant_rls.sql     # RLS y rol mantra_app
 *   psql -d gov_rls -f SQL/patches/2026-10-30_v4269_personal_apoyo.sql
 *   psql -d gov_rls -f SQL/patches/2026-11-02_v4272_gobierno_de_accesos.sql
 *   psql -d gov_rls -v demo_accounts=1 -f salud-db/demo/04-hospital-piloto.sql   # y 07, 09
 *   psql -d gov_rls -c "alter role mantra_app login"
 *
 * Se apunta con `SUPPORT_GOV_RLS_DB_HOST/PORT/NAME` (por defecto 127.0.0.1:5497/gov_rls),
 * `SUPPORT_GOV_RLS_ADMIN_USER` (superusuario que siembra; por defecto `postgres`) y
 * `SUPPORT_GOV_RLS_APP_USER` (por defecto `mantra_app`).
 *
 * Las filas que siembra el superusuario llevan ids aleatorios y se borran al
 * terminar; las pruebas de la aplicación corren en transacciones que se revierten
 * (salvo la concurrencia, que necesita filas confirmadas).
 */
const describeGov =
  process.env.SUPPORT_GOV_RLS_TEST === '1' ? describe : describe.skip;

const HOST = process.env.SUPPORT_GOV_RLS_DB_HOST ?? '127.0.0.1';
const PORT = Number(process.env.SUPPORT_GOV_RLS_DB_PORT ?? 5497);
const DB = process.env.SUPPORT_GOV_RLS_DB_NAME ?? 'gov_rls';
const ADMIN_USER = process.env.SUPPORT_GOV_RLS_ADMIN_USER ?? 'postgres';
const APP_USER = process.env.SUPPORT_GOV_RLS_APP_USER ?? 'mantra_app';

const ENTITIES = [
  ...Object.values(delegated),
  CareSpaces,
  HealthcareServices,
  PracticeSites,
  Practices,
  PractitionerLocationAssignments,
  PractitionerRoleAssignments,
  TenantMemberships,
  Users,
  AppointmentBookings,
  BookableSlots,
  ConversationAssignments,
  WorkflowInstances,
  WorkflowTasks,
] as any[];

const logger: any = {
  setContext: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};
const ROLLBACK = new Error('rollback');
const id = (): string => randomUUID();
const sha = (s: string): string => createHash('sha256').update(s).digest('hex');
const NOW = new Date();
const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const ahead = (ms: number): Date => new Date(Date.now() + ms);
const ACTIVE = CONCEPTS.STATE_ACTIVE;

/** Anclas del hospital piloto sembrado por 04/07/09 (ids literales de esos scripts). */
const ANCHORS = {
  hospital: '830e47e1-8e82-50ff-99c0-bfed0a7971a4',
  consultorio: 'a52f851c-e5c2-5a32-b99e-a4993ff5a287',
  anaUser: 'bc643859-d89d-582e-86fa-fb3f6819ee29',
  anaBond: '9f1761b6-e456-5a99-bf11-d14b05077d4f',
  anaGrant: '656e1227-25d4-5369-bf7d-7a87b9cfa812',
  perezUser: '6a796b91-f7db-5160-97b8-f38ed8614f95',
  rosaUser: 'f2bef10b-df89-5ac8-a87e-3f6e75e9672a',
  rosaBond: 'fa601b88-ccf6-5360-aea4-52a889a0d5a7',
  rosaGrant: 'dc350c15-4611-5270-95c6-2921c4d79a4c',
  cespedesUser: '25036a8b-fb9d-52c3-82ec-c5ca03179d75',
  pabloUser: '902be75b-9e55-59c7-9f3f-01c34cde9dee',
  carmen: '1b0127e2-5979-540f-9f51-3fc0ca699331',
  luis: '0d79d694-fa71-5d38-8a36-829b738dfdac',
} as const;

interface Side {
  readonly tenant: string;
  readonly user: string;
  readonly bond: string;
  readonly grant: string;
  /** Otra persona (nunca el titular del vínculo): revisora, aprobadora. */
  readonly other: string;
  readonly patient: string;
}
const A: Side = {
  tenant: ANCHORS.hospital,
  user: ANCHORS.anaUser,
  bond: ANCHORS.anaBond,
  grant: ANCHORS.anaGrant,
  other: ANCHORS.perezUser,
  patient: ANCHORS.carmen,
};
const B: Side = {
  tenant: ANCHORS.consultorio,
  user: ANCHORS.rosaUser,
  bond: ANCHORS.rosaBond,
  grant: ANCHORS.rosaGrant,
  other: ANCHORS.cespedesUser,
  patient: ANCHORS.luis,
};

/** Las 12 tablas nuevas y su orden de siembra (padres primero). */
const TABLES = [
  'governance_rules',
  'sod_rules',
  'four_eyes_requests',
  'sod_exceptions',
  'access_review_campaigns',
  'access_review_items',
  'lifecycle_cases',
  'handover_items',
  'patient_restriction_flags',
  'access_decision_log',
  'grant_usage_stats',
  'access_anomalies',
] as const;
type Table = (typeof TABLES)[number];

/** Ids propios de una pasada de siembra de un lado (los hijos apuntan a los padres de SU organización). */
function ids() {
  return {
    rule: id(),
    sodRule: id(),
    fourEyes: id(),
    sodException: id(),
    campaign: id(),
    item: id(),
    kase: id(),
    handover: id(),
    flag: id(),
    log: id(),
    usage: id(),
    anomaly: id(),
  };
}
type Ids = ReturnType<typeof ids>;

const stamps = { created_at: NOW, updated_at: NOW };

/** Una fila válida de cada tabla para un lado. `tag` hace únicos los campos con único parcial. */
function rowsOf(
  s: Side,
  i: Ids,
  tag: string,
  exceptionRule: string = PLATFORM_RULE_FOR_EXCEPTION,
): Record<Table, Record<string, unknown>> {
  return {
    governance_rules: {
      id: i.rule,
      tenant_id: s.tenant,
      rule_kind_concept_id: DELEG.GOV_RULE_DENY_PERMISSION,
      permission_pattern: 'agenda.appointment.view',
      rule_json: JSON.stringify({}),
      rule_schema_version: 1,
      message_text: `Regla de prueba ${tag}`,
      status_concept_id: ACTIVE,
      ...stamps,
    },
    sod_rules: {
      id: i.sodRule,
      tenant_id: s.tenant,
      code: `IT-${tag}`,
      name: `Regla SoD de prueba ${tag}`,
      atoms_a_json: JSON.stringify(['billing.payment.collect']),
      atoms_b_json: JSON.stringify(['billing.receipt.void']),
      scope_concept_id: DELEG.SOD_SCOPE_PERSON,
      action_concept_id: DELEG.SOD_ACTION_WARN,
      status_concept_id: ACTIVE,
      version_number: 1,
      ...stamps,
    },
    four_eyes_requests: {
      id: i.fourEyes,
      tenant_id: s.tenant,
      kind_concept_id: DELEG.FOUR_EYES_KIND_ACTION,
      requester_user_id: s.user,
      approver_kind_concept_id: AUTHZ.APPROVAL_DOCTOR,
      payload_json: JSON.stringify({ tag }),
      payload_hash: sha(`fe-${tag}`),
      payload_schema_version: 1,
      status_concept_id: DELEG.FOUR_EYES_PENDING,
      expires_at: ahead(DAY),
      ...stamps,
    },
    sod_exceptions: {
      id: i.sodException,
      tenant_id: s.tenant,
      sod_rule_id: exceptionRule,
      organization_user_assignment_id: s.bond,
      four_eyes_request_id: i.fourEyes,
      justification_text:
        'Consultorio pequeño: una sola persona cubre caja y citas (prueba de integración).',
      valid_from: NOW,
      valid_to: ahead(30 * DAY),
      status_concept_id: ACTIVE,
      ...stamps,
    },
    access_review_campaigns: {
      id: i.campaign,
      tenant_id: s.tenant,
      name: `Campaña de prueba ${tag}`,
      kind_concept_id: DELEG.REVIEW_KIND_PERIODIC,
      scope_json: JSON.stringify({ all: true }),
      scope_schema_version: 1,
      due_at: ahead(14 * DAY),
      uncertified_action_concept_id: DELEG.UNCERTIFIED_ESCALATE,
      status_concept_id: DELEG.REVIEW_CAMPAIGN_DRAFT,
      ...stamps,
    },
    access_review_items: {
      id: i.item,
      tenant_id: s.tenant,
      access_review_campaign_id: i.campaign,
      organization_user_assignment_id: s.bond,
      support_scope_grant_id: s.grant,
      reviewer_user_id: s.other,
      reviewer_kind_concept_id: DELEG.REVIEWER_KIND_ADMIN,
      evidence_json: JSON.stringify({ grants: 1 }),
      evidence_hash: sha(`ev-${tag}`),
      due_at: ahead(14 * DAY),
      ...stamps,
    },
    lifecycle_cases: {
      id: i.kase,
      tenant_id: s.tenant,
      organization_user_assignment_id: s.bond,
      subject_user_id: s.user,
      kind_concept_id: DELEG.LIFECYCLE_MOVER,
      status_concept_id: DELEG.LIFECYCLE_OPEN,
      opened_at: NOW,
      checklist_json: JSON.stringify([]),
      ...stamps,
    },
    handover_items: {
      id: i.handover,
      tenant_id: s.tenant,
      lifecycle_case_id: i.kase,
      item_kind_concept_id: DELEG.HANDOVER_CONVERSATION,
      source_id: id(),
      from_user_id: s.user,
      status_concept_id: DELEG.HANDOVER_PENDING,
      ...stamps,
    },
    patient_restriction_flags: {
      id: i.flag,
      tenant_id: s.tenant,
      patient_profile_id: s.patient,
      flag_concept_id: DELEG.PATIENT_FLAG_PROTECTED,
      reason_text: 'Caso protegido por la organización (prueba).',
      status_concept_id: ACTIVE,
      valid_from: NOW,
      ...stamps,
    },
    access_decision_log: {
      id: i.log,
      tenant_id: s.tenant,
      user_id: s.user,
      permission_code: 'agenda.appointment.view',
      effect_concept_id: DELEG.DECISION_EFFECT_DENY,
      reason_code: 'TIME_WINDOW',
      recorded_at: NOW,
    },
    grant_usage_stats: {
      id: i.usage,
      tenant_id: s.tenant,
      user_id: s.user,
      support_scope_grant_id: s.grant,
      permission_code: 'agenda.appointment.view',
      bucket_start: new Date(
        Math.floor(Date.now() / (60 * MIN)) * 60 * MIN - 5 * DAY,
      ),
      updated_at: NOW,
    },
    access_anomalies: {
      id: i.anomaly,
      tenant_id: s.tenant,
      user_id: s.user,
      organization_user_assignment_id: s.bond,
      kind_concept_id: DELEG.ANOMALY_SEARCH_SPIKE,
      window_start: new Date(Date.now() - 2 * DAY),
      window_end: new Date(Date.now() - 2 * DAY + 60 * MIN),
      observed_value: '18.00',
      threshold_value: '10.00',
      evidence_json: JSON.stringify({ n: 18 }),
      status_concept_id: DELEG.ANOMALY_OPEN,
      ...stamps,
    },
  };
}

/** Regla SoD de plataforma sobre la que se registran las excepciones SEMBRADAS (se resuelve en `beforeAll`). */
let PLATFORM_RULE_FOR_EXCEPTION = '';
/** Otra regla de plataforma que admite excepción, para las filas «nuevas» que no deben chocar con la sembrada. */
let PLATFORM_RULE_ALT_EXCEPTION = '';
/** Regla SoD de plataforma dura (BLOCK) con la que se prueba el disparador «solo endurecer». */
let PLATFORM_HARD_RULE = '';
/** Regla SoD de plataforma que solo ADVIERTE (WARN), para endurecerla. */
let PLATFORM_WARN_RULE = '';

describeGov(
  'Gobierno de accesos con RLS (mantra_app, RLS_ENFORCE=true) contra PostgreSQL real',
  () => {
    let admin: pg.Client;
    let app: pg.Client;
    let orm: MikroORM;
    const before = process.env.RLS_ENFORCE;
    /** Filas sembradas por el superusuario, para borrarlas al terminar (tabla, id). */
    const seeded: Array<[string, string, string]> = [];
    const sideIds: Record<'A' | 'B', Ids> = { A: ids(), B: ids() };
    /** Las filas exactas que se sembraron (para repetirlas y provocar el choque con el único parcial). */
    const seededRows = {} as Record<
      'A' | 'B',
      Record<Table, Record<string, unknown>>
    >;

    /** INSERT por nombre de columna con parámetros (jsonb recibe el texto). */
    const insertSql = (table: string, row: Record<string, unknown>) => {
      const cols = Object.keys(row);
      return {
        text: `insert into delegated_access.${table} (${cols.join(', ')}) values (${cols
          .map((_, k) => `$${k + 1}`)
          .join(', ')})`,
        values: Object.values(row),
      };
    };
    const adminInsert = async (
      table: string,
      row: Record<string, unknown>,
    ): Promise<void> => {
      await admin.query(insertSql(table, row));
      seeded.push(['delegated_access', table, String(row.id)]);
    };

    /**
     * Transacción de la APLICACIÓN con el contexto de una organización (o ninguno):
     * siempre se revierte, así que nada de lo que `fn` escriba queda.
     */
    async function asApp<T>(
      tenant: string | null,
      fn: (c: pg.Client) => Promise<T>,
    ): Promise<T> {
      await app.query('begin');
      try {
        await app.query(
          "select set_config('app.system_context', 'false', true)",
        );
        if (tenant) {
          await app.query(
            "select set_config('app.current_tenant_id', $1, true)",
            [tenant],
          );
        }
        return await fn(app);
      } finally {
        await app.query('rollback');
      }
    }

    /** Igual con el ORM (misma conexión de `mantra_app`); `commit` confirma. */
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

    /** El error que lanza `fn`, o falla si no lanza. */
    async function failure(fn: () => Promise<unknown>): Promise<any> {
      try {
        await fn();
      } catch (e) {
        return e;
      }
      throw new Error('se esperaba un error de la base y no lo hubo');
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

      // El hospital piloto debe estar sembrado (04, 07 y 09): sin él no hay con qué probar.
      const anchors = await admin.query(
        `select (select count(*) from directory.tenants where id in ($1, $2))::int as tenants,
                (select count(*) from delegated_access.support_scope_grants where id in ($3, $4))::int as grants`,
        [A.tenant, B.tenant, A.grant, B.grant],
      );
      if (anchors.rows[0].tenants !== 2 || anchors.rows[0].grants !== 2) {
        throw new Error(
          'Falta el hospital piloto: cargue 04-hospital-piloto.sql, 07-gobierno-… y 09-agenda-chat-… en una base propia (ver la cabecera de esta prueba).',
        );
      }
      const rules = await admin.query(
        `select id, code, action_concept_id, is_hard from delegated_access.sod_rules where tenant_id is null`,
      );
      const byCode = new Map(rules.rows.map((r: any) => [r.code, r]));
      PLATFORM_RULE_FOR_EXCEPTION = (byCode.get('SOD-PAT-02') as any).id;
      PLATFORM_RULE_ALT_EXCEPTION = (byCode.get('SOD-GOV-03') as any).id;
      PLATFORM_HARD_RULE = (byCode.get('SOD-BILL-01') as any).id;
      PLATFORM_WARN_RULE = (byCode.get('SOD-BILL-04') as any).id;

      // Siembra: una fila de cada tabla para cada organización (el superusuario no pasa por RLS).
      for (const [side, s] of [
        ['A', A],
        ['B', B],
      ] as const) {
        const rows = rowsOf(s, sideIds[side], `seed-${side}`);
        seededRows[side] = rows;
        for (const table of TABLES) await adminInsert(table, rows[table]);
      }

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
      if (admin) {
        // Sin disparadores (la bitácora WORM y el resto): limpia solo lo que sembró esta prueba, hijos primero.
        await admin.query("set session_replication_role = 'replica'");
        for (const [schema, table, rowId] of [...seeded].reverse()) {
          await admin.query(`delete from ${schema}.${table} where id = $1`, [
            rowId,
          ]);
        }
        await admin.end();
      }
    });

    // =====================================================================
    // AC-9 · aislamiento por organización de las 12 tablas nuevas
    // =====================================================================
    describe('AC-9 aislamiento: ninguna de las 12 tablas devuelve ni acepta filas de otra organización', () => {
      const own = (side: 'A' | 'B', table: Table): string => {
        const i = sideIds[side];
        const pk: Record<Table, string> = {
          governance_rules: i.rule,
          sod_rules: i.sodRule,
          four_eyes_requests: i.fourEyes,
          sod_exceptions: i.sodException,
          access_review_campaigns: i.campaign,
          access_review_items: i.item,
          lifecycle_cases: i.kase,
          handover_items: i.handover,
          patient_restriction_flags: i.flag,
          access_decision_log: i.log,
          grant_usage_stats: i.usage,
          access_anomalies: i.anomaly,
        };
        return pk[table];
      };

      it('control: el rol de la aplicación no es superusuario ni evita RLS, y las 12 tablas tienen su política y RLS forzado', async () => {
        const role = await admin.query(
          'select rolsuper, rolbypassrls from pg_roles where rolname = $1',
          [APP_USER],
        );
        expect(role.rows[0]).toEqual({ rolsuper: false, rolbypassrls: false });
        const pol = await admin.query(
          `select c.relname, c.relrowsecurity, c.relforcerowsecurity,
                  exists (select 1 from pg_policies p where p.schemaname = 'delegated_access' and p.tablename = c.relname and p.policyname = 'tenant_isolation') as has_policy
             from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'delegated_access' and c.relname = any($1)`,
          [[...TABLES]],
        );
        expect(pol.rows).toHaveLength(12);
        for (const r of pol.rows) {
          expect(r).toMatchObject({
            relrowsecurity: true,
            relforcerowsecurity: true,
            has_policy: true,
          });
        }
      });

      it.each(TABLES.map((t) => [t]))(
        '%s: sin contexto no ve nada; con el de A ve solo lo de A; nunca lo de B',
        async (table) => {
          const a = own('A', table);
          const b = own('B', table);
          const q = `select id from delegated_access.${table} where id = any($1)`;
          // sin contexto: cero filas (también las suyas)
          expect((await asApp(null, (c) => c.query(q, [[a, b]]))).rows).toEqual(
            [],
          );
          // con el contexto de A: la de A; con el de B: la de B
          expect(
            (await asApp(A.tenant, (c) => c.query(q, [[a, b]]))).rows,
          ).toEqual([{ id: a }]);
          expect(
            (await asApp(B.tenant, (c) => c.query(q, [[a, b]]))).rows,
          ).toEqual([{ id: b }]);
          // y el conteo de la tabla entera con A nunca incluye filas con tenant_id de B
          const leak = await asApp(A.tenant, (c) =>
            c.query(
              `select count(*)::int as n from delegated_access.${table} where tenant_id = $1`,
              [B.tenant],
            ),
          );
          expect(leak.rows[0].n).toBe(0);
        },
      );

      it.each(TABLES.map((t) => [t]))(
        '%s: con el contexto de A acepta una fila de A y RECHAZA una de B (y no queda)',
        async (table) => {
          const fresh = (s: Side) =>
            rowsOf(
              s,
              ids(),
              `new-${id().slice(0, 8)}`,
              PLATFORM_RULE_ALT_EXCEPTION,
            )[table];
          // control: con el contexto de A una fila de A entra (el rechazo de abajo no es por una fila mal armada)
          // — los hijos se apoyan en el padre sembrado de su organización
          const rowA: Record<string, unknown> = fresh(A);
          const parentFix: Partial<Record<Table, Record<string, unknown>>> = {
            sod_exceptions: { four_eyes_request_id: sideIds.A.fourEyes },
            access_review_items: {
              access_review_campaign_id: sideIds.A.campaign,
            },
            handover_items: { lifecycle_case_id: sideIds.A.kase },
          };
          Object.assign(rowA, parentFix[table] ?? {});
          // únicos parciales que chocarían con la fila sembrada
          const uniqFix: Partial<Record<Table, Record<string, unknown>>> = {
            governance_rules: { permission_pattern: 'agenda.appointment.edit' },
            four_eyes_requests: { payload_hash: sha(id()) },
            access_review_items: { support_scope_grant_id: null },
            patient_restriction_flags: {
              flag_concept_id: DELEG.PATIENT_FLAG_VIP,
            },
            grant_usage_stats: { permission_code: 'agenda.appointment.edit' },
          };
          Object.assign(rowA, uniqFix[table] ?? {});
          const ok = await asApp(A.tenant, (c) =>
            c.query(insertSql(table, rowA)),
          );
          expect(ok.rowCount).toBe(1);

          // la fila de B bajo el contexto de A: la base la rechaza (RLS WITH CHECK, o el disparador de consistencia que falla cerrado)
          const rowB: Record<string, unknown> = fresh(B);
          const err = await failure(() =>
            asApp(A.tenant, (c) => c.query(insertSql(table, rowB))),
          );
          expect(['42501', '23503', '23514']).toContain(err.code);
          // y no quedó (el superusuario no ve ninguna fila con ese id)
          const left = await admin.query(
            `select count(*)::int as n from delegated_access.${table} where id = $1`,
            [rowB.id],
          );
          expect(left.rows[0].n).toBe(0);

          // la tabla de la que depende RLS, sin padre de por medio, rechaza con 42501 EXACTO
          if (
            [
              'governance_rules',
              'sod_rules',
              'patient_restriction_flags',
              'access_decision_log',
              'access_review_campaigns',
              'four_eyes_requests',
            ].includes(table)
          ) {
            expect(err.code).toBe('42501');
          }
        },
      );

      it.each(TABLES.map((t) => [t]))(
        '%s: con el contexto de A no modifica ni borra filas de B (0 filas afectadas)',
        async (table) => {
          const b = own('B', table);
          if (table === 'access_decision_log') {
            // v4.2.73 (A-B2): la bitácora WORM no da UPDATE ni DELETE ni a la aplicación: se rechaza por
            // privilegio (42501) antes de mirar filas; la fila de B sigue intacta.
            for (const sql of [
              `update delegated_access.${table} set reason_code = 'X' where id = $1`,
              `delete from delegated_access.${table} where id = $1`,
            ]) {
              const denied = await failure(() =>
                asApp(A.tenant, (c) => c.query(sql, [b])),
              );
              expect(denied.code).toBe('42501');
            }
          } else {
            const upd = await asApp(A.tenant, (c) =>
              c.query(
                `update delegated_access.${table} set updated_at = now() where id = $1`,
                [b],
              ),
            );
            expect(upd.rowCount).toBe(0);
            const del = await asApp(A.tenant, (c) =>
              c.query(`delete from delegated_access.${table} where id = $1`, [
                b,
              ]),
            );
            expect(del.rowCount).toBe(0);
          }
          // la fila de B sigue intacta
          const still = await admin.query(
            `select count(*)::int as n from delegated_access.${table} where id = $1`,
            [b],
          );
          expect(still.rows[0].n).toBe(1);
        },
      );

      it('sod_rules: las reglas de PLATAFORMA (tenant NULL) las lee toda organización pero nadie las escribe; la regla de otra organización no se ve', async () => {
        const platform = PLATFORM_HARD_RULE;
        for (const t of [A.tenant, B.tenant]) {
          const seen = await asApp(t, (c) =>
            c.query(
              'select id from delegated_access.sod_rules where id = any($1) order by id',
              [[platform, sideIds.A.sodRule, sideIds.B.sodRule]],
            ),
          );
          const expected = [
            platform,
            t === A.tenant ? sideIds.A.sodRule : sideIds.B.sodRule,
          ].sort();
          expect(seen.rows.map((r: any) => r.id)).toEqual(expected);
        }
        const err = await failure(() =>
          asApp(A.tenant, (c) =>
            c.query(
              insertSql('sod_rules', {
                ...rowsOf(A, ids(), 'plat')['sod_rules'],
                tenant_id: null,
                code: `PLAT-${id().slice(0, 6)}`,
              }),
            ),
          ),
        );
        expect(err.code).toBe('42501');
        const upd = await asApp(A.tenant, (c) =>
          c.query(
            'update delegated_access.sod_rules set updated_at = now() where id = $1',
            [platform],
          ),
        );
        expect(upd.rowCount).toBe(0);
        // sin contexto, la de plataforma sí se lee (catálogo global) y la de una organización no
        const anon = await asApp(null, (c) =>
          c.query(
            'select id from delegated_access.sod_rules where id = any($1)',
            [[platform, sideIds.A.sodRule]],
          ),
        );
        expect(anon.rows).toEqual([{ id: platform }]);
      });

      it('con el ORM y los repositorios: la lectura acotada por organización no cruza (cuatro ojos, reglas, campañas, anomalías, casos)', async () => {
        const fourEyes = new FourEyesRepository();
        const rules = new GovernanceRulesRepository();
        const reviews = new AccessReviewRepository();
        const anomalies = new AccessAnomaliesRepository();
        const lifecycle = new LifecycleRepository();
        await inTenant(A.tenant, async (tx) => {
          expect(
            await fourEyes.findById(tx, A.tenant, sideIds.A.fourEyes),
          ).not.toBeNull();
          // aunque se pida con el tenant ajeno en el filtro, RLS no la devuelve
          expect(
            await fourEyes.findById(tx, B.tenant, sideIds.B.fourEyes),
          ).toBeNull();
          expect(
            await fourEyes.findById(tx, A.tenant, sideIds.B.fourEyes),
          ).toBeNull();
          const pending = await fourEyes.findPendingByTenant(tx, A.tenant, 200);
          expect(pending.every((r) => r.tenantId === A.tenant)).toBe(true);
          expect(pending.map((r) => r.id)).toContain(sideIds.A.fourEyes);
          expect(pending.map((r) => r.id)).not.toContain(sideIds.B.fourEyes);
          expect(
            (await rules.findByTenant(tx, A.tenant)).every(
              (r) => r.tenantId === A.tenant,
            ),
          ).toBe(true);
          expect(
            await reviews.findCampaignById(tx, B.tenant, sideIds.B.campaign),
          ).toBeNull();
          expect(
            await reviews.findItemById(tx, B.tenant, sideIds.B.item),
          ).toBeNull();
          expect(
            await anomalies.findById(tx, B.tenant, sideIds.B.anomaly),
          ).toBeNull();
          expect(
            await lifecycle.findCaseById(tx, B.tenant, sideIds.B.kase),
          ).toBeNull();
        });
      });
    });

    // =====================================================================
    // AC-10 · cuatro ojos
    // =====================================================================
    describe('AC-10 cuatro ojos', () => {
      /** Aprueba la solicitud pendiente de A por `approver` (dentro de una transacción de la aplicación que se revierte). */
      const approveAs = (approver: string, subject?: string) =>
        asApp(A.tenant, async (c) => {
          if (subject) {
            await c.query(
              'update delegated_access.four_eyes_requests set subject_user_id = $2 where id = $1',
              [sideIds.A.fourEyes, subject],
            );
          }
          return c.query(
            `update delegated_access.four_eyes_requests
                set status_concept_id = $2, decided_by_user_id = $3, decided_at = now()
              where id = $1`,
            [sideIds.A.fourEyes, DELEG.FOUR_EYES_APPROVED, approver],
          );
        });

      it('la BASE rechaza autoaprobar (23514, ck_four_eyes_requests_not_self): ni quien pide ni la persona afectada; el servicio recibe 403 FOUR_EYES_SELF_APPROVAL', async () => {
        // quien pide (A.user) no puede aprobar lo suyo
        const selfRequester = await failure(() => approveAs(A.user));
        expect(selfRequester.code).toBe('23514');
        expect(selfRequester.constraint).toBe('ck_four_eyes_requests_not_self');
        const mapped = mapGovernanceDbError(selfRequester) as any;
        expect(mapped.getStatus()).toBe(403);
        expect(mapped.reason).toBe('FOUR_EYES_SELF_APPROVAL');
        // la persona afectada tampoco: otra persona pide, el decisor es la afectada
        const selfSubject = await failure(() => approveAs(A.other, A.other));
        expect(selfSubject.code).toBe('23514');
        expect(selfSubject.constraint).toBe('ck_four_eyes_requests_not_self');
        // una persona distinta SÍ puede
        const ok = await approveAs(A.other);
        expect(ok.rowCount).toBe(1);
      });

      it('lo mismo por el ORM y el repositorio: el flush de una aprobación propia lanza un error que mapGovernanceDbError traduce', async () => {
        const repo = new FourEyesRepository();
        const err = await failure(() =>
          inTenant(A.tenant, async (tx) => {
            const row = repo.create(tx, {
              tenantId: A.tenant,
              kindConceptId: DELEG.FOUR_EYES_KIND_ACTION,
              requesterUserId: A.user,
              approverKindConceptId: AUTHZ.APPROVAL_DOCTOR,
              payload: { n: 1 },
              payloadHash: sha(id()),
              payloadSchemaVersion: 1,
              expiresAt: ahead(DAY),
            });
            row.statusConceptId = DELEG.FOUR_EYES_APPROVED;
            row.decidedByUserId = A.user; // se aprueba a sí misma
            row.decidedAt = new Date();
            await tx.flush();
          }),
        );
        const mapped = mapGovernanceDbError(err) as any;
        expect(mapped).toBeDefined();
        expect(mapped.reason).toBe('FOUR_EYES_SELF_APPROVAL');
      });

      it('hash mal formado, caducidad ≤ creación, decisión incoherente y rechazo sin comentario: 23514 con su restricción', async () => {
        const base = (over: Record<string, unknown>) => ({
          ...rowsOf(A, ids(), `chk-${id().slice(0, 6)}`).four_eyes_requests,
          ...over,
        });
        const cases: Array<[string, Record<string, unknown>]> = [
          ['ck_four_eyes_requests_hash', { payload_hash: 'no-es-sha256' }],
          [
            'ck_four_eyes_requests_expiry',
            { expires_at: new Date(Date.now() - DAY), created_at: NOW },
          ],
          [
            'ck_four_eyes_requests_decision',
            { status_concept_id: DELEG.FOUR_EYES_APPROVED }, // aprobada sin decisor ni fecha
          ],
          [
            'ck_four_eyes_requests_reject_comment',
            {
              status_concept_id: DELEG.FOUR_EYES_REJECTED,
              decided_by_user_id: A.other,
              decided_at: NOW,
              decision_comment_text: 'no',
            },
          ],
        ];
        for (const [constraint, over] of cases) {
          const err = await failure(() =>
            asApp(A.tenant, (c) =>
              c.query(insertSql('four_eyes_requests', base(over))),
            ),
          );
          expect({ code: err.code, constraint: err.constraint }).toEqual({
            code: '23514',
            constraint,
          });
        }
      });

      it('una aprobación de acción se consume UNA sola vez: 10 usos simultáneos (diez transacciones) → exactamente 1 éxito (FourEyesRepository.consume)', async () => {
        const approvalId = id();
        await adminInsert('four_eyes_requests', {
          ...rowsOf(A, { ...ids(), fourEyes: approvalId }, `race-${approvalId}`)
            .four_eyes_requests,
          status_concept_id: DELEG.FOUR_EYES_APPROVED,
          decided_by_user_id: A.other,
          decided_at: NOW,
          approved_until: ahead(60 * MIN),
        });
        const repo = new FourEyesRepository();
        const attempts = await Promise.all(
          Array.from({ length: 10 }, () =>
            inTenant(
              A.tenant,
              (tx) => repo.consume(tx, approvalId, new Date()),
              true,
            ),
          ),
        );
        expect(attempts.filter(Boolean)).toHaveLength(1);
        expect(attempts.filter((x) => !x)).toHaveLength(9);
        const row = (
          await admin.query(
            'select consumed_at, status_concept_id from delegated_access.four_eyes_requests where id = $1',
            [approvalId],
          )
        ).rows[0];
        expect(row.consumed_at).not.toBeNull();
        // el mismo id otra vez, después: ya consumida
        expect(
          await inTenant(
            A.tenant,
            (tx) => repo.consume(tx, approvalId, new Date()),
            true,
          ),
        ).toBe(false);
      });

      it('una aprobación vencida no se consume (consume → false) y expireApproved la pasa a EXPIRED; una sin vencimiento se consume una vez', async () => {
        const repo = new FourEyesRepository();
        const make = async (approvedUntil: Date | null): Promise<string> => {
          const rid = id();
          await adminInsert('four_eyes_requests', {
            ...rowsOf(A, { ...ids(), fourEyes: rid }, `exp-${rid}`)
              .four_eyes_requests,
            status_concept_id: DELEG.FOUR_EYES_APPROVED,
            decided_by_user_id: A.other,
            decided_at: NOW,
            approved_until: approvedUntil,
          });
          return rid;
        };
        const stale = await make(new Date(Date.now() - 5 * MIN));
        expect(
          await inTenant(
            A.tenant,
            (tx) => repo.consume(tx, stale, new Date()),
            true,
          ),
        ).toBe(false);
        expect(
          await inTenant(
            A.tenant,
            (tx) => repo.expireApproved(tx, stale, new Date()),
            true,
          ),
        ).toBe(true);
        const state = await admin.query(
          'select status_concept_id, consumed_at from delegated_access.four_eyes_requests where id = $1',
          [stale],
        );
        expect(state.rows[0]).toMatchObject({
          status_concept_id: DELEG.FOUR_EYES_EXPIRED,
          consumed_at: null,
        });
        const open = await make(null);
        expect(
          await inTenant(
            A.tenant,
            (tx) => repo.consume(tx, open, new Date()),
            true,
          ),
        ).toBe(true);
        expect(
          await inTenant(
            A.tenant,
            (tx) => repo.consume(tx, open, new Date()),
            true,
          ),
        ).toBe(false);
      });

      it('una aprobación de OTRA organización no se consume desde la mía (RLS: 0 filas) y el barrido de caducadas ve las de todas con contexto de sistema', async () => {
        const repo = new FourEyesRepository();
        const rid = id();
        await adminInsert('four_eyes_requests', {
          ...rowsOf(B, { ...ids(), fourEyes: rid }, `x-${rid}`)
            .four_eyes_requests,
          status_concept_id: DELEG.FOUR_EYES_APPROVED,
          decided_by_user_id: B.other,
          decided_at: NOW,
        });
        expect(
          await inTenant(
            A.tenant,
            (tx) => repo.consume(tx, rid, new Date()),
            true,
          ),
        ).toBe(false);
        expect(
          await inTenant(
            B.tenant,
            (tx) => repo.consume(tx, rid, new Date()),
            true,
          ),
        ).toBe(true);
        // caducadas pendientes: una por organización, creadas «ayer» (expires_at > created_at)
        const expiredA = id();
        const expiredB = id();
        for (const [s, rid2] of [
          [A, expiredA],
          [B, expiredB],
        ] as const) {
          await adminInsert('four_eyes_requests', {
            ...rowsOf(s, { ...ids(), fourEyes: rid2 }, `old-${rid2}`)
              .four_eyes_requests,
            created_at: new Date(Date.now() - 3 * DAY),
            updated_at: new Date(Date.now() - 3 * DAY),
            expires_at: new Date(Date.now() - 2 * DAY),
          });
        }
        const swept = await orm.em.fork().transactional(async (tx) => {
          await tx.execute(
            "select set_config('app.system_context', 'false', true)",
          );
          return repo.findExpiredPendingAcrossTenants(
            tx as any,
            new Date(),
            500,
          );
        });
        const sweptIds = swept.map((r) => r.id);
        expect(sweptIds).toEqual(expect.arrayContaining([expiredA, expiredB]));
        // y sin salir del contexto de sistema: la lectura normal de A no las ve
        const normal = await inTenant(A.tenant, (tx) =>
          repo.findPendingByTenant(tx, A.tenant, 500),
        );
        expect(normal.map((r) => r.id)).not.toContain(expiredB);
      });
    });

    // =====================================================================
    // Bitácora WORM
    // =====================================================================
    describe('bitácora WORM access_decision_log', () => {
      it('el ORM anexa bajo RLS; UPDATE y DELETE se rechazan: la aplicación por privilegio (42501, v4.2.73 A-B2) y el superusuario con 23001 (disparador, que el servicio traduce a 409 APPEND_ONLY)', async () => {
        const repo = new AccessDecisionLogRepository();
        await inTenant(A.tenant, async (tx) => {
          const rowId = await repo.appendNow(tx, {
            tenantId: A.tenant,
            userId: A.user,
            permissionCode: 'agenda.appointment.cancel',
            effectConceptId: DELEG.DECISION_EFFECT_DENY,
            reasonCode: 'TIME_WINDOW',
            detail: { unmet: ['time'] },
            recordedAt: new Date(),
          });
          for (const sql of [
            `update delegated_access.access_decision_log set reason_code = 'OTRA' where id = ?`,
            `delete from delegated_access.access_decision_log where id = ?`,
          ]) {
            await tx.execute('savepoint worm');
            const err = await failure(() => tx.execute(sql, [rowId]));
            expect(err.code).toBe('42501');
            await tx.execute('rollback to savepoint worm');
          }
          // la fila anexada se lee dentro de la organización
          const page = await repo.findPage(tx, A.tenant, { userId: A.user }, {
            limit: 5,
            offset: 0,
          } as any);
          expect(JSON.stringify(page)).toContain('TIME_WINDOW');
        });
        // el superusuario tampoco: el disparador no mira privilegios
        const seededLog = sideIds.A.log;
        for (const sql of [
          `update delegated_access.access_decision_log set reason_code = 'OTRA' where id = $1`,
          `delete from delegated_access.access_decision_log where id = $1`,
        ]) {
          await admin.query('begin');
          const err = await failure(() => admin.query(sql, [seededLog]));
          await admin.query('rollback');
          expect(err.code).toBe('23001');
          const mapped = mapGovernanceDbError(err) as any;
          expect(mapped.getStatus()).toBe(409);
          expect(mapped.reason).toBe('APPEND_ONLY');
        }
        // v4.2.73 (A-B2): ni TRUNCATE (disparador de sentencia) ni para el dueño
        await admin.query('begin');
        const truncated = await failure(() =>
          admin.query('truncate delegated_access.access_decision_log'),
        );
        await admin.query('rollback');
        expect(truncated.code).toBe('23001');
        // y un asiento de otra organización no se anexa desde la mía
        const cross = await failure(() =>
          inTenant(A.tenant, (tx) =>
            repo.appendNow(tx, {
              tenantId: B.tenant,
              userId: B.user,
              permissionCode: 'agenda.appointment.view',
              effectConceptId: DELEG.DECISION_EFFECT_DENY,
              reasonCode: 'TIME_WINDOW',
              recordedAt: new Date(),
            }),
          ),
        );
        expect(cross.code).toBe('42501');
      });
    });

    // =====================================================================
    // Únicos parciales
    // =====================================================================
    describe('únicos parciales (23505) y su traducción', () => {
      const dup = async (
        constraint: string,
        run: (c: pg.Client) => Promise<unknown>,
        reason?: string,
        side: Side = A,
      ): Promise<void> => {
        const err = await failure(() => asApp(side.tenant, run));
        expect({ code: err.code, constraint: err.constraint }).toEqual({
          code: '23505',
          constraint,
        });
        if (reason)
          expect((mapGovernanceDbError(err) as any).reason).toBe(reason);
      };
      const seedRow = (table: Table, over: Record<string, unknown> = {}) => ({
        ...seededRows.A[table],
        id: id(),
        ...over,
      });

      it('cuatro ojos: una sola solicitud pendiente idéntica → FOUR_EYES_DUPLICATE_PENDING', async () => {
        await dup(
          'uq_four_eyes_requests_pending_payload',
          (c) =>
            c.query(
              insertSql('four_eyes_requests', seedRow('four_eyes_requests')),
            ),
          'FOUR_EYES_DUPLICATE_PENDING',
        );
      });

      it('reglas de la organización: una sola activa igual → GOVERNANCE_RULE_DUPLICATE', async () => {
        await dup(
          'uq_governance_rules_active',
          (c) =>
            c.query(insertSql('governance_rules', seedRow('governance_rules'))),
          'GOVERNANCE_RULE_DUPLICATE',
        );
      });

      it('campañas de recertificación: una por mes y nombre en borrador/abierta → REVIEW_CAMPAIGN_DUPLICATE; otra cosa pasa', async () => {
        const base = {
          ...rowsOf(A, ids(), 'rc')['access_review_campaigns'],
          kind_concept_id: DELEG.REVIEW_KIND_RECERTIFICATION,
          name: `Recertificación ${id().slice(0, 6)}`,
        };
        await dup(
          'uq_access_review_campaigns_recert_month',
          async (c) => {
            await c.query(
              insertSql('access_review_campaigns', { ...base, id: id() }),
            );
            await c.query(
              insertSql('access_review_campaigns', { ...base, id: id() }),
            );
          },
          'REVIEW_CAMPAIGN_DUPLICATE',
        );
        // cerrada, o de otro tipo con el mismo nombre: no choca
        await asApp(A.tenant, async (c) => {
          await c.query(
            insertSql('access_review_campaigns', { ...base, id: id() }),
          );
          await c.query(
            insertSql('access_review_campaigns', {
              ...base,
              id: id(),
              status_concept_id: DELEG.REVIEW_CAMPAIGN_CLOSED,
            }),
          );
          await c.query(
            insertSql('access_review_campaigns', {
              ...base,
              id: id(),
              kind_concept_id: DELEG.REVIEW_KIND_PERIODIC,
            }),
          );
        });
      });

      it('ítems de campaña: un acceso por (campaña, vínculo, permiso) y también sin permiso (ítem de vínculo) → REVIEW_CAMPAIGN_DUPLICATE', async () => {
        await dup(
          'uq_access_review_items_campaign_grant',
          (c) =>
            c.query(
              insertSql(
                'access_review_items',
                seedRow('access_review_items', {
                  access_review_campaign_id: sideIds.A.campaign,
                }),
              ),
            ),
          'REVIEW_CAMPAIGN_DUPLICATE',
        );
        // ítem de vínculo (permiso NULL): la llave coalesce evita el duplicado que un único con NULL no vería
        await dup('uq_access_review_items_campaign_grant', async (c) => {
          const link = seedRow('access_review_items', {
            access_review_campaign_id: sideIds.A.campaign,
            support_scope_grant_id: null,
          });
          await c.query(insertSql('access_review_items', link));
          await c.query(
            insertSql('access_review_items', { ...link, id: id() }),
          );
        });
      });

      it('ciclo de vida: un solo ingreso abierto y una sola suspensión abierta por vínculo; traspaso: un ítem por (caso, tipo, origen)', async () => {
        const joiner = {
          ...rowsOf(A, ids(), 'lc')['lifecycle_cases'],
          kind_concept_id: DELEG.LIFECYCLE_JOINER,
        };
        await dup('uq_lifecycle_cases_open_joiner', async (c) => {
          await c.query(insertSql('lifecycle_cases', { ...joiner, id: id() }));
          await c.query(insertSql('lifecycle_cases', { ...joiner, id: id() }));
        });
        const suspension = {
          ...joiner,
          kind_concept_id: DELEG.LIFECYCLE_SUSPENSION,
        };
        await dup(
          'uq_lifecycle_cases_open_suspension',
          async (c) => {
            await c.query(
              insertSql('lifecycle_cases', { ...suspension, id: id() }),
            );
            await c.query(
              insertSql('lifecycle_cases', { ...suspension, id: id() }),
            );
          },
          'ENGAGEMENT_ALREADY_SUSPENDED',
        );
        await dup('uq_handover_items_case_source', async (c) => {
          const item = {
            ...rowsOf(A, ids(), 'hv')['handover_items'],
            lifecycle_case_id: sideIds.A.kase,
          };
          await c.query(insertSql('handover_items', { ...item, id: id() }));
          await c.query(insertSql('handover_items', { ...item, id: id() }));
        });
      });

      it('banderas de paciente, excepciones SoD, reglas SoD, anomalías y uso: cada único parcial rechaza con su nombre', async () => {
        await dup('uq_patient_restriction_flags_active', (c) =>
          c.query(
            insertSql(
              'patient_restriction_flags',
              seedRow('patient_restriction_flags'),
            ),
          ),
        );
        await dup('uq_sod_exceptions_active', (c) =>
          c.query(
            insertSql(
              'sod_exceptions',
              seedRow('sod_exceptions', {
                four_eyes_request_id: sideIds.A.fourEyes,
              }),
            ),
          ),
        );
        await dup('uq_sod_rules_tenant_code_version', (c) =>
          c.query(insertSql('sod_rules', seedRow('sod_rules'))),
        );
        await dup('uq_access_anomalies_window', (c) =>
          c.query(insertSql('access_anomalies', seedRow('access_anomalies'))),
        );
        await dup('uq_grant_usage_stats_bucket', (c) =>
          c.query(insertSql('grant_usage_stats', seedRow('grant_usage_stats'))),
        );
        // regla de plataforma (tenant NULL): solo el superusuario la escribe
        await admin.query('begin');
        try {
          const err = await failure(() =>
            admin.query(
              insertSql('sod_rules', {
                ...rowsOf(A, ids(), 'p')['sod_rules'],
                tenant_id: null,
                code: 'SOD-BILL-01',
                version_number: 1,
              }),
            ),
          );
          expect({ code: err.code, constraint: err.constraint }).toEqual({
            code: '23505',
            constraint: 'uq_sod_rules_platform_code_version',
          });
        } finally {
          await admin.query('rollback');
        }
      });
    });

    // =====================================================================
    // Disparadores
    // =====================================================================
    describe('disparadores de integridad', () => {
      const sodRule = (over: Record<string, unknown>) => ({
        ...rowsOf(A, ids(), `sr-${id().slice(0, 6)}`)['sod_rules'],
        ...over,
      });
      const rejected = async (
        row: Record<string, unknown>,
        fragment: RegExp,
      ): Promise<void> => {
        const err = await failure(() =>
          asApp(A.tenant, (c) => c.query(insertSql('sod_rules', row))),
        );
        expect(err.code).toBe('23514');
        expect(String(err.message)).toMatch(fragment);
      };

      it('sod_rules_only_stricter: una regla de la organización no afloja a la de plataforma (acción, dureza, vencimiento ni base)', async () => {
        // base BLOCK y dura: WARN afloja
        await rejected(
          sodRule({
            base_rule_id: PLATFORM_HARD_RULE,
            action_concept_id: DELEG.SOD_ACTION_WARN,
          }),
          /menos estricta/,
        );
        // base dura: BLOCK sin ser dura deja de serlo
        await rejected(
          sodRule({
            base_rule_id: PLATFORM_HARD_RULE,
            action_concept_id: DELEG.SOD_ACTION_BLOCK,
            is_hard: false,
          }),
          /dura de plataforma no puede dejar de serlo/,
        );
        // la base debe ser de plataforma: una regla de la propia organización no sirve
        await rejected(
          sodRule({
            base_rule_id: sideIds.A.sodRule,
            action_concept_id: DELEG.SOD_ACTION_BLOCK,
            is_hard: true,
          }),
          /debe ser de plataforma/,
        );
        // base con excepción de 90 días: 120 es más larga
        await rejected(
          sodRule({
            base_rule_id: PLATFORM_RULE_ALT_EXCEPTION,
            action_concept_id: DELEG.SOD_ACTION_BLOCK,
            max_exception_days: 120,
          }),
          /no puede durar mas que la de plataforma/,
        );
        // endurecer sí: de ADVERTIR a BLOQUEAR duro, y de 90 a 30 días de excepción
        await asApp(A.tenant, async (c) => {
          await c.query(
            insertSql(
              'sod_rules',
              sodRule({
                base_rule_id: PLATFORM_WARN_RULE,
                action_concept_id: DELEG.SOD_ACTION_BLOCK,
                is_hard: true,
              }),
            ),
          );
          await c.query(
            insertSql(
              'sod_rules',
              sodRule({
                base_rule_id: PLATFORM_RULE_ALT_EXCEPTION,
                action_concept_id: DELEG.SOD_ACTION_REQUIRE_APPROVAL,
                max_exception_days: 30,
              }),
            ),
          );
        });
        // CHECK propio: una regla dura no admite excepción
        const hard = await failure(() =>
          asApp(A.tenant, (c) =>
            c.query(
              insertSql(
                'sod_rules',
                sodRule({ is_hard: true, max_exception_days: 10 }),
              ),
            ),
          ),
        );
        expect({ code: hard.code, constraint: hard.constraint }).toEqual({
          code: '23514',
          constraint: 'ck_sod_rules_hard_no_exception',
        });
      });

      it('access_review_reviewer_not_subject: ni revisor, ni escalamiento, ni decisor pueden ser la persona revisada (403 REVIEW_NOT_REVIEWER)', async () => {
        const item = (over: Record<string, unknown>) => ({
          ...rowsOf(A, ids(), `rv-${id().slice(0, 6)}`)['access_review_items'],
          access_review_campaign_id: sideIds.A.campaign,
          support_scope_grant_id: null,
          ...over,
        });
        const cases: Array<Record<string, unknown>> = [
          { reviewer_user_id: A.user },
          { escalated_to_user_id: A.user },
          {
            decision_concept_id: DELEG.REVIEW_ITEM_CERTIFIED,
            decided_at: NOW,
            decided_by_user_id: A.user,
          },
        ];
        for (const over of cases) {
          const err = await failure(() =>
            asApp(A.tenant, (c) =>
              c.query(insertSql('access_review_items', item(over))),
            ),
          );
          expect(err.code).toBe('23514');
          const mapped = mapGovernanceDbError(err) as any;
          expect(mapped.getStatus()).toBe(403);
          expect(mapped.reason).toBe('REVIEW_NOT_REVIEWER');
        }
        // otra persona revisa sin problema; y UPDATE a la persona revisada también se rechaza
        await asApp(A.tenant, async (c) => {
          const ok = await c.query(
            insertSql(
              'access_review_items',
              item({ reviewer_user_id: A.other }),
            ),
          );
          expect(ok.rowCount).toBe(1);
          const upd = await failure(() =>
            c.query(
              'update delegated_access.access_review_items set reviewer_user_id = $2 where id = $1',
              [sideIds.A.item, A.user],
            ),
          );
          expect(upd.code).toBe('23514');
        });
      });

      it('support_tenant_consistency: el hijo no cuelga de un padre de otra organización (23503 con RLS: padre oculto → 404; 23514 sin ocultar → tenant distinto)', async () => {
        // con el contexto de A, el padre de B está oculto: el disparador falla cerrado (23503) y el servicio responde 404
        const hidden = await failure(() =>
          asApp(A.tenant, (c) =>
            c.query(
              insertSql('access_review_items', {
                ...rowsOf(A, ids(), 'x1')['access_review_items'],
                access_review_campaign_id: sideIds.B.campaign,
              }),
            ),
          ),
        );
        expect(hidden.code).toBe('23503');
        expect((mapGovernanceDbError(hidden) as any).getStatus()).toBe(404);
        // sin ocultar nada (superusuario): el padre existe pero es de otra organización → 23514
        await admin.query('begin');
        try {
          const crossed = await failure(() =>
            admin.query(
              insertSql('access_review_items', {
                ...rowsOf(A, ids(), 'x2')['access_review_items'],
                access_review_campaign_id: sideIds.B.campaign,
              }),
            ),
          );
          expect(crossed.code).toBe('23514');
          expect(String(crossed.message)).toMatch(/tenant_id/);
        } finally {
          await admin.query('rollback');
        }
      });
    });

    // =====================================================================
    // Repositorios de gobierno que solo se habían probado con dobles
    // =====================================================================
    describe('repositorios con Postgres real y RLS', () => {
      const tag = (): string => id().slice(0, 8);

      describe('AccessReviewRepository (B4b): createCampaign y createItems', () => {
        const repo = new AccessReviewRepository();
        const itemOf = (
          campaignId: string,
          over: Record<string, unknown> = {},
        ) => ({
          tenantId: A.tenant,
          campaignId,
          organizationUserAssignmentId: A.bond,
          supportScopeGrantId: A.grant as string | undefined,
          reviewerUserId: A.other,
          reviewerKindConceptId: DELEG.REVIEWER_KIND_ADMIN,
          evidence: { grants: 1 },
          evidenceHash: sha(id()),
          dueAt: ahead(10 * DAY),
          actorUserId: A.other,
          ...over,
        });

        it('createCampaign aplica los valores del contrato (gracia 7, escalar a los 3 días, recordatorios [7,3,1], borrador) y createItems crea ítems PENDIENTES con su evidencia', async () => {
          await inTenant(A.tenant, async (tx) => {
            const campaign = repo.createCampaign(tx, {
              tenantId: A.tenant,
              name: `Certificación ${tag()}`,
              kindConceptId: DELEG.REVIEW_KIND_PERIODIC,
              scope: { all: true },
              scopeSchemaVersion: 1,
              dueAt: ahead(10 * DAY),
              uncertifiedActionConceptId: DELEG.UNCERTIFIED_REVOKE,
              actorUserId: A.other,
            });
            await tx.flush(); // la campaña antes que sus ítems (el disparador exige el padre), como hace el servicio
            const items = repo.createItems(tx, [
              itemOf(campaign.id),
              itemOf(campaign.id, { supportScopeGrantId: undefined }), // ítem de vínculo
            ]);
            await tx.flush();
            expect(items).toHaveLength(2);
            tx.clear();
            const saved = await repo.findCampaignById(
              tx,
              A.tenant,
              campaign.id,
            );
            expect(saved).toMatchObject({
              graceDays: 7,
              escalateAfterDays: 3,
              reminderDaysBeforeJson: [7, 3, 1],
              statusConceptId: DELEG.REVIEW_CAMPAIGN_DRAFT,
              scopeSchemaVersion: 1,
            });
            const stored = await repo.findItemsByCampaign(tx, campaign.id);
            expect(stored).toHaveLength(2);
            expect(
              stored.every(
                (i) => i.decisionConceptId === DELEG.REVIEW_ITEM_PENDING,
              ),
            ).toBe(true);
            expect(stored.every((i) => i.reminderCount === 0)).toBe(true);
            expect(
              stored.every((i) => /^[0-9a-f]{64}$/.test(i.evidenceHash)),
            ).toBe(true);
            expect(await repo.decisionTally(tx, campaign.id)).toEqual({
              [DELEG.REVIEW_ITEM_PENDING]: 2,
            });
            const pending = await repo.findPendingForReviewer(
              tx,
              A.tenant,
              A.other,
            );
            expect(pending.map((p) => p.accessReviewCampaignId)).toContain(
              campaign.id,
            );
            expect(
              (await repo.findCampaigns(tx, A.tenant)).map((c) => c.id),
            ).toContain(campaign.id);
          });
        });

        it('el mismo acceso dos veces en una campaña se rechaza (uq_access_review_items_campaign_grant → REVIEW_CAMPAIGN_DUPLICATE) y un ítem de OTRA organización no se crea', async () => {
          const duplicate = await failure(() =>
            inTenant(A.tenant, async (tx) => {
              const campaign = repo.createCampaign(tx, {
                tenantId: A.tenant,
                name: `Dup ${tag()}`,
                kindConceptId: DELEG.REVIEW_KIND_TARGETED,
                scope: {},
                scopeSchemaVersion: 1,
                dueAt: ahead(5 * DAY),
                uncertifiedActionConceptId: DELEG.UNCERTIFIED_ESCALATE,
              });
              await tx.flush();
              repo.createItems(tx, [itemOf(campaign.id), itemOf(campaign.id)]);
              await tx.flush();
            }),
          );
          expect((mapGovernanceDbError(duplicate) as any).reason).toBe(
            'REVIEW_CAMPAIGN_DUPLICATE',
          );
          // un ítem de A que cuelga de la campaña de B: el padre de B está oculto (23503 → 404)
          const crossed = await failure(() =>
            inTenant(A.tenant, async (tx) => {
              repo.createItems(tx, [itemOf(sideIds.B.campaign)]);
              await tx.flush();
            }),
          );
          expect((mapGovernanceDbError(crossed) as any).getStatus()).toBe(404);
          // y un ítem con tenantId de B bajo el contexto de A lo rechaza RLS
          const foreign = await failure(() =>
            inTenant(A.tenant, async (tx) => {
              repo.createItems(tx, [
                itemOf(sideIds.A.campaign, { tenantId: B.tenant }),
              ]);
              await tx.flush();
            }),
          );
          expect(['42501', '23503', '23514']).toContain(foreign.code);
        });

        it('decide(): revocar con un comentario corto lo rechaza la base (REVIEW_COMMENT_REQUIRED); con ≥ 10 caracteres lo guarda y el ítem sale de la bandeja', async () => {
          const short = await failure(() =>
            inTenant(A.tenant, async (tx) => {
              const row = await repo.findItemById(tx, A.tenant, sideIds.A.item);
              repo.decide(row!, {
                decisionConceptId: DELEG.REVIEW_ITEM_REVOKED,
                decidedByUserId: A.other,
                comment: 'corto',
                now: new Date(),
              });
              await tx.flush();
            }),
          );
          expect((mapGovernanceDbError(short) as any).reason).toBe(
            'REVIEW_COMMENT_REQUIRED',
          );
          await inTenant(A.tenant, async (tx) => {
            const row = await repo.findItemById(tx, A.tenant, sideIds.A.item);
            repo.decide(row!, {
              decisionConceptId: DELEG.REVIEW_ITEM_REVOKED,
              decidedByUserId: A.other,
              comment: 'Ya no atiende en esta agenda.',
              now: new Date(),
            });
            await tx.flush();
            tx.clear();
            const pending = await repo.findPendingForReviewer(
              tx,
              A.tenant,
              A.other,
            );
            expect(pending.map((p) => p.id)).not.toContain(sideIds.A.item);
            const again = await repo.findItemById(tx, A.tenant, sideIds.A.item);
            expect(again).toMatchObject({
              decisionConceptId: DELEG.REVIEW_ITEM_REVOKED,
              decidedByUserId: A.other,
            });
            expect(again!.decidedAt).toBeInstanceOf(Date);
          });
        });

        it('el barrido de ítems vencidos (contexto de sistema) ve los de todas las organizaciones; la lectura normal solo la propia', async () => {
          const overdueA = id();
          const overdueB = id();
          for (const [s, rid] of [
            [A, overdueA],
            [B, overdueB],
          ] as const) {
            await adminInsert('access_review_items', {
              ...seededRows[s === A ? 'A' : 'B'].access_review_items,
              id: rid,
              support_scope_grant_id: null,
              due_at: new Date(Date.now() - DAY),
              evidence_hash: sha(rid),
            });
          }
          const swept = await orm.em.fork().transactional(async (tx) => {
            await tx.execute(
              "select set_config('app.system_context', 'false', true)",
            );
            return repo.findOverdueItemsAcrossTenants(
              tx as any,
              new Date(),
              500,
            );
          });
          expect(swept.map((i) => i.id)).toEqual(
            expect.arrayContaining([overdueA, overdueB]),
          );
          const mine = await inTenant(A.tenant, (tx) =>
            repo.findItemById(tx, A.tenant, overdueB),
          );
          expect(mine).toBeNull();
        });
      });

      describe('AccessAnomaliesRepository (B4b): createIfAbsent idempotente', () => {
        const repo = new AccessAnomaliesRepository();
        const detected = (over: Record<string, unknown> = {}) => ({
          tenantId: A.tenant,
          userId: A.user,
          organizationUserAssignmentId: A.bond,
          kindConceptId: DELEG.ANOMALY_OFF_HOURS,
          windowStart: new Date(Date.now() - 6 * DAY),
          windowEnd: new Date(Date.now() - 6 * DAY + 60 * MIN),
          observedValue: '7.00',
          baselineValue: '1.00',
          thresholdValue: '5.00',
          evidence: { n: 7 },
          ...over,
        });

        it('la misma ventana (organización, persona, tipo, inicio) se crea una vez: true, false y otra ventana true', async () => {
          await inTenant(A.tenant, async (tx) => {
            const first = detected();
            expect(await repo.createIfAbsent(tx, first, A.other)).toBe(true);
            expect(await repo.createIfAbsent(tx, first, A.other)).toBe(false);
            const later = detected({
              windowStart: new Date(first.windowStart.getTime() + 2 * 60 * MIN),
              windowEnd: new Date(first.windowEnd.getTime() + 2 * 60 * MIN),
            });
            expect(await repo.createIfAbsent(tx, later)).toBe(true);
            const open = await repo.findOpenByUser(tx, A.tenant, A.user);
            expect(
              open.filter((r) => r.kindConceptId === DELEG.ANOMALY_OFF_HOURS),
            ).toHaveLength(2);
            const listed = await repo.findByTenant(tx, A.tenant, {
              kindConceptIds: [DELEG.ANOMALY_OFF_HOURS],
              statusConceptIds: [DELEG.ANOMALY_OPEN],
              limit: 10,
            });
            expect(listed.every((r) => r.tenantId === A.tenant)).toBe(true);
            // valores decimales con 2 cifras y evidencia como JSON
            const row = open.find(
              (r) => r.windowStart.getTime() === first.windowStart.getTime(),
            );
            expect(String(row!.observedValue)).toBe('7.00');
            expect(row!.evidenceJson).toEqual({ n: 7 });
          });
        });

        it('cinco barridos simultáneos de la misma ventana crean exactamente UNA fila', async () => {
          const win = detected({
            kindConceptId: DELEG.ANOMALY_DENIED_BURST,
            windowStart: new Date(Date.now() - 9 * DAY),
            windowEnd: new Date(Date.now() - 9 * DAY + 60 * MIN),
          });
          const results = await Promise.all(
            Array.from({ length: 5 }, () =>
              inTenant(A.tenant, (tx) => repo.createIfAbsent(tx, win), true),
            ),
          );
          const created = await admin.query(
            `select id from delegated_access.access_anomalies where tenant_id = $1 and user_id = $2 and kind_concept_id = $3`,
            [A.tenant, A.user, DELEG.ANOMALY_DENIED_BURST],
          );
          for (const r of created.rows)
            seeded.push(['delegated_access', 'access_anomalies', r.id]);
          expect(results.filter(Boolean)).toHaveLength(1);
          expect(created.rows).toHaveLength(1);
        });

        it('bajo el contexto de A no se registra una anomalía de B (RLS), una ventana invertida y descartar sin motivo los rechaza la base', async () => {
          const foreign = await failure(() =>
            inTenant(A.tenant, (tx) =>
              repo.createIfAbsent(
                tx,
                detected({
                  tenantId: B.tenant,
                  userId: B.user,
                  organizationUserAssignmentId: B.bond,
                }),
              ),
            ),
          );
          expect(['42501', '23503', '23514']).toContain(foreign.code);
          const inverted = await failure(() =>
            inTenant(A.tenant, (tx) =>
              repo.createIfAbsent(
                tx,
                detected({
                  kindConceptId: DELEG.ANOMALY_CANCEL_SPIKE,
                  windowStart: new Date(),
                  windowEnd: new Date(Date.now() - MIN),
                }),
              ),
            ),
          );
          expect({
            code: inverted.code,
            constraint: inverted.constraint,
          }).toEqual({
            code: '23514',
            constraint: 'ck_access_anomalies_window',
          });
          const dismiss = await failure(() =>
            inTenant(A.tenant, async (tx) => {
              const row = await repo.findById(tx, A.tenant, sideIds.A.anomaly);
              repo.resolve(row!, {
                statusConceptId: DELEG.ANOMALY_DISMISSED,
                byUserId: A.other,
                comment: 'no',
                now: new Date(),
              });
              await tx.flush();
            }),
          );
          expect({
            code: dismiss.code,
            constraint: dismiss.constraint,
          }).toEqual({
            code: '23514',
            constraint: 'ck_access_anomalies_dismiss_comment',
          });
          await inTenant(A.tenant, async (tx) => {
            const row = await repo.findById(tx, A.tenant, sideIds.A.anomaly);
            repo.resolve(row!, {
              statusConceptId: DELEG.ANOMALY_DISMISSED,
              byUserId: A.other,
              comment: 'Era una auditoría programada.',
              now: new Date(),
            });
            await tx.flush();
          });
        });
      });

      describe('LifecycleRepository (B3a/B4c): casos y traspaso', () => {
        const repo = new LifecycleRepository();

        it('abre un caso, crea ítems de traspaso, los reasigna o devuelve a la bandeja común y completa el caso', async () => {
          await inTenant(A.tenant, async (tx) => {
            const kase = repo.createCase(tx, {
              tenantId: A.tenant,
              organizationUserAssignmentId: A.bond,
              subjectUserId: A.user,
              kindConceptId: DELEG.LIFECYCLE_LEAVER,
              openedByUserId: A.other,
              openedAt: new Date(),
              reasonText: 'Se va del servicio',
              checklist: [{ code: 'REVOKE', status: 'PENDING' }],
              details: { dueDays: 7 },
              actorUserId: A.other,
            });
            await tx.flush();
            expect(
              await repo.findOpenCase(tx, A.bond, DELEG.LIFECYCLE_LEAVER),
            ).not.toBeNull();
            const conv = id();
            const task = id();
            const items = repo.createHandoverItems(tx, [
              {
                tenantId: A.tenant,
                lifecycleCaseId: kase.id,
                itemKindConceptId: DELEG.HANDOVER_CONVERSATION,
                sourceId: conv,
                fromUserId: A.user,
                summaryText: 'Conversación de la bandeja',
                actorUserId: A.other,
              },
              {
                tenantId: A.tenant,
                lifecycleCaseId: kase.id,
                itemKindConceptId: DELEG.HANDOVER_WORKFLOW_TASK,
                sourceId: task,
                fromUserId: A.user,
              },
              {
                tenantId: A.tenant,
                lifecycleCaseId: kase.id,
                itemKindConceptId: DELEG.HANDOVER_SUPERVISED_ENGAGEMENT,
                sourceId: A.bond,
                fromUserId: A.user,
              },
            ]);
            await tx.flush();
            expect(await repo.countPendingHandover(tx, kase.id)).toBe(3);
            expect(await repo.findHandoverItems(tx, kase.id)).toHaveLength(3);
            const now = new Date();
            repo.reassign(items[0], {
              toUserId: A.other,
              byUserId: A.other,
              now,
              note: 'Sigue Pérez',
            });
            repo.returnToPool(items[1], A.other, now);
            await tx.flush();
            tx.clear();
            expect(await repo.countPendingHandover(tx, kase.id)).toBe(1);
            const pending = await repo.findPendingItemsBySource(
              tx,
              A.tenant,
              A.bond,
              DELEG.HANDOVER_SUPERVISED_ENGAGEMENT,
            );
            expect(pending).toHaveLength(1);
            const all = await repo.findHandoverItems(tx, kase.id);
            expect(all.map((i) => i.statusConceptId).sort()).toEqual(
              [
                DELEG.HANDOVER_REASSIGNED,
                DELEG.HANDOVER_RETURNED_TO_POOL,
                DELEG.HANDOVER_PENDING,
              ].sort(),
            );
            expect(
              all.find((i) => i.statusConceptId === DELEG.HANDOVER_REASSIGNED),
            ).toMatchObject({
              toUserId: A.other,
              noteText: 'Sigue Pérez',
            });
            const again = await repo.findCaseById(tx, A.tenant, kase.id);
            repo.complete(again!, now, A.other);
            await tx.flush();
            tx.clear();
            expect(
              await repo.findOpenCase(tx, A.bond, DELEG.LIFECYCLE_LEAVER),
            ).toBeNull();
            const done = await repo.findCases(tx, A.tenant, {
              kindConceptId: DELEG.LIFECYCLE_LEAVER,
              statusConceptId: DELEG.LIFECYCLE_COMPLETED,
            });
            expect(done.map((c) => c.id)).toContain(kase.id);
            expect(
              done.find((c) => c.id === kase.id)!.completedAt,
            ).toBeInstanceOf(Date);
          });
        });

        it('la base impone las reglas del traspaso: no reasignarse a uno mismo, y «reasignado» exige destino y fecha', async () => {
          const toSelf = await failure(() =>
            inTenant(A.tenant, async (tx) => {
              const [item] = repo.createHandoverItems(tx, [
                {
                  tenantId: A.tenant,
                  lifecycleCaseId: sideIds.A.kase,
                  itemKindConceptId: DELEG.HANDOVER_CONVERSATION,
                  sourceId: id(),
                  fromUserId: A.user,
                },
              ]);
              await tx.flush();
              repo.reassign(item, {
                toUserId: A.user,
                byUserId: A.other,
                now: new Date(),
              });
              await tx.flush();
            }),
          );
          expect({ code: toSelf.code, constraint: toSelf.constraint }).toEqual({
            code: '23514',
            constraint: 'ck_handover_items_not_self',
          });
          const noTarget = await failure(() =>
            asApp(A.tenant, (c) =>
              c.query(
                insertSql('handover_items', {
                  ...rowsOf(A, ids(), 'hn')['handover_items'],
                  lifecycle_case_id: sideIds.A.kase,
                  status_concept_id: DELEG.HANDOVER_REASSIGNED,
                }),
              ),
            ),
          );
          expect({
            code: noTarget.code,
            constraint: noTarget.constraint,
          }).toEqual({
            code: '23514',
            constraint: 'ck_handover_items_reassigned',
          });
        });

        it('un caso y sus ítems de A no se ven ni se tocan desde B', async () => {
          await inTenant(B.tenant, async (tx) => {
            expect(
              await repo.findCaseById(tx, A.tenant, sideIds.A.kase),
            ).toBeNull();
            expect(await repo.findHandoverItems(tx, sideIds.A.kase)).toEqual(
              [],
            );
            expect(await repo.countPendingHandover(tx, sideIds.A.kase)).toBe(0);
            expect(
              await repo.findPendingItemsBySource(
                tx,
                A.tenant,
                A.bond,
                DELEG.HANDOVER_SUPERVISED_ENGAGEMENT,
              ),
            ).toEqual([]);
          });
        });
      });

      describe('HandoverWorkRepository (B4c): lo que toca community, workflow y scheduling', () => {
        const repo = new HandoverWorkRepository();
        const PABLO = ANCHORS.pabloUser;
        const ANA = ANCHORS.anaUser;
        let tasksOfOtherTenant: string[] = [];

        beforeAll(async () => {
          // una tarea de Pablo en una instancia de OTRA organización: no debe contar en el hospital
          const instance = id();
          const task = id();
          await admin.query(
            `insert into workflow.workflow_instances (id, workflow_code, subject_type_concept_id, subject_id, tenant_id, current_state_concept_id, status_concept_id, created_at, updated_at, row_version)
             select $1, workflow_code, subject_type_concept_id, subject_id, $2, current_state_concept_id, status_concept_id, now(), now(), 1
               from workflow.workflow_instances
              where id = (select workflow_instance_id from workflow.workflow_tasks where assigned_user_id = $3 limit 1)`,
            [instance, B.tenant, PABLO],
          );
          seeded.push(['workflow', 'workflow_instances', instance]);
          await admin.query(
            `insert into workflow.workflow_tasks (id, workflow_instance_id, task_code, task_type_concept_id, assigned_user_id, due_at, status_concept_id, created_at, updated_at, row_version)
             select $1, $2, task_code, task_type_concept_id, assigned_user_id, due_at, status_concept_id, now(), now(), 1
               from workflow.workflow_tasks where assigned_user_id = $3 limit 1`,
            [task, instance, PABLO],
          );
          seeded.push(['workflow', 'workflow_tasks', task]);
          tasksOfOtherTenant = [task];
        });

        it('lo que Pablo deja en el hospital: 3 conversaciones abiertas, 2 tareas (no la de otra organización) y 1 cita pendiente', async () => {
          await inTenant(A.tenant, async (tx) => {
            const convs = await repo.findOpenConversations(tx, A.tenant, PABLO);
            expect(convs).toHaveLength(3);
            const profiles = await repo.conversationProfiles(
              tx,
              convs.map((c) => c.id),
            );
            expect(profiles.size).toBe(3);
            expect(new Set(profiles.values()).size).toBe(2); // 2 de Pérez, 1 de Méndez
            const tasks = await repo.findOpenTaskIds(tx, A.tenant, PABLO);
            expect(tasks).toHaveLength(2);
            expect(tasks).not.toContain(tasksOfOtherTenant[0]);
            const bookings = await repo.findPendingBookings(
              tx,
              A.tenant,
              PABLO,
              new Date(),
            );
            expect(bookings).toHaveLength(1);
            expect(bookings[0].startAt).toBeInstanceOf(Date);
            expect(await repo.conversationProfiles(tx, [])).toEqual(new Map());
          });
          // y con una fecha posterior a la de la cita, ya no es «futura»
          await inTenant(A.tenant, async (tx) => {
            expect(
              await repo.findPendingBookings(
                tx,
                A.tenant,
                PABLO,
                new Date('2027-01-01T00:00:00Z'),
              ),
            ).toEqual([]);
          });
        });

        it('desde otra organización no se ve nada de lo de Pablo en el hospital (RLS)', async () => {
          await inTenant(B.tenant, async (tx) => {
            expect(
              await repo.findOpenConversations(tx, A.tenant, PABLO),
            ).toEqual([]);
            expect(
              await repo.findOpenConversations(tx, B.tenant, PABLO),
            ).toEqual([]);
            expect(
              await repo.findPendingBookings(tx, A.tenant, PABLO, new Date()),
            ).toEqual([]);
            // la tarea de B sí cuenta en B (y solo en B)
            expect(await repo.findOpenTaskIds(tx, B.tenant, PABLO)).toEqual(
              tasksOfOtherTenant,
            );
          });
        });

        it('reasigna: conversación a una persona o a la bandeja común (NEW, sin responsable), tarea a una persona o por rol, y cambia el dueño de la cuenta', async () => {
          // B-B6: cada escritura exige que la fila siga siendo de la organización y de quien se fue (Pablo).
          await admin.query(
            'update delegated_access.organization_user_assignments set supervisor_user_id = $1 where id = $2',
            [PABLO, ANCHORS.anaBond],
          );
          const owner = { tenantId: A.tenant, fromUserId: PABLO };
          await inTenant(A.tenant, async (tx) => {
            const now = new Date();
            const [first, second] = await repo.findOpenConversations(
              tx,
              A.tenant,
              PABLO,
            );
            expect(
              await repo.reassignConversation(
                tx,
                first.id,
                ANA,
                A.other,
                now,
                owner,
              ),
            ).toBe(true);
            await tx.flush();
            // B-B6: ya es de Ana: reasignar «lo de Pablo» otra vez no la pisa
            expect(
              await repo.reassignConversation(
                tx,
                first.id,
                A.other,
                A.other,
                now,
                owner,
              ),
            ).toBe(false);
            expect(
              await repo.reassignConversation(
                tx,
                second.id,
                null,
                A.other,
                now,
                owner,
              ),
            ).toBe(true);
            expect(
              await repo.reassignConversation(
                tx,
                id(),
                ANA,
                A.other,
                now,
                owner,
              ),
            ).toBe(false);
            const [task] = await repo.findOpenTaskIds(tx, A.tenant, PABLO);
            expect(
              await repo.reassignTask(tx, task, ANA, A.other, now, owner),
            ).toBe(true);
            expect(
              await repo.reassignTask(tx, id(), ANA, A.other, now, owner),
            ).toBe(false);
            expect(
              await repo.setSupervisor(
                tx,
                ANCHORS.anaBond,
                A.other,
                A.other,
                now,
                owner,
              ),
            ).toBe(true);
            expect(
              await repo.setSupervisor(tx, id(), A.other, A.other, now, owner),
            ).toBe(false);
            await tx.flush();
            const rows = await tx.execute(
              `select id, assigned_user_id, status_concept_id from community.conversation_assignments where id in (?, ?)`,
              [first.id, second.id],
            );
            const byId = new Map<string, any>(rows.map((r: any) => [r.id, r]));
            expect(byId.get(first.id).assigned_user_id).toBe(ANA);
            expect(byId.get(second.id).assigned_user_id).toBeNull();
            expect(byId.get(second.id).status_concept_id).toBe(
              COMM.CONVERSATION_ASSIGNMENT_NEW,
            );
            const taskRow = await tx.execute(
              'select assigned_user_id from workflow.workflow_tasks where id = ?',
              [task],
            );
            expect(taskRow[0].assigned_user_id).toBe(ANA);
            const bond = await tx.execute(
              'select supervisor_user_id from delegated_access.organization_user_assignments where id = ?',
              [ANCHORS.anaBond],
            );
            expect(bond[0].supervisor_user_id).toBe(A.other);
            // findSupervised: los vínculos de la organización cuyo dueño es esa persona
            const supervised = await repo.findSupervised(
              tx,
              [ANCHORS.anaBond, id()],
              A.other,
            );
            expect(supervised.map((r) => r.id)).toEqual([ANCHORS.anaBond]);
            expect(await repo.findSupervised(tx, [], A.other)).toEqual([]);
          });
        });

        it('una reasignación pedida desde otra organización no encuentra la fila (false) y no cambia nada', async () => {
          const target = (
            await inTenant(A.tenant, (tx) =>
              repo.findOpenConversations(tx, A.tenant, PABLO),
            )
          )[0];
          await inTenant(B.tenant, async (tx) => {
            expect(
              await repo.reassignConversation(
                tx,
                target.id,
                ANA,
                A.other,
                new Date(),
                { tenantId: A.tenant, fromUserId: PABLO },
              ),
            ).toBe(false);
            // v4.2.73 (A-M1): `organization_user_assignments` ya tiene tenant_id + RLS: desde otra organización ni se ve el vínculo.
            expect(
              await repo.findSupervised(
                tx,
                [ANCHORS.anaBond],
                ANCHORS.perezUser,
              ),
            ).toEqual([]);
          });
          const row = await admin.query(
            'select assigned_user_id from community.conversation_assignments where id = $1',
            [target.id],
          );
          expect(row.rows[0].assigned_user_id).toBe(PABLO);
        });
      });

      describe('otros repositorios del gobierno con la base real', () => {
        it('GrantUsageStatsRepository.upsertBuckets SUMA sobre la llave (organización, permiso, cubeta) y respeta el contexto de sistema del lote', async () => {
          const repo = new GrantUsageStatsRepository();
          const bucketStart = new Date(
            Math.floor(Date.now() / (60 * MIN)) * 60 * MIN - 40 * DAY,
          );
          const delta = (permit: number) => ({
            tenantId: A.tenant,
            userId: A.user,
            supportScopeGrantId: A.grant,
            permissionCode: 'agenda.appointment.confirm',
            bucketStart,
            permit,
            deny: 1,
            challenge: 0,
            offHours: 0,
            distinctPatients: permit,
            lastUsedAt: new Date(),
          });
          await orm.em
            .fork()
            .transactional(async (tx) => {
              await tx.execute(
                "select set_config('app.system_context', 'false', true)",
              );
              await tx.execute(
                "select set_config('app.current_tenant_id', ?, true)",
                [A.tenant],
              );
              await repo.upsertBuckets(tx as any, [delta(2)]);
              await repo.upsertBuckets(tx as any, [delta(3)]);
              const rows = await tx.execute(
                `select permit_count, deny_count, distinct_patients_in_bucket from delegated_access.grant_usage_stats
                where tenant_id = ? and support_scope_grant_id = ? and permission_code = 'agenda.appointment.confirm' and bucket_start = ?`,
                [A.tenant, A.grant, bucketStart],
              );
              expect(rows).toHaveLength(1);
              expect(rows[0]).toMatchObject({
                permit_count: 5,
                deny_count: 2,
                distinct_patients_in_bucket: 3,
              });
              throw ROLLBACK;
            })
            .catch((e) => {
              if (e !== ROLLBACK) throw e;
            });
        });

        it('SodRepository y PatientRestrictionFlagsRepository: la excepción SoD y la bandera se crean y se leen solo en su organización', async () => {
          const sod = new SodRepository();
          const flags = new PatientRestrictionFlagsRepository();
          await inTenant(A.tenant, async (tx) => {
            expect(
              (await sod.findRulesVisible(tx, A.tenant)).some(
                (r) => r.tenantId === B.tenant,
              ),
            ).toBe(false);
            expect(
              (await sod.findPlatformRules(tx)).length,
            ).toBeGreaterThanOrEqual(11);
            expect(await sod.findRuleById(tx, sideIds.B.sodRule)).toBeNull();
            const active = await flags.findActiveForPatients(
              tx,
              A.tenant,
              [A.patient],
              new Date(),
            );
            expect(active.map((f) => f.id)).toContain(sideIds.A.flag);
            // la bandera de B no se lee desde A aunque se pregunte por su paciente y su organización
            expect(
              await flags.findActiveForPatients(
                tx,
                B.tenant,
                [B.patient],
                new Date(),
              ),
            ).toEqual([]);
          });
        });
      });
    });

    // =====================================================================
    // derivada effective_support_access: TS y SQL, sin DENY ni acciones reemplazadas
    // =====================================================================
    describe('refresh_effective_support_access: la función SQL y EffectiveSupportAccessService dan el mismo resultado', () => {
      const service = () =>
        new EffectiveSupportAccessService(
          orm.em as any,
          new SupportAccessRepository(),
          new EffectiveSupportAccessRepository(),
          new PractitionerDelegateAssignmentsRepository(),
          new DelegatedPermissionSetsRepository(),
          new DelegatedPermissionSetItemsRepository(),
          logger,
        );
      const derived = async (tx: any, tenant: string): Promise<string[]> => {
        const rows = await tx.execute(
          `select user_id, practitioner_role_assignment_id, healthcare_service_id, care_space_id, permission_code, grant_id
             from delegated_access.effective_support_access where tenant_id = ?`,
          [tenant],
        );
        return rows
          .map((r: any) =>
            [
              r.user_id,
              r.practitioner_role_assignment_id,
              r.healthcare_service_id,
              r.care_space_id,
              r.permission_code,
              r.grant_id,
            ].join('|'),
          )
          .sort();
      };

      it('sobre el hospital piloto (que ya trae una concesión DENY): iguales, y sin filas de la DENY; una DENY nueva y una acción reemplazada tampoco se materializan', async () => {
        await inTenant(A.tenant, async (tx) => {
          // el estado del piloto
          const denyGrants = await tx.execute(
            'select id from delegated_access.support_scope_grants where tenant_id = ? and effect_concept_id = ?',
            [A.tenant, AUTHZ.EFFECT_DENY],
          );
          expect(denyGrants.length).toBeGreaterThanOrEqual(1);
          await service().refreshTenant(A.tenant, { tx });
          await tx.flush();
          const ts = await derived(tx, A.tenant);
          await tx.execute(
            'select delegated_access.refresh_effective_support_access(?)',
            [A.tenant],
          );
          const sql = await derived(tx, A.tenant);
          expect(ts.length).toBeGreaterThan(0);
          expect(sql).toEqual(ts);
          for (const g of denyGrants) {
            expect(sql.some((r) => r.includes(g.id))).toBe(false);
          }
        });
      });

      it('una concesión DENY nueva (alias) y una acción de alias reemplazada (superseded_at) NO generan filas ni en TS ni en SQL, y lo demás sigue igual', async () => {
        await inTenant(A.tenant, async (tx) => {
          const denyGrant = id();
          await tx.execute(
            `insert into delegated_access.support_scope_grants
               (id, tenant_id, organization_user_assignment_id, target_kind_concept_id, expansion_mode_concept_id, status_concept_id, effect_concept_id, valid_from, created_at, updated_at)
             values (?, ?, ?, ?, ?, ?, ?, now() - interval '1 day', now(), now())`,
            [
              denyGrant,
              A.tenant,
              ANCHORS.anaBond,
              DELEG.SUPPORT_TARGET_ALL,
              DELEG.SUPPORT_EXPANSION_DYNAMIC,
              DELEG.SUPPORT_GRANT_ACTIVE,
              AUTHZ.EFFECT_DENY,
            ],
          );
          await tx.execute(
            `insert into delegated_access.support_grant_actions (id, tenant_id, support_scope_grant_id, permission_id, created_at)
             select gen_random_uuid(), ?, ?, id, now() from authz.permissions where code = 'schedule.send_reminders'`,
            [A.tenant, denyGrant],
          );
          // una acción de alias de Ana reemplazada por átomos (normalize-legacy)
          const superseded = await tx.execute(
            `update delegated_access.support_grant_actions sga set superseded_at = now()
               from authz.permissions p
              where p.id = sga.permission_id and p.code = 'schedule.create' and sga.support_scope_grant_id = ?
              returning sga.id`,
            [ANCHORS.anaGrant],
          );
          expect(superseded.length).toBeGreaterThanOrEqual(1);

          await service().refreshTenant(A.tenant, { tx });
          await tx.flush();
          const ts = await derived(tx, A.tenant);
          await tx.execute(
            'select delegated_access.refresh_effective_support_access(?)',
            [A.tenant],
          );
          const sql = await derived(tx, A.tenant);
          expect(sql).toEqual(ts);
          // ni la DENY nueva ni el alias reemplazado de la concesión de Ana
          expect(sql.some((r) => r.includes(denyGrant))).toBe(false);
          expect(
            sql.some(
              (r) =>
                r.includes(ANCHORS.anaGrant) && r.includes('|schedule.create|'),
            ),
          ).toBe(false);
          // y lo que no se tocó sigue ahí (la misma concesión conserva sus otras acciones)
          expect(
            sql.some(
              (r) =>
                r.includes(ANCHORS.anaGrant) && r.includes('|schedule.view|'),
            ),
          ).toBe(true);
        });
      });
    });

    // =====================================================================
    // Hallazgo de B7a: la bandeja de apoyo resuelve el patientProfileId por person_account_links
    // =====================================================================
    describe('SupportInboxRepository.patientContext: patientProfileId por profiles.person_account_links', () => {
      it('una cuenta de paciente con vínculo `profiles:ACCOUNT_LINK_ACTIVE` resuelve su perfil de paciente y el motivo de su cita con ese doctor', async () => {
        const repo = new SupportInboxRepository();
        const row = (
          await admin.query(
            `select l.user_id, l.person_id
               from profiles.person_account_links l
               join profiles.patient_profiles pp on pp.profile_id = l.person_id
              where pp.patient_code = 'DEMO-PIL-P01'`,
          )
        ).rows[0];
        const perez = (
          await admin.query(
            `select practitioner_profile_id from practice.practitioner_role_assignments where id = (
               select practitioner_role_assignment_id from delegated_access.support_scope_grants where id = $1)`,
            [A.grant],
          )
        ).rows[0].practitioner_profile_id;
        const ctx = await inTenant(A.tenant, (tx) =>
          repo.patientContext(tx, {
            tenantId: A.tenant,
            practitionerProfileId: perez,
            patientUserId: row.user_id,
          }),
        );
        expect(ctx.patientProfileId).toBe(row.person_id);
        expect(ctx.reasonText).toBe('Control de presión arterial (ficticio)');
      });

      it('la cuenta sin vínculo activo (o sin perfil de paciente) no resuelve nada: contexto vacío, sin inventar', async () => {
        const repo = new SupportInboxRepository();
        const ctx = await inTenant(A.tenant, (tx) =>
          repo.patientContext(tx, {
            tenantId: A.tenant,
            practitionerProfileId: id(),
            patientUserId: ANCHORS.perezUser, // una cuenta de doctor: su persona no es paciente
          }),
        );
        expect(ctx).toEqual({});
      });
    });

    // =====================================================================
    // AC-9 (servicio) · el administrador delegado de una organización no opera en otra
    // =====================================================================
    describe('AC-9: un administrador delegado de la organización A recibe 403 en B', () => {
      const SOFIA = '161a6e07-9098-52d4-82e9-d0485c5646a2'; // jefa de Ecografía (hospital): preajuste «Jefe de servicio»
      const policy = () =>
        new TeamAdminPolicy(
          new SupportAdminDirectory(
            new SupportAccessRepository(),
            new SupportDirectoryRepository(),
          ),
          new SupportAccessRepository(),
          new GovernanceRulesRepository(),
        );
      const actor = { id: SOFIA, roles: [] } as any;

      it('en su organización opera con alcance de delegada; en otra, ADMIN_SCOPE_EXCEEDED (403) aunque el contexto sea el de la otra', async () => {
        const own = await inTenant(A.tenant, (tx) =>
          policy().actorOf(tx, actor, A.tenant, undefined, new Date()),
        );
        expect(own.full).toBe(false);
        expect((own as any).ctx.atoms.size).toBeGreaterThan(0);
        // el mismo actor pidiendo la organización B (con el contexto de B: su vínculo ni se ve)
        const err = await failure(() =>
          inTenant(B.tenant, (tx) =>
            policy().actorOf(tx, actor, B.tenant, undefined, new Date()),
          ),
        );
        expect(err.getStatus()).toBe(403);
        expect(err.reason).toBe('ADMIN_SCOPE_EXCEEDED');
        // y con el contexto de A pero pidiendo B: tampoco (el vínculo de B no existe para ella)
        const crossed = await failure(() =>
          inTenant(A.tenant, (tx) =>
            policy().actorOf(tx, actor, B.tenant, undefined, new Date()),
          ),
        );
        expect(crossed.getStatus()).toBe(403);
        expect(crossed.reason).toBe('ADMIN_SCOPE_EXCEEDED');
      });
    });
  },
);
