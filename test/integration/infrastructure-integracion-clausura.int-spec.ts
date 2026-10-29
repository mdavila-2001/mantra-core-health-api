import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { CONCEPTS } from '../../src/common';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { bootstrapTestApp, type TestContext } from './harness';
import {
  as,
  createSpace,
  createUnit,
  ifMatch,
  registerOrg,
  toolbox,
  type InfraOrg,
} from './infrastructure-f3.fixtures';

/**
 * Clausura (retiro) REAL contra quien cuelga algo del espacio o de la unidad.
 *
 * El retiro bloquea la fila `for update` antes de recolectar los bloqueos, y quien cuelga
 * un activo, una tarifa o un centro de costo la toma `for share` antes de leer su estado.
 * Acá el retiro es el flujo real (`POST /care-spaces/:id/lifecycle`, `POST
 * /clinical-units/:id/lifecycle`); el otro lado se sostiene en una conexión propia (la
 * lectura `for share` y la escritura que hace `PATCH /accounting/infrastructure-items/:id`)
 * para fijar el orden, y en la última prueba también es el endpoint real.
 */
describe('Infraestructura · retiro real vs. escritura concurrente sobre el espacio', () => {
  let ctx: TestContext;
  const suffix = randomUUID().slice(0, 8);
  let http: ReturnType<typeof toolbox>['http'];
  let sql: ReturnType<typeof toolbox>['sql'];
  let org: InfraOrg;
  let seq = 0;

  const owner = () => as(org.token, org.tenantId);

  async function room(): Promise<{ id: string }> {
    seq += 1;
    return createSpace(ctx, org, {
      code: `CL${seq}-${suffix}`,
      name: `Sala ${seq}`,
      formCode: 'LOC_FORM_ROOM',
      functionCode: 'SPACE_FN_INPATIENT_ROOM',
    });
  }

  async function item(): Promise<string> {
    const id = randomUUID();
    await sql(
      `insert into accounting.infrastructure_items
         (id, practice_id, name, category_concept_id, status_concept_id, created_at, updated_at, row_version)
       values (?, ?, ?, ?, ?, now(), now(), 1)`,
      [
        id,
        org.practiceId,
        `Activo ${id.slice(0, 4)}`,
        CONCEPTS.STATE_ACTIVE,
        CONCEPTS.STATE_ACTIVE,
      ],
    );
    return id;
  }

  const located = async (itemId: string) =>
    (
      await sql<{ care_space_id: string | null }>(
        'select care_space_id from accounting.infrastructure_items where id = ?',
        [itemId],
      )
    )[0].care_space_id;

  const versionOf = async (table: string, id: string): Promise<number> =>
    (
      await sql<{ row_version: number }>(
        `select row_version from practice.${table} where id = ?`,
        [id],
      )
    )[0].row_version;

  const statusOf = async (table: string, id: string): Promise<string> =>
    (
      await sql<{ status_concept_id: string }>(
        `select status_concept_id from practice.${table} where id = ?`,
        [id],
      )
    )[0].status_concept_id;

  const retireSpace = (id: string, version: number) =>
    http()
      .post(`/care-spaces/${id}/lifecycle`)
      .set(owner())
      .set(ifMatch(version))
      .send({ action: 'retire', reason: 'Cierre por obra' });

  async function connect(): Promise<pg.Client> {
    const client = new pg.Client({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5433),
      user: process.env.DB_USER ?? 'mantra',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    await client.connect();
    return client;
  }

  const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    ({ http, sql } = toolbox(ctx));
    org = await registerOrg(ctx, 'K', suffix);
  }, 240000);

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('el retiro espera a quien tiene la fila del espacio `for share` y, cuando éste ubica un activo, lo ve como bloqueo: 409 y el espacio sigue vivo', async () => {
    const space = await room();
    const id = await item();
    const version = await versionOf('care_spaces', space.id);
    const otro = await connect();
    try {
      await otro.query('begin');
      await otro.query("select set_config('app.system_context', 'true', true)");
      // Lo que hace quien ubica un activo: toma la fila y lee su estado (vivo).
      const read = await otro.query(
        'select status_concept_id from practice.care_spaces where id = $1 for share',
        [space.id],
      );
      expect(read.rows[0].status_concept_id).toBe(PRAC.SPACE_ACTIVE);

      let terminado = false;
      const retiro = retireSpace(space.id, version).then((res) => {
        terminado = true;
        return res;
      });
      await pause(1500);
      // El retiro real no avanzó: está esperando la fila.
      expect(terminado).toBe(false);

      await otro.query(
        'update accounting.infrastructure_items set care_space_id = $1 where id = $2',
        [space.id, id],
      );
      await otro.query('commit');

      const res = await retiro;
      expect(res.status).toBe(409);
      expect(res.body.reason).toBe('SPACE_RETIRE_BLOCKED');
      expect(res.body.details.blockers).toEqual([
        expect.objectContaining({ kind: 'EQUIPMENT', sampleIds: [id] }),
      ]);
      expect(await statusOf('care_spaces', space.id)).toBe(PRAC.SPACE_ACTIVE);
      expect(await located(id)).toBe(space.id);
    } finally {
      await otro.query('rollback').catch(() => undefined);
      await otro.end();
    }
  }, 60000);

  it('el bloqueo cubre el subárbol: quien tiene una cama hija `for share` también hace esperar al retiro de la sala', async () => {
    const sala = await room();
    seq += 1;
    const cama = await createSpace(ctx, org, {
      code: `CL${seq}-${suffix}`,
      name: `Cama ${seq}`,
      formCode: 'LOC_FORM_BED',
      functionCode: 'SPACE_FN_BED_STANDARD',
      parentSpaceId: sala.id,
      bedCategoryCode: 'BED_CAT_SHARED',
      censable: true,
    });
    const id = await item();
    const version = await versionOf('care_spaces', sala.id);
    const otro = await connect();
    try {
      await otro.query('begin');
      await otro.query("select set_config('app.system_context', 'true', true)");
      await otro.query(
        'select id from practice.care_spaces where id = $1 for share',
        [cama.id],
      );
      let terminado = false;
      const retiro = retireSpace(sala.id, version).then((res) => {
        terminado = true;
        return res;
      });
      await pause(1500);
      expect(terminado).toBe(false);
      await otro.query(
        'update accounting.infrastructure_items set care_space_id = $1 where id = $2',
        [cama.id, id],
      );
      await otro.query('commit');
      const res = await retiro;
      expect(res.status).toBe(409);
      expect(res.body.reason).toBe('SPACE_RETIRE_BLOCKED');
      expect(await statusOf('care_spaces', sala.id)).toBe(PRAC.SPACE_ACTIVE);
    } finally {
      await otro.query('rollback').catch(() => undefined);
      await otro.end();
    }
  }, 60000);

  it('si el retiro gana, la escritura que esperaba ve el espacio retirado: sólo una de las dos operaciones se aplica', async () => {
    const space = await room();
    const id = await item();
    const version = await versionOf('care_spaces', space.id);
    const res = await retireSpace(space.id, version);
    expect(res.status).toBe(200);
    const ubicar = await http()
      .patch(`/accounting/infrastructure-items/${id}`)
      .set(owner())
      .send({ careSpaceId: space.id });
    expect(ubicar.status).toBe(422);
    expect(ubicar.body.reason).toBe('INFRASTRUCTURE_SPACE_RETIRED');
    expect(await located(id)).toBeNull();
    expect(await statusOf('care_spaces', space.id)).toBe(PRAC.SPACE_RETIRED);
  });

  it('retiro y ubicación a la vez, por los endpoints reales: exactamente uno gana y nunca queda un activo en un espacio retirado', async () => {
    const outcomes = new Set<string>();
    for (let round = 0; round < 6; round += 1) {
      const space = await room();
      const id = await item();
      const version = await versionOf('care_spaces', space.id);
      const [retiro, ubicar] = await Promise.all([
        retireSpace(space.id, version),
        http()
          .patch(`/accounting/infrastructure-items/${id}`)
          .set(owner())
          .send({ careSpaceId: space.id }),
      ]);
      const retired =
        (await statusOf('care_spaces', space.id)) === PRAC.SPACE_RETIRED;
      const colgado = (await located(id)) !== null;
      expect(retired && colgado).toBe(false);
      // exactamente una gana
      expect(
        Number(retiro.status === 200) + Number(ubicar.status === 200),
      ).toBe(1);
      if (retiro.status === 200) {
        expect(ubicar.status).toBe(422);
        expect(retired).toBe(true);
      } else {
        expect(retiro.status).toBe(409);
        expect(colgado).toBe(true);
      }
      outcomes.add(`${retiro.status}/${ubicar.status}`);
    }
    expect(outcomes.size).toBeGreaterThan(0);
  }, 120000);

  it('el retiro de una unidad también espera a quien la tiene `for share` (centro de costo) y relee el estado', async () => {
    const unit = await createUnit(ctx, org, `UK-${suffix}`, 'Unidad K');
    const version = await versionOf('clinical_units', unit);
    const otro = await connect();
    try {
      await otro.query('begin');
      await otro.query("select set_config('app.system_context', 'true', true)");
      await otro.query(
        'select id from practice.clinical_units where id = $1 for share',
        [unit],
      );
      let terminado = false;
      const retiro = http()
        .post(`/clinical-units/${unit}/lifecycle`)
        .set(owner())
        .set(ifMatch(version))
        .send({ action: 'retire', reason: 'Cierre' })
        .then((res) => {
          terminado = true;
          return res;
        });
      await pause(1500);
      expect(terminado).toBe(false);
      await otro.query('commit');
      const res = await retiro;
      expect(res.status).toBe(200);
      expect(await statusOf('clinical_units', unit)).toBe(PRAC.UNIT_RETIRED);
    } finally {
      await otro.query('rollback').catch(() => undefined);
      await otro.end();
    }
  }, 60000);
});
