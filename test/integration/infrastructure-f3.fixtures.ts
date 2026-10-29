import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { CONCEPTS, SEED, deterministicId } from '../../src/common';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import {
  bearer,
  camposObligatoriosDePaciente,
  type TestContext,
} from './harness';

/** Claves de `practice` que F2 declara y que el ADT referencia (ver `adt-catalog.ts`). */
const F2_PRACTICE_KEYS = [
  'ISO_CONTACT',
  'ISO_DROPLET',
  'ISO_AIRBORNE',
  'ISO_PROTECTIVE',
] as const;

export const PASSWORD = 'S3cret-passw0rd';

/** Una organización de prueba: dueño, práctica y sede. */
export interface InfraOrg {
  letter: string;
  email: string;
  tenantId: string;
  token: string;
  practiceId: string;
  siteId: string;
}

/** Un usuario con un rol operativo delegado. */
export interface Staff {
  userId: string;
  membershipId: string;
  token: string;
}

/** Rol operativo y su concepto. */
export const ROLE = {
  NURSE: DELEG.ASSIGN_ROLE_NURSE,
  NURSE_SUPERVISOR: DELEG.ASSIGN_ROLE_NURSE_SUPERVISOR,
  ADMISSION: DELEG.ASSIGN_ROLE_ADMISSION,
  HOUSEKEEPING: DELEG.ASSIGN_ROLE_HOUSEKEEPING,
  HOUSEKEEPING_SUPERVISOR: DELEG.ASSIGN_ROLE_HOUSEKEEPING_SUPERVISOR,
  INFECTION_CONTROL: DELEG.ASSIGN_ROLE_INFECTION_CONTROL,
  BILLING: DELEG.ASSIGN_ROLE_BILLING,
} as const;

/** Alcance de una asignación delegada. */
export type StaffScope =
  | { kind: 'SITE'; siteId: string }
  | { kind: 'UNIT'; unitId: string }
  | { kind: 'SPACE'; careSpaceId: string }
  | { kind: 'TENANT' };

export const ifMatch = (rowVersion: number) => ({
  'If-Match': `"${rowVersion}"`,
});

/** Cabeceras de una petición como una organización o un usuario suyo. */
export const as = (token: string, tenantId: string) => ({
  ...bearer(token),
  'X-Tenant-Id': tenantId,
});

/** Atajos HTTP/SQL de un contexto de prueba. */
export function toolbox(ctx: TestContext) {
  return {
    http: () => request(ctx.app.getHttpServer()),
    sql: <T = any>(query: string, params: unknown[] = []): Promise<T[]> =>
      ctx.orm.em.fork().getConnection().execute<T[]>(query, params),
  };
}

/**
 * Inserta los conceptos de `practice` que F2 declara (`ISO_*`) y que esta rama no
 * trae. Idempotente: cuando F2 se fusione, sus filas ya existen y no se tocan.
 */
export async function ensureF2Concepts(ctx: TestContext): Promise<void> {
  const { sql } = toolbox(ctx);
  for (const key of F2_PRACTICE_KEYS) {
    await sql(
      `insert into terminology.catalog_concepts
         (id, code_system_version_id, code, display, abstract, selectable, created_at, updated_at)
       values (?, ?, ?, ?, false, true, now(), now())
       on conflict (id) do nothing`,
      [
        deterministicId(`practice:${key}`),
        SEED.codeSystemVersionId,
        `practice:${key}`,
        key,
      ],
    );
  }
}

/** Registra una organización con su dueño, su práctica y su sede (como en F1). */
export async function registerOrg(
  ctx: TestContext,
  letter: string,
  suffix: string,
): Promise<InfraOrg> {
  const { http } = toolbox(ctx);
  const org: InfraOrg = {
    letter,
    email: `f3-${letter.toLowerCase()}-${suffix}@example.test`,
    tenantId: '',
    token: '',
    practiceId: '',
    siteId: '',
  };
  const alta = await http()
    .post('/iam/auth/register-organization')
    .send({
      organization: {
        code: `F3_${letter}_${suffix.toUpperCase()}`,
        legalName: `Hospital F3 ${letter} ${suffix}`,
        tenantType: 'HOSPITAL',
        countryConceptId: CONCEPTS.COUNTRY_BO,
        jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
      },
      owner: {
        email: org.email,
        password: PASSWORD,
        name: 'Dueña',
        lastName: letter,
      },
    })
    .expect(201);
  org.tenantId = alta.body.tenantId;
  const login = await http()
    .post('/iam/auth/login')
    .send({ email: org.email, password: PASSWORD })
    .expect(200);
  org.token = login.body.accessToken;
  const practica = await http()
    .post('/practices')
    .set(bearer(ctx.adminToken))
    .send({
      tenantId: org.tenantId,
      code: `F3-PRACT-${letter}-${suffix}`,
      name: `Hospital F3 ${letter}`,
      timeZone: 'America/La_Paz',
    })
    .expect(201);
  org.practiceId = practica.body.id;
  const sede = await http()
    .post(`/practices/${org.practiceId}/sites`)
    .set(as(org.token, org.tenantId))
    .send({ code: `F3-SEDE-${letter}-${suffix}`, name: `Sede ${letter}` })
    .expect(201);
  org.siteId = sede.body.id;
  return org;
}

/** Crea una unidad clínica por la API. */
export async function createUnit(
  ctx: TestContext,
  org: InfraOrg,
  code: string,
  name: string,
): Promise<string> {
  const res = await toolbox(ctx)
    .http()
    .post(`/sites/${org.siteId}/clinical-units`)
    .set(as(org.token, org.tenantId))
    .send({ code, name })
    .expect(201);
  return res.body.id;
}

