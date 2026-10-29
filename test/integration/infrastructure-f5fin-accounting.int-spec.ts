import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { CONCEPTS } from '../../src/common';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { bootstrapTestApp, type TestContext } from './harness';
import {
  ROLE,
  as,
  createSpace,
  createStaff,
  createUnit,
  ifMatch,
  registerOrg,
  toolbox,
  type InfraOrg,
  type Staff,
} from './infrastructure-f3.fixtures';

/**
 * F5f · activos ubicados en un espacio, centro de costo por unidad y bloqueo
 * `EQUIPMENT` de clausura, contra la API y la base reales.
 *
 * Cada endpoint: un caso permitido, uno fail-closed por tenant (404) y uno por rol (403).
 * Incluye la carrera «ubicar vs retirar» con dos conexiones reales.
 */
describe('Infraestructura F5f · activos, centro de costo por unidad y clausura', () => {
  let ctx: TestContext;
  const suffix = randomUUID().slice(0, 8);
  let http: ReturnType<typeof toolbox>['http'];
  let sql: ReturnType<typeof toolbox>['sql'];
  let orgA: InfraOrg;
  let orgB: InfraOrg;
  let unitA: string;
  let nurse: Staff;
  let seq = 0;

  const owner = () => as(orgA.token, orgA.tenantId);

  async function room(org: InfraOrg, extra: Record<string, unknown> = {}) {
    seq += 1;
    return createSpace(ctx, org, {
      code: `F5F${seq}-${suffix}`,
      name: `Sala ${seq}`,
      formCode: 'LOC_FORM_ROOM',
      functionCode: 'SPACE_FN_INPATIENT_ROOM',
      ...extra,
    });
  }

  async function item(practiceId: string): Promise<string> {
    const id = randomUUID();
    await sql(
      `insert into accounting.infrastructure_items
         (id, practice_id, name, category_concept_id, status_concept_id, created_at, updated_at, row_version)
       values (?, ?, ?, ?, ?, now(), now(), 1)`,
      [
        id,
        practiceId,
        `Activo ${id.slice(0, 4)}`,
        CONCEPTS.STATE_ACTIVE,
        CONCEPTS.STATE_ACTIVE,
      ],
    );
    return id;
  }

  async function costCenter(
    practiceId: string,
    status = CONCEPTS.STATE_ACTIVE,
  ) {
    const id = randomUUID();
    await sql(
      `insert into accounting.cost_centers
         (id, practice_id, code, name, status_concept_id, created_at, updated_at, row_version)
       values (?, ?, ?, ?, ?, now(), now(), 1)`,
      [id, practiceId, `CC-${id.slice(0, 8)}`, 'Centro', status],
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

  const events = (type: string, aggregateId: string) =>
    sql<{ payload_json: any }>(
      'select payload_json from messaging.domain_events where event_type = ? and aggregate_id = ?',
      [type, aggregateId],
    );

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    ({ http, sql } = toolbox(ctx));
    orgA = await registerOrg(ctx, 'FA', suffix);
    orgB = await registerOrg(ctx, 'FB', suffix);
    unitA = await createUnit(ctx, orgA, 'UN-F5F', 'Medicina');
    nurse = await createStaff(
      ctx,
      orgA,
      'enf',
      ROLE.NURSE,
      { kind: 'SITE', siteId: orgA.siteId },
      suffix,
    );
  }, 240000);

  afterAll(async () => {
    await ctx?.app.close();
  });

  describe('PATCH /accounting/infrastructure-items/:id', () => {
    it('permitido: el administrador de la organización ubica el activo, queda el evento y la base lo dice', async () => {
      const space = await room(orgA);
      const id = await item(orgA.practiceId);
      const res = await http()
        .patch(`/accounting/infrastructure-items/${id}`)
        .set(owner())
        .send({ careSpaceId: space.id })
        .expect(200);
      expect(res.body).toEqual({
        id,
        practiceId: orgA.practiceId,
        careSpaceId: space.id,
      });
      expect(await located(id)).toBe(space.id);
      const evs = await events('accounting.infrastructure_item.located', id);
      expect(evs).toHaveLength(1);
      expect(evs[0].payload_json).toMatchObject({
        careSpaceId: space.id,
        previousCareSpaceId: null,
        tenantId: orgA.tenantId,
      });

      // null lo desubica
      await http()
        .patch(`/accounting/infrastructure-items/${id}`)
        .set(owner())
        .send({ careSpaceId: null })
        .expect(200);
      expect(await located(id)).toBeNull();
    });

    it('un espacio de OTRA práctica del mismo tenant es 422 INFRASTRUCTURE_SPACE_PRACTICE_MISMATCH y no escribe', async () => {
      const otraPractica = (
        await http()
          .post('/practices')
          .set({ Authorization: `Bearer ${ctx.adminToken}` })
          .send({
            tenantId: orgA.tenantId,
            code: `F5F-P2-${suffix}`,
            name: 'Segunda práctica',
            timeZone: 'America/La_Paz',
          })
          .expect(201)
      ).body.id;
      const sede = (
        await http()
          .post(`/practices/${otraPractica}/sites`)
          .set(owner())
          .send({ code: `F5F-S2-${suffix}`, name: 'Sede 2' })
          .expect(201)
      ).body.id;
      const ajeno = (
        await http()
          .post(`/sites/${sede}/care-spaces`)
          .set(owner())
          .send({
            code: `AJ-${suffix}`,
            name: 'Sala de otra práctica',
            formCode: 'LOC_FORM_ROOM',
            functionCode: 'SPACE_FN_INPATIENT_ROOM',
            activate: true,
          })
          .expect(201)
      ).body.id;
      const id = await item(orgA.practiceId);
      const res = await http()
        .patch(`/accounting/infrastructure-items/${id}`)
        .set(owner())
        .send({ careSpaceId: ajeno })
        .expect(422);
      expect(res.body.reason).toBe('INFRASTRUCTURE_SPACE_PRACTICE_MISMATCH');
      expect(await located(id)).toBeNull();
    });

    it('fail-closed por tenant: activo ajeno o espacio ajeno responden 404 sin revelar cuál', async () => {
      const spaceB = await room(orgB);
      const itemB = await item(orgB.practiceId);
      const spaceA = await room(orgA);
      const itemA = await item(orgA.practiceId);
      // activo de B con el token de A
      const a = await http()
        .patch(`/accounting/infrastructure-items/${itemB}`)
        .set(owner())
        .send({ careSpaceId: spaceA.id })
        .expect(404);
      // espacio de B para un activo de A
      const b = await http()
        .patch(`/accounting/infrastructure-items/${itemA}`)
        .set(owner())
        .send({ careSpaceId: spaceB.id })
        .expect(404);
      // inexistente
      const c = await http()
        .patch(`/accounting/infrastructure-items/${randomUUID()}`)
        .set(owner())
        .send({ careSpaceId: spaceA.id })
        .expect(404);
      expect(a.body.details).toBeUndefined();
      expect(c.body.reason).toBe(a.body.reason);
      expect(b.body.reason).toBe('INFRASTRUCTURE_SPACE_NOT_FOUND');
      expect(await located(itemA)).toBeNull();
      expect(await located(itemB)).toBeNull();
    });

    it('fail-closed por rol: Enfermería de la sede recibe 403 con los roles requeridos', async () => {
      const space = await room(orgA);
      const id = await item(orgA.practiceId);
      const res = await http()
        .patch(`/accounting/infrastructure-items/${id}`)
        .set(as(nurse.token, orgA.tenantId))
        .send({ careSpaceId: space.id })
        .expect(403);
      expect(res.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
      expect(res.body.details.requiredRoles).toEqual([
        'ORG_ADMIN',
        'ACCOUNTING_APPROVER',
      ]);
      expect(await located(id)).toBeNull();
    });

    it('un espacio clausurado no aloja activos (422 INFRASTRUCTURE_SPACE_RETIRED)', async () => {
      const space = await room(orgA);
      await sql(
        'update practice.care_spaces set status_concept_id = ? where id = ?',
        [PRAC.SPACE_RETIRED, space.id],
      );
      const id = await item(orgA.practiceId);
      const res = await http()
        .patch(`/accounting/infrastructure-items/${id}`)
        .set(owner())
        .send({ careSpaceId: space.id })
        .expect(422);
      expect(res.body.reason).toBe('INFRASTRUCTURE_SPACE_RETIRED');
    });

    it('el cuerpo exige careSpaceId (uuid o null)', async () => {
      const id = await item(orgA.practiceId);
      await http()
        .patch(`/accounting/infrastructure-items/${id}`)
        .set(owner())
        .send({})
        .expect(400);
      await http()
        .patch(`/accounting/infrastructure-items/${id}`)
        .set(owner())
        .send({ careSpaceId: 'no-es-uuid' })
        .expect(400);
    });
  });

  describe('retire-check: bloqueo EQUIPMENT con activos del subárbol', () => {
    it('clausurar una sala con un activo ubicado en una cama hija queda bloqueado con próxima acción', async () => {
      const sala = await room(orgA);
      const cama = await createSpace(ctx, orgA, {
        code: `CAMA-F5F-${suffix}`,
        name: 'Cama',
        formCode: 'LOC_FORM_BED',
        functionCode: 'SPACE_FN_BED_STANDARD',
        parentSpaceId: sala.id,
        bedCategoryCode: 'BED_CAT_SHARED',
        censable: true,
      });
      const id = await item(orgA.practiceId);
      await http()
        .patch(`/accounting/infrastructure-items/${id}`)
        .set(owner())
        .send({ careSpaceId: cama.id })
        .expect(200);
      const chequeo = await http()
        .get(`/care-spaces/${sala.id}/retire-check`)
        .set(owner())
        .expect(200);
      const equipo = chequeo.body.blockers.find(
        (b: any) => b.kind === 'EQUIPMENT',
      );
      expect(equipo).toMatchObject({ count: 1, sampleIds: [id] });
      expect(equipo.nextAction).toMatch(/reubicar/i);

      // al desubicarlo, el bloqueo desaparece
      await http()
        .patch(`/accounting/infrastructure-items/${id}`)
        .set(owner())
        .send({ careSpaceId: null })
        .expect(200);
      const libre = await http()
        .get(`/care-spaces/${sala.id}/retire-check`)
        .set(owner())
        .expect(200);
      expect(
        libre.body.blockers.find((b: any) => b.kind === 'EQUIPMENT'),
      ).toBeUndefined();
    });
  });

  describe('POST /accounting/cost-centers/:id/unit-link', () => {
    it('permitido: vincula la unidad, queda el evento; repetirlo es idempotente', async () => {
      const cc = await costCenter(orgA.practiceId);
      const res = await http()
        .post(`/accounting/cost-centers/${cc}/unit-link`)
        .set(owner())
        .send({ clinicalUnitId: unitA })
        .expect(200);
      expect(res.body).toEqual({
        id: cc,
        practiceId: orgA.practiceId,
        clinicalUnitId: unitA,
      });
      const repetido = await http()
        .post(`/accounting/cost-centers/${cc}/unit-link`)
        .set(owner())
        .send({ clinicalUnitId: unitA })
        .expect(200);
      expect(repetido.body.clinicalUnitId).toBe(unitA);
      expect(
        await events('accounting.cost_center.unit_linked', cc),
      ).toHaveLength(1);
    });

    it('un segundo centro de costo ACTIVO para la misma unidad es 409 UNIT_ALREADY_HAS_COST_CENTER', async () => {
      const unit = await createUnit(ctx, orgA, `UN-DUP-${suffix}`, 'Dup');
      const first = await costCenter(orgA.practiceId);
      const second = await costCenter(orgA.practiceId);
      await http()
        .post(`/accounting/cost-centers/${first}/unit-link`)
        .set(owner())
        .send({ clinicalUnitId: unit })
        .expect(200);
      const res = await http()
        .post(`/accounting/cost-centers/${second}/unit-link`)
        .set(owner())
        .send({ clinicalUnitId: unit })
        .expect(409);
      expect(res.body.reason).toBe('UNIT_ALREADY_HAS_COST_CENTER');
      // uno inactivo sí puede apuntar a la misma unidad
      const inactivo = await costCenter(
        orgA.practiceId,
        CONCEPTS.STATE_EXPIRED,
      );
      await http()
        .post(`/accounting/cost-centers/${inactivo}/unit-link`)
        .set(owner())
        .send({ clinicalUnitId: unit })
        .expect(200);
    });

    it('dos vínculos simultáneos a la misma unidad: exactamente uno gana (la base es la red)', async () => {
      const unit = await createUnit(ctx, orgA, `UN-RACE-${suffix}`, 'Carrera');
      const [c1, c2] = [
        await costCenter(orgA.practiceId),
        await costCenter(orgA.practiceId),
      ];
      const results = await Promise.all(
        [c1, c2].map((cc) =>
          http()
            .post(`/accounting/cost-centers/${cc}/unit-link`)
            .set(owner())
            .send({ clinicalUnitId: unit }),
        ),
      );
      expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
      const linked = await sql(
        'select id from accounting.cost_centers where clinical_unit_id = ? and status_concept_id = ?',
        [unit, CONCEPTS.STATE_ACTIVE],
      );
      expect(linked).toHaveLength(1);
    });

    it('fail-closed por tenant y por rol', async () => {
      const cc = await costCenter(orgA.practiceId);
      const ccB = await costCenter(orgB.practiceId);
      const unitB = await createUnit(ctx, orgB, `UN-B-${suffix}`, 'B');
      // centro de costo ajeno / unidad ajena / inexistente: 404
      await http()
        .post(`/accounting/cost-centers/${ccB}/unit-link`)
        .set(owner())
        .send({ clinicalUnitId: unitA })
        .expect(404);
      const unidadAjena = await http()
        .post(`/accounting/cost-centers/${cc}/unit-link`)
        .set(owner())
        .send({ clinicalUnitId: unitB })
        .expect(404);
      expect(unidadAjena.body.reason).toBe('COST_CENTER_UNIT_NOT_FOUND');
      await http()
        .post(`/accounting/cost-centers/${randomUUID()}/unit-link`)
        .set(owner())
        .send({ clinicalUnitId: unitA })
        .expect(404);
      // Enfermería: 403
      const res = await http()
        .post(`/accounting/cost-centers/${cc}/unit-link`)
        .set(as(nurse.token, orgA.tenantId))
        .send({ clinicalUnitId: unitA })
        .expect(403);
      expect(res.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
      expect(
        (
          await sql(
            'select clinical_unit_id from accounting.cost_centers where id = ?',
            [cc],
          )
        )[0].clinical_unit_id,
      ).toBeNull();
    });

    it('una unidad de otra práctica del mismo tenant es 422; una unidad clausurada, 422', async () => {
      const cc = await costCenter(orgA.practiceId);
      const retired = await createUnit(
        ctx,
        orgA,
        `UN-RET-${suffix}`,
        'Retirada',
      );
      await sql(
        'update practice.clinical_units set status_concept_id = ? where id = ?',
        [PRAC.UNIT_RETIRED, retired],
      );
      const res = await http()
        .post(`/accounting/cost-centers/${cc}/unit-link`)
        .set(owner())
        .send({ clinicalUnitId: retired })
        .expect(422);
      expect(res.body.reason).toBe('COST_CENTER_UNIT_RETIRED');
    });
  });

  describe('carrera ubicar vs clausurar: nunca queda un activo en un espacio retirado', () => {
    /** Conexión propia (otra transacción) a la misma base. */
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

    it('la clausura toma la fila del espacio (for update) y recolecta sus bloqueos; el PATCH concurrente espera, ve SPACE_RETIRED y no escribe nada', async () => {
      const space = await room(orgA);
      const id = await item(orgA.practiceId);
      const retiro = await connect();
      try {
        // «Clausura»: bloquea la fila ANTES de recolectar los bloqueos (lo que el flujo de
        // retiro debe hacer); no hay activos todavía, así que «no hay bloqueos».
        await retiro.query('begin');
        await retiro.query(
          "select set_config('app.system_context', 'true', true)",
        );
        await retiro.query(
          'select id from practice.care_spaces where id = $1 for update',
          [space.id],
        );
        const sinActivos = await retiro.query(
          'select count(*)::int as n from accounting.infrastructure_items where care_space_id = $1',
          [space.id],
        );
        expect(sinActivos.rows[0].n).toBe(0);

        let terminado = false;
        const ubicar = http()
          .patch(`/accounting/infrastructure-items/${id}`)
          .set(owner())
          .send({ careSpaceId: space.id })
          .then((res) => {
            terminado = true;
            return res;
          });
        // El PATCH tiene que quedarse esperando el bloqueo de la fila.
        await new Promise((resolve) => setTimeout(resolve, 1500));
        expect(terminado).toBe(false);

        await retiro.query(
          'update practice.care_spaces set status_concept_id = $1, valid_to = now() where id = $2',
          [PRAC.SPACE_RETIRED, space.id],
        );
        await retiro.query('commit');

        const res = await ubicar;
        expect(res.status).toBe(422);
        expect(res.body.reason).toBe('INFRASTRUCTURE_SPACE_RETIRED');
        expect(await located(id)).toBeNull();
      } finally {
        await retiro.query('rollback').catch(() => undefined);
        await retiro.end();
      }
    }, 60000);

    it('si el PATCH gana, la clausura (que espera la fila) ya ve el activo como bloqueo', async () => {
      const space = await room(orgA);
      const id = await item(orgA.practiceId);
      await http()
        .patch(`/accounting/infrastructure-items/${id}`)
        .set(owner())
        .send({ careSpaceId: space.id })
        .expect(200);
      const retiro = await connect();
      try {
        await retiro.query('begin');
        await retiro.query(
          "select set_config('app.system_context', 'true', true)",
        );
        await retiro.query(
          'select id from practice.care_spaces where id = $1 for update',
          [space.id],
        );
        const bloqueos = await retiro.query(
          'select count(*)::int as n from accounting.infrastructure_items where care_space_id = $1',
          [space.id],
        );
        // Con el activo ya escrito, la recolección lo ve: la clausura se rechaza.
        expect(bloqueos.rows[0].n).toBe(1);
        await retiro.query('rollback');
      } finally {
        await retiro.end();
      }
      expect(await located(id)).toBe(space.id);
    });

    it('ubicar y clausurar a la vez (clausura que toma la fila primero) nunca deja un activo colgando de un retirado', async () => {
      const outcomes: string[] = [];
      for (let round = 0; round < 3; round += 1) {
        const space = await room(orgA);
        const id = await item(orgA.practiceId);
        const retiro = await connect();
        try {
          await retiro.query('begin');
          await retiro.query(
            "select set_config('app.system_context', 'true', true)",
          );
          await retiro.query(
            'select id from practice.care_spaces where id = $1 for update',
            [space.id],
          );
          const ubicar = http()
            .patch(`/accounting/infrastructure-items/${id}`)
            .set(owner())
            .send({ careSpaceId: space.id });
          const pending = ubicar.then((r) => r);
          await new Promise((resolve) =>
            setTimeout(resolve, 300 * (round + 1)),
          );
          const hay = await retiro.query(
            'select count(*)::int as n from accounting.infrastructure_items where care_space_id = $1',
            [space.id],
          );
          if (hay.rows[0].n === 0) {
            await retiro.query(
              'update practice.care_spaces set status_concept_id = $1 where id = $2',
              [PRAC.SPACE_RETIRED, space.id],
            );
          }
          await retiro.query('commit');
          const res = await pending;
          outcomes.push(String(res.status));
          const estado = (
            await sql(
              'select status_concept_id from practice.care_spaces where id = ?',
              [space.id],
            )
          )[0].status_concept_id;
          const colgado = await located(id);
          // exactamente una gana: o el espacio quedó retirado sin activo, o el activo quedó ubicado en uno vivo
          expect(estado === PRAC.SPACE_RETIRED && colgado !== null).toBe(false);
          expect(estado === PRAC.SPACE_RETIRED ? colgado === null : true).toBe(
            true,
          );
        } finally {
          await retiro.end();
        }
      }
      expect(outcomes.every((s) => s === '422')).toBe(true);
    }, 90000);
  });
});
