import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, type TestContext } from './harness';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import {
  armarPlanta,
  como,
  crearPersonal,
  opsVersion,
  registrarOrganizacion,
  sql,
  type InfraOrg,
  type InfraStaff,
  type Planta,
} from './infrastructure-fixture';

/**
 * F2 · operación de camas contra la base real (CONTRATO-F2-F5 §F2.5).
 *
 * Cadena por mutación: request → response → fila (`care_spaces`, órdenes,
 * bloqueos, con `tenant_id`) → evento A20 → historia → outbox → relectura por la
 * API. Roles por `organization_user_assignments` (§0.3): Enfermería, Limpieza,
 * supervisión de Limpieza; el OWNER es Admin org. Otro tenant → 404.
 */
describe('Infraestructura F2 · operación (estados, bloqueos, limpieza)', () => {
  let ctx: TestContext;
  let q: ReturnType<typeof sql>;
  const http = () => request(ctx.app.getHttpServer());
  const tag = randomUUID().slice(0, 6);
  let orgA: InfraOrg;
  let orgB: InfraOrg;
  let planta: Planta;
  let nurse: InfraStaff;
  let cleaner: InfraStaff;
  let supervisor: InfraStaff;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    q = sql(ctx);
    orgA = await registrarOrganizacion(ctx, `F2A-${tag}`);
    orgB = await registrarOrganizacion(ctx, `F2B-${tag}`);
    planta = await armarPlanta(ctx, orgA, `F2-${tag}`, 3);
    nurse = await crearPersonal(
      ctx,
      orgA,
      `F2N-${tag}`,
      DELEG.ASSIGN_ROLE_NURSE,
      { site: orgA.siteId },
    );
    cleaner = await crearPersonal(
      ctx,
      orgA,
      `F2L-${tag}`,
      DELEG.ASSIGN_ROLE_HOUSEKEEPING,
      { site: orgA.siteId },
    );
    supervisor = await crearPersonal(
      ctx,
      orgA,
      `F2S-${tag}`,
      DELEG.ASSIGN_ROLE_HOUSEKEEPING_SUPERVISOR,
      {
        site: orgA.siteId,
      },
    );
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const hygieneEvents = (spaceId: string) =>
    q<{ to: string; v2: string; tenant_id: string }>(
      `select to_concept_id as to, v2_0116_code as v2, tenant_id
         from practice.care_space_status_events
        where care_space_id = ? and axis_concept_id = ? order by occurred_at, created_at`,
      [spaceId, PRAC.AXIS_HYGIENE],
    );

  it('ciclo de limpieza DIRTY→CLEANING→CLEAN→INSPECTED con cuatro eventos A20 en orden', async () => {
    const bed = planta.beds[0];
    const dirty = await http()
      .post(`/care-spaces/${bed}/hygiene`)
      .set(como(nurse))
      .set('If-Match-Ops', String(await opsVersion(ctx, bed)))
      .send({ action: 'mark-dirty', reasonText: 'Derrame' })
      .expect(200);
    const orderId: string = dirty.body.cleaningOrderId;
    expect(dirty.body.cell.hygiene.code).toBe('HYG_DIRTY');
    expect(dirty.body.cell.v2Code).toBe('H');
    const [order] = await q(
      'select tenant_id, status_concept_id, row_version from practice.cleaning_orders where id = ?',
      [orderId],
    );
    expect(order).toMatchObject({
      tenant_id: orgA.tenantId,
      status_concept_id: PRAC.CLN_PENDING,
      row_version: 1,
    });
    const outbox = await q(
      'select tenant_id from messaging.domain_events where event_type = ? and aggregate_id = ?',
      ['practice.cleaning_order.created', orderId],
    );
    expect(outbox).toEqual([{ tenant_id: orgA.tenantId }]);

    // Limpieza ve la orden en la cola, sin datos de paciente.
    const cola = await http()
      .get(`/sites/${orgA.siteId}/cleaning-orders`)
      .set(como(cleaner))
      .expect(200);
    expect(cola.body.items.map((o: any) => o.id)).toContain(orderId);
    expect(JSON.stringify(cola.body)).not.toContain('patient');

    await http()
      .post(`/cleaning-orders/${orderId}/start`)
      .set(como(cleaner))
      .set('If-Match', '1')
      .send({})
      .expect(200);
    await http()
      .post(`/cleaning-orders/${orderId}/finish`)
      .set(como(cleaner))
      .set('If-Match', '2')
      .send({})
      .expect(200);
    // Limpieza (sin supervisión) no inspecciona.
    const sinRol = await http()
      .post(`/cleaning-orders/${orderId}/inspect`)
      .set(como(cleaner))
      .set('If-Match', '3')
      .send({ result: 'PASS' })
      .expect(403);
    expect(sinRol.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
    const ok = await http()
      .post(`/cleaning-orders/${orderId}/inspect`)
      .set(como(supervisor))
      .set('If-Match', '3')
      .send({ result: 'PASS' })
      .expect(200);
    expect(ok.body.order.statusCode).toBe('CLN_INSPECTED');

    const events = await hygieneEvents(bed);
    expect(events.map((e) => e.to)).toEqual([
      PRAC.HYG_DIRTY,
      PRAC.HYG_CLEANING,
      PRAC.HYG_CLEAN,
      PRAC.HYG_INSPECTED,
    ]);
    expect(events.map((e) => e.v2)).toEqual(['H', 'H', 'U', 'U']);
    expect(new Set(events.map((e) => e.tenant_id))).toEqual(
      new Set([orgA.tenantId]),
    );
    const [space] = await q(
      'select hygiene_status_concept_id, ops_version from practice.care_spaces where id = ?',
      [bed],
    );
    expect(space.hygiene_status_concept_id).toBe(PRAC.HYG_INSPECTED);
    const hist = await q(
      'select count(*)::int as n, min(tenant_id::text) as t from audit.cleaning_orders_history where cleaning_order_id = ?',
      [orderId],
    );
    expect(hist[0]).toEqual({ n: 4, t: orgA.tenantId });
    const historiaEspacio = await q(
      'select count(*)::int as n from audit.care_spaces_history where care_space_id = ? and tenant_id = ?',
      [bed, orgA.tenantId],
    );
    expect(historiaEspacio[0].n).toBeGreaterThanOrEqual(5);

    // Relectura por la API: historial A20 y estado operativo.
    const hist20 = await http()
      .get(`/care-spaces/${bed}/status-events?axis=HYGIENE`)
      .set(como(nurse))
      .expect(200);
    expect(hist20.body.items.map((e: any) => e.to)).toEqual([
      'HYG_INSPECTED',
      'HYG_CLEAN',
      'HYG_CLEANING',
      'HYG_DIRTY',
    ]);
    const estado = await http()
      .get(`/care-spaces/${bed}/operational-state`)
      .set(como(nurse))
      .expect(200);
    expect(estado.body).toMatchObject({
      assignable: true,
      v2Code: 'U',
      openCleaningOrder: null,
    });
  });

  it('quien terminó la limpieza no la inspecciona (422)', async () => {
    const bed = planta.beds[1];
    const dirty = await http()
      .post(`/care-spaces/${bed}/hygiene`)
      .set(como(cleaner))
      .set('If-Match-Ops', String(await opsVersion(ctx, bed)))
      .send({ action: 'mark-dirty' })
      .expect(200);
    const id = dirty.body.cleaningOrderId;
    await http()
      .post(`/cleaning-orders/${id}/start`)
      .set(como(supervisor))
      .set('If-Match', '1')
      .send({})
      .expect(200);
    await http()
      .post(`/cleaning-orders/${id}/finish`)
      .set(como(supervisor))
      .set('If-Match', '2')
      .send({})
      .expect(200);
    const res = await http()
      .post(`/cleaning-orders/${id}/inspect`)
      .set(como(supervisor))
      .set('If-Match', '3')
      .send({ result: 'PASS' })
      .expect(422);
    expect(res.body.reason).toBe('INSPECTION_BY_CLEANER_NOT_ALLOWED');
    const [row] = await q(
      'select status_concept_id from practice.cleaning_orders where id = ?',
      [id],
    );
    expect(row.status_concept_id).toBe(PRAC.CLN_DONE);
  });

  it('mantenimiento: sin fecha estimada 422; con fecha 200 + bloqueo + A20 C + outbox; If-Match-Ops viejo 412', async () => {
    const bed = planta.beds[2];
    const sinFecha = await http()
      .post(`/care-spaces/${bed}/availability`)
      .set(como(orgA))
      .set('If-Match-Ops', String(await opsVersion(ctx, bed)))
      .send({
        action: 'start-maintenance',
        reasonCode: 'BLOCK_RSN_PREVENTIVE_MAINTENANCE',
      })
      .expect(422);
    expect(sinFecha.body.reason).toBe('BLOCK_EXPECTED_END_REQUIRED');
    const otro = await http()
      .post(`/care-spaces/${bed}/availability`)
      .set(como(orgA))
      .set('If-Match-Ops', String(await opsVersion(ctx, bed)))
      .send({
        action: 'block',
        kindCode: 'BLOCK_ADMIN',
        reasonCode: 'BLOCK_RSN_OTHER',
      })
      .expect(422);
    expect(otro.body.reason).toBe('BLOCK_REASON_TEXT_REQUIRED');

    const version = await opsVersion(ctx, bed);
    const hasta = new Date(Date.now() + 2 * 86_400_000).toISOString();
    const ok = await http()
      .post(`/care-spaces/${bed}/availability`)
      .set(como(orgA))
      .set('If-Match-Ops', String(version))
      .send({
        action: 'start-maintenance',
        reasonCode: 'BLOCK_RSN_PREVENTIVE_MAINTENANCE',
        expectedEndAt: hasta,
      })
      .expect(200);
    expect(ok.body.cell.availability).toMatchObject({
      code: 'SPACE_OP_MAINTENANCE',
      reasonCode: 'BLOCK_RSN_PREVENTIVE_MAINTENANCE',
      expectedUntil: hasta,
    });
    expect(ok.body.cell.v2Code).toBe('C');
    const [block] = await q(
      'select tenant_id, kind_concept_id from practice.care_space_blocks where id = ?',
      [ok.body.blockId],
    );
    expect(block).toEqual({
      tenant_id: orgA.tenantId,
      kind_concept_id: PRAC.BLOCK_MAINTENANCE,
    });
    const [a20] = await q(
      'select v2_0116_code from practice.care_space_status_events where care_space_id = ? and axis_concept_id = ?',
      [bed, PRAC.AXIS_AVAILABILITY],
    );
    expect(a20.v2_0116_code).toBe('C');
    const started = await q(
      'select count(*)::int as n from messaging.domain_events where event_type = ? and aggregate_id = ?',
      ['practice.care_space.block_started', ok.body.blockId],
    );
    expect(started[0].n).toBe(1);
    const hist = await q(
      'select tenant_id from audit.care_space_blocks_history where care_space_block_id = ?',
      [ok.body.blockId],
    );
    expect(hist).toEqual([{ tenant_id: orgA.tenantId }]);

    const viejo = await http()
      .post(`/care-spaces/${bed}/availability`)
      .set(como(orgA))
      .set('If-Match-Ops', String(version))
      .send({ action: 'close', reasonCode: 'BLOCK_RSN_ADMIN_DECISION' })
      .expect(412);
    expect(viejo.body.reason).toBe('OPS_VERSION_MISMATCH');

    // Fin de mantenimiento → orden de limpieza MAINTENANCE_END.
    const fin = await http()
      .post(`/care-space-blocks/${ok.body.blockId}/end`)
      .set(como(orgA))
      .send({ note: 'listo' })
      .expect(200);
    expect(fin.body.cleaningOrderId).toEqual(expect.any(String));
    const [orden] = await q(
      'select trigger_concept_id from practice.cleaning_orders where id = ?',
      [fin.body.cleaningOrderId],
    );
    expect(orden.trigger_concept_id).toBe(PRAC.CLN_TRG_MAINTENANCE_END);
    const tablero = await http()
      .get(`/sites/${orgA.siteId}/bed-board`)
      .set(como(orgA))
      .expect(200);
    const celda = tablero.body.units
      .flatMap((u: any) => u.cells)
      .find((c: any) => c.id === bed);
    expect(celda.availability.code).toBe('SPACE_OP_AVAILABLE');
    expect(celda.hygiene.code).toBe('HYG_DIRTY');
  });

  it('Limpieza: tablero sin paciente y availability → 403', async () => {
    const tablero = await http()
      .get(`/sites/${orgA.siteId}/bed-board`)
      .set(como(cleaner))
      .expect(200);
    expect(tablero.headers['x-data-as-of']).toEqual(expect.any(String));
    const cells = tablero.body.units.flatMap((u: any) => u.cells);
    expect(cells.length).toBeGreaterThanOrEqual(3);
    expect(cells.every((c: any) => c.occupancy.patient === undefined)).toBe(
      true,
    );
    const bed = planta.beds[0];
    const res = await http()
      .post(`/care-spaces/${bed}/availability`)
      .set(como(cleaner))
      .set('If-Match-Ops', String(await opsVersion(ctx, bed)))
      .send({ action: 'block', reasonCode: 'BLOCK_RSN_STAFF_SHORTAGE' })
      .expect(403);
    expect(res.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
  });

  it('otro tenant → 404 en todos los endpoints con :id y nada cambia', async () => {
    const bed = planta.beds[0];
    const antes = await opsVersion(ctx, bed);
    await http()
      .get(`/care-spaces/${bed}/operational-state`)
      .set(como(orgB))
      .expect(404);
    await http()
      .get(`/care-spaces/${bed}/status-events`)
      .set(como(orgB))
      .expect(404);
    await http()
      .get(`/sites/${orgA.siteId}/bed-board`)
      .set(como(orgB))
      .expect(404);
    await http()
      .get(`/sites/${orgA.siteId}/cleaning-orders`)
      .set(como(orgB))
      .expect(404);
    await http()
      .post(`/care-spaces/${bed}/hygiene`)
      .set(como(orgB))
      .set('If-Match-Ops', String(antes))
      .send({ action: 'mark-dirty' })
      .expect(404);
    await http()
      .post(`/care-spaces/${bed}/availability`)
      .set(como(orgB))
      .set('If-Match-Ops', String(antes))
      .send({ action: 'close', reasonCode: 'BLOCK_RSN_ADMIN_DECISION' })
      .expect(404);
    const [orden] = await q(
      'select id, row_version from practice.cleaning_orders where care_space_id = ? order by created_at desc limit 1',
      [bed],
    );
    await http()
      .post(`/cleaning-orders/${orden.id}/cancel`)
      .set(como(orgB))
      .set('If-Match', String(orden.row_version))
      .send({ reason: 'x' })
      .expect(404);
    expect(await opsVersion(ctx, bed)).toBe(antes);
  });

  it('la base rechaza UPDATE sobre care_space_status_events (guarda de inmutabilidad)', async () => {
    await expect(
      q(
        'update practice.care_space_status_events set reason_text = ? where care_space_id = ?',
        ['x', planta.beds[0]],
      ),
    ).rejects.toThrow();
  });
});
