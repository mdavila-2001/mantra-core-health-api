import { randomUUID } from 'node:crypto';
import pg from 'pg';
import request from 'supertest';
import { CONCEPTS, SEED } from '../../src/common';
import { bootstrapTestApp, type TestContext } from './harness';

/**
 * Bitácora transversal contra Postgres real (informe C §8.4): lo que las
 * unitarias de `AuditTrailInterceptor` prueban con el `EntityManager`
 * mockeado, acá se observa en las tablas.
 *
 * - Una ruta `@Audited` que el servicio no sella deja UNA fila en
 *   `audit.audit_log` con su acción de negocio, el actor, el tenant y la `ip`.
 * - Si la petición falla (400 del `ValidationPipe`), el sello de fallo se
 *   confirma igual —va en `REQUIRES_NEW`— y el cliente recibe el error original.
 * - Una lectura `@AccessLogged` escribe `audit.data_access_log` ANTES del
 *   handler: la fila existe aunque el recurso no.
 *
 * `audit_log` es WORM (`trg_forbid_mutation`): las filas que deja esta prueba
 * no se pueden borrar. Son del admin del arnés y llevan un id propio de la
 * corrida, como el probe de `audit-worm.int-spec.ts`.
 */
const DB = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};

interface SealRow {
  action: string;
  entity: string;
  user_id: string;
  tenant_id: string | null;
  outcome_concept_id: string;
  ip: string | null;
}

describe('bitácora transversal: el sello llega a la base (DB real)', () => {
  let ctx: TestContext;
  let db: pg.Client;
  const createdAddressIds: string[] = [];

  const http = () => request(ctx.app.getHttpServer());
  const auth = () => ({
    Authorization: `Bearer ${ctx.adminToken}`,
    'X-Tenant-Id': SEED.tenantId,
  });

  async function sealsSince(since: Date, action: string): Promise<SealRow[]> {
    const { rows } = await db.query<SealRow>(
      `select action, entity, user_id::text, tenant_id::text,
              outcome_concept_id::text, host(ip) as ip
         from audit.audit_log
        where user_id = $1 and action = $2 and recorded_at >= $3
        order by recorded_at`,
      [ctx.adminUserId, action, since],
    );
    return rows;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    db = new pg.Client(DB);
    await db.connect();
  });

  afterAll(async () => {
    if (createdAddressIds.length > 0) {
      await db.query(
        'delete from common.addresses where id = any($1::uuid[])',
        [createdAddressIds],
      );
    }
    await db.end();
    await ctx.app.close();
  });

  it('una ruta @Audited sella su acción de negocio con actor, tenant e ip', async () => {
    const response = await http()
      .post('/common/addresses')
      .set(auth())
      .send({
        ownerType: 'USER',
        ownerId: ctx.adminUserId,
        lines: [`Calle de la bitácora ${randomUUID().slice(0, 8)}`],
      })
      .expect(201);
    const addressId = (response.body as { id: string }).id;
    createdAddressIds.push(addressId);

    const { rows } = await db.query<SealRow>(
      `select action, entity, user_id::text, tenant_id::text,
              outcome_concept_id::text, host(ip) as ip
         from audit.audit_log where entity_id = $1`,
      [addressId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      action: 'ADDRESS_CREATED',
      entity: 'address',
      user_id: ctx.adminUserId,
      tenant_id: SEED.tenantId,
      outcome_concept_id: CONCEPTS.OUTCOME_SUCCESS,
    });
    expect(rows[0].ip).toMatch(/127\.0\.0\.1|::1/);
  });

  it('un fallo se sella con success:false y el cliente recibe el error original', async () => {
    const since = new Date(Date.now() - 1000);

    const response = await http()
      .post('/common/addresses')
      .set(auth())
      .send({ ownerType: 'USER', ownerId: ctx.adminUserId })
      .expect(400);
    expect(JSON.stringify(response.body)).toMatch(/lines/);

    const failures = (await sealsSince(since, 'ADDRESS_CREATED')).filter(
      (row) => row.outcome_concept_id === CONCEPTS.OUTCOME_FAILURE,
    );
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({
      entity: 'address',
      tenant_id: SEED.tenantId,
    });
  });

  it('una lectura @AccessLogged registra el acceso antes del handler', async () => {
    const allergyId = randomUUID();

    await http()
      .get(`/clinical/allergy-intolerances/${allergyId}/attachments`)
      .set(auth());

    const { rows } = await db.query<{ resource_type: string; user_id: string }>(
      `select resource_type, user_id::text
         from audit.data_access_log where resource_id = $1`,
      [allergyId],
    );
    expect(rows).toEqual([
      {
        resource_type: 'ALLERGY_INTOLERANCE_ATTACHMENTS',
        user_id: ctx.adminUserId,
      },
    ]);
  });
});