/** Crea un espacio por la API y devuelve su detalle. */
export async function createSpace(
  ctx: TestContext,
  org: InfraOrg,
  body: Record<string, unknown>,
): Promise<{ id: string; rowVersion: number; [key: string]: unknown }> {
  const res = await toolbox(ctx)
    .http()
    .post(`/sites/${org.siteId}/care-spaces`)
    .set(as(org.token, org.tenantId))
    .send({ activate: true, ...body })
    .expect(201);
  return res.body;
}

/** Una cuenta con membresía ordinaria en la organización, todavía sin rol delegado. */
export interface Member {
  userId: string;
  membershipId: string;
  nationalId: string;
}

/** Registra una cuenta y le da membresía ordinaria (STAFF) en el tenant de la organización. */
export async function createMember(
  ctx: TestContext,
  org: InfraOrg,
  label: string,
  suffix: string,
): Promise<Member> {
  const { http, sql } = toolbox(ctx);
  const campos = await camposObligatoriosDePaciente(ctx);
  const nationalId = `F3${label.toUpperCase()}${suffix}${randomUUID().slice(0, 4)}`;
  await http()
    .post('/iam/auth/register-patient')
    .send({
      ...campos,
      nationalId,
      password: PASSWORD,
      displayName: `Personal ${label}`,
      email: `f3-${label.toLowerCase()}-${suffix}-${randomUUID().slice(0, 4)}@example.test`,
    })
    .expect(201);
  const pre = await http()
    .post('/iam/auth/login')
    .send({ nationalId, password: PASSWORD })
    .expect(200);
  const claims = JSON.parse(
    Buffer.from(pre.body.accessToken.split('.')[1], 'base64url').toString(
      'utf8',
    ),
  );
  const userId = claims.sub as string;
  const [membership] = await sql<{ id: string }>(
    `insert into directory.tenant_memberships
       (id, user_id, tenant_id, tenant_role_concept_id, status_concept_id,
        access_scope_concept_id, start_date, created_at, updated_at)
     values (gen_random_uuid(), ?, ?, ?, ?, ?, now(), now(), now())
     returning id`,
    [
      userId,
      org.tenantId,
      DIR.ROLE_STAFF,
      DIR.MEMBERSHIP_ACTIVE,
      DIR.SCOPE_ALL_TENANT,
    ],
  );
  return { userId, membershipId: membership.id, nationalId };
}

/** Inicia sesión como un miembro y devuelve su token. */
export async function loginMember(
  ctx: TestContext,
  member: Member,
): Promise<string> {
  const login = await toolbox(ctx)
    .http()
    .post('/iam/auth/login')
    .send({ nationalId: member.nationalId, password: PASSWORD })
    .expect(200);
  return login.body.accessToken;
}

/**
 * Un usuario sin rol global con una asignación delegada vigente: registra una
 * cuenta, le da membresía ordinaria en el tenant y le asigna el rol con alcance.
 */
export async function createStaff(
  ctx: TestContext,
  org: InfraOrg,
  label: string,
  role: string,
  scope: StaffScope,
  suffix: string,
): Promise<Staff> {
  const member = await createMember(ctx, org, label, suffix);
  await assign(ctx, member.membershipId, role, scope);
  return {
    userId: member.userId,
    membershipId: member.membershipId,
    token: await loginMember(ctx, member),
  };
}

/** Asigna un rol delegado con alcance a una membresía. */
export async function assign(
  ctx: TestContext,
  membershipId: string,
  role: string,
  scope: StaffScope,
  validTo: Date | null = null,
): Promise<void> {
  const scopeConcept =
    scope.kind === 'SITE'
      ? DELEG.SCOPE_SITE
      : scope.kind === 'UNIT'
        ? DELEG.SCOPE_UNIT
        : scope.kind === 'SPACE'
          ? DELEG.SCOPE_SPACE
          : DELEG.SCOPE_TENANT;
  await toolbox(ctx).sql(
    `insert into delegated_access.organization_user_assignments
       (id, tenant_membership_id, practice_site_id, clinical_unit_id, care_space_id,
        assignment_role_concept_id, access_scope_concept_id, valid_from, valid_to,
        status_concept_id, created_at, updated_at)
     values (gen_random_uuid(), ?, ?, ?, ?, ?, ?, now() - interval '1 minute', ?, ?, now(), now())`,
    [
      membershipId,
      scope.kind === 'SITE' ? scope.siteId : null,
      scope.kind === 'UNIT' ? scope.unitId : null,
      scope.kind === 'SPACE' ? scope.careSpaceId : null,
      role,
      scopeConcept,
      validTo,
      CONCEPTS.STATE_ACTIVE,
    ],
  );
}

let patientSeq = 0;

/** Un paciente (persona + perfil) con sexo administrativo y fecha de nacimiento. */
export async function createPatient(
  ctx: TestContext,
  data: { name: string; gender: 'MALE' | 'FEMALE'; birthDate: string },
): Promise<string> {
  const { sql } = toolbox(ctx);
  const id = randomUUID();
  patientSeq += 1;
  await sql(
    `insert into profiles.persons
       (id, person_status_concept_id, display_name, birth_date, administrative_gender_concept_id,
        created_at, updated_at, row_version)
     values (?, ?, ?, ?, ?, now(), now(), 1)`,
    [
      id,
      CONCEPTS.STATE_ACTIVE,
      data.name,
      data.birthDate,
      data.gender === 'MALE' ? PROF.GENDER_MALE : PROF.GENDER_FEMALE,
    ],
  );
  await sql(
    `insert into profiles.patient_profiles (profile_id, patient_code, created_at, updated_at, row_version)
     values (?, ?, now(), now(), 1)`,
    [id, `F3-PAT-${Date.now()}-${patientSeq}-${id.slice(0, 4)}`],
  );
  return id;
}
