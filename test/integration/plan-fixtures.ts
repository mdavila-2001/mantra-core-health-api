import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  CONCEPTS,
  TokenService,
  createdBy,
  deterministicId,
} from '../../src/common';
import { Users } from '../../src/modules/iam/entities';
import { TenantMemberships } from '../../src/modules/directory/entities';
import { OrganizationUserAssignments } from '../../src/modules/delegated_access/entities';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { bearer, ensureTestSession, type TestContext } from './harness';

/** Una organización de prueba con su dueño, práctica y sede. */
export interface PlanOrg {
  email: string;
  tenantId: string;
  token: string;
  practiceId: string;
  siteId: string;
}

const PASSWORD = 'S3cret-passw0rd';

/** Cabeceras de un actor dentro de una organización. */
export const como = (token: string, tenantId: string) => ({
  ...bearer(token),
  'X-Tenant-Id': tenantId,
});

/** Cabeceras del dueño de la organización. */
export const comoDueno = (org: PlanOrg) => como(org.token, org.tenantId);

/** `If-Match` con una `rowVersion` o un `layoutVersion`. */
export const ifMatch = (version: number | string) => ({
  'If-Match': `"${version}"`,
});

/** Rectángulo axial dado por su esquina superior izquierda. */
export const rect = (
  x: number,
  y: number,
  w: number,
  d: number,
  rotationDeg = 0,
) => ({
  kind: 'RECT',
  centerXM: x + w / 2,
  centerYM: y + d / 2,
  widthM: w,
  depthM: d,
  rotationDeg,
});

/**
 * Registra una organización completa por la API (dueño, práctica y sede), como
 * lo hace la suite de F1.
 */
