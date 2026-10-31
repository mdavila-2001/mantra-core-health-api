import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bearer, type TestContext } from './harness';
import { CONCEPTS } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';

/**
 * Armado compartido de los int-spec de F2–F5 (CONTRATO-F2-F5): organizaciones
 * con su OWNER, práctica y sede; personal con rol de §0.3 por
 * `organization_user_assignments`; estructura física (edificio > habitación >
 * camas). Todo por la API, salvo la membresía y la asignación del personal,
 * que se escriben en SQL porque el alta de asignaciones es F5g y su consumidor
 * es justamente lo que se prueba.
 */
export interface InfraOrg {
  email: string;
  tenantId: string;
  token: string;
  ownerUserId: string;
  practiceId: string;
  siteId: string;
}

/** Personal del tenant con su sesión. */
export interface InfraStaff {
  userId: string;
  token: string;
  tenantId: string;
}

export const PASSWORD = 'S3cret-passw0rd';

/** Cabeceras de un actor en su tenant. */
export function como(actor: {
  token: string;
  tenantId: string;
}): Record<string, string> {
  return { ...bearer(actor.token), 'X-Tenant-Id': actor.tenantId };
}

/** SQL directo para leer (y sembrar personal). */
export function sql(ctx: TestContext) {
  return <T = any>(text: string, params: unknown[] = []): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute(text, params) as Promise<T[]>;
}

/**
 * Organización con OWNER, práctica y sede.
 *
 * @param ctx - Contexto de la prueba.
 * @param tag - Prefijo único (`F2A-1234`).
 */
export async function registrarOrganizacion(
  ctx: TestContext,
  tag: string,
): Promise<InfraOrg> {
  const http = () => request(ctx.app.getHttpServer());
  const email = `${tag.toLowerCase()}@example.test`;
  const alta = await http()
    .post('/iam/auth/register-organization')
    .send({
      organization: {
        code: tag.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
        legalName: `Hospital ${tag}`,
        tenantType: 'HOSPITAL',
        countryConceptId: CONCEPTS.COUNTRY_BO,
        jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
      },
      owner: { email, password: PASSWORD, name: 'Dueña', lastName: tag },
    })
    .expect(201);
  const login = await http()
    .post('/iam/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  const org: InfraOrg = {
    email,
    tenantId: alta.body.tenantId,
    token: login.body.accessToken,
    ownerUserId: alta.body.ownerUserId,
    practiceId: '',
    siteId: '',
  };
  const practica = await http()
    .post('/practices')
    .set(bearer(ctx.adminToken))
    .send({
      tenantId: org.tenantId,
      code: `P-${tag}`,
      name: `Hospital ${tag}`,
      timeZone: 'America/La_Paz',
    })
    .expect(201);
  org.practiceId = practica.body.id;
  const sede = await http()
    .post(`/practices/${org.practiceId}/sites`)
    .set(como(org))
    .send({ code: `S-${tag}`, name: `Sede ${tag}` })
    .expect(201);
  org.siteId = sede.body.id;
  return org;
}

/** Alcance de una asignación de personal. */
export type StaffScope =
  { site: string } | { unit: string } | { space: string };

/**
 * Personal del tenant con un rol de §0.3: cuenta propia (se registra una
 * organización descartable para tener usuario y contraseña), membresía STAFF
 * activa en el tenant y una asignación vigente con el alcance pedido.
 *
 * @param ctx - Contexto.
 * @param org - Organización donde trabaja.
 * @param tag - Prefijo único.
 * @param roleConceptId - `DELEG.ASSIGN_ROLE_*`.
 * @param scope - Sede, unidad o espacio.
 */
