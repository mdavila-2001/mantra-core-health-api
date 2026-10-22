import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  deleteRegisteredOrganizations,
  type TestContext,
} from './harness';
import { CONCEPTS } from '../../src/common';

/**
 * Subtarea 1.3 · la casa matriz georreferenciada de una aseguradora en
 * `POST /iam/auth/register-organization`.
 *
 * Las coordenadas no viven en `insurance.insurance_carriers`: junto con la
 * dirección, materializan una fila de `common.addresses` (dueño el tenant,
 * uso `ADDR_USE_WORK`) — el mismo lugar donde ya viven las coordenadas del
 * consultorio propio del profesional y del centro de diagnóstico. El par es
 * «ambos o ninguno»: media coordenada, o una fuera de rango, es 400 de
 * `ValidationPipe`, no 422. `GET /tenants/me` las expone de vuelta.
 */
describe('1.3 · casa matriz georreferenciada del alta de organización (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);

  const creados: { userId: string; tenantId: string }[] = [];

  const http = () => request(ctx.app.getHttpServer());

  function altaDto(overrides: {
    code: string;
    email: string;
    latitude?: number;
    longitude?: number;
  }) {
    return {
      organization: {
        code: overrides.code,
        legalName: `Aseguradora ${overrides.code} S.R.L.`,
        tenantType: 'PAYER',
        payer: {
          carrierCode: `CAR_${overrides.code}`,
          sigla: overrides.code.slice(0, 6),
          address: 'Av. Siempre Viva 123',
          regulatorIdentifier: `NIT-${overrides.code}`,
          ...(overrides.latitude === undefined
            ? {}
            : { latitude: overrides.latitude }),
          ...(overrides.longitude === undefined
            ? {}
            : { longitude: overrides.longitude }),
        },
      },
      owner: {
        email: overrides.email,
        password: 'S3cret-passw0rd',
        name: 'Elena',
        lastName: 'Salas',
      },
    };
  }

  /** La fila de `common.addresses` del tenant, si la hay. Columnas como texto para comparar exacto. */
  async function direccionDelTenant(tenantId: string): Promise<
    | {
        lines: string;
        owner_type_concept_id: string;
        use_concept_id: string;
        type_concept_id: string;
        country_concept_id: string;
        latitude: string;
        longitude: string;
        created_by_user_id: string;
      }
    | undefined
  > {
    const filas = await ctx.orm.em.getConnection().execute<
      Array<{
        lines: string;
        owner_type_concept_id: string;
        use_concept_id: string;
        type_concept_id: string;
        country_concept_id: string;
        latitude: string;
        longitude: string;
        created_by_user_id: string;
      }>
    >(
      `select lines, owner_type_concept_id, use_concept_id, type_concept_id,
              country_concept_id, latitude::text, longitude::text, created_by_user_id
         from common.addresses
        where owner_id = ?`,
      [tenantId],
    );
    return filas[0];
  }

  async function direccionDelCarrier(
    tenantId: string,
  ): Promise<string | undefined> {
    const filas = await ctx.orm.em
      .getConnection()
      .execute<Array<{ address: string }>>(
        `select address from insurance.insurance_carriers where tenant_id = ?`,
        [tenantId],
      );
    return filas[0]?.address;
  }

  async function login(email: string): Promise<string> {
    const res = await http()
      .post('/iam/auth/login')
      .send({ email, password: 'S3cret-passw0rd' })
      .expect(200);
    return res.body.accessToken;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredOrganizations(creados);

    // Cierra la escalera: sin esta fila en `harness.ts` (`TENANT_ESCRIBE_EN`),
    // la dirección de la casa matriz sobrevive al borrado del tenant.
    if (creados.length === 0) return;
    const marcadores = creados.map(() => '?').join(', ');
    const restantes = await ctx.orm.em
      .getConnection()
      .execute<Array<{ count: string }>>(
        `select count(*)::text as count from common.addresses where owner_id in (${marcadores})`,
        creados.map((c) => c.tenantId),
      );
    expect(restantes[0]?.count).toBe('0');
  });

  it('escenario 1 · el par completo crea una fila de common.addresses con los conceptos correctos', async () => {
    const codigo = `GPS1_${marca}`;
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigo,
          email: `gps1-${marca}@example.test`,
          latitude: -17.7833,
          longitude: -63.1821,
        }),
      )
      .expect(201);

    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });

    const direccion = await direccionDelTenant(res.body.tenantId);
    expect(direccion).toBeDefined();
    expect(direccion?.latitude).toBe('-17.7833');
    expect(direccion?.longitude).toBe('-63.1821');
    expect(direccion?.owner_type_concept_id).toBe(CONCEPTS.OWNER_TENANT);
    expect(direccion?.use_concept_id).toBe(CONCEPTS.ADDR_USE_WORK);
    expect(direccion?.type_concept_id).toBe(CONCEPTS.ADDR_TYPE_POSTAL);
    expect(direccion?.country_concept_id).toBe(CONCEPTS.COUNTRY_BO);
    expect(direccion?.created_by_user_id).toBe(res.body.ownerUserId);
  });

  it('escenario 2 · lines coincide con la dirección de insurance_carriers', async () => {
    const codigo = `GPS2_${marca}`;
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigo,
          email: `gps2-${marca}@example.test`,
          latitude: -17.7833,
          longitude: -63.1821,
        }),
      )
      .expect(201);

    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });

    const direccion = await direccionDelTenant(res.body.tenantId);
    const direccionDelCarrierRow = await direccionDelCarrier(res.body.tenantId);
    expect(direccion?.lines).toBe(direccionDelCarrierRow);
    expect(direccion?.lines).toBe('Av. Siempre Viva 123');
  });

  it('escenario 3 · sólo latitude es 400, y no crea ni tenant ni cuenta', async () => {
    const codigo = `GPS3_${marca}`;
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigo,
          email: `gps3-${marca}@example.test`,
          latitude: -17.7833,
        }),
      )
      .expect(400);

    expect(JSON.stringify(res.body)).toContain('organization.payer.longitude');

    const tenants = await ctx.orm.em
      .getConnection()
      .execute<Array<{ id: string }>>(
        `select id from directory.tenants where code = ?`,
        [codigo],
      );
    expect(tenants).toHaveLength(0);
  });

  it('escenario 4 · coordenadas fuera de rango son 400', async () => {
    await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: `GPS4A_${marca}`,
          email: `gps4a-${marca}@example.test`,
          latitude: 91,
          longitude: -63.1821,
        }),
      )
      .expect(400);

    await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: `GPS4B_${marca}`,
          email: `gps4b-${marca}@example.test`,
          latitude: -17.7833,
          longitude: -181,
        }),
      )
      .expect(400);
  });

  it('escenario 5 · sin coordenadas, el alta sigue 201 y sin fila en common.addresses', async () => {
    const codigo = `GPS5_${marca}`;
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(altaDto({ code: codigo, email: `gps5-${marca}@example.test` }))
      .expect(201);

    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });

    const direccion = await direccionDelTenant(res.body.tenantId);
    expect(direccion).toBeUndefined();

    const direccionDelCarrierRow = await direccionDelCarrier(res.body.tenantId);
    expect(direccionDelCarrierRow).toBe('Av. Siempre Viva 123');
  });

  it('escenario 6 · GET /tenants/me devuelve las coordenadas como números', async () => {
    const codigo = `GPS6_${marca}`;
    const email = `gps6-${marca}@example.test`;
    const res = await http()
      .post('/iam/auth/register-organization')
      .send(
        altaDto({
          code: codigo,
          email,
          latitude: -17.7833,
          longitude: -63.1821,
        }),
      )
      .expect(201);

    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });

    const token = await login(email);
    const misOrganizaciones = await http()
      .get('/tenants/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const organizacion = misOrganizaciones.body.items.find(
      (item: { id: string }) => item.id === res.body.tenantId,
    );
    expect(organizacion?.payer?.latitude).toBe(-17.7833);
    expect(organizacion?.payer?.longitude).toBe(-63.1821);
  });
});
