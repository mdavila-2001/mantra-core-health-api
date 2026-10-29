import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import {
  como,
  comoDueno,
  createPlainMember,
  createSpace,
  createStaffUser,
  ifMatch,
  rect,
  registerOrg,
  sql,
  type PlanOrg,
} from './plan-fixtures';

/**
 * F1c · Plano de planta · lienzos y dibujo (CONTRATO-PLANO §3.2–§3.4), contra la
 * base real: HTTP completo, sin mocks.
 *
 * Por endpoint hay un caso permitido y uno que debe fallar cerrado (otro
 * tenant → 404, rol sin la acción → 403). Los rechazos de dibujo comprueban
 * también que la base no cambió.
 */
describe('Infraestructura F1c · plano · lienzos y dibujo', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  let orgA: PlanOrg;
  let orgB: PlanOrg;

  const ids: Record<string, string> = {};
  let plan: any; // lienzo del piso (ancla: PISO)

  const filas = (text: string, params: unknown[] = []) =>
    sql<any>(ctx, text, params);

  const mkSpace = (
    code: string,
    form: string,
    fn: string,
    parent?: string,
    extra: Record<string, unknown> = {},
  ) =>
    createSpace(ctx, orgA, {
      code,
      name: `Espacio ${code}`,
      formCode: `LOC_FORM_${form}`,
      functionCode: `SPACE_FN_${fn}`,
      parentSpaceId: parent,
      ...extra,
    });

  const layout = (
    token = orgA.token,
    tenant = orgA.tenantId,
    planId = plan.id,
  ) => http().get(`/floor-plans/${planId}/layout`).set(como(token, tenant));

  const patchLayout = (
    body: Record<string, unknown>,
    version: number,
    query = '',
    headers = comoDueno(orgA),
  ) =>
    http()
      .patch(`/floor-plans/${plan.id}/layout${query}`)
      .set(headers)
      .set(ifMatch(version))
      .send(body);

  const versionOf = async (planId = plan.id): Promise<number> =>
    (
      await filas(
        'select layout_version from practice.floor_plans where id = ?',
        [planId],
      )
    )[0].layout_version;

  const count = async (table: string, planId = plan.id): Promise<number> =>
    (
      await filas(
        `select count(*)::int as n from practice.${table} where floor_plan_id = ?`,
        [planId],
      )
    )[0].n;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    orgA = await registerOrg(ctx, 'A', sufijo);
    orgB = await registerOrg(ctx, 'B', sufijo);

    ids.edif = (await mkSpace('EDIF', 'BUILDING', 'BUILDING_GENERIC')).id;
    ids.piso = (
      await mkSpace('PISO-1', 'LEVEL', 'LEVEL_GENERIC', ids.edif, {
        floorNumber: 1,
      })
    ).id;
    ids.sala = (await mkSpace('SALA-A', 'WARD', 'WARD_GENERIC', ids.piso)).id;
    ids.h101 = (
      await mkSpace('HAB-101', 'ROOM', 'INPATIENT_ROOM', ids.sala, {
        areaM2: 42.5,
      })
    ).id;
    ids.h102 = (
      await mkSpace('HAB-102', 'ROOM', 'INPATIENT_ROOM', ids.sala)
    ).id;
    ids.h103 = (
      await mkSpace('HAB-103', 'ROOM', 'INPATIENT_ROOM', ids.sala)
    ).id;
    for (const [key, room] of [
      ['c101a', ids.h101],
      ['c101b', ids.h101],
      ['c102a', ids.h102],
    ] as const) {
      ids[key] = (
        await mkSpace(key.toUpperCase(), 'BED', 'BED_STANDARD', room, {
          bedCategoryCode: 'BED_CAT_PRIVATE',
          censable: true,
        })
      ).id;
    }
    ids.cons = (
      await mkSpace('CONS-1', 'ROOM', 'CONSULTING_ROOM', ids.piso)
    ).id;
    ids.bOtro = (await mkSpace('B-EDIF-2', 'BUILDING', 'BUILDING_GENERIC')).id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  // ---------------------------------------------------------------- catálogo
  describe('catálogo', () => {
    it('GET /practice/floor-plan-catalog trae límites, tipos de elemento, plantillas y reglas del fondo', async () => {
      const res = await http()
        .get(`/practice/floor-plan-catalog?siteId=${orgA.siteId}`)
        .set(comoDueno(orgA))
        .expect(200);
      expect(res.body.limits).toMatchObject({
        maxVertices: 64,
        maxItemsPerPatch: 500,
        maxItemsPerReplace: 5000,
        maxPageSize: 2000,
      });
      expect(res.body.defaults).toMatchObject({
        gridSizeM: 0.5,
        contactToleranceM: 0.01,
      });
      expect(res.body.elementKinds.map((k: any) => k.code)).toEqual(
        expect.arrayContaining(['WALL', 'DOOR', 'STAIRS', 'ANNOTATION']),
      );
      expect(res.body.backgroundRules).toMatchObject({
        svgExcluded: true,
        mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
      });
      expect(res.body.roomTemplates.length).toBeGreaterThan(0);
    });

    it('sin sesión 401; con una sede de otro tenant 404', async () => {
      await http().get('/practice/floor-plan-catalog').expect(401);
      await http()
        .get(`/practice/floor-plan-catalog?siteId=${orgA.siteId}`)
        .set(comoDueno(orgB))
        .expect(404);
    });
  });

  // ------------------------------------------------------------------ lienzos
  describe('lienzos', () => {
    it('crear un lienzo anclado a un piso: 201, versión 1, historia y evento en la misma transacción', async () => {
      const res = await http()
        .post(`/sites/${orgA.siteId}/floor-plans`)
        .set(comoDueno(orgA))
        .send({
          code: 'PLANO-P1',
          name: 'Piso 1',
          anchorSpaceId: ids.piso,
          widthM: 40,
          heightM: 20,
          elevationM: 3.6,
        })
        .expect(201);
      plan = res.body;
      expect(plan).toMatchObject({
        code: 'PLANO-P1',
        widthM: 40,
        heightM: 20,
        elevationM: 3.6,
        gridSizeM: 0.5,
        snapToGrid: true,
        contactToleranceM: 0.01,
        layoutVersion: 1,
        rowVersion: 1,
        retired: false,
        background: null,
        anchor: { spaceId: ids.piso, code: 'PISO-1', form: 'LOC_FORM_LEVEL' },
        viewer: { canEditPlan: true, canOpenSpaceFile: true },
      });
      const [fila] = await filas(
        'select tenant_id, practice_site_id, layout_version from practice.floor_plans where id = ?',
        [plan.id],
      );
      expect(fila).toMatchObject({
        tenant_id: orgA.tenantId,
        practice_site_id: orgA.siteId,
      });
      const hist = await filas(
        'select revision_no, tenant_id from audit.floor_plans_history where floor_plan_id = ?',
        [plan.id],
      );
      expect(hist).toEqual([{ revision_no: 1, tenant_id: orgA.tenantId }]);
      const eventos = await filas(
        `select event_type, aggregate_type, payload_json from messaging.domain_events
          where aggregate_id = ? and event_type = 'practice.floor_plan.created'`,
        [plan.id],
      );
      expect(eventos).toHaveLength(1);
      expect(eventos[0].payload_json).toMatchObject({
        floorPlanId: plan.id,
        siteId: orgA.siteId,
        anchorSpaceId: ids.piso,
        layoutVersion: 1,
      });
    });

    it('rechaza código repetido, ancla ya tomada y segundo campus con su reason', async () => {
      const repetido = await http()
        .post(`/sites/${orgA.siteId}/floor-plans`)
        .set(comoDueno(orgA))
        .send({
          code: 'PLANO-P1',
          name: 'Otro',
          anchorSpaceId: ids.edif,
          widthM: 10,
          heightM: 10,
        })
        .expect(409);
      expect(repetido.body.reason).toBe('PLAN_CODE_TAKEN');
      const anclaTomada = await http()
        .post(`/sites/${orgA.siteId}/floor-plans`)
        .set(comoDueno(orgA))
        .send({
          code: 'PLANO-P1B',
          name: 'Otro',
          anchorSpaceId: ids.piso,
          widthM: 10,
          heightM: 10,
        })
        .expect(409);
      expect(anclaTomada.body.reason).toBe('PLAN_ANCHOR_TAKEN');
      await http()
        .post(`/sites/${orgA.siteId}/floor-plans`)
        .set(comoDueno(orgA))
        .send({ code: 'CAMPUS', name: 'Campus', widthM: 100, heightM: 70 })
        .expect(201);
      const segundo = await http()
        .post(`/sites/${orgA.siteId}/floor-plans`)
        .set(comoDueno(orgA))
        .send({ code: 'CAMPUS-2', name: 'Campus 2', widthM: 100, heightM: 70 })
        .expect(409);
      expect(segundo.body.reason).toBe('PLAN_CAMPUS_EXISTS');
    });

    it('422 si la forma del ancla no sirve (un local) o el tamaño es inválido', async () => {
      const forma = await http()
        .post(`/sites/${orgA.siteId}/floor-plans`)
        .set(comoDueno(orgA))
        .send({
          code: 'X1',
          name: 'x',
          anchorSpaceId: ids.h101,
          widthM: 10,
          heightM: 10,
        })
        .expect(422);
      expect(forma.body.reason).toBe('PLAN_ANCHOR_FORM_INVALID');
      const tamano = await http()
        .post(`/sites/${orgA.siteId}/floor-plans`)
        .set(comoDueno(orgA))
        .send({
          code: 'X2',
          name: 'x',
          anchorSpaceId: ids.bOtro,
          widthM: 0,
          heightM: 99999,
        })
        .expect(422);
      expect(tamano.body.reason).toBe('PLAN_CANVAS_INVALID');
      expect(tamano.body.details.errors.map((e: any) => e.property)).toEqual(
        expect.arrayContaining(['widthM', 'heightM']),
      );
    });

    it('listar la sede: resumen con recuentos; el detalle repite capacidades de quien mira', async () => {
      const lista = await http()
        .get(`/sites/${orgA.siteId}/floor-plans`)
        .set(comoDueno(orgA))
        .expect(200);
      const resumen = lista.body.find((p: any) => p.id === plan.id);
      expect(resumen).toMatchObject({
        code: 'PLANO-P1',
        layoutVersion: 1,
        counts: { placed: 0, elements: 0 },
        anchor: { code: 'PISO-1' },
      });
      expect(resumen.counts.unplaced).toBeGreaterThan(0);
      const detalle = await http()
        .get(`/floor-plans/${plan.id}`)
        .set(comoDueno(orgA))
        .expect(200);
      expect(detalle.body.viewer.canEditPlan).toBe(true);
    });

    it('PATCH con If-Match: cambia el nombre; versión vieja 412; sin cabecera 428', async () => {
      const ok = await http()
        .patch(`/floor-plans/${plan.id}`)
        .set(comoDueno(orgA))
        .set(ifMatch(plan.rowVersion))
        .send({ name: 'Piso 1 · Internación' })
        .expect(200);
      expect(ok.body).toMatchObject({
        name: 'Piso 1 · Internación',
        rowVersion: 2,
      });
      plan = ok.body;
      const viejo = await http()
        .patch(`/floor-plans/${plan.id}`)
        .set(comoDueno(orgA))
        .set(ifMatch(1))
        .send({ name: 'Pisada' })
        .expect(412);
      expect(viejo.body.reason).toBe('ROW_VERSION_MISMATCH');
      await http()
        .patch(`/floor-plans/${plan.id}`)
        .set(comoDueno(orgA))
        .send({ name: 'x' })
        .expect(428);
      const [fila] = await filas(
        'select name from practice.floor_plans where id = ?',
        [plan.id],
      );
      expect(fila.name).toBe('Piso 1 · Internación');
    });
  });

  // ---------------------------------------------------------- dibujo y errores
  describe('dibujo', () => {
    it('layout vacío: ETag débil y 304 con If-None-Match', async () => {
      const primero = await layout().expect(200);
      expect(primero.body).toMatchObject({
        layoutVersion: 1,
        spaces: [],
        elements: [],
        page: { nextCursor: null, total: 0 },
      });
      const etag = primero.headers.etag as string;
      expect(etag).toMatch(new RegExp(`^W/"fp:${plan.id}:v1:[0-9a-f]+"$`));
      expect(primero.headers['cache-control']).toBe('private, no-cache');
      await layout().set('If-None-Match', etag).expect(304);
    });

    it('guardar el primer dibujo (sala, habitaciones, camas, muro y puerta): todo en una transacción', async () => {
      const wallId = randomUUID();
      const res = await patchLayout(
        {
          upsert: {
            // Desordenado a propósito: la cama antes que su habitación y la sala al final.
            placements: [
              { spaceId: ids.c101a, geometry: rect(3, 3, 1, 2), zOrder: 20 },
              { spaceId: ids.h101, geometry: rect(2, 2, 5, 8.5), zOrder: 10 },
              { spaceId: ids.h102, geometry: rect(7, 2, 5, 8.5), zOrder: 10 },
              { spaceId: ids.sala, geometry: rect(2, 2, 20, 8.5), zOrder: 0 },
            ],
            elements: [
              {
                id: randomUUID(),
                kind: 'DOOR',
                hostElementId: wallId,
                offsetM: 1,
                widthM: 1.2,
                swing: 'LEFT',
                swingSide: 'A',
                connectsSpaceAId: ids.h101,
              },
              {
                id: wallId,
                kind: 'WALL',
                vertices: [
                  [2, 2],
                  [7, 2],
                  [7, 10.5],
                  [2, 10.5],
                  [2, 2],
                ],
                thicknessM: 0.15,
                zOrder: 30,
              },
            ],
          },
        },
        1,
      ).expect(200);
      expect(res.body).toMatchObject({
        layoutVersion: 2,
        applied: {
          placed: 4,
          moved: 0,
          removed: 0,
          elementsUpserted: 2,
          elementsRemoved: 0,
        },
        warnings: [
          // HAB-101: declarada 42,5 m² frente a 42,5 dibujados: sin umbral configurado no hay veredicto.
        ],
      });
      expect(res.body.requestId).toBeTruthy();
      expect(await versionOf()).toBe(2);
      expect(await count('space_placements')).toBe(4);
      expect(await count('plan_elements')).toBe(2);
      // Historia de las tres tablas y evento, con el mismo tenant.
      expect(
        (
          await filas(
            `select count(*)::int as n from audit.space_placements_history h
               join practice.space_placements p on p.id = h.space_placement_id
              where p.floor_plan_id = ? and h.tenant_id = ?`,
            [plan.id, orgA.tenantId],
          )
        )[0].n,
      ).toBe(4);
      expect(
        (
          await filas(
            `select count(*)::int as n from audit.plan_elements_history h
               join practice.plan_elements e on e.id = h.plan_element_id where e.floor_plan_id = ?`,
            [plan.id],
          )
        )[0].n,
      ).toBe(2);
      const evento = await filas(
        `select payload_json from messaging.domain_events
          where aggregate_id = ? and event_type = 'practice.floor_plan.layout_changed'`,
        [plan.id],
      );
      expect(evento).toHaveLength(1);
      expect(evento[0].payload_json).toMatchObject({
        fromVersion: 1,
        toVersion: 2,
        elementsAdded: 2,
        truncated: false,
      });
      expect(evento[0].payload_json.placedSpaceIds).toHaveLength(4);
      // Las derivadas las calcula la base, no el cliente.
      const [derivada] = await filas(
        'select area_calc_m2::float8 as area, sibling_group_id from practice.space_placements where care_space_id = ?',
        [ids.h101],
      );
      expect(derivada).toMatchObject({
        area: 42.5,
        sibling_group_id: ids.sala,
      });
    });

    it('recargar: el layout devuelve lo guardado, con identidad, ruta y datos de la tarjeta (detail=full)', async () => {
      const res = await layout().query({ detail: 'full' }).expect(200);
      expect(res.body.layoutVersion).toBe(2);
      expect(res.body.page.total).toBe(4);
      // Orden del contrato: (zOrder, id). Con zOrder iguales desempata el id, no el código.
      const claves = res.body.spaces.map(
        (s: any) => [s.zOrder, s.placementId] as [number, string],
      );
      expect(claves).toEqual(
        [...claves].sort(
          (a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0),
        ),
      );
      expect(res.body.spaces.map((s: any) => s.code).sort()).toEqual([
        'C101A',
        'HAB-101',
        'HAB-102',
        'SALA-A',
      ]);
      const h101 = res.body.spaces.find((s: any) => s.code === 'HAB-101');
      expect(h101).toMatchObject({
        spaceId: ids.h101,
        inScope: true,
        parentId: ids.sala,
        form: { code: 'LOC_FORM_ROOM' },
        function: { code: 'SPACE_FN_INPATIENT_ROOM' },
        areaCalcM2: 42.5,
        geometry: {
          kind: 'RECT',
          centerXM: 4.5,
          centerYM: 6.25,
          widthM: 5,
          depthM: 8.5,
          rotationDeg: 0,
        },
        bbox: [2, 2, 7, 10.5],
        card: {
          areaDeclaredM2: 42.5,
          // Las camas nacen PLANNED: la cuenta derivada sólo suma las activas (INV-20).
          bedCount: 0,
          path: [
            { code: 'EDIF', form: 'LOC_FORM_BUILDING' },
            { code: 'PISO-1', form: 'LOC_FORM_LEVEL' },
            { code: 'SALA-A', form: 'LOC_FORM_WARD' },
          ],
        },
      });
      expect(res.body.elements).toHaveLength(2);
      const puerta = res.body.elements.find((e: any) => e.kind === 'DOOR');
      expect(puerta).toMatchObject({ offsetM: 1, widthM: 1.2, swing: 'LEFT' });
      expect(puerta.position).toMatchObject({ y: 2 });
      // `lite` no trae la tarjeta.
      const lite = await layout().expect(200);
      expect(lite.body.spaces[0].card).toBeUndefined();
    });

    it('solape de hermanos: 422 PLAN_LAYOUT_INVALID con la figura, su vecino y los m²; la base no cambia', async () => {
      const antes = await versionOf();
      const res = await patchLayout(
        {
          upsert: {
            placements: [{ spaceId: ids.h102, geometry: rect(6, 2, 5, 8.5) }],
          },
        },
        antes,
      ).expect(422);
      expect(res.body.reason).toBe('PLAN_LAYOUT_INVALID');
      expect(res.body.details.errors).toHaveLength(1);
      expect(res.body.details.errors[0]).toMatchObject({
        kind: 'SPACE',
        id: ids.h102,
        code: 'PLAN_SIBLING_OVERLAP',
        field: 'geometry',
        conflictsWith: [
          { kind: 'SPACE', id: ids.h101, code: 'HAB-101', overlapAreaM2: 8.5 },
        ],
        nextAction: { label: expect.any(String) },
      });
      expect(res.body.details.requestId).toBeTruthy();
      expect(await versionOf()).toBe(antes);
      const [h102] = await filas(
        'select (bbox[1])[0]::float8 as x from practice.space_placements where care_space_id = ?',
        [ids.h102],
      );
      expect(h102.x).toBe(7);
    });

    it('pared compartida (tocarse) guarda; hermanos fuera del padre no', async () => {
      const antes = await versionOf();
      await patchLayout(
        {
          upsert: {
            placements: [{ spaceId: ids.h103, geometry: rect(12, 2, 5, 8.5) }],
          },
        },
        antes,
      ).expect(200);
      const fuera = await patchLayout(
        {
          upsert: {
            placements: [{ spaceId: ids.cons, geometry: rect(30, 12, 4, 4) }],
          },
        },
        antes + 1,
      ).expect(200);
      expect(fuera.body.applied.placed).toBe(1);
      // HAB-103 se corre fuera de SALA-A (que llega a x=22): no cabe.
      const cae = await patchLayout(
        {
          upsert: {
            placements: [{ spaceId: ids.h103, geometry: rect(20, 2, 5, 8.5) }],
          },
        },
        antes + 2,
      ).expect(422);
      expect(cae.body.details.errors[0]).toMatchObject({
        id: ids.h103,
        code: 'PLAN_CHILD_OUTSIDE_PARENT',
        conflictsWith: [{ id: ids.sala }],
      });
    });

    it('contención: sacar una cama de su habitación falla; mover la habitación con sus camas en el mismo guardado funciona', async () => {
      const v = await versionOf();
      const afuera = await patchLayout(
        {
          upsert: {
            placements: [{ spaceId: ids.c101a, geometry: rect(9, 3, 1, 2) }],
          },
        },
        v,
      ).expect(422);
      expect(afuera.body.details.errors[0]).toMatchObject({
        id: ids.c101a,
        code: 'PLAN_CHILD_OUTSIDE_PARENT',
      });
      // La habitación sola no puede irse sin su cama...
      const sola = await patchLayout(
        {
          upsert: {
            placements: [{ spaceId: ids.h101, geometry: rect(15, 2, 5, 8.5) }],
          },
        },
        v,
      ).expect(422);
      expect(sola.body.details.errors.map((e: any) => e.code)).toEqual(
        expect.arrayContaining([
          'PLAN_SIBLING_OVERLAP',
          'PLAN_CHILD_OUTSIDE_PARENT',
        ]),
      );
      // ...pero sí junto con ella (HAB-103 ocupa 12..17: se mueve 103 también).
      const juntas = await patchLayout(
        {
          upsert: {
            placements: [
              { spaceId: ids.h103, geometry: rect(17, 2, 5, 8.5) },
              { spaceId: ids.h101, geometry: rect(12, 2, 5, 8.5) },
              { spaceId: ids.c101a, geometry: rect(13, 3, 1, 2) },
            ],
          },
        },
        v,
      ).expect(200);
      expect(juntas.body.applied).toMatchObject({ placed: 0, moved: 3 });
    });

    it('intercambiar dos locales de lugar en un mismo guardado es válido (restricción diferida)', async () => {
      const v = await versionOf();
      const [a] = await filas(
        'select (bbox[1])[0]::float8 as x from practice.space_placements where care_space_id = ?',
        [ids.h101],
      );
      const [b] = await filas(
        'select (bbox[1])[0]::float8 as x from practice.space_placements where care_space_id = ?',
        [ids.h102],
      );
      // Mismas dimensiones: 101 (con su cama) y 102 cambian de lugar.
      const res = await patchLayout(
        {
          upsert: {
            placements: [
              { spaceId: ids.h101, geometry: rect(b.x, 2, 5, 8.5) },
              { spaceId: ids.c101a, geometry: rect(b.x + 1, 3, 1, 2) },
              { spaceId: ids.h102, geometry: rect(a.x, 2, 5, 8.5) },
            ],
          },
        },
        v,
      ).expect(200);
      expect(res.body.applied.moved).toBe(3);
    });

    it('412: otra persona guardó antes; el cuerpo trae la versión vigente', async () => {
      const v = await versionOf();
      const res = await patchLayout(
        {
          upsert: {
            placements: [{ spaceId: ids.cons, geometry: rect(30, 12, 5, 5) }],
          },
        },
        v - 1,
      ).expect(412);
      expect(res.body.reason).toBe('PLAN_VERSION_MISMATCH');
      expect(res.body.details).toMatchObject({
        currentVersion: v,
        expectedVersion: v - 1,
      });
      // También acepta el ETag completo del layout como If-Match.
      const etag = (await layout().expect(200)).headers.etag as string;
      await http()
        .patch(`/floor-plans/${plan.id}/layout`)
        .set(comoDueno(orgA))
        .set('If-Match', etag)
        .send({
          upsert: {
            placements: [{ spaceId: ids.cons, geometry: rect(30, 12, 5, 5) }],
          },
        })
        .expect(200);
      await http()
        .patch(`/floor-plans/${plan.id}/layout`)
        .set(comoDueno(orgA))
        .send({})
        .expect(428);
    });

    it('dryRun valida con la base y deshace: nada se escribe, pero el error sale igual', async () => {
      const v = await versionOf();
      const filasAntes = await count('space_placements');
      const [caja] = await filas(
        'select (bbox[1])[0]::float8 as x, (bbox[1])[1]::float8 as y from practice.space_placements where care_space_id = ?',
        [ids.h101],
      );
      const ok = await patchLayout(
        {
          upsert: {
            placements: [
              {
                spaceId: ids.c101b,
                geometry: rect(caja.x + 2, caja.y + 5, 1, 2),
              },
            ],
          },
        },
        v,
        '?dryRun=true',
      ).expect(200);
      expect(ok.body).toMatchObject({ dryRun: true, applied: { placed: 1 } });
      expect(await versionOf()).toBe(v);
      expect(await count('space_placements')).toBe(filasAntes);
      const mal = await patchLayout(
        {
          upsert: {
            placements: [{ spaceId: ids.c101b, geometry: rect(0, 0, 1, 2) }],
          },
        },
        v,
        '?dryRun=true',
      ).expect(422);
      expect(mal.body.details.errors[0].code).toBe('PLAN_CHILD_OUTSIDE_PARENT');
    });

    it('un espacio con lugar en otro lienzo: 409 PLAN_SPACE_ALREADY_PLACED', async () => {
      const otro = await http()
        .post(`/sites/${orgA.siteId}/floor-plans`)
        .set(comoDueno(orgA))
        .send({
          code: 'PLANO-EDIF',
          name: 'Edificio',
          anchorSpaceId: ids.edif,
          widthM: 60,
          heightM: 30,
        })
        .expect(201);
      const res = await http()
        .patch(`/floor-plans/${otro.body.id}/layout`)
        .set(comoDueno(orgA))
        .set(ifMatch(1))
        .send({
          upsert: {
            placements: [{ spaceId: ids.h101, geometry: rect(2, 2, 5, 5) }],
          },
        })
        .expect(409);
      expect(res.body.reason).toBe('PLAN_SPACE_ALREADY_PLACED');
      expect(res.body.details.conflicts[0]).toMatchObject({
        spaceId: ids.h101,
        floorPlanId: plan.id,
      });
    });

    it('muros y puertas: una puerta fuera del largo del muro es PLAN_OPENING_OUTSIDE_WALL; quitar el muro quita su puerta', async () => {
      const lienzo = await layout().expect(200);
      const muro = lienzo.body.elements.find((e: any) => e.kind === 'WALL');
      const puerta = lienzo.body.elements.find((e: any) => e.kind === 'DOOR');
      const v = await versionOf();
      const larga = await patchLayout(
        {
          upsert: {
            elements: [
              {
                id: randomUUID(),
                kind: 'DOOR',
                hostElementId: muro.id,
                offsetM: 26,
                widthM: 2,
              },
            ],
          },
        },
        v,
      ).expect(422);
      expect(larga.body.details.errors[0]).toMatchObject({
        kind: 'ELEMENT',
        code: 'PLAN_OPENING_OUTSIDE_WALL',
        field: 'size',
      });
      const quitar = await patchLayout(
        { remove: { elementIds: [muro.id] } },
        v,
      ).expect(200);
      expect(quitar.body.applied.elementsRemoved).toBe(2);
      const [restos] = await filas(
        'select count(*)::int as n from practice.plan_elements where id = any(?::uuid[])',
        [`{${muro.id},${puerta.id}}`],
      );
      expect(restos.n).toBe(0);
      // La historia conserva las dos filas borradas, con la revisión final cerrada.
      const hist = await filas(
        `select operation_concept_id is not null as op, valid_to is not null as cerrada
           from audit.plan_elements_history where plan_element_id = ? order by revision_no desc limit 1`,
        [muro.id],
      );
      expect(hist[0]).toMatchObject({ op: true, cerrada: true });
    });

    it('quitar una habitación con camas dibujadas pide cascade; con cascade quita también las camas', async () => {
      const v = await versionOf();
      const sin = await patchLayout(
        { remove: { spaceIds: [ids.h101] } },
        v,
      ).expect(422);
      expect(sin.body.details.errors[0]).toMatchObject({
        id: ids.h101,
        code: 'PLAN_HAS_PLACED_CHILDREN',
        conflictsWith: [{ id: ids.c101a }],
      });
      const con = await patchLayout(
        { remove: { spaceIds: [ids.h101], cascade: true } },
        v,
      ).expect(200);
      expect(con.body.applied.removed).toBe(2);
      const [restos] = await filas(
        'select count(*)::int as n from practice.space_placements where care_space_id = any(?::uuid[])',
        [`{${ids.h101},${ids.c101a}}`],
      );
      expect(restos.n).toBe(0);
      // Sacar del plano no borra el espacio del árbol (INV-PL-09).
      const [espacio] = await filas(
        'select code, parent_space_id from practice.care_spaces where id = ?',
        [ids.h101],
      );
      expect(espacio).toMatchObject({
        code: 'HAB-101',
        parent_space_id: ids.sala,
      });
    });

    it('PUT reemplaza todo: exige confirmRemoval si quita algo; 413 con demasiados ítems', async () => {
      const v = await versionOf();
      const sin = await http()
        .put(`/floor-plans/${plan.id}/layout`)
        .set(comoDueno(orgA))
        .set(ifMatch(v))
        .send({
          placements: [{ spaceId: ids.sala, geometry: rect(2, 2, 20, 8.5) }],
          elements: [],
        })
        .expect(422);
      expect(sin.body.reason).toBe('PLAN_REMOVAL_NOT_CONFIRMED');
      expect(sin.body.details.wouldRemove.spaces).toBeGreaterThan(0);
      const con = await http()
        .put(`/floor-plans/${plan.id}/layout`)
        .set(comoDueno(orgA))
        .set(ifMatch(v))
        .send({
          placements: [{ spaceId: ids.sala, geometry: rect(2, 2, 20, 8.5) }],
          elements: [],
          confirmRemoval: true,
        })
        .expect(200);
      expect(con.body.applied.removed).toBeGreaterThan(0);
      expect(await count('space_placements')).toBe(1);

      const demasiados = await patchLayout(
        {
          remove: {
            elementIds: Array.from({ length: 501 }, () => randomUUID()),
          },
        },
        await versionOf(),
      ).expect(413);
      expect(demasiados.body.reason).toBe('PLAN_TOO_MANY_ITEMS');
    });

    it('paginación keyset, ventana y foco por área (filter / flag)', async () => {
      // Se vuelve a dibujar un conjunto para paginar.
      const v = await versionOf();
      await patchLayout(
        {
          upsert: {
            placements: [
              { spaceId: ids.h101, geometry: rect(2, 2, 5, 8.5), zOrder: 10 },
              { spaceId: ids.h102, geometry: rect(7, 2, 5, 8.5), zOrder: 10 },
              { spaceId: ids.h103, geometry: rect(12, 2, 5, 8.5), zOrder: 10 },
              { spaceId: ids.c101a, geometry: rect(3, 3, 1, 2), zOrder: 20 },
            ],
          },
        },
        v,
      ).expect(200);
      const p1 = await layout()
        .query({ limit: 2, include: 'spaces' })
        .expect(200);
      expect(p1.body.spaces).toHaveLength(2);
      expect(p1.body.page.total).toBeGreaterThanOrEqual(5);
      expect(p1.body.page.nextCursor).toBeTruthy();
      const p2 = await layout()
        .query({ limit: 2, include: 'spaces', cursor: p1.body.page.nextCursor })
        .expect(200);
      const vistos = [...p1.body.spaces, ...p2.body.spaces].map(
        (s: any) => s.spaceId,
      );
      expect(new Set(vistos).size).toBe(4);
      expect(p2.body.elements).toEqual([]);
      // Ventana: sólo lo que toca x 2..7.
      const ventana = await layout()
        .query({ bbox: '2,2,6,6', include: 'spaces' })
        .expect(200);
      expect(ventana.body.spaces.map((s: any) => s.code).sort()).toEqual([
        'C101A',
        'HAB-101',
        'SALA-A',
      ]);
      // Foco: el subárbol de HAB-101.
      const filtro = await layout()
        .query({ focusSpaceId: ids.h101, unitMode: 'filter' })
        .expect(200);
      expect(filtro.body.spaces.map((s: any) => s.code).sort()).toEqual([
        'C101A',
        'HAB-101',
      ]);
      expect(filtro.body.focus).toMatchObject({ bbox: [2, 2, 7, 10.5] });
      expect(filtro.body.focus.spaceIds.sort()).toEqual(
        [ids.c101a, ids.h101].sort(),
      );
      const bandera = await layout()
        .query({ focusSpaceId: ids.h101, unitMode: 'flag' })
        .expect(200);
      expect(bandera.body.spaces.length).toBeGreaterThan(2);
      expect(
        bandera.body.spaces
          .filter((s: any) => s.inFocus)
          .map((s: any) => s.code)
          .sort(),
      ).toEqual(['C101A', 'HAB-101']);
      await layout()
        .query({ focusSpaceId: ids.h101, unitId: randomUUID() })
        .expect(422);
    });

    it('un lienzo clausurado no admite dibujo (409 PLAN_RETIRED); reabrirlo lo permite', async () => {
      const [{ row_version }] = await filas(
        'select row_version from practice.floor_plans where id = ?',
        [plan.id],
      );
      const cerrado = await http()
        .post(`/floor-plans/${plan.id}/lifecycle`)
        .set(comoDueno(orgA))
        .set(ifMatch(row_version))
        .send({ action: 'retire', reason: 'Remodelación' })
        .expect(200);
      expect(cerrado.body.retired).toBe(true);
      const v = await versionOf();
      const res = await patchLayout(
        { remove: { spaceIds: [ids.c101a] } },
        v,
      ).expect(409);
      expect(res.body.reason).toBe('PLAN_RETIRED');
      await http()
        .post(`/floor-plans/${plan.id}/lifecycle`)
        .set(comoDueno(orgA))
        .set(ifMatch(cerrado.body.rowVersion))
        .send({ action: 'retire', reason: 'Otra vez' })
        .expect(409);
      const abierto = await http()
        .post(`/floor-plans/${plan.id}/lifecycle`)
        .set(comoDueno(orgA))
        .set(ifMatch(cerrado.body.rowVersion))
        .send({ action: 'reactivate', reason: 'Listo' })
        .expect(200);
      expect(abierto.body.retired).toBe(false);
      const eventos = await filas(
        `select payload_json->>'action' as action from messaging.domain_events
          where aggregate_id = ? and event_type = 'practice.floor_plan.lifecycle_changed' order by occurred_at`,
        [plan.id],
      );
      expect(eventos.map((e: any) => e.action)).toEqual([
        'retire',
        'reactivate',
      ]);
    });

    it('mover en el árbol un espacio dibujado bajo un padre que no está dibujado: 409 SPACE_MOVE_BREAKS_PLAN y nada cambia', async () => {
      const salaB = await mkSpace('SALA-B', 'WARD', 'WARD_GENERIC', ids.piso);
      const [antes] = await filas(
        `select cs.row_version, cs.parent_space_id,
                (select count(*)::int from practice.space_placements sp where sp.care_space_id = cs.id) as dibujado
           from practice.care_spaces cs where cs.id = ?`,
        [ids.h101],
      );
      expect(antes.dibujado).toBe(1);
      const res = await http()
        .post(`/care-spaces/${ids.h101}/move`)
        .set(comoDueno(orgA))
        .set(ifMatch(antes.row_version))
        .send({ parentSpaceId: salaB.id })
        .expect(409);
      expect(res.body.reason).toBe('SPACE_MOVE_BREAKS_PLAN');
      expect(res.body.details).toMatchObject({ spaceId: ids.h101 });
      const [despues] = await filas(
        'select row_version, parent_space_id from practice.care_spaces where id = ?',
        [ids.h101],
      );
      expect(despues).toEqual({
        row_version: antes.row_version,
        parent_space_id: ids.sala,
      });

      // Control: un espacio que no está dibujado se mueve sin que el plano intervenga.
      const libre = await mkSpace(
        'HAB-LIBRE',
        'ROOM',
        'INPATIENT_ROOM',
        ids.sala,
      );
      await http()
        .post(`/care-spaces/${libre.id}/move`)
        .set(comoDueno(orgA))
        .set(ifMatch(libre.rowVersion))
        .send({ parentSpaceId: salaB.id })
        .expect(200);
    });
  });

  // ------------------------------------------------------------------ permisos
  describe('permisos y alcance', () => {
    it('un miembro del personal sin rol de estructura lee el plano pero no lo edita: 403 INFRA_ACTION_NOT_ALLOWED', async () => {
      const miembro = await createPlainMember(ctx, orgA, 'lector');
      const lectura = await layout(miembro.token).expect(200);
      expect(lectura.body.viewer).toMatchObject({
        canEditPlan: false,
        canSeeState: false,
        canSeePatient: false,
        scope: 'NONE',
      });
      expect(lectura.body.spaces[0].code).toBeTruthy();
      const v = await versionOf();
      const res = await patchLayout(
        { remove: { spaceIds: [ids.c101a] } },
        v,
        '',
        como(miembro.token, orgA.tenantId),
      ).expect(403);
      expect(res.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
      expect(res.body.details.requiredRoles).toEqual(
        expect.arrayContaining(['ORGANIZATION_OWNER_OR_ADMIN', 'BRANCH_ADMIN']),
      );
      expect(await versionOf()).toBe(v);
      await http()
        .post(`/sites/${orgA.siteId}/floor-plans`)
        .set(como(miembro.token, orgA.tenantId))
        .send({ code: 'NO', name: 'no', widthM: 10, heightM: 10 })
        .expect(403);
      await http()
        .patch(`/floor-plans/${plan.id}`)
        .set(como(miembro.token, orgA.tenantId))
        .set(ifMatch(1))
        .send({ name: 'x' })
        .expect(403);
    });

    let unidad: any;
    let enf: { userId: string; token: string };
    let miembro: { userId: string; token: string };

    beforeAll(async () => {
      unidad = (
        await http()
          .post(`/sites/${orgA.siteId}/clinical-units`)
          .set(comoDueno(orgA))
          .send({ code: 'UN-MED', name: 'Medicina' })
          .expect(201)
      ).body;
      await http()
        .post(`/care-spaces/${ids.h102}/unit-assignments`)
        .set(comoDueno(orgA))
        .send({ clinicalUnitId: unidad.id, roleCode: 'OWNER' })
        .expect(201);
      enf = await createStaffUser(
        ctx,
        orgA,
        'DA_ASSIGN_NURSE',
        { kind: 'UNIT', unitId: unidad.id },
        'enf',
      );
      miembro = await createPlainMember(ctx, orgA, 'lector2');
    });

    it('Enfermería con alcance de unidad ve la identidad de su unidad y sólo la silueta del resto (fail-closed)', async () => {
      const res = await layout(enf.token).query({ detail: 'full' }).expect(200);
      const porId = new Map<string, any>(
        res.body.spaces.map((s: any) => [s.spaceId, s]),
      );
      expect(porId.get(ids.h102)).toMatchObject({
        inScope: true,
        code: 'HAB-102',
      });
      const ajena = porId.get(ids.h101);
      expect(ajena.inScope).toBe(false);
      expect(ajena.geometry).toBeTruthy();
      for (const campo of [
        'code',
        'name',
        'parentId',
        'form',
        'function',
        'card',
      ]) {
        expect(ajena).not.toHaveProperty(campo);
      }
      expect(res.body.viewer).toMatchObject({
        canEditPlan: false,
        canSeeState: true,
        scope: 'UNITS',
        unitIds: [unidad.id],
      });
      expect(porId.get(ids.sala).inScope).toBe(false);
      await http()
        .get(`/care-spaces/${ids.h101}/plan-location`)
        .set(como(enf.token, orgA.tenantId))
        .expect(404);
      await http()
        .get(`/care-spaces/${ids.h102}/plan-location`)
        .set(como(enf.token, orgA.tenantId))
        .expect(200);
    });

    it('una puerta que une un local propio con uno ajeno no revela el ajeno', async () => {
      const [muro] = await filas(
        "select id from practice.plan_elements where floor_plan_id = ? and kind = 'WALL' limit 1",
        [plan.id],
      );
      const wall = muro?.id ?? randomUUID();
      const v = await versionOf();
      const puertaId = randomUUID();
      await patchLayout(
        {
          upsert: {
            elements: [
              ...(muro
                ? []
                : [
                    {
                      id: wall,
                      kind: 'WALL',
                      vertices: [
                        [2, 2],
                        [22, 2],
                      ],
                      thicknessM: 0.15,
                    },
                  ]),
              {
                id: puertaId,
                kind: 'DOOR',
                hostElementId: wall,
                offsetM: 3,
                widthM: 1,
                connectsSpaceAId: ids.h102,
                connectsSpaceBId: ids.h101,
              },
            ],
          },
        },
        v,
      ).expect(200);
      const dueno = (await layout().expect(200)).body.elements.find(
        (e: any) => e.id === puertaId,
      );
      expect(dueno).toMatchObject({
        connectsSpaceAId: ids.h102,
        connectsSpaceBId: ids.h101,
      });
      const vista = (await layout(enf.token).expect(200)).body.elements.find(
        (e: any) => e.id === puertaId,
      );
      expect(vista.connectsSpaceAId).toBe(ids.h102);
      expect(vista).not.toHaveProperty('connectsSpaceBId');
    });

    it('la paleta de espacios sin ubicar es del editor: Enfermería y un miembro reciben 403; el dueño la ve', async () => {
      for (const token of [enf.token, miembro.token]) {
        const res = await http()
          .get(`/floor-plans/${plan.id}/unplaced-spaces`)
          .set(como(token, orgA.tenantId))
          .expect(403);
        expect(res.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
        expect(JSON.stringify(res.body)).not.toMatch(/HAB-|CAMA|CONS-/);
      }
      const dueno = await http()
        .get(`/floor-plans/${plan.id}/unplaced-spaces`)
        .set(comoDueno(orgA))
        .expect(200);
      expect(dueno.body.items.length).toBeGreaterThan(0);
      expect(dueno.body.items[0]).toHaveProperty('placeable');
    });

    it('la validación y la búsqueda sólo informan lo que el actor ve (m² declarados incluidos)', async () => {
      // Umbral de demostración y dos áreas declaradas que no cuadran con lo dibujado.
      await filas(
        `insert into practice.practice_settings (id, practice_id, setting_key, value_json, created_at, updated_at)
         select gen_random_uuid(), ?::uuid, 'infra.plan.area_tolerance_pct', '10'::jsonb, now(), now()
          where not exists (select 1 from practice.practice_settings where practice_id = ?::uuid and setting_key = 'infra.plan.area_tolerance_pct')`,
        [orgA.practiceId, orgA.practiceId],
      );
      await filas(
        'update practice.care_spaces set area_m2 = 30 where id = any(?::uuid[])',
        [`{${ids.h101},${ids.h102}}`],
      );
      const completa = await http()
        .get(`/floor-plans/${plan.id}/validation`)
        .set(comoDueno(orgA))
        .expect(200);
      const sujetos = completa.body.issues.map((i: any) => i.subjectId);
      expect(sujetos).toEqual(expect.arrayContaining([ids.h101, ids.h102]));
      const mia = await http()
        .get(`/floor-plans/${plan.id}/validation`)
        .set(como(enf.token, orgA.tenantId))
        .expect(200);
      expect(mia.body.issues.map((i: any) => i.subjectId)).toEqual([ids.h102]);
      expect(JSON.stringify(mia.body)).not.toContain(ids.h101);

      const busqueda = await http()
        .get(`/sites/${orgA.siteId}/plan-search?q=hab`)
        .set(como(enf.token, orgA.tenantId))
        .expect(200);
      expect(busqueda.body.map((h: any) => h.code)).toEqual(['HAB-102']);
      const todo = await http()
        .get(`/sites/${orgA.siteId}/plan-search?q=HAB`)
        .set(comoDueno(orgA))
        .expect(200);
      expect(todo.body.map((h: any) => h.code)).toEqual(
        expect.arrayContaining(['HAB-101', 'HAB-102', 'HAB-103']),
      );
      // Foco por unidad: un actor con alcance no obtiene espacios ajenos aunque pida el árbol entero.
      const foco = await http()
        .get(`/sites/${orgA.siteId}/plan-focus?spaceId=${ids.sala}`)
        .set(como(enf.token, orgA.tenantId))
        .expect(200);
      expect(foco.body.flatMap((f: any) => f.spaceIds)).toEqual([ids.h102]);
    });

    it('el soporte de plataforma debe indicar el motivo para escribir', async () => {
      const v = await versionOf();
      const sinMotivo = await http()
        .patch(`/floor-plans/${plan.id}/layout`)
        .set(como(ctx.adminToken, orgA.tenantId))
        .set(ifMatch(v))
        .send({ upsert: { placements: [] } })
        .expect(422);
      expect(sinMotivo.body.reason).toBe('SUPPORT_REASON_REQUIRED');
      await http()
        .patch(`/floor-plans/${plan.id}/layout`)
        .set(como(ctx.adminToken, orgA.tenantId))
        .set(ifMatch(v))
        .set('X-Support-Reason', 'Ticket 123: corregir cota')
        .send({ upsert: { placements: [] } })
        .expect(200);
    });
  });

  // ---------------------------------------------------- otro tenant: 404 en todo
  describe('fail-closed por tenant: toda ruta responde 404 a una organización ajena', () => {
    const unElemento = async () =>
      (await layout().expect(200)).body.elements[0]?.id ?? randomUUID();
    const unaUbicacion = async () =>
      (
        await filas(
          'select id from practice.space_placements where floor_plan_id = ? limit 1',
          [plan.id],
        )
      )[0].id;

    it.each([
      ['GET', (p: string) => `/sites/${orgA.siteId}/floor-plans`, undefined],
      [
        'POST',
        () => `/sites/${orgA.siteId}/floor-plans`,
        { code: 'Z', name: 'z', widthM: 5, heightM: 5 },
      ],
      ['GET', (p: string) => `/floor-plans/${p}`, undefined],
      ['PATCH', (p: string) => `/floor-plans/${p}`, { name: 'x' }],
      [
        'POST',
        (p: string) => `/floor-plans/${p}/lifecycle`,
        { action: 'retire', reason: 'x' },
      ],
      [
        'PUT',
        (p: string) => `/floor-plans/${p}/background`,
        { fileId: randomUUID(), scaleMPerPx: 0.1 },
      ],
      ['DELETE', (p: string) => `/floor-plans/${p}/background`, undefined],
      ['GET', (p: string) => `/floor-plans/${p}/layout`, undefined],
      ['PATCH', (p: string) => `/floor-plans/${p}/layout`, { remove: {} }],
      [
        'PUT',
        (p: string) => `/floor-plans/${p}/layout`,
        { placements: [], elements: [] },
      ],
      [
        'POST',
        (p: string) => `/floor-plans/${p}/placements`,
        { spaceId: randomUUID(), geometry: rect(1, 1, 1, 1) },
      ],
      [
        'POST',
        (p: string) => `/floor-plans/${p}/elements`,
        { id: randomUUID(), kind: 'COLUMN' },
      ],
      ['GET', (p: string) => `/floor-plans/${p}/validation`, undefined],
      ['GET', (p: string) => `/floor-plans/${p}/unplaced-spaces`, undefined],
      ['GET', (p: string) => `/floor-plans/${p}/state`, undefined],
      [
        'GET',
        (p: string) =>
          `/floor-plans/${p}/background/content?v=${randomUUID()}&exp=1893456000&sig=${'a'.repeat(64)}`,
        undefined,
      ],
      ['GET', () => `/care-spaces/${ids.h102}/plan-card`, undefined],
      ['GET', () => `/care-spaces/${ids.h102}/plan-location`, undefined],
      ['GET', () => `/sites/${orgA.siteId}/plan-search?q=hab`, undefined],
      [
        'GET',
        () => `/sites/${orgA.siteId}/plan-focus?spaceId=${ids.sala}`,
        undefined,
      ],
    ] as const)('%s %s → 404', async (method, path, body) => {
      const url = path(plan.id);
      const call = http()
        [method.toLowerCase() as 'get'](url)
        .set(comoDueno(orgB));
      if (['PATCH', 'POST', 'PUT', 'DELETE'].includes(method))
        call.set(ifMatch(1));
      const res =
        body === undefined ? await call : await call.send(body as object);
      expect(res.status).toBe(404);
    });

    it('ubicaciones y elementos sueltos de otro tenant: PATCH/DELETE → 404', async () => {
      const placement = await unaUbicacion();
      const elemento = await unElemento();
      for (const [method, url, body] of [
        ['patch', `/space-placements/${placement}`, { zOrder: 3 }],
        ['delete', `/space-placements/${placement}`, undefined],
        ['patch', `/plan-elements/${elemento}`, { zOrder: 3 }],
        ['delete', `/plan-elements/${elemento}`, undefined],
      ] as const) {
        const call = http()[method](url).set(comoDueno(orgB)).set(ifMatch(1));
        const res = body ? await call.send(body) : await call;
        expect(res.status).toBe(404);
      }
    });

    it('un espacio de otro tenant dentro de un guardado propio tampoco se revela: 404', async () => {
      const ajeno = await createSpace(ctx, orgB, {
        code: 'AJENO',
        name: 'Ajeno',
        formCode: 'LOC_FORM_BUILDING',
        functionCode: 'SPACE_FN_BUILDING_GENERIC',
      });
      const res = await patchLayout(
        {
          upsert: {
            placements: [{ spaceId: ajeno.id, geometry: rect(1, 1, 3, 3) }],
          },
        },
        await versionOf(),
      );
      expect(res.status).toBe(404);
      expect(JSON.stringify(res.body)).not.toContain(ajeno.id);
    });

    it('sin sesión todas responden 401', async () => {
      await http().get(`/floor-plans/${plan.id}/layout`).expect(401);
      await http().patch(`/floor-plans/${plan.id}/layout`).send({}).expect(401);
    });
  });
});
