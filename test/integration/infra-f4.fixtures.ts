import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bearer, type TestContext } from './harness';
import { CONCEPTS } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { DIR } from '../../src/modules/directory/directory.concepts';

/**
 * Armado compartido de los int-spec de infraestructura F4 (quirófanos): organizaciones
 * reales por la API, quirófanos activos, miembros con roles por la API de `authz`.
 * Nada se simula: cada fila sale de un endpoint o de un SQL sobre la base de pruebas.
 */
export const PASSWORD = 'S3cret-passw0rd';

export interface Org {
  email: string;
  tenantId: string;
  token: string;
  practiceId: string;
  siteId: string;
  userId: string;
}

export const mkOrg = (letra: string, sufijo: string): Org => ({
  email: `f4-${letra.toLowerCase()}-${sufijo}@example.test`,
  tenantId: '',
  token: '',
  practiceId: '',
  siteId: '',
  userId: '',
});

export const como = (org: { token: string; tenantId: string }) => ({
  ...bearer(org.token),
  'X-Tenant-Id': org.tenantId,
});

export function claims(token: string): Record<string, any> {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
}

export function http(ctx: TestContext) {
  return request(ctx.app.getHttpServer());
}

/** Registra una organización (dueño), su práctica y una sede. */
export async function registrarOrg(
  ctx: TestContext,
  org: Org,
  letra: string,
  sufijo: string,
): Promise<void> {
  const alta = await http(ctx)
    .post('/iam/auth/register-organization')
    .send({
      organization: {
        code: `F4_${letra}_${sufijo.toUpperCase()}`,
        legalName: `Hospital F4 ${letra} ${sufijo}`,
        tenantType: 'HOSPITAL',
        countryConceptId: CONCEPTS.COUNTRY_BO,
        jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
      },
      owner: {
        email: org.email,
        password: PASSWORD,
        name: 'Dueña',
        lastName: letra,
      },
    })
    .expect(201);
  org.tenantId = alta.body.tenantId;
  const login = await http(ctx)
    .post('/iam/auth/login')
    .send({ email: org.email, password: PASSWORD })
    .expect(200);
  org.token = login.body.accessToken;
  org.userId = claims(org.token).sub;
  const practica = await http(ctx)
    .post('/practices')
    .set(bearer(ctx.adminToken))
    .send({
      tenantId: org.tenantId,
      code: `F4-PRACT-${letra}-${sufijo}`,
      name: `Hospital F4 ${letra}`,
      timeZone: 'America/La_Paz',
    })
    .expect(201);
  org.practiceId = practica.body.id;
  const sede = await http(ctx)
    .post(`/practices/${org.practiceId}/sites`)
    .set(como(org))
    .send({ code: `F4-SEDE-${letra}-${sufijo}`, name: `Sede ${letra}` })
    .expect(201);
  org.siteId = sede.body.id;
}

/** Crea una sede más en la práctica de la organización. */
export async function crearSede(
  ctx: TestContext,
  org: Org,
  code: string,
): Promise<string> {
  const sede = await http(ctx)
    .post(`/practices/${org.practiceId}/sites`)
    .set(como(org))
    .send({ code, name: code })
    .expect(201);
  return sede.body.id;
}

/** Atributos que exige el perfil del quirófano para activarse (CONTRATO-F0-F1 §2). */
export const ATRIBUTOS_QUIROFANO = {
  areaM2: 36,
  pressureCode: 'PRESSURE_POSITIVE',
  airChangesPerHour: 20,
  hvacValidatedOn: '2026-10-01',
};

/** Crea un espacio por la API y devuelve su detalle. */
export async function crearEspacio(
  ctx: TestContext,
  org: Org,
  siteId: string,
  body: Record<string, unknown>,
): Promise<any> {
  const res = await http(ctx)
    .post(`/sites/${siteId}/care-spaces`)
    .set(como(org))
    .send({ formCode: 'LOC_FORM_ROOM', ...body })
    .expect(201);
  return res.body;
}

/** Quirófano activo con preparación y limpieza. */
export function crearQuirofano(
  ctx: TestContext,
  org: Org,
  code: string,
  extra: Record<string, unknown> = {},
  siteId: string = org.siteId,
): Promise<any> {
  return crearEspacio(ctx, org, siteId, {
    code,
    name: `Quirófano ${code}`,
    functionCode: 'SPACE_FN_OPERATING_ROOM',
    ...ATRIBUTOS_QUIROFANO,
    prepMinutes: 15,
    cleanupMinutes: 20,
    activate: true,
    ...extra,
  });
}

/** Liga un espacio como recurso agendable y devuelve el id del recurso. */
export async function ligarRecurso(
  ctx: TestContext,
  org: Org,
  careSpaceId: string,
  name = 'Recurso de sala',
): Promise<string> {
  const res = await http(ctx)
    .post('/scheduling/resources')
    .set(como(org))
    .send({
      tenantId: org.tenantId,
      resourceType: 'ROOM',
      resourceRefType: 'care_spaces',
      resourceRefId: careSpaceId,
      name,
      timeZone: 'America/La_Paz',
    })
    .expect(201);
  return res.body.id;
}

/**
 * Usuario que es MIEMBRO (sin rol de administración) de la organización y tiene los roles
 * indicados con ámbito en su tenant. Se registra como dueño de una organización propia,
 * se le da una membresía STAFF en `org` y los roles salen de `POST /authz/users/:id/role-assignments`.
 */
export async function crearMiembro(
  ctx: TestContext,
  org: Org,
  etiqueta: string,
  sufijo: string,
  roles: string[],
): Promise<{ token: string; tenantId: string; userId: string }> {
  const propia = mkOrg(`m${etiqueta}`, sufijo);
  propia.email = `f4-miembro-${etiqueta}-${sufijo}@example.test`;
  await registrarOrg(ctx, propia, `M${etiqueta}`, sufijo);
  await ctx.orm.em
    .fork()
    .getConnection()
    .execute(
      `insert into directory.tenant_memberships
       (id, user_id, tenant_id, tenant_role_concept_id, status_concept_id,
        access_scope_concept_id, start_date, created_at, updated_at)
     values (?, ?, ?, ?, ?, ?, now(), now(), now())`,
      [
        randomUUID(),
        propia.userId,
        org.tenantId,
        DIR.ROLE_STAFF,
        DIR.MEMBERSHIP_ACTIVE,
        DIR.SCOPE_ALL_TENANT,
      ],
    );
  for (const roleCode of roles) {
    await http(ctx)
      .post(`/authz/users/${propia.userId}/role-assignments`)
      .set(bearer(ctx.adminToken))
      .send({ roleCode, tenantId: org.tenantId })
      .expect(201);
  }
  const login = await http(ctx)
    .post('/iam/auth/login')
    .send({ email: propia.email, password: PASSWORD })
    .expect(200);
  return {
    token: login.body.accessToken,
    tenantId: org.tenantId,
    userId: propia.userId,
  };
}

/** Filas por SQL contra la base de pruebas. */
export async function filas(
  ctx: TestContext,
  sql: string,
  params: unknown[] = [],
): Promise<any[]> {
  return ctx.orm.em.fork().getConnection().execute(sql, params);
}
