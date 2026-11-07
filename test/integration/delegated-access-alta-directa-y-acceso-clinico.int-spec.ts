import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import pg from 'pg';
import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import * as clinicalEntities from '../../src/modules/clinical/entities';
import * as delegatedEntities from '../../src/modules/delegated_access/entities';
import * as directoryEntities from '../../src/modules/directory/entities';
import * as practiceEntities from '../../src/modules/practice/entities';
import * as profilesEntities from '../../src/modules/profiles/entities';
import {
  CONCEPTS,
  ConflictException,
  DomainException,
  ResourceNotFoundException,
  runWithTenant,
  type AuthenticatedUser,
} from '../../src/common';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { IamErrorReason } from '../../src/modules/iam/iam.error-reasons';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../../src/modules/delegated_access/delegated_access.error-reasons';
import {
  DelegatedAccessApprovalRequestsRepository,
  DelegatedAccessGrantsRepository,
  DelegatedPermissionSetsRepository,
  DelegationEventsRepository,
  DelegationScopeRepository,
  OrganizationUserAssignmentsRepository,
  PractitionerDelegateAssignmentsRepository,
  SupportLinksRepository,
  SupportStaffProvisioningRepository,
} from '../../src/modules/delegated_access/repositories';
import { AccessRequestsService } from '../../src/modules/delegated_access/services/access-requests.service';
import { DelegationScopeService } from '../../src/modules/delegated_access/services/delegation-scope.service';
import { STATUS } from '../../src/modules/delegated_access/services/concept-maps';
import { SupportStaffProvisioningService } from '../../src/modules/delegated_access/services/support-staff-provisioning.service';

/**
 * Alta directa de secretarias y acceso clínico temporal, contra PostgreSQL real
 * con el DDL canónico (`iam`, `directory`, `profiles`, `clinical`, `practice` y
 * `delegated_access`, sin las FK entre esquemas).
 *
 * Arma los servicios reales (`AccessRequestsService`, `DelegationScopeService`,
 * `SupportStaffProvisioningService`) con los **repositorios reales** sobre un
 * `EntityManager` de MikroORM. Sólo el alta de la cuenta (`iam`) es un doble que
 * escribe en las tablas reales de `iam` y falla igual que el servicio de IAM
 * cuando el documento ya tiene credencial. Lo que prueba y un mock no puede:
 *   - A6: un grant clínico temporal no se emite (ni la solicitud se abre) sobre
 *     una delegación, un paciente o un encuentro de otra organización; y la
 *     solicitud ajena responde el mismo 404 que una inexistente;
 *   - D-1: un administrador acotado a la organización A no da de alta personal
 *     de apoyo en B: no queda cuenta, membresía ni vínculo;
 *   - D-2: una cuenta existente no se vincula, no se reactivan membresías
 *     ENDED/SUSPENDED/INVITED, un doctor no abre la membresía del hospital y
 *     un documento de secretaria responde igual que el de otra persona.
 *
 * No toca la base configurada: con la conexión del arnés (`DB_HOST`, `DB_PORT`,
 * `DB_USER`, `DB_PASSWORD`) crea una base NUEVA de nombre aleatorio y la borra
 * al terminar. Si el servidor no responde, la prueba falla: no se omite.
 */
const root = process.cwd();
const PG = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
};
const DB_NAME = `mantra_it_alta_${randomBytes(5).toString('hex')}`;

const TENANT_A = randomUUID();
const TENANT_B = randomUUID();
const ANY = randomUUID();
const PATIENT = randomUUID();
const PERM = randomUUID();
const PRACTITIONER = randomUUID();

const silent = {
  setContext() {},
  info() {},
  warn() {},
  error() {},
  debug() {},
} as never;

const adminOf = (
  tenantId: string,
  over: Partial<AuthenticatedUser> = {},
): AuthenticatedUser =>
  ({
    id: randomUUID(),
    roles: ['SECURITY_ADMIN'],
    scopedRoles: { [tenantId]: ['SECURITY_ADMIN'] },
    tenantIds: [tenantId],
    ...over,
  }) as never;

