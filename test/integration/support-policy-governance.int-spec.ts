import 'dotenv/config';
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
import { Devices, MfaFactors, Sessions } from '../../src/modules/iam/entities';
import { IpAccessRules } from '../../src/modules/authz/entities';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import { SupportAccessRepository } from '../../src/modules/delegated_access/repositories/support-access.repository';
import {
  AccessDecisionLogRepository,
  FourEyesRepository,
  GovernanceRulesRepository,
  GrantUsageStatsRepository,
} from '../../src/modules/delegated_access/repositories';
import { SupportAccessPolicy } from '../../src/modules/delegated_access/services/support-access.policy';
import { SupportDecisionPipeline } from '../../src/modules/delegated_access/services/support-decision-pipeline';
import { SupportAccessContextLoader } from '../../src/modules/delegated_access/services/support-access-context.loader';
import { SupportGovernanceRules } from '../../src/modules/delegated_access/services/support-governance-rules.reader';
import { SupportUsageCounter } from '../../src/modules/delegated_access/services/support-usage-counter';
import { SupportApprovalGate } from '../../src/modules/delegated_access/services/support-approval-gate';
import { AccessDecisionRecorder } from '../../src/modules/delegated_access/services/access-decision-recorder.service';
import { AccessUsageRecorder } from '../../src/modules/delegated_access/services/access-usage-recorder';
import { PatientFactsAdapter } from '../../src/modules/delegated_access/infrastructure/adapters/patient-facts.adapter';
import { SessionInfoAdapter } from '../../src/modules/delegated_access/infrastructure/adapters/session-info.adapter';
import { NetworkPolicyAdapter } from '../../src/modules/delegated_access/infrastructure/adapters/network-policy.adapter';
import { DeviceAdapter } from '../../src/modules/delegated_access/infrastructure/adapters/device.adapter';
import { TenantZoneAdapter } from '../../src/modules/delegated_access/infrastructure/adapters/tenant-zone.adapter';
import { mapGovernanceDbError } from '../../src/modules/delegated_access/services/governance-db-errors';

/**
 * Política de apoyo con el gobierno de accesos contra PostgreSQL REAL (modelo
 * v4.2.72 aplicado y el hospital piloto sembrado): valida el SQL crudo de los
 * adaptadores del PIP, la bitácora WORM, el mapeo de errores de la base, el
 * aislamiento por organización (`mantra_app` + RLS) y MIDE el número de
 * consultas (AC-12). Cada prueba corre en una transacción que se revierte.
 *
 * Es opt-in: `SUPPORT_GOV_TEST=1`. Se apunta con `SUPPORT_GOV_DB_HOST/PORT/NAME/USER`
 * (por defecto 127.0.0.1:5494/salud_real, usuario `postgres`). Nunca usa la base
 * compartida ni el puerto 5432.
 */
const describeGov =
  process.env.SUPPORT_GOV_TEST === '1' ? describe : describe.skip;

const ENTITIES = [
  ...Object.values(delegated),
  CareSpaces,
  HealthcareServices,
  PracticeSites,
  Practices,
  PractitionerLocationAssignments,
  PractitionerRoleAssignments,
  TenantMemberships,
  Sessions,
  Devices,
  MfaFactors,
  IpAccessRules,
] as any[];

const logger: any = {
  setContext: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};
const ROLLBACK = new Error('rollback');