export async function crearPersonal(
  ctx: TestContext,
  org: InfraOrg,
  tag: string,
  roleConceptId: string,
  scope: StaffScope,
): Promise<InfraStaff> {
  const http = () => request(ctx.app.getHttpServer());
  const email = `${tag.toLowerCase()}@example.test`;
  const alta = await http()
    .post('/iam/auth/register-organization')
    .send({
      organization: {
        code: `U_${tag.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}`,
        legalName: `Cuenta ${tag}`,
        tenantType: 'HOSPITAL',
        countryConceptId: CONCEPTS.COUNTRY_BO,
        jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
      },
      owner: { email, password: PASSWORD, name: 'Persona', lastName: tag },
    })
    .expect(201);
  const userId: string = alta.body.ownerUserId;
  const q = sql(ctx);
  const membershipId = randomUUID();
  await q(
    `insert into directory.tenant_memberships
       (id, user_id, tenant_id, tenant_role_concept_id, status_concept_id, access_scope_concept_id,
        start_date, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, current_date, now(), now())`,
    [
      membershipId,
      userId,
      org.tenantId,
      DIR.ROLE_STAFF,
      DIR.MEMBERSHIP_ACTIVE,
      DIR.SCOPE_ALL_TENANT,
    ],
  );
  const scopeId =
    'site' in scope
      ? DELEG.SCOPE_SITE
      : 'unit' in scope
        ? DELEG.SCOPE_UNIT
        : DELEG.SCOPE_SPACE;
  await q(
    `insert into delegated_access.organization_user_assignments
       (id, tenant_membership_id, practice_id, practice_site_id, clinical_unit_id, care_space_id,
        assignment_role_concept_id, access_scope_concept_id, valid_from, status_concept_id,
        created_at, updated_at)
     values (gen_random_uuid(), ?, ?, ?, ?, ?, ?, ?, now() - interval '1 minute', ?, now(), now())`,
    [
      membershipId,
      org.practiceId,
      'site' in scope ? scope.site : null,
      'unit' in scope ? scope.unit : null,
      'space' in scope ? scope.space : null,
      roleConceptId,
      scopeId,
      CONCEPTS.STATE_ACTIVE,
    ],
  );
  const login = await http()
    .post('/iam/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  return { userId, token: login.body.accessToken, tenantId: org.tenantId };
}

/** Ids de la estructura armada. */
export interface Planta {
  building: string;
  room: string;
  beds: string[];
  /** Unidad dueña (OWNER) de las camas. */
  unit: string;
}

/**
 * Edificio > habitación de internación > `n` camas activas.
 *
 * @param ctx - Contexto.
 * @param org - Organización.
 * @param tag - Prefijo de códigos.
 * @param n - Cantidad de camas.
 * @param room - Atributos extra de la habitación.
 */
export async function armarPlanta(
  ctx: TestContext,
  org: InfraOrg,
  tag: string,
  n = 2,
  room: Record<string, unknown> = {},
): Promise<Planta> {
  const http = () => request(ctx.app.getHttpServer());
  const building = await http()
    .post(`/sites/${org.siteId}/care-spaces`)
    .set(como(org))
    .send({
      code: `ED-${tag}`,
      name: 'Edificio',
      formCode: 'LOC_FORM_BUILDING',
      functionCode: 'SPACE_FN_BUILDING_GENERIC',
      activate: true,
    })
    .expect(201);
  const habitacion = await http()
    .post(`/sites/${org.siteId}/care-spaces`)
    .set(como(org))
    .send({
      code: `H-${tag}`,
      name: 'Habitación',
      formCode: 'LOC_FORM_ROOM',
      functionCode: 'SPACE_FN_INPATIENT_ROOM',
      parentSpaceId: building.body.id,
      activate: true,
      areaM2: 20,
      ...room,
    })
    .expect(201);
  const letters = 'ABCDEFGH'.slice(0, n);
  const bulk = await http()
    .post(`/sites/${org.siteId}/care-spaces/bulk`)
    .set(como(org))
    .send({
      parentSpaceId: habitacion.body.id,
      formCode: 'LOC_FORM_BED',
      functionCode: 'SPACE_FN_BED_STANDARD',
      codePattern: `H-${tag}-{${letters[0]}..${letters[n - 1]}}`,
      namePattern: 'Cama {}',
      censable: true,
      activate: true,
    })
    .expect(201);
  const beds: string[] = bulk.body.created.map((c: { id: string }) => c.id);
  const unidad = await http()
    .post(`/sites/${org.siteId}/clinical-units`)
    .set(como(org))
    .send({ code: `U-${tag}`, name: `Unidad ${tag}` })
    .expect(201);
  for (const bed of beds) {
    await http()
      .post(`/care-spaces/${bed}/unit-assignments`)
      .set(como(org))
      .send({
        clinicalUnitId: unidad.body.id,
        roleCode: 'SPACE_UNIT_ROLE_OWNER',
      })
      .expect(201);
  }
  return {
    building: building.body.id,
    room: habitacion.body.id,
    beds,
    unit: unidad.body.id,
  };
}

/** Versión operativa actual de un espacio (para `If-Match-Ops`). */
export async function opsVersion(
  ctx: TestContext,
  spaceId: string,
): Promise<number> {
  const [row] = await sql(ctx)<{ ops_version: number }>(
    'select ops_version from practice.care_spaces where id = ?',
    [spaceId],
  );
  return row.ops_version;
}

/**
 * Paciente con cuenta propia y membresía en el tenant (la huella que exige
 * `AuthzClinicalScopeService.isPatientInTenant`).
 *
 * @param ctx - Contexto.
 * @param org - Organización.
 * @param tag - Prefijo único.
 * @param campos - `camposObligatoriosDePaciente(ctx)`.
 */
export async function registrarPaciente(
  ctx: TestContext,
  org: InfraOrg,
  tag: string,
  campos: Record<string, unknown>,
): Promise<{ patientProfileId: string; userId: string }> {
  const http = () => request(ctx.app.getHttpServer());
  const nationalId = `F3-${tag}`;
  await http()
    .post('/iam/auth/register-patient')
    .send({
      ...campos,
      nationalId,
      password: PASSWORD,
      displayName: `Paciente ${tag}`,
      email: `pac-${tag.toLowerCase()}@example.test`,
    })
    .expect(201);
  const login = await http()
    .post('/iam/auth/login')
    .send({ nationalId, password: PASSWORD })
    .expect(200);
  const [, body] = String(login.body.accessToken).split('.');
  const claims = JSON.parse(
    Buffer.from(body, 'base64url').toString('utf8'),
  ) as Record<string, string>;
  await sql(ctx)(
    `insert into directory.tenant_memberships
       (id, user_id, tenant_id, tenant_role_concept_id, status_concept_id, access_scope_concept_id,
        start_date, created_at, updated_at)
     values (gen_random_uuid(), ?, ?, ?, ?, ?, current_date, now(), now())`,
    [
      claims.sub,
      org.tenantId,
      DIR.ROLE_STAFF,
      DIR.MEMBERSHIP_ACTIVE,
      DIR.SCOPE_ALL_TENANT,
    ],
  );
  return { patientProfileId: claims.pid, userId: claims.sub };
}
