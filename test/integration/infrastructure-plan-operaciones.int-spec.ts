import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, type TestContext } from './harness';
import {
  como,
  comoDueno,
  createPlainMember,
  createSpace,
  ifMatch,
  rect,
  registerOrg,
  sql,
  type PlanOrg,
} from './plan-fixtures';

/**
 * F1c · Plano de planta · operaciones sueltas de dibujo (CONTRATO-PLANO §3.4):
 * dibujar, mover y quitar una ubicación; agregar, editar y quitar un elemento. Contra
 * la base real, por HTTP, sin mocks.
 *
 * Por endpoint: el caso permitido (con SELECT de la fila, del `layout_version` y del
 * evento), el 404 de otro tenant, el 403 de quien sólo lee la estructura y el 412 de
 * una versión vieja. Los rechazos comprueban que la base no cambió.
 */
describe('Infraestructura F1c · plano · operaciones sueltas', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  let orgA: PlanOrg;
  let orgB: PlanOrg;
  let lector: { userId: string; token: string };
  let plan: any;
  const ids: Record<string, string> = {};

  const filas = (text: string, params: unknown[] = []) =>
    sql<any>(ctx, text, params);
  const layoutVersion = async (): Promise<number> =>
    (
      await filas(
        'select layout_version from practice.floor_plans where id = ?',
        [plan.id],
      )
    )[0].layout_version;
  const placementOf = async (spaceId: string) =>
    (
      await filas(
        'select id, row_version, floor_plan_id, tenant_id from practice.space_placements where care_space_id = ?',
        [spaceId],
      )
    )[0];
  const events = (type: string) =>
    filas(
      `select * from messaging.domain_events where event_type = ? and aggregate_id = ?`,
      [type, plan.id],
    );

  const mk = (code: string, form: string, fn: string, parent?: string) =>
    createSpace(ctx, orgA, {
      code,
      name: `Espacio ${code}`,
      formCode: `LOC_FORM_${form}`,
      functionCode: `SPACE_FN_${fn}`,
      parentSpaceId: parent,
    });

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    orgA = await registerOrg(ctx, 'A', sufijo);
    orgB = await registerOrg(ctx, 'B', sufijo);
    lector = await createPlainMember(ctx, orgA, 'lector');
    ids.edif = (await mk('EDIF', 'BUILDING', 'BUILDING_GENERIC')).id;
    ids.piso = (await mk('PISO-1', 'LEVEL', 'LEVEL_GENERIC', ids.edif)).id;
    ids.sala = (await mk('SALA-A', 'WARD', 'WARD_GENERIC', ids.piso)).id;
    ids.h1 = (await mk('HAB-1', 'ROOM', 'INPATIENT_ROOM', ids.sala)).id;
    ids.h2 = (await mk('HAB-2', 'ROOM', 'INPATIENT_ROOM', ids.sala)).id;
    plan = (
      await http()
        .post(`/sites/${orgA.siteId}/floor-plans`)
        .set(comoDueno(orgA))
        .send({
          code: 'PLANO-OP',
          name: 'Piso 1',
          anchorSpaceId: ids.piso,
          widthM: 40,
          heightM: 20,
        })
        .expect(201)
    ).body;
  }, 240000);

  afterAll(async () => {
    await ctx?.app.close();
  });

  describe('ubicaciones', () => {
    it('POST /floor-plans/:id/placements dibuja un espacio: 201, fila, versión del lienzo, evento', async () => {
      // la sala contiene a las habitaciones: se dibuja primero
      await http()
        .post(`/floor-plans/${plan.id}/placements`)
        .set(comoDueno(orgA))
        .send({ spaceId: ids.sala, geometry: rect(1, 1, 30, 15) })
        .expect(201);
      const antes = await layoutVersion();
      const res = await http()
        .post(`/floor-plans/${plan.id}/placements`)
        .set(comoDueno(orgA))
        .send({ spaceId: ids.h1, geometry: rect(2, 2, 5, 8) })
        .expect(201);
      expect(res.body.placementId).toEqual(expect.any(String));
      expect(res.body.applied.placed).toBe(1);
      const fila = await placementOf(ids.h1);
      expect(fila).toMatchObject({
        id: res.body.placementId,
        floor_plan_id: plan.id,
        tenant_id: orgA.tenantId,
        row_version: 1,
      });
      expect(await layoutVersion()).toBe(antes + 1);
      expect(res.body.layoutVersion).toBe(antes + 1);
      expect(
        (await events('practice.floor_plan.layout_changed')).length,
      ).toBeGreaterThan(0);
    });

    it('fail-closed: el espacio de otro tenant no se dibuja (404) y quien sólo lee la estructura no dibuja (403)', async () => {
      const otro = await createSpace(ctx, orgB, {
        code: 'HAB-B',
        name: 'Hab B',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_INPATIENT_ROOM',
      });
      const antes = await layoutVersion();
      await http()
        .post(`/floor-plans/${plan.id}/placements`)
        .set(comoDueno(orgB))
        .send({ spaceId: ids.h2, geometry: rect(10, 2, 5, 8) })
        .expect(404);
      const ajeno = await http()
        .post(`/floor-plans/${plan.id}/placements`)
        .set(comoDueno(orgA))
        .send({ spaceId: otro.id, geometry: rect(10, 2, 5, 8) });
      expect([404, 422]).toContain(ajeno.status);
      await http()
        .post(`/floor-plans/${plan.id}/placements`)
        .set(como(lector.token, orgA.tenantId))
        .send({ spaceId: ids.h2, geometry: rect(10, 2, 5, 8) })
        .expect(403);
      expect(await layoutVersion()).toBe(antes);
      expect(await placementOf(otro.id)).toBeUndefined();
      expect(await placementOf(ids.h2)).toBeUndefined();
    });

    it('PATCH /space-placements/:id mueve el espacio con If-Match; versión vieja 412; otro tenant 404; lector 403', async () => {
      const fila = await placementOf(ids.h1);
      const antes = await layoutVersion();
      await http()
        .patch(`/space-placements/${fila.id}`)
        .set(comoDueno(orgB))
        .set(ifMatch(fila.row_version))
        .send({ geometry: rect(3, 3, 5, 8) })
        .expect(404);
      await http()
        .patch(`/space-placements/${fila.id}`)
        .set(como(lector.token, orgA.tenantId))
        .set(ifMatch(fila.row_version))
        .send({ geometry: rect(3, 3, 5, 8) })
        .expect(403);
      await http()
        .patch(`/space-placements/${fila.id}`)
        .set(comoDueno(orgA))
        .set(ifMatch(fila.row_version + 5))
        .send({ geometry: rect(3, 3, 5, 8) })
        .expect(412);
      expect(await layoutVersion()).toBe(antes);

      const ok = await http()
        .patch(`/space-placements/${fila.id}`)
        .set(comoDueno(orgA))
        .set(ifMatch(fila.row_version))
        .send({ geometry: rect(3, 3, 5, 8) })
        .expect(200);
      expect(ok.body.applied.moved).toBe(1);
      const movida = await placementOf(ids.h1);
      expect(movida.row_version).toBe(fila.row_version + 1);
      const [x] = await filas(
        'select (bbox[1])[0]::float8 as x from practice.space_placements where id = ?',
        [fila.id],
      );
      expect(x.x).toBe(3);
      expect(await layoutVersion()).toBe(antes + 1);
    });
  });

  describe('elementos', () => {
    let wallId: string;
    let doorId: string;

    it('POST /floor-plans/:id/elements agrega un muro: 201 y la fila queda en el tenant del lienzo', async () => {
      const antes = await layoutVersion();
      wallId = randomUUID();
      const res = await http()
        .post(`/floor-plans/${plan.id}/elements`)
        .set(comoDueno(orgA))
        .send({
          id: wallId,
          kind: 'WALL',
          vertices: [
            [2, 12],
            [12, 12],
          ],
          thicknessM: 0.15,
        })
        .expect(201);
      expect(res.body.applied.elementsUpserted).toBe(1);
      const [fila] = await filas(
        'select floor_plan_id, tenant_id, kind, row_version from practice.plan_elements where id = ?',
        [wallId],
      );
      expect(fila).toMatchObject({
        floor_plan_id: plan.id,
        tenant_id: orgA.tenantId,
        row_version: 1,
      });
      expect(await layoutVersion()).toBe(antes + 1);
    });

    it('fail-closed al agregar: otro tenant 404 y lector 403, sin escribir', async () => {
      const id = randomUUID();
      const body = {
        id,
        kind: 'WALL',
        vertices: [
          [2, 14],
          [12, 14],
        ],
        thicknessM: 0.15,
      };
      const antes = await layoutVersion();
      await http()
        .post(`/floor-plans/${plan.id}/elements`)
        .set(comoDueno(orgB))
        .send(body)
        .expect(404);
      await http()
        .post(`/floor-plans/${plan.id}/elements`)
        .set(como(lector.token, orgA.tenantId))
        .send(body)
        .expect(403);
      expect(
        await filas('select 1 from practice.plan_elements where id = ?', [id]),
      ).toHaveLength(0);
      expect(await layoutVersion()).toBe(antes);
    });

    it('una puerta en ese muro, un espacio de otro tenant como destino no se admite', async () => {
      doorId = randomUUID();
      const otro = await createSpace(ctx, orgB, {
        code: 'HAB-B2',
        name: 'Hab B2',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_INPATIENT_ROOM',
      });
      const res = await http()
        .post(`/floor-plans/${plan.id}/elements`)
        .set(comoDueno(orgA))
        .send({
          id: doorId,
          kind: 'DOOR',
          hostElementId: wallId,
          offsetM: 1,
          widthM: 1,
          swing: 'LEFT',
          swingSide: 'A',
          connectsSpaceAId: otro.id,
        });
      expect([404, 422]).toContain(res.status);
      expect(
        await filas('select 1 from practice.plan_elements where id = ?', [
          doorId,
        ]),
      ).toHaveLength(0);
    });

    it('PATCH /plan-elements/:id edita con If-Match; versión vieja 412; otro tenant 404; lector 403', async () => {
      const [fila] = await filas(
        'select row_version from practice.plan_elements where id = ?',
        [wallId],
      );
      const url = `/plan-elements/${wallId}`;
      await http()
        .patch(url)
        .set(comoDueno(orgB))
        .set(ifMatch(fila.row_version))
        .send({ thicknessM: 0.2 })
        .expect(404);
      await http()
        .patch(url)
        .set(como(lector.token, orgA.tenantId))
        .set(ifMatch(fila.row_version))
        .send({ thicknessM: 0.2 })
        .expect(403);
      await http()
        .patch(url)
        .set(comoDueno(orgA))
        .set(ifMatch(fila.row_version + 3))
        .send({ thicknessM: 0.2 })
        .expect(412);
      await http()
        .patch(url)
        .set(comoDueno(orgA))
        .set(ifMatch(fila.row_version))
        .send({ thicknessM: 0.2 })
        .expect(200);
      const [despues] = await filas(
        'select row_version, thickness_m::float8 as t from practice.plan_elements where id = ?',
        [wallId],
      );
      expect(despues).toMatchObject({
        row_version: fila.row_version + 1,
        t: 0.2,
      });
    });

    it('DELETE /plan-elements/:id quita el elemento; otro tenant 404; lector 403; versión vieja 412', async () => {
      const [fila] = await filas(
        'select row_version from practice.plan_elements where id = ?',
        [wallId],
      );
      const url = `/plan-elements/${wallId}`;
      await http()
        .delete(url)
        .set(comoDueno(orgB))
        .set(ifMatch(fila.row_version))
        .expect(404);
      await http()
        .delete(url)
        .set(como(lector.token, orgA.tenantId))
        .set(ifMatch(fila.row_version))
        .expect(403);
      await http()
        .delete(url)
        .set(comoDueno(orgA))
        .set(ifMatch(fila.row_version + 3))
        .expect(412);
      expect(
        await filas('select 1 from practice.plan_elements where id = ?', [
          wallId,
        ]),
      ).toHaveLength(1);
      const antes = await layoutVersion();
      const ok = await http()
        .delete(url)
        .set(comoDueno(orgA))
        .set(ifMatch(fila.row_version))
        .expect(200);
      expect(ok.body.applied.elementsRemoved).toBe(1);
      expect(
        await filas('select 1 from practice.plan_elements where id = ?', [
          wallId,
        ]),
      ).toHaveLength(0);
      expect(await layoutVersion()).toBe(antes + 1);
    });
  });

  describe('quitar una ubicación', () => {
    it('DELETE /space-placements/:id: otro tenant 404, lector 403, versión vieja 412; luego 200 y la fila desaparece', async () => {
      const fila = await placementOf(ids.h1);
      const url = `/space-placements/${fila.id}`;
      await http()
        .delete(url)
        .set(comoDueno(orgB))
        .set(ifMatch(fila.row_version))
        .expect(404);
      await http()
        .delete(url)
        .set(como(lector.token, orgA.tenantId))
        .set(ifMatch(fila.row_version))
        .expect(403);
      await http()
        .delete(url)
        .set(comoDueno(orgA))
        .set(ifMatch(fila.row_version + 2))
        .expect(412);
      expect(await placementOf(ids.h1)).toBeDefined();
      const antes = await layoutVersion();
      const ok = await http()
        .delete(url)
        .set(comoDueno(orgA))
        .set(ifMatch(fila.row_version))
        .expect(200);
      expect(ok.body.applied.removed).toBe(1);
      expect(await placementOf(ids.h1)).toBeUndefined();
      expect(await layoutVersion()).toBe(antes + 1);
      // el espacio sigue en el árbol: sólo salió del plano
      const [espacio] = await filas(
        'select 1 from practice.care_spaces where id = ?',
        [ids.h1],
      );
      expect(espacio).toBeDefined();
    });
  });
});