describeGov(
  'Política de apoyo con gobierno de accesos, contra PostgreSQL real',
  () => {
    let orm: MikroORM;
    let queries = 0;
    let policy: SupportAccessPolicy;
    let rules: SupportGovernanceRules;
    let usage: AccessUsageRecorder;
    let ana: {
      userId: string;
      tenantId: string;
      profileId: string;
      roleId: string;
      grantId: string;
    };

    const count = async <T>(
      fn: () => Promise<T>,
    ): Promise<{ result: T; queries: number }> => {
      queries = 0;
      const result = await fn();
      return { result, queries };
    };
    /** Corre `fn` en una transacción que SIEMPRE se revierte. */
    const inRollback = async (
      fn: (tx: any) => Promise<void>,
    ): Promise<void> => {
      await expect(
        orm.em.fork().transactional(async (tx) => {
          await fn(tx);
          throw ROLLBACK;
        }),
      ).rejects.toBe(ROLLBACK);
    };

    beforeAll(async () => {
      orm = await MikroORM.init({
        driver: PostgreSqlDriver,
        host: process.env.SUPPORT_GOV_DB_HOST ?? '127.0.0.1',
        port: Number(process.env.SUPPORT_GOV_DB_PORT ?? 5494),
        user: process.env.SUPPORT_GOV_DB_USER ?? 'postgres',
        dbName: process.env.SUPPORT_GOV_DB_NAME ?? 'salud_real',
        entities: ENTITIES,
        metadataProvider: ReflectMetadataProvider,
        allowGlobalContext: true,
        discovery: { warnWhenNoEntities: false },
        forceUtcTimezone: true,
      });
      // Cuenta TODA consulta que sale a la base (lecturas y escrituras).
      const connection = orm.em.getConnection() as any;
      const execute = connection.execute.bind(connection);
      connection.execute = (...args: unknown[]) => {
        queries += 1;
        return execute(...args);
      };
      const em = orm.em as any;
      const counter = new SupportUsageCounter(logger);
      rules = new SupportGovernanceRules(
        new GovernanceRulesRepository(),
        logger,
      );
      const loader = new SupportAccessContextLoader(
        counter,
        logger,
        new PatientFactsAdapter(),
        new SessionInfoAdapter(),
        new NetworkPolicyAdapter(),
        new DeviceAdapter(),
        undefined,
        undefined,
        new TenantZoneAdapter(),
      );
      usage = new AccessUsageRecorder(
        em,
        new GrantUsageStatsRepository(),
        logger,
      );
      const pipeline = new SupportDecisionPipeline(
        rules,
        loader,
        counter,
        new AccessDecisionRecorder(
          em,
          new AccessDecisionLogRepository(),
          logger,
        ),
        usage,
        new SupportApprovalGate(new FourEyesRepository()),
        logger,
      );
      policy = new SupportAccessPolicy(
        em,
        new SupportAccessRepository(),
        logger,
        pipeline,
      );
      // Una persona del hospital piloto con un permiso de cancelar sobre un doctor.
      const rows = await em.execute(
        `select tm.user_id, tm.tenant_id, g.id as grant_id, g.practitioner_role_assignment_id as role_id, pra.practitioner_profile_id as profile_id
         from delegated_access.support_scope_grants g
         join delegated_access.support_grant_actions ga on ga.support_scope_grant_id = g.id
         join authz.permissions p on p.id = ga.permission_id and p.code = 'schedule.cancel'
         join delegated_access.organization_user_assignments a on a.id = g.organization_user_assignment_id
         join directory.tenant_memberships tm on tm.id = a.tenant_membership_id
         join practice.practitioner_role_assignments pra on pra.id = g.practitioner_role_assignment_id
         join delegated_access.practitioner_delegate_assignments d
           on d.delegate_user_assignment_id = a.id and d.accepted_at is not null and d.status_concept_id = ?
         join practice.practitioner_role_assignments dpra on dpra.id = d.practitioner_role_assignment_id
        where g.practitioner_role_assignment_id is not null
          and dpra.practitioner_profile_id = pra.practitioner_profile_id
          and a.status_concept_id = ? and (a.valid_to is null or a.valid_to > now())
          and g.status_concept_id = ? and g.target_kind_concept_id = ?
        limit 1`,
        [
          CONCEPTS.STATE_ACTIVE,
          CONCEPTS.STATE_ACTIVE,
          DELEG.SUPPORT_GRANT_ACTIVE,
          DELEG.SUPPORT_TARGET_PRACTITIONER,
        ],
      );
      const r = rows[0];
      ana = {
        userId: r.user_id,
        tenantId: r.tenant_id,
        profileId: r.profile_id,
        roleId: r.role_id,
        grantId: r.grant_id,
      };
    });

    afterAll(async () => {
      await usage?.onModuleDestroy();
      await orm?.close(true);
    });

    const cancel = (extra: Record<string, unknown> = {}) => ({
      userId: ana.userId,
      tenantId: ana.tenantId,
      action: 'schedule.cancel' as const,
      practitionerProfileId: ana.profileId,
      ...extra,
    });

    it('AC-1 / AC-12: un permiso de alias sin condiciones se decide con las MISMAS consultas que antes del gobierno (caché de reglas caliente)', async () => {
      const em = orm.em.fork() as any;
      const legacy = new SupportAccessPolicy(
        em,
        new SupportAccessRepository(),
        logger,
      );
      const before = await count(() => legacy.can(cancel(), em));
      expect(before.result.allowed).toBe(true);
      rules.invalidate();
      const cold = await count(() => policy.can(cancel(), em));
      expect(cold.result).toMatchObject({
        allowed: true,
        effect: 'PERMIT',
        grantId: ana.grantId,
      });
      const warm = await count(() => policy.can(cancel(), em));
      console.log(
        `[AC-12] consultas por decisión: antes=${before.queries} · con gobierno en frío=${cold.queries} · en caliente=${warm.queries}`,
      );
      // en frío (primera decisión de la organización): la lectura de reglas Y la zona horaria de la organización (TenantZoneAdapter), cada una
      // UNA vez por organización y con caché; en una base limpia son +2 (B7a; la medición anterior, sobre salud_real, daba +1).
      expect(cold.queries).toBe(before.queries + 2);
      expect(warm.queries).toBe(before.queries); // 0 de más
    });

    it('regla DENY_PERMISSION de la organización: niega de inmediato, deja asiento WORM y retirarla lo permite (G-02)', async () => {
      await inRollback(async (tx) => {
        await tx.execute(
          `insert into delegated_access.governance_rules (id, tenant_id, rule_kind_concept_id, permission_pattern, rule_json, rule_schema_version, message_text, status_concept_id, created_at, updated_at, row_version)
         values (gen_random_uuid(), ?, ?, 'agenda.appointment.cancel', '{}'::jsonb, 1, 'Prueba', ?, now(), now(), 1)`,
          [ana.tenantId, DELEG.GOV_RULE_DENY_PERMISSION, CONCEPTS.STATE_ACTIVE],
        );
        rules.invalidate(ana.tenantId);
        const denied = await policy.can(cancel(), tx);
        expect(denied).toMatchObject({
          allowed: false,
          effect: 'DENY',
          reason: 'ORG_RULE_DENY',
        });
        const log = await tx.execute(
          `select reason_code, effect_concept_id, user_id from delegated_access.access_decision_log where tenant_id = ? and user_id = ? and reason_code = 'ORG_RULE_DENY' order by recorded_at desc limit 1`,
          [ana.tenantId, ana.userId],
        );
        expect(log[0]).toMatchObject({
          reason_code: 'ORG_RULE_DENY',
          effect_concept_id: DELEG.DECISION_EFFECT_DENY,
        });
        await tx.execute(
          `delete from delegated_access.governance_rules where tenant_id = ? and message_text = 'Prueba'`,
          [ana.tenantId],
        );
        rules.invalidate(ana.tenantId);
        // Con el DENY deduplicado (60 s) la segunda decisión permitida no escribe nada más.
        expect((await policy.can(cancel(), tx)).allowed).toBe(true);
      });
      rules.invalidate(ana.tenantId);
    });

    it('una condición horaria cerrada niega con TIME_WINDOW y la zona horaria sale de directory.tenants (SQL crudo validado)', async () => {
      await inRollback(async (tx) => {
        const atoms = await tx.execute(
          `select ga.id from delegated_access.support_grant_actions ga join authz.permissions p on p.id = ga.permission_id
          where ga.support_scope_grant_id = ? and p.code = 'schedule.cancel'`,
          [ana.grantId],
        );
        // Condición del permiso: solo domingos de madrugada (casi nunca): lo vigente hoy se cierra.
        await tx.execute(
          `update delegated_access.support_scope_grants set condition_json = ?::jsonb, condition_schema_version = 1 where id = ?`,
          [
            JSON.stringify({
              schemaVersion: 1,
              time: {
                timeZone: 'America/La_Paz',
                windows: [{ days: [0], from: '03:00', to: '03:01' }],
              },
            }),
            ana.grantId,
          ],
        );
        // El alias no trae condiciones (no regresión): se escribe el átomo.
        const atomId = (
          await tx.execute(
            `select id from authz.permissions where code = 'agenda.appointment.cancel'`,
          )
        )[0].id;
        await tx.execute(
          `insert into delegated_access.support_grant_actions (id, tenant_id, support_scope_grant_id, permission_id, created_at) values (gen_random_uuid(), ?, ?, ?, now())`,
          [ana.tenantId, ana.grantId, atomId],
        );
        void atoms;
        const decision = await policy.can(
          {
            ...cancel({ action: 'agenda.appointment.cancel' }),
            context: {
              proof: { reasonText: 'Motivo suficiente para cancelar' },
            },
          },
          tx,
        );
        expect(decision).toMatchObject({
          allowed: false,
          reason: 'TIME_WINDOW',
        });
        const { queries: n } = await count(() =>
          policy.can(
            {
              ...cancel({ action: 'agenda.appointment.cancel' }),
              context: {
                proof: { reasonText: 'Motivo suficiente para cancelar' },
              },
            },
            tx,
          ),
        );
        console.log(
          `[AC-12] con una condición horaria (sin hechos de paciente/red): ${n} consultas por decisión (incluye el asiento del DENY deduplicado: 0)`,
        );
      });
    });

    it('AC-12: con condiciones sobre el paciente (banderas, edad, ventana de citas) la decisión cuesta ≤ 4 consultas más que sin condiciones', async () => {
      await inRollback(async (tx) => {
        const patient = (
          await tx.execute(
            `select profile_id from profiles.patient_profiles limit 1`,
          )
        )[0].profile_id;
        const atomId = (
          await tx.execute(
            `select id from authz.permissions where code = 'agenda.appointment.cancel'`,
          )
        )[0].id;
        await tx.execute(
          `insert into delegated_access.support_grant_actions (id, tenant_id, support_scope_grant_id, permission_id, created_at) values (gen_random_uuid(), ?, ?, ?, now())`,
          [ana.tenantId, ana.grantId, atomId],
        );
        const input = (): any => ({
          ...cancel({ action: 'agenda.appointment.cancel' }),
          context: {
            patientProfileId: patient,
            appointmentStartAt: new Date(Date.now() + 3 * 86_400_000),
            proof: { reasonText: 'Motivo suficiente para cancelar' },
          },
        });
        // Sin condiciones (el átomo exige motivo del catálogo): base.
        await policy.can(input(), tx);
        const base = await count(() => policy.can(input(), tx));
        expect(base.result.allowed).toBe(true);
        await tx.execute(
          `update delegated_access.support_scope_grants set condition_json = ?::jsonb, condition_schema_version = 1 where id = ?`,
          [
            JSON.stringify({
              schemaVersion: 1,
              patients: {
                exclude: { minors: true, flags: ['VIP', 'CONFIDENTIAL'] },
                scope: 'WITH_APPOINTMENT_WINDOW',
                appointmentWindow: { daysBefore: 30, daysAfter: 30 },
              },
            }),
            ana.grantId,
          ],
        );
        await policy.can(input(), tx); // calienta la zona horaria (caché de 5 min)
        const withConditions = await count(() => policy.can(input(), tx));
        console.log(
          `[AC-12] sin condiciones=${base.queries} · con condiciones de paciente=${withConditions.queries} (+${withConditions.queries - base.queries}) · veredicto=${withConditions.result.reason}`,
        );
        expect(withConditions.queries - base.queries).toBeLessThanOrEqual(4);
        expect([
          'ALLOWED',
          'PATIENT_SCOPE',
          'PATIENT_AGE',
          'PATIENT_AGE_UNKNOWN',
          'PATIENT_EXCLUDED',
        ]).toContain(withConditions.result.reason);
      });
    });

    it('PatientFactsAdapter: el SQL real corre y devuelve edad, banderas, cobertura, equipo y citas de varios pacientes con 2 consultas fijas', async () => {
      const em = orm.em.fork() as any;
      const patients = await em.execute(
        `select profile_id from profiles.patient_profiles limit 3`,
      );
      const ids = patients.map((p: any) => p.profile_id);
      const adapter = new PatientFactsAdapter();
      const { result, queries: n } = await count(() =>
        adapter.loadMany(em, {
          tenantId: ana.tenantId,
          patientProfileIds: ids,
          now: new Date(),
          bookingRange: { daysBefore: 30, daysAfter: 30 },
          needsCoverage: true,
          needsCareTeam: true,
          needsBirthDate: true,
        }),
      );
      expect(result.size).toBe(ids.length);
      for (const record of result.values()) {
        expect(Array.isArray(record.flags)).toBe(true);
        expect(Array.isArray(record.bookings)).toBe(true);
        expect(Array.isArray(record.careTeam)).toBe(true);
      }
      expect(n).toBe(2); // una para todos los pacientes + una para sus citas
      const lean = await count(() =>
        adapter.loadMany(em, {
          tenantId: ana.tenantId,
          patientProfileIds: ids,
          now: new Date(),
          needsCoverage: false,
          needsCareTeam: false,
          needsBirthDate: false,
        }),
      );
      expect(lean.queries).toBe(1); // sin ventana de citas: una sola consulta
    });

    it('SessionInfo / Network / Device / TenantZone: el SQL real corre y falla cerrado ante lo inexistente', async () => {
      const em = orm.em.fork() as any;
      expect(
        await new SessionInfoAdapter().find(em, 'token-que-no-existe'),
      ).toBeUndefined();
      const net = await new NetworkPolicyAdapter().evaluate(
        em,
        ana.tenantId,
        '198.51.100.7',
        new Date(),
      );
      expect(typeof net.orgHasAllowRules).toBe('boolean');
      if (!net.orgHasAllowRules) expect(net.satisfiesOrgRules).toBe(false); // sin redes definidas no «satisface»
      expect(
        await new DeviceAdapter().isTrusted(
          em,
          ana.userId,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).toBe(false);
      const zone = await new TenantZoneAdapter().timeZoneOf(em, ana.tenantId);
      expect(zone === undefined || typeof zone === 'string').toBe(true);
    });

    it('access_decision_log es WORM: UPDATE y DELETE fallan con 23001 y mapGovernanceDbError lo traduce a 409 APPEND_ONLY', async () => {
      await inRollback(async (tx) => {
        await tx.execute(
          `insert into delegated_access.access_decision_log (id, tenant_id, user_id, permission_code, effect_concept_id, reason_code, recorded_at)
         values (gen_random_uuid(), ?, ?, 'schedule.view', ?, 'ALLOWED', now())`,
          [ana.tenantId, ana.userId, DELEG.DECISION_EFFECT_PERMIT],
        );
        for (const sql of [
          `update delegated_access.access_decision_log set reason_code = 'X' where tenant_id = '${ana.tenantId}'`,
          `delete from delegated_access.access_decision_log where tenant_id = '${ana.tenantId}'`,
        ]) {
          const error = await tx
            .execute(`savepoint s1`)
            .then(() => tx.execute(sql))
            .catch((e: unknown) => e);
          const mapped: any = mapGovernanceDbError(error);
          expect(mapped).toBeDefined();
          expect(mapped.getStatus()).toBe(409);
          expect(mapped.reason).toBe('APPEND_ONLY');
          await tx.execute(`rollback to savepoint s1`);
        }
      });
    });

    it('auto-aprobación del cuatro ojos: la base responde 23514 y el mapeo da 403 FOUR_EYES_SELF_APPROVAL', async () => {
      await inRollback(async (tx) => {
        const attempt = tx.execute(
          `insert into delegated_access.four_eyes_requests (id, tenant_id, kind_concept_id, requester_user_id, approver_kind_concept_id, payload_json, payload_hash, payload_schema_version, status_concept_id, expires_at, decided_at, decided_by_user_id, created_at, updated_at, row_version)
         values (gen_random_uuid(), ?, ?, ?, (select id from terminology.catalog_concepts where code = 'authz:APPROVAL_DOCTOR' limit 1), '{}'::jsonb, repeat('a', 64), 1, ?, now() + interval '1 day', now(), ?, now(), now(), 1)`,
          [
            ana.tenantId,
            DELEG.FOUR_EYES_KIND_ACTION,
            ana.userId,
            DELEG.FOUR_EYES_APPROVED,
            ana.userId,
          ],
        );
        const error = await attempt.catch((e: unknown) => e);
        const mapped: any = mapGovernanceDbError(error);
        expect(mapped?.getStatus()).toBe(403);
        expect(mapped?.reason).toBe('FOUR_EYES_SELF_APPROVAL');
      });
    });

    it('AC-9: como mantra_app con RLS el asiento solo entra en la organización del contexto y la lectura no cruza organizaciones', async () => {
      const others = await orm.em
        .fork()
        .execute(`select id from directory.tenants where id <> ? limit 1`, [
          ana.tenantId,
        ]);
      const other: string = others[0].id;
      await inRollback(async (tx) => {
        await tx.execute(`set local role mantra_app`);
        await tx.execute(
          `select set_config('app.system_context', 'false', true)`,
        );
        await tx.execute(
          `select set_config('app.current_tenant_id', ?, true)`,
          [ana.tenantId],
        );
        const recorder = new AccessDecisionRecorder(
          orm.em as any,
          new AccessDecisionLogRepository(),
          logger,
        );
        const decision: any = {
          allowed: false,
          effect: 'DENY',
          reason: 'TIME_WINDOW',
        };
        const input = (tenantId: string) => ({
          tenantId,
          userId: ana.userId,
          action: 'schedule.view',
          decision,
          now: new Date(),
        });
        // En su organización: entra.
        await expect(
          recorder.write(tx, input(ana.tenantId), {
            write: true,
            required: false,
          }),
        ).resolves.toBe(true);
        const mine = await tx.execute(
          `select count(*)::int as n from delegated_access.access_decision_log`,
        );
        expect(mine[0].n).toBeGreaterThanOrEqual(1);
        // En otra organización: la política `tenant_isolation` lo rechaza (y no envenena la transacción: punto de guardado).
        await expect(
          recorder.write(
            tx,
            { ...input(other), userId: ana.userId },
            { write: true, required: true },
          ),
        ).rejects.toBeDefined();
        // La lectura de la bitácora y de las reglas nunca muestra filas de otra organización.
        const foreign = await tx.execute(
          `select count(*)::int as n from delegated_access.access_decision_log where tenant_id <> ?`,
          [ana.tenantId],
        );
        expect(foreign[0].n).toBe(0);
        const foreignRules = await tx.execute(
          `select count(*)::int as n from delegated_access.governance_rules where tenant_id <> ?`,
          [ana.tenantId],
        );
        expect(foreignRules[0].n).toBe(0);
      });
    });
  },
);