export async function registerOrg(
  ctx: TestContext,
  letra: string,
  sufijo: string,
): Promise<PlanOrg> {
  const http = () => request(ctx.app.getHttpServer());
  const org: PlanOrg = {
    email: `pl-${letra.toLowerCase()}-${sufijo}@example.test`,
    tenantId: '',
    token: '',
    practiceId: '',
    siteId: '',
  };
  const alta = await http()
    .post('/iam/auth/register-organization')
    .send({
      organization: {
        code: `PL_${letra}_${sufijo.toUpperCase()}`,
        legalName: `Hospital Plano ${letra} ${sufijo}`,
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
      code: `PL-PRACT-${letra}-${sufijo}`,
      name: `Hospital Plano ${letra}`,
      timeZone: 'America/La_Paz',
    })
    .expect(201);
  org.practiceId = practica.body.id;
  const sede = await http()
    .post(`/practices/${org.practiceId}/sites`)
    .set(comoDueno(org))
    .send({ code: `PL-SEDE-${letra}-${sufijo}`, name: `Sede ${letra}` })
    .expect(201);
  org.siteId = sede.body.id;
  return org;
}

/** Crea un espacio del árbol por la API y devuelve el detalle. */
export async function createSpace(
  ctx: TestContext,
  org: PlanOrg,
  body: Record<string, unknown>,
): Promise<{ id: string; code: string; rowVersion: number }> {
  const res = await request(ctx.app.getHttpServer())
    .post(`/sites/${org.siteId}/care-spaces`)
    .set(comoDueno(org))
    .send(body)
    .expect(201);
  return res.body;
}

/** Ejecuta SQL directo (fixtures que ningún endpoint expone). */
export async function sql<T = Record<string, unknown>>(
  ctx: TestContext,
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  return ctx.orm.em.fork().getConnection().execute(text, params);
}

/** Código de un rol operativo → clave del concepto de asignación (`delegated_access:<clave>`). */
const ROLE_KEY: Readonly<Record<string, string>> = {
  DA_ASSIGN_NURSE: 'ASSIGN_ROLE_NURSE',
  DA_ASSIGN_NURSE_SUPERVISOR: 'ASSIGN_ROLE_NURSE_SUPERVISOR',
  DA_ASSIGN_ADMISSION: 'ASSIGN_ROLE_ADMISSION',
  DA_ASSIGN_HOUSEKEEPING: 'ASSIGN_ROLE_HOUSEKEEPING',
  DA_ASSIGN_MAINTENANCE: 'ASSIGN_ROLE_MAINTENANCE',
  DA_ASSIGN_OR_MANAGER: 'ASSIGN_ROLE_OR_MANAGER',
  DA_ASSIGN_BILLING: 'ASSIGN_ROLE_BILLING',
  DA_ASSIGN_INFECTION_CONTROL: 'ASSIGN_ROLE_INFECTION_CONTROL',
};

/**
 * Garantiza que exista el concepto (`<módulo>:<clave>` → id determinista), con la
 * misma versión de sistema de códigos que un concepto ya sembrado. Idempotente.
 * Los conceptos de rol de Admisión, Limpieza o Mantenimiento los suma F2 en su
 * rama; hasta entonces el test los crea con el mismo id que F2 les dará.
 */
export async function ensureConcept(
  ctx: TestContext,
  module: string,
  key: string,
  code: string,
): Promise<string> {
  const id = deterministicId(`${module}:${key}`);
  await sql(
    ctx,
    `insert into terminology.catalog_concepts (id, code_system_version_id, code, display, created_at, updated_at)
     select ?::uuid, c.code_system_version_id, ?, ?, now(), now()
       from terminology.catalog_concepts c where c.code = 'delegated_access:ASSIGN_ROLE_STAFF' limit 1
     on conflict (id) do nothing`,
    [id, `${module}:${key}`, code],
  );
  return id;
}

/** Alcance de una asignación delegada. */
export type AssignmentScope =
  | { kind: 'SITE'; siteId: string }
  | { kind: 'UNIT'; unitId: string }
  | { kind: 'SPACE'; spaceId: string };

/**
 * Crea un usuario con membresía de personal en la organización y una asignación
 * delegada con el rol operativo y el alcance dados. Devuelve su token.
 */
export async function createStaffUser(
  ctx: TestContext,
  org: PlanOrg,
  roleCode: keyof typeof ROLE_KEY,
  scope: AssignmentScope,
  label: string,
): Promise<{ userId: string; token: string }> {
  const em = ctx.orm.em.fork();
  const userId = randomUUID();
  em.create(
    Users,
    {
      id: userId,
      statusConceptId: CONCEPTS.USER_ACTIVE,
      displayName: `Personal ${label}`,
      mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
      emailVerified: true,
      phoneVerified: false,
      ...createdBy(),
    },
    { partial: true },
  );
  await em.flush();
  const membership = em.create(
    TenantMemberships,
    {
      userId,
      tenantId: org.tenantId,
      tenantRoleConceptId: DIR.ROLE_STAFF,
      statusConceptId: DIR.MEMBERSHIP_ACTIVE,
      accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
      startDate: new Date(Date.now() - 60_000),
      ...createdBy(),
    },
    { partial: true },
  );
  await em.flush();
  const roleId = await ensureConcept(
    ctx,
    'delegated_access',
    ROLE_KEY[roleCode],
    roleCode,
  );
  em.create(
    OrganizationUserAssignments,
    {
      tenantMembershipId: membership.id,
      practiceSiteId: scope.kind === 'SITE' ? scope.siteId : undefined,
      clinicalUnitId: scope.kind === 'UNIT' ? scope.unitId : undefined,
      careSpaceId: scope.kind === 'SPACE' ? scope.spaceId : undefined,
      assignmentRoleConceptId: roleId,
      accessScopeConceptId:
        scope.kind === 'SITE'
          ? DELEG.SCOPE_SITE
          : scope.kind === 'UNIT'
            ? DELEG.SCOPE_UNIT
            : DELEG.SCOPE_SPACE,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      validFrom: new Date(Date.now() - 60_000),
      ...createdBy(),
    },
    { partial: true },
  );
  await em.flush();
  const sid = `plan-${label}-${userId.slice(0, 8)}`;
  await ensureTestSession(ctx.orm, userId, sid);
  const token = ctx.app
    .get(TokenService)
    .signAccessToken(userId, sid, [], [org.tenantId]);
  return { userId, token };
}

/** Usuario miembro del personal SIN asignación delegada (sólo lee la estructura). */
export async function createPlainMember(
  ctx: TestContext,
  org: PlanOrg,
  label: string,
): Promise<{ userId: string; token: string }> {
  const em = ctx.orm.em.fork();
  const userId = randomUUID();
  em.create(
    Users,
    {
      id: userId,
      statusConceptId: CONCEPTS.USER_ACTIVE,
      displayName: `Miembro ${label}`,
      mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
      emailVerified: true,
      phoneVerified: false,
      ...createdBy(),
    },
    { partial: true },
  );
  await em.flush();
  em.create(
    TenantMemberships,
    {
      userId,
      tenantId: org.tenantId,
      tenantRoleConceptId: DIR.ROLE_STAFF,
      statusConceptId: DIR.MEMBERSHIP_ACTIVE,
      accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
      startDate: new Date(Date.now() - 60_000),
      ...createdBy(),
    },
    { partial: true },
  );
  await em.flush();
  const sid = `plan-${label}-${userId.slice(0, 8)}`;
  await ensureTestSession(ctx.orm, userId, sid);
  return {
    userId,
    token: ctx.app
      .get(TokenService)
      .signAccessToken(userId, sid, [], [org.tenantId]),
  };
}

/** Un PNG válido de `width × height` (franja gris), para el fondo. */
export function makePng(width: number, height: number): Buffer {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const zlib = require('node:zlib') as typeof import('node:zlib');
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3, 0x88)]);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  const chunk = (type: string, data: Buffer): Buffer => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(body) >>> 0);
    return Buffer.concat([length, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // profundidad
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Sube un archivo de imagen por la API real y devuelve su id. */
export async function uploadImage(
  ctx: TestContext,
  token: string,
  tenantId: string,
  buffer: Buffer,
  filename: string,
  contentType: string,
  category: 'IMAGE' | 'DOCUMENT' = 'IMAGE',
): Promise<{ status: number; id?: string; body: unknown }> {
  const res = await request(ctx.app.getHttpServer())
    .post('/common/files/upload')
    .set(como(token, tenantId))
    .field('category', category)
    .field('sensitivity', 'NORMAL')
    .attach('file', buffer, { filename, contentType });
  return { status: res.status, id: res.body?.id, body: res.body };
}