describe('Alta directa de secretarias y acceso clínico temporal (integración real)', () => {
  let admin: pg.Client;
  let client: pg.Client;
  let orm: MikroORM;

  const sql = (text: string, values: unknown[] = []) =>
    client.query(text, values);
  const rows = async (text: string, values: unknown[] = []) =>
    (await sql(text, values)).rows;
  const count = async (text: string, values: unknown[] = []) =>
    Number((await rows(text, values))[0].n);

  /** INSERT por nombre de columna; `ts` añade `created_at`/`updated_at`. */
  async function insert(
    table: string,
    values: Record<string, unknown>,
    ts: 'both' | 'created' = 'both',
  ): Promise<string> {
    const data: Record<string, unknown> = {
      ...values,
      created_at: new Date(),
      ...(ts === 'both' ? { updated_at: new Date() } : {}),
    };
    const cols = Object.keys(data);
    await sql(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})`,
      Object.values(data),
    );
    return String(data.id ?? data.profile_id);
  }

  const seedTenant = (id: string) =>
    insert('directory.tenants', {
      id,
      code: `T${id.slice(0, 8)}`,
      tenant_type_concept_id: ANY,
      legal_name: 'Hospital',
      legal_entity_type_concept_id: ANY,
      status_concept_id: ANY,
      verification_status_concept_id: ANY,
    });

  /** Vinculación activa del doctor con una práctica nueva del tenant. */
  async function seedRoleAssignment(tenantId: string) {
    const practice = await insert('practice.practices', {
      id: randomUUID(),
      tenant_id: tenantId,
      code: `P${randomBytes(4).toString('hex')}`,
      name: 'Consultorio',
      type_concept_id: ANY,
      admin_user_id: randomUUID(),
      status_concept_id: ANY,
    });
    return insert('practice.practitioner_role_assignments', {
      id: randomUUID(),
      practitioner_profile_id: PRACTITIONER,
      practice_id: practice,
      role_concept_id: ANY,
      status_concept_id: PRAC.ROLE_ASSIGNMENT_ACTIVE,
    });
  }

  /** Delegación activa del tenant: vinculación del doctor, set y delegación. */
  async function seedDelegation(tenantId: string) {
    const role = await seedRoleAssignment(tenantId);
    const set = await insert('delegated_access.delegated_permission_sets', {
      id: randomUUID(),
      tenant_id: tenantId,
      code: `S${randomBytes(4).toString('hex')}`,
      name: 'Set',
      delegate_type_concept_id: ANY,
      status_concept_id: STATUS.ACTIVE,
      version_number: 1,
    });
    return insert('delegated_access.practitioner_delegate_assignments', {
      id: randomUUID(),
      tenant_id: tenantId,
      practitioner_role_assignment_id: role,
      delegate_user_assignment_id: randomUUID(),
      delegated_permission_set_id: set,
      delegate_role_concept_id: ANY,
      status_concept_id: STATUS.ACTIVE,
    });
  }

  const seedEncounter = (tenantId: string, patient: string) =>
    insert('clinical.encounters', {
      id: randomUUID(),
      patient_profile_id: patient,
      tenant_id: tenantId,
      status_concept_id: ANY,
    });

  /** Solicitud abierta sobre una delegación. */
  const seedOpenRequest = (
    delegate: string,
    over: Record<string, unknown> = {},
  ) =>
    insert(
      'delegated_access.delegated_access_approval_requests',
      {
        id: randomUUID(),
        practitioner_delegate_assignment_id: delegate,
        requested_permission_id: PERM,
        decision_concept_id: STATUS.PENDING,
        status_concept_id: DELEG.REQUEST_OPEN,
        patient_profile_id: PATIENT,
        ...over,
      },
      'created',
    );

  function accessRequests() {
    const delegatesRepo = new PractitionerDelegateAssignmentsRepository();
    return new AccessRequestsService(
      orm.em as never,
      new DelegatedAccessApprovalRequestsRepository() as never,
      delegatesRepo as never,
      new DelegatedAccessGrantsRepository() as never,
      new DelegationEventsRepository() as never,
      silent,
      new DelegationScopeService(
        new DelegatedPermissionSetsRepository() as never,
        delegatesRepo as never,
        new OrganizationUserAssignmentsRepository() as never,
        new DelegationScopeRepository() as never,
      ),
    );
  }

  /**
   * Doble del alta de IAM: escribe en las tablas reales de `iam` y `profiles`, y
   * rechaza un documento con credencial viva con el mismo 409 que el servicio real.
   */
  const iamRegister = {
    async register(dto: { nationalId: string }) {
      const existing = await rows(
        `SELECT 1 FROM iam.authentication_credentials
          WHERE external_subject = $1 AND method_concept_id = $2 AND state_concept_id = $3`,
        [dto.nationalId, CONCEPTS.CRED_PASSWORD, CONCEPTS.STATE_ACTIVE],
      );
      if (existing.length > 0) {
        throw new ConflictException(
          'Ya existe una cuenta con ese documento de identidad',
          undefined,
          IamErrorReason.NATIONAL_ID_ALREADY_REGISTERED,
        );
      }
      const account = await seedAccount(dto.nationalId, true);
      return {
        userId: account.userId,
        personId: account.personId,
        supportProfileId: account.personId,
      };
    },
  };

  function provisioning() {
    return new SupportStaffProvisioningService(
      orm.em as never,
      iamRegister as never,
      new SupportStaffProvisioningRepository() as never,
      new SupportLinksRepository() as never,
      silent,
    );
  }

  /** Cuenta con credencial de contraseña vigente; con `secretary`, perfil de secretaria. */
  async function seedAccount(nationalId: string, secretary: boolean) {
    const userId = randomUUID();
    const personId = randomUUID();
    await insert('iam.users', {
      id: userId,
      status_concept_id: CONCEPTS.USER_ACTIVE,
      display_name: 'Cuenta',
    });
    await insert('iam.authentication_credentials', {
      id: randomUUID(),
      user_id: userId,
      method_concept_id: CONCEPTS.CRED_PASSWORD,
      state_concept_id: CONCEPTS.STATE_ACTIVE,
      external_subject: nationalId,
    });
    await insert('profiles.person_account_links', {
      id: randomUUID(),
      person_id: personId,
      user_id: userId,
      link_type_concept_id: ANY,
      verification_status_concept_id: ANY,
      valid_from: new Date(),
      status_concept_id: PROF.ACCOUNT_LINK_ACTIVE,
    });
    if (secretary) {
      await insert('profiles.secretary_profiles', { profile_id: personId });
    }
    return { userId, personId };
  }

  const seedMembership = (
    userId: string,
    tenantId: string,
    status: string,
    role: string = DIR.ROLE_SUPPORT,
  ) =>
    insert('directory.tenant_memberships', {
      id: randomUUID(),
      user_id: userId,
      tenant_id: tenantId,
      tenant_role_concept_id: role,
      status_concept_id: status,
      access_scope_concept_id: DIR.SCOPE_ALL_TENANT,
      start_date: new Date(),
    });

  const dto = (nationalId: string, extra: Record<string, unknown> = {}) =>
    ({ nationalId, password: 'Secreta-123!', ...extra }) as never;

  /** Lo que el alta deja en la base para un par usuario/organización. */
  const footprint = async (userId: string, tenantId: string) => ({
    memberships: await rows(
      `SELECT status_concept_id FROM directory.tenant_memberships
        WHERE user_id = $1 AND tenant_id = $2 ORDER BY created_at`,
      [userId, tenantId],
    ),
    locationLinks: await count(
      `SELECT count(*) AS n FROM delegated_access.organization_user_assignments a
         JOIN directory.tenant_memberships m ON m.id = a.tenant_membership_id
        WHERE m.user_id = $1 AND m.tenant_id = $2`,
      [userId, tenantId],
    ),
  });

  const thrownOf = async (
    promise: Promise<unknown>,
  ): Promise<DomainException> => {
    try {
      await promise;
    } catch (error) {
      return error as DomainException;
    }
    throw new Error('Se esperaba una excepción de dominio y no hubo error');
  };

  beforeAll(async () => {
    // Base nueva y descartable: se rechaza reutilizar una que ya exista.
    admin = new pg.Client({ ...PG, database: 'postgres' });
    await admin.connect();
    const exists = await admin.query(
      'select 1 from pg_database where datname = $1',
      [DB_NAME],
    );
    if (exists.rowCount) {
      throw new Error(`La base ${DB_NAME} ya existe: se rechaza reutilizarla`);
    }
    await admin.query(`CREATE DATABASE "${DB_NAME}"`);
    client = new pg.Client({ ...PG, database: DB_NAME });
    await client.connect();
    for (const file of [
      '00_shared/00_types.sql',
      '01_iam/01_schema.sql',
      '01_iam/02_tables.sql',
      '04_directory/01_schema.sql',
      '04_directory/02_tables.sql',
      '05_profiles/01_schema.sql',
      '05_profiles/02_tables.sql',
      '08_clinical/01_schema.sql',
      '08_clinical/02_tables.sql',
      '14_practice/01_schema.sql',
      '14_practice/02_tables.sql',
      '29_delegated_access/01_schema.sql',
      '29_delegated_access/02_tables.sql',
    ]) {
      await sql(readFileSync(join(root, 'database/SQL', file), 'utf8'));
    }
    await seedTenant(TENANT_A);
    await seedTenant(TENANT_B);
    await insert('profiles.patient_profiles', {
      profile_id: PATIENT,
      patient_code: `PAC${randomBytes(3).toString('hex')}`,
    });
    orm = await MikroORM.init({
      ...PG,
      dbName: DB_NAME,
      entities: [
        clinicalEntities,
        delegatedEntities,
        directoryEntities,
        practiceEntities,
        profilesEntities,
      ].flatMap((module) =>
        Object.values(module).filter((value) => typeof value === 'function'),
      ),
      metadataProvider: TsMorphMetadataProvider,
      metadataCache: { enabled: false },
      allowGlobalContext: true,
    });
  });

  afterAll(async () => {
    await orm?.close(true);
    await client?.end();
    if (admin) {
      // El pool cierra sus sockets de forma asíncrona: se espera por condición a
      // que no quede ninguna conexión de esta base antes de tirarla.
      for (let i = 0; i < 100; i += 1) {
        const open = await admin.query(
          'select count(*)::int as n from pg_stat_activity where datname = $1 and pid <> pg_backend_pid()',
          [DB_NAME],
        );
        if (open.rows[0].n === 0) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      await admin.query(`DROP DATABASE IF EXISTS "${DB_NAME}"`);
      await admin.end();
    }
  });

  describe('A6 · acceso clínico temporal acotado a la organización', () => {
    const inA = <T>(fn: () => Promise<T>) => runWithTenant(TENANT_A, fn);
    const actor = adminOf(TENANT_A);
    const requestsOf = (delegate: string) =>
      count(
        `SELECT count(*) AS n FROM delegated_access.delegated_access_approval_requests
          WHERE practitioner_delegate_assignment_id = $1`,
        [delegate],
      );
    const grantsOf = (delegate: string) =>
      count(
        `SELECT count(*) AS n FROM delegated_access.delegated_access_grants
          WHERE practitioner_delegate_assignment_id = $1`,
        [delegate],
      );
    const eventsOf = (delegate: string) =>
      count(
        `SELECT count(*) AS n FROM delegated_access.delegation_events
          WHERE practitioner_delegate_assignment_id = $1`,
        [delegate],
      );

    it('no abre una solicitud sobre la delegación de otra organización: 404 y sin rastro', async () => {
      const foreign = await seedDelegation(TENANT_B);

      const error = await thrownOf(
        inA(() =>
          accessRequests().requestAccess(
            foreign,
            { requestedPermissionId: PERM, patientProfileId: PATIENT },
            actor,
          ),
        ),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(Reason.DELEGATED_DELEGATION_NOT_FOUND);
      expect(await requestsOf(foreign)).toBe(0);
      expect(await eventsOf(foreign)).toBe(0);
    });

    it('no abre una solicitud con un encuentro de otra organización ni con un paciente inexistente', async () => {
      const own = await seedDelegation(TENANT_A);
      const foreignEncounter = await seedEncounter(TENANT_B, PATIENT);

      const withEncounter = await thrownOf(
        inA(() =>
          accessRequests().requestAccess(
            own,
            {
              requestedPermissionId: PERM,
              patientProfileId: PATIENT,
              encounterId: foreignEncounter,
            },
            actor,
          ),
        ),
      );
      const withPatient = await thrownOf(
        inA(() =>
          accessRequests().requestAccess(
            own,
            { requestedPermissionId: PERM, patientProfileId: randomUUID() },
            actor,
          ),
        ),
      );

      expect(withEncounter.reason).toBe(Reason.DELEGATED_ENCOUNTER_NOT_FOUND);
      expect(withPatient.reason).toBe(Reason.DELEGATED_PATIENT_NOT_FOUND);
      expect(await requestsOf(own)).toBe(0);
      expect(await eventsOf(own)).toBe(0);
    });

    it('abre la solicitud cuando delegación, paciente y encuentro son de la organización', async () => {
      const own = await seedDelegation(TENANT_A);
      const encounter = await seedEncounter(TENANT_A, PATIENT);

      const opened = await inA(() =>
        accessRequests().requestAccess(
          own,
          {
            requestedPermissionId: PERM,
            patientProfileId: PATIENT,
            encounterId: encounter,
          },
          actor,
        ),
      );

      expect(opened.status).toBe(DELEG.REQUEST_OPEN);
      expect(await requestsOf(own)).toBe(1);
      expect(await eventsOf(own)).toBe(1);
    });

    it('decide: la solicitud de otra organización responde igual que una inexistente y no emite grant', async () => {
      const foreign = await seedDelegation(TENANT_B);
      const request = await seedOpenRequest(foreign);

      const ajena = await thrownOf(
        inA(() =>
          accessRequests().decide(
            request,
            { decision: 'APPROVED' } as never,
            actor,
          ),
        ),
      );
      const inexistente = await thrownOf(
        inA(() =>
          accessRequests().decide(
            randomUUID(),
            { decision: 'APPROVED' } as never,
            actor,
          ),
        ),
      );

      expect(ajena.getStatus()).toBe(404);
      expect(ajena.getResponse()).toEqual(inexistente.getResponse());
      expect(await grantsOf(foreign)).toBe(0);
      expect(
        (
          await rows(
            `SELECT status_concept_id FROM delegated_access.delegated_access_approval_requests WHERE id = $1`,
            [request],
          )
        )[0].status_concept_id,
      ).toBe(DELEG.REQUEST_OPEN);
    });

    it('decide: la solicitud ajena ya cerrada tampoco se distingue de una inexistente', async () => {
      const foreign = await seedDelegation(TENANT_B);
      const request = await seedOpenRequest(foreign, {
        status_concept_id: DELEG.REQUEST_CLOSED,
      });

      const ajena = await thrownOf(
        inA(() =>
          accessRequests().decide(
            request,
            { decision: 'DENIED' } as never,
            actor,
          ),
        ),
      );
      const inexistente = await thrownOf(
        inA(() =>
          accessRequests().decide(
            randomUUID(),
            { decision: 'DENIED' } as never,
            actor,
          ),
        ),
      );

      expect(ajena.getResponse()).toEqual(inexistente.getResponse());
    });

    it('decide: no aprueba con un encuentro de otra organización: 404, sin grant y la solicitud sigue abierta', async () => {
      const own = await seedDelegation(TENANT_A);
      const foreignEncounter = await seedEncounter(TENANT_B, PATIENT);
      const request = await seedOpenRequest(own, {
        encounter_id: foreignEncounter,
      });

      const error = await thrownOf(
        inA(() =>
          accessRequests().decide(
            request,
            { decision: 'APPROVED' } as never,
            actor,
          ),
        ),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(Reason.DELEGATED_ENCOUNTER_NOT_FOUND);
      expect(await grantsOf(own)).toBe(0);
      expect(
        (
          await rows(
            `SELECT status_concept_id FROM delegated_access.delegated_access_approval_requests WHERE id = $1`,
            [request],
          )
        )[0].status_concept_id,
      ).toBe(DELEG.REQUEST_OPEN);
    });

    it('decide: no aprueba para un paciente inexistente', async () => {
      const own = await seedDelegation(TENANT_A);
      const request = await seedOpenRequest(own, {
        patient_profile_id: randomUUID(),
      });

      const error = await thrownOf(
        inA(() =>
          accessRequests().decide(
            request,
            { decision: 'APPROVED' } as never,
            actor,
          ),
        ),
      );

      expect(error.reason).toBe(Reason.DELEGATED_PATIENT_NOT_FOUND);
      expect(await grantsOf(own)).toBe(0);
    });

    it('decide: con toda la cadena en la organización emite el grant sobre ese paciente y encuentro', async () => {
      const own = await seedDelegation(TENANT_A);
      const encounter = await seedEncounter(TENANT_A, PATIENT);
      const request = await seedOpenRequest(own, { encounter_id: encounter });

      const result = await inA(() =>
        accessRequests().decide(
          request,
          { decision: 'APPROVED' } as never,
          actor,
        ),
      );

      expect(result.grantId).toBeDefined();
      const grant = (
        await rows(
          `SELECT patient_profile_id, encounter_id FROM delegated_access.delegated_access_grants WHERE id = $1`,
          [result.grantId],
        )
      )[0];
      expect(grant).toEqual({
        patient_profile_id: PATIENT,
        encounter_id: encounter,
      });
    });
  });

  describe('D-1 · el alta directa exige administrar la organización del contexto', () => {
    it('un SECURITY_ADMIN acotado a A no da de alta en B: sin cuenta, membresía ni vínculo', async () => {
      const nationalId = `D1-${randomBytes(4).toString('hex')}`;
      const actor = adminOf(TENANT_A, { tenantIds: [TENANT_A, TENANT_B] });

      const error = await thrownOf(
        provisioning().provisionForOrganization(
          TENANT_B,
          dto(nationalId),
          actor,
        ),
      );

      expect(error.getStatus()).toBe(403);
      expect(error.reason).toBe(Reason.SUPPORT_ORGANIZATION_ADMIN_REQUIRED);
      expect(
        await count(
          `SELECT count(*) AS n FROM iam.authentication_credentials WHERE external_subject = $1`,
          [nationalId],
        ),
      ).toBe(0);
    });

    it('un SECURITY_ADMIN acotado a B da de alta en B: cuenta, membresía activa y vínculo', async () => {
      const nationalId = `D1-${randomBytes(4).toString('hex')}`;

      const created = await provisioning().provisionForOrganization(
        TENANT_B,
        dto(nationalId),
        adminOf(TENANT_B),
      );

      expect(created.status).toBe('ACTIVE');
      const seen = await footprint(created.userId, TENANT_B);
      expect(seen.memberships).toEqual([
        { status_concept_id: DIR.MEMBERSHIP_ACTIVE },
      ]);
      expect(seen.locationLinks).toBe(1);
    });

    it('quien es OWNER activo de B por su membresía da de alta en B aunque su rol de plataforma sea de A', async () => {
      const nationalId = `D1-${randomBytes(4).toString('hex')}`;
      const actor = adminOf(TENANT_A, { tenantIds: [TENANT_A, TENANT_B] });
      await seedMembership(
        actor.id,
        TENANT_B,
        DIR.MEMBERSHIP_ACTIVE,
        DIR.ROLE_OWNER,
      );

      const created = await provisioning().provisionForOrganization(
        TENANT_B,
        dto(nationalId),
        actor,
      );

      expect((await footprint(created.userId, TENANT_B)).locationLinks).toBe(1);
    });
  });

  describe('D-2 · una cuenta existente no se vincula sin su consentimiento', () => {
    const ownerOfB = async () => {
      const actor = adminOf(TENANT_B, { roles: ['USER'], scopedRoles: {} });
      await seedMembership(
        actor.id,
        TENANT_B,
        DIR.MEMBERSHIP_ACTIVE,
        DIR.ROLE_OWNER,
      );
      return actor;
    };

    it.each([
      ['ENDED', DIR.MEMBERSHIP_ENDED],
      ['SUSPENDED', DIR.MEMBERSHIP_SUSPENDED],
      ['INVITED', DIR.MEMBERSHIP_INVITED],
    ])(
      'hospital: una secretaria existente con membresía %s no se vincula ni se reactiva',
      async (_label, status) => {
        const nationalId = `D2-${randomBytes(4).toString('hex')}`;
        const secretary = await seedAccount(nationalId, true);
        await seedMembership(secretary.userId, TENANT_B, status);
        const actor = await ownerOfB();

        const error = await thrownOf(
          provisioning().provisionForOrganization(
            TENANT_B,
            dto(nationalId),
            actor,
          ),
        );

        expect(error).toBeInstanceOf(ConflictException);
        expect(error.reason).toBe(
          IamErrorReason.NATIONAL_ID_ALREADY_REGISTERED,
        );
        expect(await footprint(secretary.userId, TENANT_B)).toEqual({
          memberships: [{ status_concept_id: status }],
          locationLinks: 0,
        });
      },
    );

    it('sin oráculo: el documento de una secretaria y el de otra persona responden exactamente igual', async () => {
      const secretaryDoc = `D2-${randomBytes(4).toString('hex')}`;
      const otherDoc = `D2-${randomBytes(4).toString('hex')}`;
      await seedAccount(secretaryDoc, true);
      await seedAccount(otherDoc, false);
      const actor = await ownerOfB();

      const secretary = await thrownOf(
        provisioning().provisionForOrganization(
          TENANT_B,
          dto(secretaryDoc),
          actor,
        ),
      );
      const other = await thrownOf(
        provisioning().provisionForOrganization(TENANT_B, dto(otherDoc), actor),
      );

      expect(secretary.getStatus()).toBe(409);
      expect(secretary.getStatus()).toBe(other.getStatus());
      expect(secretary.getResponse()).toEqual(other.getResponse());
    });

    it('doctor: una secretaria existente no se vincula ni se le abre la membresía', async () => {
      const nationalId = `D2-${randomBytes(4).toString('hex')}`;
      const secretary = await seedAccount(nationalId, true);
      const doctor = {
        id: randomUUID(),
        roles: ['PRACTITIONER'],
        practitionerProfileId: PRACTITIONER,
      } as never as AuthenticatedUser;
      const role = await seedRoleAssignment(TENANT_A);

      const error = await thrownOf(
        provisioning().provisionForPractitioner(
          dto(nationalId, { practitionerRoleAssignmentId: role }),
          doctor,
        ),
      );

      expect(error.reason).toBe(IamErrorReason.NATIONAL_ID_ALREADY_REGISTERED);
      expect((await footprint(secretary.userId, TENANT_A)).memberships).toEqual(
        [],
      );
      expect(
        await count(
          `SELECT count(*) AS n FROM practice.practitioner_support_assignments WHERE practitioner_role_assignment_id = $1`,
          [role],
        ),
      ).toBe(0);
    });

    it('doctor: la cuenta nueva queda vinculada al doctor pero la membresía del hospital queda INVITED', async () => {
      const nationalId = `D2-${randomBytes(4).toString('hex')}`;
      const doctor = {
        id: randomUUID(),
        roles: ['PRACTITIONER'],
        practitionerProfileId: PRACTITIONER,
      } as never as AuthenticatedUser;
      const role = await seedRoleAssignment(TENANT_A);

      const created = await provisioning().provisionForPractitioner(
        dto(nationalId, { practitionerRoleAssignmentId: role }),
        doctor,
      );

      expect(created.status).toBe('ACTIVE');
      expect((await footprint(created.userId, TENANT_A)).memberships).toEqual([
        { status_concept_id: DIR.MEMBERSHIP_INVITED },
      ]);
      expect(
        await count(
          `SELECT count(*) AS n FROM practice.practitioner_support_assignments WHERE id = $1 AND status_concept_id = $2`,
          [created.linkId, PRAC.SUPPORT_ACTIVE],
        ),
      ).toBe(1);
    });

    it('el repositorio no revive una membresía terminada, suspendida o invitada', async () => {
      const repo = new SupportStaffProvisioningRepository();
      for (const status of [
        DIR.MEMBERSHIP_ENDED,
        DIR.MEMBERSHIP_SUSPENDED,
        DIR.MEMBERSHIP_INVITED,
      ]) {
        const userId = randomUUID();
        await seedMembership(userId, TENANT_B, status);

        await expect(
          repo.ensureActiveTenantMembership(orm.em.fork() as never, {
            userId,
            tenantId: TENANT_B,
            actorUserId: randomUUID(),
          }),
        ).rejects.toBeInstanceOf(ConflictException);

        expect((await footprint(userId, TENANT_B)).memberships).toEqual([
          { status_concept_id: status },
        ]);
      }
    });
  });
});
