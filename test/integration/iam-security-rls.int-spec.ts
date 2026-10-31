import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { generate, generateSecret } from 'otplib';
import { MikroORM, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { CONCEPTS } from '../../src/common/constants/concepts';
import { TokenService, encryptSecret } from '../../src/common';
import { withSystemRead } from '../../src/common/tenant/system-read-scope';
import {
  DIR,
  TENANT_TYPE_CONCEPT_BY_CODE,
} from '../../src/modules/directory/directory.concepts';
import {
  BranchMemberships,
  Branches,
  TenantMemberships,
  Tenants,
} from '../../src/modules/directory/entities';
import {
  BranchMembershipsRepository,
  BranchesRepository,
  TenantMembershipsRepository,
  TenantsRepository,
} from '../../src/modules/directory/repositories';
import { DirectoryMembershipsService } from '../../src/modules/directory/services/directory-memberships.service';
import { TenantAdministrationService } from '../../src/modules/directory/services/tenant-administration.service';
import {
  EmailVerifications,
  MfaFactors,
  SecurityEvents,
  Users,
} from '../../src/modules/iam/entities';
import {
  EmailVerificationsRepository,
  SecurityEventsRepository,
} from '../../src/modules/iam/infrastructure/repositories';
import { DirectoryTenantClaimsAdapter } from '../../src/modules/iam/infrastructure/adapters/directory-tenant-claims.adapter';
import { IamTotpService } from '../../src/modules/iam/application/services/iam-totp.service';
import { IamAuthService } from '../../src/modules/iam/application/services/iam-auth.service';
import { IpAccessRulesService } from '../../src/modules/iam/application/services/ip-access-rules.service';
import { SessionPoliciesService } from '../../src/modules/iam/application/services/session-policies.service';
import { DelegatedAccessSupportClaimsAdapter } from '../../src/modules/iam/infrastructure/adapters/delegated-access-support-claims.adapter';
import { AuthzIpAccessRulesAdapter } from '../../src/modules/iam/infrastructure/adapters/authz-ip-access-rules.adapter';
import { AuthzBusinessRolesAdapter } from '../../src/modules/iam/infrastructure/adapters/authz-business-roles.adapter';
import { ProfilesAccountProfileIdsAdapter } from '../../src/modules/iam/infrastructure/adapters/profiles-account-profile-ids.adapter';
import {
  AccountLockoutsRepository,
  CredentialsRepository,
  RefreshTokensRepository,
  SessionPoliciesRepository,
  SessionsRepository,
  UserGlobalRolesRepository,
  UsersRepository,
} from '../../src/modules/iam/infrastructure/repositories';
import { AuthzEffectiveRolesService } from '../../src/modules/authz/services/authz-effective-roles.service';
import { UserRoleAssignmentsRepository } from '../../src/modules/authz/repositories/user-role-assignments.repository';
import {
  HealthPractitionerProfilesRepository,
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../src/modules/profiles/infrastructure/repositories';
import { AUTHZ } from '../../src/modules/authz/authz.concepts';
import { IAMC } from '../../src/modules/iam/iam.concepts';
import * as iamEntities from '../../src/modules/iam/entities';
import * as directoryEntities from '../../src/modules/directory/entities';
import * as authzEntities from '../../src/modules/authz/entities';
import * as practiceEntities from '../../src/modules/practice/entities';
import * as profilesEntities from '../../src/modules/profiles/entities';
import * as delegatedEntities from '../../src/modules/delegated_access/entities';

/**
 * N2 (membresías pendientes con RLS) y N6/N7 (TOTP de un solo uso, contadores y
 * códigos de «Fui yo») contra PostgreSQL REAL, conectado como `mantra_app` (sin
 * BYPASSRLS) con `RLS_ENFORCE=true`.
 *
 * Es opt-in porque exige una base con el modelo, los parches (entre ellos
 * `2026-08-05_tenant_rls.sql`), el rol `mantra_app` con LOGIN y un superusuario
 * para sembrar. Se activa con `IAM_RLS_TEST=1` y se apunta con
 * `IAM_RLS_DB_HOST/PORT/NAME` (por defecto 127.0.0.1:5492/iam_rls) y
 * `IAM_RLS_ADMIN_USER` (por defecto `postgres`). Nunca usa la base de pruebas
 * compartida ni el puerto 5432.
 *
 * La siembra corre como superusuario con `session_replication_role = replica`
 * (sin disparadores ni FK); los conceptos que la aplicación escribe se siembran
 * aparte porque su FK sí corre bajo `mantra_app`.
 */
const describeRls = process.env.IAM_RLS_TEST === '1' ? describe : describe.skip;

const HOST = process.env.IAM_RLS_DB_HOST ?? '127.0.0.1';
const PORT = Number(process.env.IAM_RLS_DB_PORT ?? 5492);
const DB = process.env.IAM_RLS_DB_NAME ?? 'iam_rls';
const ADMIN_USER = process.env.IAM_RLS_ADMIN_USER ?? 'postgres';
const APP_USER = process.env.IAM_RLS_APP_USER ?? 'mantra_app';

const id = (): string => randomUUID();
const X = id();
const Y = id();
const Z = id();
const ADMIN = id();
const VERA = id();
const WALTER = id();
const NOW = new Date();
const stamps = { created_at: NOW, updated_at: NOW };

const logger: any = {
  setContext: () => undefined,
  info: () => undefined,
  warn: () => undefined,
};

describeRls(
  'N2/N6/N7: membresías, TOTP y códigos con RLS, como mantra_app',
  () => {
    let admin: pg.Client;
    let orm: MikroORM;
    let memberships: DirectoryMembershipsService;
    const events = new SecurityEventsRepository();
    const before = process.env.RLS_ENFORCE;

    async function insert(
      table: string,
      row: Record<string, unknown>,
    ): Promise<void> {
      const columns = Object.keys(row);
      await admin.query(
        `insert into ${table} (${columns.join(', ')}) values (${columns
          .map((_, i) => `$${i + 1}`)
          .join(', ')})`,
        Object.values(row),
      );
    }

    /** Corre `work` como lo hace el interceptor de tenant: transacción con el tenant fijado. */
    async function inRequest<T>(
      tenant: string,
      work: () => Promise<T>,
    ): Promise<T> {
      return orm.em.transactional(async (tx) => {
        await tx.execute(
          "select set_config('app.system_context', 'false', true)",
        );
        await tx.execute(
          "select set_config('app.current_tenant_id', ?, true)",
          [tenant],
        );
        return work();
      });
    }

    /** Lectura con el contexto de sistema abierto SOLO durante esa transacción. */
    async function asSystem<T>(work: (tx: any) => Promise<T>): Promise<T> {
      return orm.em.transactional(async (tx) => {
        await tx.execute(
          "select set_config('app.system_context', 'true', true)",
        );
        return work(tx);
      });
    }

    beforeAll(async () => {
      admin = new pg.Client({
        host: HOST,
        port: PORT,
        user: ADMIN_USER,
        database: DB,
      });
      await admin.connect();
      await admin.query("set session_replication_role = 'replica'");

      for (const tenant of [X, Y, Z]) {
        await insert('directory.tenants', {
          id: tenant,
          code: `T-${tenant.slice(0, 6)}`,
          tenant_type_concept_id: id(),
          legal_name: `Organización ${tenant.slice(0, 4)}`,
          trade_name: `Organización ${tenant.slice(0, 4)}`,
          legal_entity_type_concept_id: id(),
          status_concept_id: id(),
          verification_status_concept_id: id(),
          ...stamps,
        });
      }
      for (const [user, name] of [
        [ADMIN, 'Administrador de X'],
        [VERA, 'Vera'],
        [WALTER, 'Walter'],
      ] as const) {
        await insert('iam.users', {
          id: user,
          status_concept_id: CONCEPTS.STATE_ACTIVE,
          display_name: name,
          ...stamps,
        });
      }
      const membership = async (
        user: string,
        tenant: string,
        role: string,
        status: string,
      ): Promise<string> => {
        const mid = id();
        await insert('directory.tenant_memberships', {
          id: mid,
          user_id: user,
          tenant_id: tenant,
          tenant_role_concept_id: role,
          status_concept_id: status,
          access_scope_concept_id: DIR.SCOPE_ALL_TENANT,
          start_date: new Date(NOW.getTime() - 30 * 86_400_000),
          ...stamps,
        });
        return mid;
      };
      // El administrador es OWNER activo de X; Vera trabaja en Y.
      await membership(ADMIN, X, DIR.ROLE_OWNER, DIR.MEMBERSHIP_ACTIVE);
      await membership(VERA, Y, DIR.ROLE_STAFF, DIR.MEMBERSHIP_ACTIVE);
      // Y en Z hay una membresía que el personal de apoyo dejó para que la
      // ORGANIZACIÓN la apruebe (`MEMBERSHIP_INVITED`): la persona no la acepta.
      awaitingOrgApproval = await membership(
        VERA,
        Z,
        DIR.ROLE_STAFF,
        DIR.MEMBERSHIP_INVITED,
      );

      // Conceptos que la aplicación escribe (su FK corre bajo `mantra_app`).
      const codeSystem = id();
      for (const concept of [
        DIR.ROLE_OWNER,
        DIR.ROLE_STAFF,
        DIR.SCOPE_ALL_TENANT,
        DIR.MEMBERSHIP_ACTIVE,
        DIR.MEMBERSHIP_PENDING_ACCEPTANCE,
        DIR.MEMBERSHIP_INVITED,
        DIR.MEMBERSHIP_ENDED,
        DIR.MEMBERSHIP_ORIGIN_ADMIN_ADDED,
        CONCEPTS.STATE_ACTIVE,
        CONCEPTS.STATE_VERIFIED,
        CONCEPTS.MFA_TOTP,
        CONCEPTS.OUTCOME_SUCCESS,
        CONCEPTS.OUTCOME_FAILURE,
        CONCEPTS.SEC_MFA_ENROLL,
        CONCEPTS.SEC_LOGIN_FAILED,
        CONCEPTS.SEC_DEVICE_TRUST,
      ]) {
        await admin.query(
          `insert into terminology.catalog_concepts
           (id, code_system_version_id, code, display, created_at, updated_at)
         values ($1, $2, $3, $3, now(), now()) on conflict (id) do nothing`,
          [concept, codeSystem, `IAM3-${concept}`],
        );
      }

      orm = await MikroORM.init({
        driver: PostgreSqlDriver,
        host: HOST,
        port: PORT,
        user: APP_USER,
        dbName: DB,
        entities: [
          Tenants,
          TenantMemberships,
          Branches,
          BranchMemberships,
          Users,
          MfaFactors,
          SecurityEvents,
          EmailVerifications,
        ],
        metadataProvider: ReflectMetadataProvider,
        allowGlobalContext: true,
        discovery: { warnWhenNoEntities: false },
        forceUtcTimezone: true,
      });
      const em = orm.em as any;
      const membershipsRepo = new TenantMembershipsRepository();
      memberships = new DirectoryMembershipsService(
        em,
        membershipsRepo,
        new BranchMembershipsRepository(),
        new BranchesRepository(),
        new TenantAdministrationService(membershipsRepo),
        logger,
        new TenantsRepository(),
      );
      process.env.RLS_ENFORCE = 'true';
    });

    let awaitingOrgApproval = '';

    afterAll(async () => {
      if (before === undefined) delete process.env.RLS_ENFORCE;
      else process.env.RLS_ENFORCE = before;
      await orm?.close(true);
      await admin?.end();
    });

    describe('N2: la membresía que crea un administrador nace pendiente', () => {
      let pendingId = '';

      it('el administrador de X incorpora a Walter: queda PENDIENTE de aceptación, no activa', async () => {
        const res = await inRequest(X, () =>
          memberships.invite(X, { userId: WALTER, role: 'STAFF' }, {
            id: ADMIN,
            roles: [],
          } as any),
        );
        pendingId = res.id;
        expect(res.status).toBe(DIR.MEMBERSHIP_PENDING_ACCEPTANCE);
        const row = await admin.query(
          'select status_concept_id, tenant_id, invited_by_user_id, origin_concept_id from directory.tenant_memberships where id = $1',
          [pendingId],
        );
        expect(row.rows[0]).toMatchObject({
          status_concept_id: DIR.MEMBERSHIP_PENDING_ACCEPTANCE,
          tenant_id: X,
          invited_by_user_id: ADMIN,
          // N10c: la columna del modelo v4.2.71 guarda quién la creó.
          origin_concept_id: DIR.MEMBERSHIP_ORIGIN_ADMIN_ADDED,
        });
      });

      it('una segunda invitación mientras hay una pendiente es 409', async () => {
        await expect(
          inRequest(X, () =>
            memberships.invite(
              X,
              { userId: WALTER } as any,
              {
                id: ADMIN,
                roles: [],
              } as any,
            ),
          ),
        ).rejects.toMatchObject({ status: 409 });
      });

      it('una pendiente NO cuenta para el token: el claim de organizaciones de Walter está vacío', async () => {
        const adapter = new DirectoryTenantClaimsAdapter();
        const tenants = await asSystem((tx) =>
          adapter.listActiveTenantIds(tx, WALTER),
        );
        expect(tenants).toEqual([]);
        // Y tampoco para la de Vera: solo Y; Z está pendiente de que la organización la apruebe.
        expect(
          await asSystem((tx) => adapter.listActiveTenantIds(tx, VERA)),
        ).toEqual([Y]);
      });

      it('Walter ve su invitación pendiente (con RLS, sin abrir el contexto para todos) y solo la suya', async () => {
        const mine = await memberships.listMyInvitations({
          id: WALTER,
          roles: [],
        } as any);
        expect(mine.items).toEqual([
          expect.objectContaining({
            id: pendingId,
            tenantId: X,
            role: 'STAFF',
          }),
        ]);
        // Vera no tiene invitaciones por aceptar: la de Z espera a la organización.
        const veras = await memberships.listMyInvitations({
          id: VERA,
          roles: [],
        } as any);
        expect(veras.items).toEqual([]);
      });

      it('404 uniforme: otra persona no acepta la invitación de Walter, ni Vera la que espera a la organización', async () => {
        await expect(
          memberships.acceptMine({ id: VERA, roles: [] } as any, pendingId),
        ).rejects.toMatchObject({ status: 404 });
        await expect(
          memberships.acceptMine(
            { id: VERA, roles: [] } as any,
            awaitingOrgApproval,
          ),
        ).rejects.toMatchObject({ status: 404 });
        await expect(
          memberships.declineMine({ id: VERA, roles: [] } as any, pendingId),
        ).rejects.toMatchObject({ status: 404 });
        // Nada cambió.
        const row = await admin.query(
          'select status_concept_id from directory.tenant_memberships where id = any($1)',
          [[pendingId, awaitingOrgApproval]],
        );
        expect(row.rows.map((r) => r.status_concept_id).sort()).toEqual(
          [DIR.MEMBERSHIP_PENDING_ACCEPTANCE, DIR.MEMBERSHIP_INVITED].sort(),
        );
      });

      it('Walter la acepta: con RLS el UPDATE entra en el contexto de X y la membresía pasa a ACTIVA', async () => {
        const res = await memberships.acceptMine(
          { id: WALTER, roles: [] } as any,
          pendingId,
        );
        expect(res).toEqual({ id: pendingId, tenantId: X, status: 'ACTIVE' });
        const row = await admin.query(
          'select status_concept_id, start_date, updated_by_user_id from directory.tenant_memberships where id = $1',
          [pendingId],
        );
        expect(row.rows[0].status_concept_id).toBe(DIR.MEMBERSHIP_ACTIVE);
        expect(row.rows[0].updated_by_user_id).toBe(WALTER);
        expect(new Date(row.rows[0].start_date).getTime()).toBeGreaterThan(
          NOW.getTime() - 60_000,
        );
        // Ahora sí cuenta para el token.
        const adapter = new DirectoryTenantClaimsAdapter();
        expect(
          await asSystem((tx) => adapter.listActiveTenantIds(tx, WALTER)),
        ).toEqual([X]);
        // Ya decidida: 404.
        await expect(
          memberships.acceptMine({ id: WALTER, roles: [] } as any, pendingId),
        ).rejects.toMatchObject({ status: 404 });
      });

      it('rechazar una invitación la termina y nunca contó', async () => {
        // Se retira la activa y se invita otra vez.
        await admin.query(
          'update directory.tenant_memberships set status_concept_id = $2 where id = $1',
          [pendingId, DIR.MEMBERSHIP_ENDED],
        );
        const again = await inRequest(X, () =>
          memberships.invite(
            X,
            { userId: WALTER } as any,
            {
              id: ADMIN,
              roles: [],
            } as any,
          ),
        );
        const res = await memberships.declineMine(
          { id: WALTER, roles: [] } as any,
          again.id,
        );
        expect(res.status).toBe('DECLINED');
        const row = await admin.query(
          'select status_concept_id, end_date from directory.tenant_memberships where id = $1',
          [again.id],
        );
        expect(row.rows[0].status_concept_id).toBe(DIR.MEMBERSHIP_ENDED);
        expect(row.rows[0].end_date).not.toBeNull();
        const adapter = new DirectoryTenantClaimsAdapter();
        expect(
          await asSystem((tx) => adapter.listActiveTenantIds(tx, WALTER)),
        ).toEqual([]);
      });
    });

    describe('N6: TOTP de un solo uso y contador propio, con SQL real', () => {
      const FACTOR = id();
      const secret = generateSecret();

      beforeAll(async () => {
        await insert('iam.mfa_factors', {
          id: FACTOR,
          user_id: VERA,
          factor_type_concept_id: CONCEPTS.MFA_TOTP,
          secret_encrypted: encryptSecret(secret),
          state_concept_id: CONCEPTS.STATE_VERIFIED,
          verified_at: NOW,
          ...stamps,
        });
      });

      it('un código vale una vez: el segundo intento con el MISMO código dentro de su ventana se rechaza', async () => {
        const totp = new IamTotpService(orm.em as any, events);
        const factor = await orm.em.fork().findOneOrFail(MfaFactors, FACTOR);
        const code = await generate({ secret });
        await expect(totp.consume(VERA, [factor], code)).resolves.toEqual({
          valid: true,
          factorId: FACTOR,
        });
        await expect(totp.consume(VERA, [factor], code)).resolves.toEqual({
          valid: false,
        });
        const used = await admin.query(
          `select detail_json from iam.security_events
          where user_id = $1 and detail_json ->> 'action' = 'code-used'`,
          [VERA],
        );
        expect(used.rows).toHaveLength(1);
        expect(used.rows[0].detail_json).toMatchObject({ factorId: FACTOR });
        expect(JSON.stringify(used.rows[0].detail_json)).not.toContain(code);
        // La consulta del último paso devuelve ese paso.
        const last = await events.lastMfaTimeStep(
          orm.em.fork() as any,
          VERA,
          FACTOR,
        );
        expect(last).toBe(used.rows[0].detail_json.timeStep);
      });

      it('dos peticiones simultáneas con el mismo código: solo una pasa (cerrojo por persona)', async () => {
        const other = id();
        const otherSecret = generateSecret();
        await insert('iam.users', {
          id: other,
          status_concept_id: CONCEPTS.STATE_ACTIVE,
          display_name: 'Otra',
          ...stamps,
        });
        const otherFactor = id();
        await insert('iam.mfa_factors', {
          id: otherFactor,
          user_id: other,
          factor_type_concept_id: CONCEPTS.MFA_TOTP,
          secret_encrypted: encryptSecret(otherSecret),
          state_concept_id: CONCEPTS.STATE_VERIFIED,
          verified_at: NOW,
          ...stamps,
        });
        const factor = await orm.em
          .fork()
          .findOneOrFail(MfaFactors, otherFactor);
        const code = await generate({ secret: otherSecret });
        const totp = new IamTotpService(orm.em as any, events);
        const results = await Promise.all(
          Array.from({ length: 4 }, () => totp.consume(other, [factor], code)),
        );
        expect(results.filter((r) => r.valid)).toHaveLength(1);
      });

      it('countFailedMfaSince cuenta SOLO los fallos de código (reason bad-mfa) desde el último login', async () => {
        const long = new Date(NOW.getTime() - 3_600_000);
        const row = (reason: string, at: Date) =>
          insert('iam.security_events', {
            id: id(),
            user_id: WALTER,
            event_type_concept_id: CONCEPTS.SEC_LOGIN_FAILED,
            outcome_concept_id: CONCEPTS.OUTCOME_FAILURE,
            detail_json: JSON.stringify({ reason }),
            recorded_at: at,
          });
        await row('bad-mfa', long);
        await row('bad-mfa', NOW);
        await row('bad-mfa', NOW);
        await row('bad-password', NOW);
        const since = new Date(NOW.getTime() - 60_000);
        expect(
          await events.countFailedMfaSince(orm.em.fork() as any, WALTER, since),
        ).toBe(2);
        expect(
          await events.countFailedMfaSince(orm.em.fork() as any, WALTER),
        ).toBe(3);
      });
    });

    describe('N7: código de «Fui yo» y correo verificado, con SQL real', () => {
      it('deviceCodeUsed encuentra la huella de un código ya usado y no otra', async () => {
        await insert('iam.security_events', {
          id: id(),
          user_id: VERA,
          event_type_concept_id: CONCEPTS.SEC_DEVICE_TRUST,
          outcome_concept_id: CONCEPTS.OUTCOME_SUCCESS,
          detail_json: JSON.stringify({ flow: 'x', codeDigest: 'abc123' }),
          recorded_at: new Date(),
        });
        const em = orm.em.fork() as any;
        expect(await events.deviceCodeUsed(em, VERA, 'abc123')).toBe(true);
        expect(await events.deviceCodeUsed(em, VERA, 'otra')).toBe(false);
        // Otra persona no hereda el uso.
        expect(await events.deviceCodeUsed(em, WALTER, 'abc123')).toBe(false);
      });

      it('findLatestVerifiedByUser devuelve solo una dirección cuyo enlace se consumió', async () => {
        const row = (
          email: string,
          state: string,
          consumed: Date | null,
          created: Date,
        ) =>
          insert('iam.email_verifications', {
            id: id(),
            user_id: VERA,
            email,
            token_hash: id(),
            state_concept_id: state,
            expires_at: new Date(NOW.getTime() + 86_400_000),
            consumed_at: consumed,
            created_at: created,
            updated_at: created,
          });
        await row(
          'verificada@clinica.bo',
          CONCEPTS.STATE_VERIFIED,
          new Date(NOW.getTime() - 86_400_000),
          new Date(NOW.getTime() - 2 * 86_400_000),
        );
        // La más reciente se escribió y nunca se verificó: no es destino de avisos.
        await row('sin-verificar@x.io', CONCEPTS.STATE_ACTIVE, null, NOW);
        const repo = new EmailVerificationsRepository();
        const found = await repo.findLatestVerifiedByUser(
          orm.em.fork() as any,
          VERA,
        );
        expect(found?.email).toBe('verificada@clinica.bo');
        expect(
          await repo.findLatestVerifiedByUser(orm.em.fork() as any, WALTER),
        ).toBeNull();
      });
    });
  },
);

/**
 * Login y renovación de sesión como `mantra_app` con `RLS_ENFORCE=true`.
 *
 * Quien se autentica todavía no tiene organización activa: sin contexto, las
 * membresías, las políticas de sesión, las reglas de red y las asignaciones de
 * rol (todas con `tenant_id`) no devuelven filas y el token saldría sin
 * organizaciones. El servicio abre el contexto de sistema SOLO durante esas
 * lecturas (`withSystemRead`), todas filtradas por la persona o por sus
 * organizaciones activas. Este bloque lo prueba con el servicio real y sus
 * repositorios, sembrando con superusuario y leyendo como `mantra_app`.
 */
describeRls('Login y renovación con RLS, como mantra_app', () => {
  const LA = id();
  const LB = id();
  const LC = id();
  const ELENA = id();
  const MARCO = id();
  const LUCIA = id();
  const NORA = id();
  const OLGA = id();
  const PASSWORD = 'Clave-RLS-123!';
  const ELENA_MAIL = `elena-${ELENA.slice(0, 8)}@rls.test`;
  const MARCO_MAIL = `marco-${MARCO.slice(0, 8)}@rls.test`;
  const LUCIA_MAIL = `lucia-${LUCIA.slice(0, 8)}@rls.test`;
  const NORA_MAIL = `nora-${NORA.slice(0, 8)}@rls.test`;
  const OLGA_MAIL = `olga-${OLGA.slice(0, 8)}@rls.test`;
  const OUTSIDE_IP = '198.51.100.7';
  const INSIDE_IP = '192.0.2.10';

  let admin: pg.Client;
  let orm: MikroORM;
  let auth: IamAuthService;
  const jwt = new JwtService();
  const before = process.env.RLS_ENFORCE;

  async function insert(
    table: string,
    row: Record<string, unknown>,
  ): Promise<void> {
    const columns = Object.keys(row);
    await admin.query(
      `insert into ${table} (${columns.join(', ')}) values (${columns
        .map((_, i) => `$${i + 1}`)
        .join(', ')})`,
      Object.values(row),
    );
  }

  const claims = (token: string): Record<string, any> =>
    jwt.decode(token) as Record<string, any>;

  /** Franja de un minuto que no es «ahora» (La Paz, el huso por defecto). */
  const hhmm = (offsetMin: number): string =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/La_Paz',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(Date.now() + offsetMin * 60_000));

  beforeAll(async () => {
    admin = new pg.Client({
      host: HOST,
      port: PORT,
      user: ADMIN_USER,
      database: DB,
    });
    await admin.connect();
    await admin.query("set session_replication_role = 'replica'");

    for (const [tenant, type] of [
      [LA, TENANT_TYPE_CONCEPT_BY_CODE.CLINIC],
      [LB, TENANT_TYPE_CONCEPT_BY_CODE.CLINIC],
      [LC, TENANT_TYPE_CONCEPT_BY_CODE.CLINIC],
    ] as const) {
      await insert('directory.tenants', {
        id: tenant,
        code: `L-${tenant.slice(0, 6)}`,
        tenant_type_concept_id: type,
        legal_name: `Clínica ${tenant.slice(0, 4)}`,
        trade_name: `Clínica ${tenant.slice(0, 4)}`,
        legal_entity_type_concept_id: id(),
        status_concept_id: id(),
        verification_status_concept_id: id(),
        ...stamps,
      });
    }
    const passwordHash = await argon2.hash(PASSWORD);
    for (const [user, name, mail] of [
      [ELENA, 'Elena', ELENA_MAIL],
      [MARCO, 'Marco', MARCO_MAIL],
      [LUCIA, 'Lucía', LUCIA_MAIL],
      [NORA, 'Nora', NORA_MAIL],
      [OLGA, 'Olga', OLGA_MAIL],
    ] as const) {
      await insert('iam.users', {
        id: user,
        status_concept_id: CONCEPTS.USER_ACTIVE,
        display_name: name,
        ...stamps,
      });
      await insert('iam.authentication_credentials', {
        id: id(),
        user_id: user,
        method_concept_id: CONCEPTS.CRED_PASSWORD,
        external_subject: mail,
        secret_hash: passwordHash,
        state_concept_id: CONCEPTS.STATE_ACTIVE,
        ...stamps,
      });
    }
    const membership = (
      user: string,
      tenant: string,
      status: string,
    ): Promise<void> =>
      insert('directory.tenant_memberships', {
        id: id(),
        user_id: user,
        tenant_id: tenant,
        tenant_role_concept_id: DIR.ROLE_STAFF,
        status_concept_id: status,
        access_scope_concept_id: DIR.SCOPE_ALL_TENANT,
        start_date: new Date(NOW.getTime() - 30 * 86_400_000),
        ...stamps,
      });
    // Elena trabaja en A y en B; en C solo hay una membresía que espera a la
    // organización (no cuenta). Marco es de C. Lucía no tiene organización.
    await membership(ELENA, LA, DIR.MEMBERSHIP_ACTIVE);
    await membership(ELENA, LB, DIR.MEMBERSHIP_ACTIVE);
    await membership(ELENA, LC, DIR.MEMBERSHIP_INVITED);
    await membership(MARCO, LC, DIR.MEMBERSHIP_ACTIVE);

    const policy = (
      tenant: string,
      row: Record<string, unknown>,
    ): Promise<void> =>
      insert('iam.session_policies', {
        id: id(),
        tenant_id: tenant,
        scope_concept_id: IAMC.SESSION_POLICY_SCOPE_ALL_ACCOUNTS,
        idle_timeout_minutes: 30,
        new_device_alert: false,
        enforce_ip_rules: false,
        require_mfa: false,
        status_concept_id: CONCEPTS.STATE_ACTIVE,
        ...stamps,
        ...row,
      });
    // A: inactividad de 30 minutos. B: solo se entra desde 192.0.2.0/24.
    await policy(LA, {});
    await policy(LB, { enforce_ip_rules: true });
    await insert('authz.ip_access_rules', {
      id: id(),
      tenant_id: LB,
      scope_concept_id: AUTHZ.SCOPE_TENANT,
      rule_type_concept_id: AUTHZ.IP_RULE_ALLOW,
      cidr: '192.0.2.0/24',
      priority: 1,
      status_concept_id: CONCEPTS.STATE_ACTIVE,
      ...stamps,
    });
    // C (de Marco): una franja horaria que no es ahora, y reglas de red que
    // Elena nunca debe evaluar.
    await policy(LC, {
      enforce_ip_rules: true,
      allowed_hours_json: JSON.stringify({
        from: hhmm(120),
        to: hhmm(121),
        timeZone: 'America/La_Paz',
      }),
    });
    await insert('authz.ip_access_rules', {
      id: id(),
      tenant_id: LC,
      scope_concept_id: AUTHZ.SCOPE_TENANT,
      rule_type_concept_id: AUTHZ.IP_RULE_DENY,
      cidr: '0.0.0.0/0',
      priority: 1,
      status_concept_id: CONCEPTS.STATE_ACTIVE,
      ...stamps,
    });

    // Un rol de negocio global asignado a Elena en A (la asignación tiene RLS).
    const role = id();
    await insert('authz.roles', {
      id: role,
      code: 'CLINICIAN',
      name: 'Clínico',
      is_system: true,
      is_assignable: true,
      state_concept_id: CONCEPTS.STATE_ACTIVE,
      ...stamps,
    });
    await insert('authz.user_role_assignments', {
      id: id(),
      user_id: ELENA,
      role_id: role,
      tenant_id: LA,
      status_concept_id: CONCEPTS.STATE_ACTIVE,
      ...stamps,
    });

    // A es una cuenta de organización (el interruptor vive en su práctica, que
    // también tiene RLS).
    const practice = id();
    await insert('practice.practices', {
      id: practice,
      tenant_id: LA,
      code: `P-${LA.slice(0, 6)}`,
      name: 'Práctica A',
      type_concept_id: id(),
      admin_user_id: ELENA,
      status_concept_id: id(),
      row_version: 1,
      ...stamps,
    });
    await insert('practice.practice_settings', {
      id: id(),
      practice_id: practice,
      setting_key: 'org_account_mode',
      value_json: JSON.stringify('ORGANIZATION'),
      row_version: 1,
      ...stamps,
    });

    // Conceptos que la aplicación escribe (su FK corre bajo `mantra_app`).
    const codeSystem = id();
    for (const concept of [
      CONCEPTS.STATE_ACTIVE,
      CONCEPTS.STATE_ROTATED,
      CONCEPTS.USER_ACTIVE,
      CONCEPTS.SEC_LOGIN,
      CONCEPTS.SEC_TOKEN_REFRESH,
      CONCEPTS.SEC_LOGIN_FAILED,
      CONCEPTS.SEC_ACCOUNT_LOCK,
      CONCEPTS.USER_LOCKED,
      CONCEPTS.LOCKOUT_ACTIVE,
      CONCEPTS.LOCK_REASON_FAILED_ATTEMPTS,
      CONCEPTS.LOCK_REASON_MANUAL,
      CONCEPTS.OUTCOME_SUCCESS,
      CONCEPTS.OUTCOME_FAILURE,
    ]) {
      await admin.query(
        `insert into terminology.catalog_concepts
           (id, code_system_version_id, code, display, created_at, updated_at)
         values ($1, $2, $3, $3, now(), now()) on conflict (id) do nothing`,
        [concept, codeSystem, `IAM4-${concept}`],
      );
    }

    orm = await MikroORM.init({
      driver: PostgreSqlDriver,
      host: HOST,
      port: PORT,
      user: APP_USER,
      dbName: DB,
      entities: [
        ...Object.values(iamEntities),
        ...Object.values(directoryEntities),
        ...Object.values(authzEntities),
        ...Object.values(practiceEntities),
        ...Object.values(profilesEntities),
        ...Object.values(delegatedEntities),
      ].filter((e) => typeof e === 'function') as any[],
      metadataProvider: ReflectMetadataProvider,
      allowGlobalContext: true,
      discovery: { warnWhenNoEntities: false },
      forceUtcTimezone: true,
    });
    const em = orm.em as any;
    const span = {
      addEvent: () => undefined,
      setAttribute: () => undefined,
      setAttributes: () => undefined,
      recordException: () => undefined,
    };
    const tracing: any = {
      runInSpan: (_name: string, _attrs: unknown, work: any) => work(span),
    };
    const ipRules = new IpAccessRulesService(
      em,
      new AuthzIpAccessRulesAdapter(),
      logger,
    );
    auth = new IamAuthService(
      em,
      new TokenService(jwt),
      new UsersRepository(),
      new CredentialsRepository(),
      new SessionsRepository(),
      new RefreshTokensRepository(),
      new UserGlobalRolesRepository(),
      new AccountLockoutsRepository(),
      new SecurityEventsRepository(),
      new AuthzBusinessRolesAdapter(
        new AuthzEffectiveRolesService(new UserRoleAssignmentsRepository()),
      ),
      new ProfilesAccountProfileIdsAdapter(
        new PersonAccountLinksRepository(),
        new PatientProfilesRepository(),
        new HealthPractitionerProfilesRepository(),
      ),
      new DirectoryTenantClaimsAdapter(),
      logger,
      tracing,
      undefined,
      new SessionPoliciesService(
        em,
        new SessionPoliciesRepository(),
        logger,
        ipRules,
      ),
      new DelegatedAccessSupportClaimsAdapter(),
      ipRules,
    );
  });

  afterAll(async () => {
    if (before === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = before;
    await orm?.close(true);
    await admin?.end();
  });

  /** Con RLS ni el contexto de sistema ni el tenant quedan puestos tras la lectura. */
  async function contextAfterwards(): Promise<{
    system: string | null;
    tenant: string | null;
  }> {
    const res = await orm.em
      .fork()
      .execute(
        "select current_setting('app.system_context', true) as system, current_setting('app.current_tenant_id', true) as tenant",
      );
    return res[0] as any;
  }

  describe('con RLS_ENFORCE=true', () => {
    beforeAll(() => {
      process.env.RLS_ENFORCE = 'true';
    });

    it('sin el arreglo el rol de la aplicación no ve las membresías sin contexto (el control)', async () => {
      const rows = await orm.em.transactional(async (tx) =>
        tx.execute(
          'select count(*)::int as n from directory.tenant_memberships where user_id = ?',
          [ELENA],
        ),
      );
      expect((rows[0] as any).n).toBe(0);
    });

    it('el login de Elena devuelve SUS organizaciones activas y ninguna ajena', async () => {
      const res = await auth.login(
        { email: ELENA_MAIL, password: PASSWORD } as any,
        INSIDE_IP,
      );
      const payload = claims(res.accessToken);
      expect(payload.sub).toBe(ELENA);
      expect(payload.tenants.sort()).toEqual([LA, LB].sort());
      // C: su membresía espera a la organización, no cuenta.
      expect(payload.tenants).not.toContain(LC);
      expect(Object.keys(payload.tenantNames).sort()).toEqual([LA, LB].sort());
      expect(payload.scopedRoles).toEqual({ [LA]: ['CLINICIAN'] });
      // Las políticas de A llegan: inactividad de 30 minutos.
      expect(payload.idleTimeoutMinutes).toBe(30);
      // La práctica de A (con RLS) dice que es una cuenta de organización.
      expect(payload.tenantAccountKinds[LA]).toBe('ORGANIZATION');
      expect(res.deniedTenants).toBeUndefined();
      expect(await contextAfterwards()).toEqual({
        system: expect.not.stringMatching(/^true$/),
        tenant: expect.anything(),
      });
    });

    it('las reglas de red de B se leen: desde otra red B sale del token y A queda', async () => {
      const res = await auth.login(
        { email: ELENA_MAIL, password: PASSWORD } as any,
        OUTSIDE_IP,
      );
      const payload = claims(res.accessToken);
      expect(payload.tenants).toEqual([LA]);
      expect(res.deniedTenants).toEqual([
        { tenantId: LB, reason: 'OUTSIDE_ALLOWED_NETWORK' },
      ]);
      // Ni el nombre ni nada de las reglas de C (ajena) aparece.
      expect(JSON.stringify(payload)).not.toContain(LC);
      expect(JSON.stringify(res)).not.toContain(LC);
    });

    it('la política de C (franja horaria) rige para Marco, su única organización: 401 con el motivo', async () => {
      await expect(
        auth.login({ email: MARCO_MAIL, password: PASSWORD } as any, INSIDE_IP),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          details: { reason: 'OUTSIDE_ALLOWED_HOURS' },
        }),
      });
    });

    it('quien no tiene organización entra con el token sin organizaciones, sin error', async () => {
      const res = await auth.login(
        { email: LUCIA_MAIL, password: PASSWORD } as any,
        INSIDE_IP,
      );
      expect(claims(res.accessToken).tenants ?? []).toEqual([]);
    });

    it('la renovación repite lo mismo con RLS: sus organizaciones, su red, su rol y nada ajeno', async () => {
      const login = await auth.login(
        { email: ELENA_MAIL, password: PASSWORD } as any,
        INSIDE_IP,
      );
      const inside = await auth.refresh(login.refreshToken, INSIDE_IP);
      const payload = claims(inside.accessToken);
      expect(payload.tenants.sort()).toEqual([LA, LB].sort());
      expect(payload.scopedRoles).toEqual({ [LA]: ['CLINICIAN'] });
      expect(payload.tenantAccountKinds[LA]).toBe('ORGANIZATION');
      expect(payload.idleTimeoutMinutes).toBe(30);

      const outside = await auth.refresh(inside.refreshToken, OUTSIDE_IP);
      expect(claims(outside.accessToken).tenants).toEqual([LA]);
      expect(outside.deniedTenants).toEqual([
        { tenantId: LB, reason: 'OUTSIDE_ALLOWED_NETWORK' },
      ]);
      expect(JSON.stringify(claims(outside.accessToken))).not.toContain(LC);
    });

    describe('bloqueo de cuenta tras el 5º fallo (iam.account_lockouts, tenant_id NULL)', () => {
      const lockouts = new AccountLockoutsRepository();
      const wrong = (email: string) =>
        auth.login(
          { email, password: 'Clave-equivocada-1!' } as any,
          INSIDE_IP,
        );

      it('el control: con RLS, mantra_app NO puede insertar un bloqueo sin tenant ni contexto de sistema', async () => {
        await expect(
          orm.em.transactional(async (tx) => {
            lockouts.create(tx, {
              userId: NORA,
              reasonConceptId: CONCEPTS.LOCK_REASON_FAILED_ATTEMPTS,
              failedAttempts: 5,
            });
            await tx.flush();
          }),
        ).rejects.toThrow(/row-level security/i);
        const rows = await admin.query(
          'select count(*)::int as n from iam.account_lockouts where user_id = $1',
          [NORA],
        );
        expect(rows.rows[0].n).toBe(0);
      });

      it('cinco contraseñas erróneas: los cinco fallos quedan registrados, la cuenta se bloquea y el bloqueo se escribe (sin 500)', async () => {
        for (let attempt = 1; attempt <= 5; attempt += 1) {
          // Cada fallo es un 401 limpio: ni siquiera el 5º, el que bloquea, es un 500.
          await expect(wrong(NORA_MAIL)).rejects.toMatchObject({
            status: 401,
          });
        }
        const events = await admin.query(
          `select count(*)::int as n from iam.security_events
            where user_id = $1 and event_type_concept_id = $2`,
          [NORA, CONCEPTS.SEC_LOGIN_FAILED],
        );
        // El evento del 5º fallo NO se revierte con el bloqueo.
        expect(events.rows[0].n).toBe(5);
        const user = await admin.query(
          'select status_concept_id from iam.users where id = $1',
          [NORA],
        );
        expect(user.rows[0].status_concept_id).toBe(CONCEPTS.USER_LOCKED);
        const lock = await admin.query(
          `select tenant_id, status_concept_id, reason_concept_id, failed_attempts
             from iam.account_lockouts where user_id = $1`,
          [NORA],
        );
        expect(lock.rows).toEqual([
          {
            tenant_id: null,
            status_concept_id: CONCEPTS.LOCKOUT_ACTIVE,
            reason_concept_id: CONCEPTS.LOCK_REASON_FAILED_ATTEMPTS,
            failed_attempts: 5,
          },
        ]);
        const trace = await admin.query(
          `select count(*)::int as n from iam.security_events
            where user_id = $1 and event_type_concept_id = $2`,
          [NORA, CONCEPTS.SEC_ACCOUNT_LOCK],
        );
        expect(trace.rows[0].n).toBe(1);
        // El contexto de sistema no quedó abierto para quien use la conexión después.
        expect((await contextAfterwards()).system).not.toBe('true');
      });

      it('el permiso es solo para esa fila: no se abre para otra cuenta ni para nada más', async () => {
        const rows = await orm.em.transactional(async (tx) =>
          tx.execute(
            'select count(*)::int as n from iam.account_lockouts where user_id = ?',
            [NORA],
          ),
        );
        // Sin contexto de sistema el rol de la aplicación sigue sin ver la fila
        // (política por tenant): el permiso no se filtró fuera de la escritura.
        expect((rows[0] as any).n).toBe(0);
        // Ninguna de las otras cuentas de esta corrida (la base puede traer
        // bloqueos de corridas anteriores) quedó bloqueada.
        const others = await admin.query(
          'select count(*)::int as n from iam.account_lockouts where user_id = any($1)',
          [[ELENA, MARCO, LUCIA]],
        );
        expect(others.rows[0].n).toBe(0);
      });

      it('un fallo más de la misma cuenta ya bloqueada no abre otro bloqueo: actualiza el conteo (con RLS la búsqueda corre con el contexto acotado)', async () => {
        await orm.em.transactional(async (tx) => {
          await lockouts.lockForFailedAttempts(tx, {
            userId: NORA,
            reasonConceptId: CONCEPTS.LOCK_REASON_FAILED_ATTEMPTS,
            failedAttempts: 6,
            sourceIp: INSIDE_IP,
          });
        });
        const lock = await admin.query(
          'select failed_attempts from iam.account_lockouts where user_id = $1',
          [NORA],
        );
        expect(lock.rows).toEqual([{ failed_attempts: 6 }]);
      });

      it('el bloqueo manual de un administrador también se escribe (mismo permiso acotado)', async () => {
        await orm.em.transactional(async (tx) => {
          await lockouts.lockManually(tx, {
            userId: OLGA,
            reasonConceptId: CONCEPTS.LOCK_REASON_MANUAL,
            actorUserId: ELENA,
          });
        });
        const lock = await admin.query(
          `select tenant_id, reason_concept_id, created_by_user_id
             from iam.account_lockouts where user_id = $1`,
          [OLGA],
        );
        expect(lock.rows).toEqual([
          {
            tenant_id: null,
            reason_concept_id: CONCEPTS.LOCK_REASON_MANUAL,
            created_by_user_id: ELENA,
          },
        ]);
        expect((await contextAfterwards()).system).not.toBe('true');
      });

      it('si algo posterior del mismo login lanza, el bloqueo se revierte con todo (misma transacción, no una aparte)', async () => {
        const other = id();
        await insert('iam.users', {
          id: other,
          status_concept_id: CONCEPTS.USER_ACTIVE,
          display_name: 'Otra',
          ...stamps,
        });
        await expect(
          orm.em.transactional(async (tx) => {
            await lockouts.lockManually(tx, {
              userId: other,
              reasonConceptId: CONCEPTS.LOCK_REASON_MANUAL,
            });
            throw new Error('falla posterior');
          }),
        ).rejects.toThrow('falla posterior');
        const lock = await admin.query(
          'select count(*)::int as n from iam.account_lockouts where user_id = $1',
          [other],
        );
        expect(lock.rows[0].n).toBe(0);
      });
    });

    it('el contexto de sistema se cierra aunque la lectura falle (finally)', async () => {
      let seenInside: string | null = null;
      await orm.em.transactional(async (tx) => {
        await expect(
          withSystemRead(tx as any, async (db: any) => {
            const r = await db.execute(
              "select current_setting('app.system_context', true) as sc",
            );
            seenInside = (r[0] as any).sc;
            throw new Error('lectura fallida');
          }),
        ).rejects.toThrow('lectura fallida');
        // La transacción sigue sana (el error no vino de SQL): el contexto vuelve a cerrado.
        const after = await tx.execute(
          "select current_setting('app.system_context', true) as sc",
        );
        expect((after[0] as any).sc).not.toBe('true');
      });
      expect(seenInside).toBe('true');
    });
  });

  describe('sin RLS_ENFORCE nada cambia', () => {
    beforeAll(() => {
      delete process.env.RLS_ENFORCE;
    });
    afterAll(() => {
      process.env.RLS_ENFORCE = 'true';
    });

    it('con el rol de la aplicación y sin la bandera el servicio no abre contexto alguno (las filas siguen ocultas, como antes)', async () => {
      // La bandera apagada es para bases sin RLS: aquí la base SÍ la tiene, y
      // sin contexto las membresías no se ven. Lo que se comprueba es que el
      // servicio no abrió el contexto de sistema por su cuenta.
      const res = await auth.login(
        { email: ELENA_MAIL, password: PASSWORD } as any,
        INSIDE_IP,
      );
      expect(claims(res.accessToken).tenants ?? []).toEqual([]);
    });
  });
});
