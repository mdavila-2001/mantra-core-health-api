import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bearer,
  bootstrapTestApp,
  deleteRegisteredOrganizations,
  ensureTestSession,
  type TestContext,
} from './harness';
import { CONCEPTS, TokenService } from '../../src/common';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { Tenants } from '../../src/modules/directory/entities';
import { Practices, PracticeSites } from '../../src/modules/practice/entities';
import { Addresses } from '../../src/modules/common/entities';

/**
 * CM-11 · alta de un centro médico: `register-organization` con un tipo de
 * salud existente (`HOSPITAL`, A-3) y, ya verificada, la práctica y su primera
 * sede con `POST /tenants/:tenantId/practices` (A-10).
 */
describe('CM-11 · alta de centro médico (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);

  /** Cuentas y tenants creados por esta suite, para limpiar al final. */
  const creados: { userId: string; tenantId: string }[] = [];

  const http = () => request(ctx.app.getHttpServer());

  /** Registra una organización `HOSPITAL` y devuelve su tenant y su owner. */
  async function registrar(sufijo: string) {
    const res = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `CM11_${sufijo}_${marca}`,
          legalName: `Centro Médico ${sufijo} ${marca} S.R.L.`,
          tenantType: 'HOSPITAL',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: {
          email: `cm11-${sufijo}-${marca}@example.test`,
          password: 'S3cret-passw0rd',
          name: 'Marta',
          lastName: 'Rojas',
        },
      })
      .expect(201);
    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });
    return {
      tenantId: res.body.tenantId as string,
      ownerUserId: res.body.ownerUserId as string,
    };
  }

  /** Token de sesión del owner: membresía OWNER, rol global `USER`. */
  async function tokenDelOwner(ownerUserId: string, tenantId: string) {
    const sid = `cm11-${ownerUserId}`;
    await ensureTestSession(ctx.orm, ownerUserId, sid);
    return ctx.app
      .get(TokenService)
      .signAccessToken(ownerUserId, sid, ['USER'], [tenantId]);
  }

  const cuerpo = (nombre: string) => ({
    name: nombre,
    site: {
      name: 'Sede Norte',
      addressText: 'Av. San Martín 123',
      latitude: -17.78,
      longitude: -63.18,
      cityText: 'Santa Cruz de la Sierra',
    },
  });

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredOrganizations(creados);
  });

  it('alta como HOSPITAL → 201 y el tenant queda pendiente de verificación', async () => {
    const { tenantId } = await registrar('ALTA');

    const tenant = await ctx.orm.em
      .fork()
      .findOneOrFail(Tenants, { id: tenantId });
    expect(tenant.statusConceptId).toBe(DIR.TENANT_PENDING);
    expect(tenant.verificationStatusConceptId).toBe(DIR.TENANT_UNVERIFIED);
    expect(tenant.tenantTypeConceptId).toBe(CONCEPTS.TENANT_TYPE_HOSPITAL);
  });

  it('flujo completo: 422 sin verificar → verifica la plataforma → 201 → 403 de otra organización → 409 repetida', async () => {
    const propia = await registrar('FLUJO');
    const ajena = await registrar('AJENA');
    const tokenPropio = await tokenDelOwner(
      propia.ownerUserId,
      propia.tenantId,
    );
    const tokenAjeno = await tokenDelOwner(ajena.ownerUserId, ajena.tenantId);
    const ruta = `/tenants/${propia.tenantId}/practices`;

    // 1) Antes de verificar: 422.
    await http()
      .post(ruta)
      .set(bearer(tokenPropio))
      .send(cuerpo('Centro Médico Norte'))
      .expect(422);

    // 2) La plataforma verifica por el camino existente.
    await http()
      .post(`/admin/tenants/${propia.tenantId}/verification`)
      .set(bearer(ctx.adminToken))
      .send({})
      .expect(200);

    // 3) La administración de otra organización no puede abrirle la práctica.
    await http()
      .post(ruta)
      .set(bearer(tokenAjeno))
      .send(cuerpo('Centro Médico Norte'))
      .expect(403);

    // 4) Verificada y con su propio owner: 201.
    const res = await http()
      .post(ruta)
      .set(bearer(tokenPropio))
      .send(cuerpo('Centro Médico Norte'))
      .expect(201);
    expect(res.body).toEqual({
      practiceId: expect.any(String),
      practiceSiteId: expect.any(String),
    });

    // 5) La misma práctica otra vez: 409.
    await http()
      .post(ruta)
      .set(bearer(tokenPropio))
      .send(cuerpo('Centro Médico Norte'))
      .expect(409);

    // Lo persistido: práctica, sede y dirección con su punto.
    const em = ctx.orm.em.fork();
    const practice = await em.findOneOrFail(Practices, {
      id: res.body.practiceId,
    });
    expect(practice.tenantId).toBe(propia.tenantId);
    expect(practice.typeConceptId).toBe(PRAC.PRACTICE_TYPE_MEDICAL_CENTER);
    expect(practice.adminUserId).toBe(propia.ownerUserId);

    const site = await em.findOneOrFail(PracticeSites, {
      id: res.body.practiceSiteId,
    });
    expect(site.practiceId).toBe(practice.id);
    expect(site.managingTenantId).toBe(propia.tenantId);
    expect(site.addressId).toEqual(expect.any(String));

    const address = await em.findOneOrFail(Addresses, { id: site.addressId });
    expect(address.lines).toBe('Av. San Martín 123');
    expect(Number(address.latitude)).toBeCloseTo(-17.78, 4);
    expect(Number(address.longitude)).toBeCloseTo(-63.18, 4);

    // El dueño del centro (rol global USER, membresía OWNER) lista sus
    // prácticas y las sedes de la suya en su tenant (A-6, #957/#984).
    const practicas = await http()
      .get('/practices')
      .set(bearer(tokenPropio))
      .set('X-Tenant-Id', propia.tenantId)
      .expect(200);
    expect(practicas.body.map((p: { id: string }) => p.id)).toContain(
      practice.id,
    );
    const sedes = await http()
      .get(`/practices/${practice.id}/sites`)
      .set(bearer(tokenPropio))
      .set('X-Tenant-Id', propia.tenantId)
      .expect(200);
    expect(sedes.body.map((s: { id: string }) => s.id)).toContain(site.id);

    // El dueño de otra organización, desde su tenant, no ve esa práctica:
    // el mismo 404 que una práctica inexistente.
    await http()
      .get(`/practices/${practice.id}/sites`)
      .set(bearer(tokenAjeno))
      .set('X-Tenant-Id', ajena.tenantId)
      .expect(404);
    const ajenas = await http()
      .get('/practices')
      .set(bearer(tokenAjeno))
      .set('X-Tenant-Id', ajena.tenantId)
      .expect(200);
    expect(ajenas.body.map((p: { id: string }) => p.id)).not.toContain(
      practice.id,
    );

    // Y no puede ponerse el tenant ajeno en la cabecera.
    const intruso = await http()
      .get(`/practices/${practice.id}/sites`)
      .set(bearer(tokenAjeno))
      .set('X-Tenant-Id', propia.tenantId);
    expect(intruso.status).toBe(403);
  });

  it('coordenadas fuera de rango → 400', async () => {
    const { tenantId, ownerUserId } = await registrar('RANGO');
    const token = await tokenDelOwner(ownerUserId, tenantId);

    await http()
      .post(`/tenants/${tenantId}/practices`)
      .set(bearer(token))
      .send({
        ...cuerpo('Centro Médico Rango'),
        site: { ...cuerpo('x').site, latitude: 91 },
      })
      .expect(400);
  });
});
