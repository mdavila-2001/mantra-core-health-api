import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  camposObligatoriosDePaciente,
  type TestContext,
} from './harness';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import {
  armarPlanta,
  como,
  crearPersonal,
  opsVersion,
  registrarOrganizacion,
  registrarPaciente,
  sql,
  type InfraOrg,
  type InfraStaff,
  type Planta,
} from './infrastructure-fixture';

/**
 * Lo que la web de F2/F3 necesita y el contrato no declaraba (revisión #1812,
 * la API manda las formas): acceso del actor, compatibilidad prospectiva,
 * estancia vigente del paciente, profesionales a cargo, celdas con unidad y
 * acciones, órdenes con transiciones y `requestId` en el cuerpo de toda
 * mutación. Cada lectura nueva: permitido y fail-closed.
 */
describe('Infraestructura F2/F3 · lo que consume la web', () => {
  let ctx: TestContext;
  let q: ReturnType<typeof sql>;
  const http = () => request(ctx.app.getHttpServer());
  const tag = randomUUID().slice(0, 6);
  let orgA: InfraOrg;
  let orgB: InfraOrg;
  let planta: Planta;
  let admission: InfraStaff;
  let cleaner: InfraStaff;
  let nurseUnit: InfraStaff;
  let p1: { patientProfileId: string };
  let pB: { patientProfileId: string };

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    q = sql(ctx);
    orgA = await registrarOrganizacion(ctx, `WFA-${tag}`);
    orgB = await registrarOrganizacion(ctx, `WFB-${tag}`);
    planta = await armarPlanta(ctx, orgA, `WF-${tag}`, 3);
    admission = await crearPersonal(
      ctx,
      orgA,
      `WFM-${tag}`,
      DELEG.ASSIGN_ROLE_ADMISSION,
      { site: orgA.siteId },
    );
    cleaner = await crearPersonal(
      ctx,
      orgA,
      `WFL-${tag}`,
      DELEG.ASSIGN_ROLE_HOUSEKEEPING,
      { site: orgA.siteId },
    );
    nurseUnit = await crearPersonal(
      ctx,
      orgA,
      `WFN-${tag}`,
      DELEG.ASSIGN_ROLE_NURSE,
      { unit: planta.unit },
    );
    const campos = (await camposObligatoriosDePaciente(
      ctx,
    )) as unknown as Record<string, unknown>;
    p1 = await registrarPaciente(ctx, orgA, `WP1${tag}`, campos);
    pB = await registrarPaciente(ctx, orgB, `WPB${tag}`, campos);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /practice/infrastructure-access/me: sedes, roles, asignaciones y acciones del mismo evaluador', async () => {
    const admin = await http()
      .get('/practice/infrastructure-access/me')
      .set(como(orgA))
      .expect(200);
    const siteA = admin.body.sites.find((s: any) => s.siteId === orgA.siteId);
    expect(siteA).toMatchObject({
      practiceId: orgA.practiceId,
      timeZone: expect.anything(),
      roles: expect.arrayContaining(['ORG_ADMIN', 'SITE_ADMIN']),
    });
    expect(siteA.actions).toContain('f2.availability.admin');
    const nurse = await http()
      .get('/practice/infrastructure-access/me')
      .set(como(nurseUnit))
      .expect(200);
    expect(nurse.body.sites).toHaveLength(1);
    const ns = nurse.body.sites[0];
    expect(ns.siteId).toBe(orgA.siteId);
    expect(ns.roles).toEqual([]);
    expect(ns.actions).toEqual([]);
    expect(ns.grants).toEqual([
      expect.objectContaining({
        scope: 'UNIT',
        role: 'NURSE',
        clinicalUnitId: planta.unit,
        actions: expect.arrayContaining(['f2.board.read']),
      }),
    ]);
    // Fail-closed por tenant: otra organización no ve las sedes de A.
    const b = await http()
      .get('/practice/infrastructure-access/me')
      .set(como(orgB))
      .expect(200);
    expect(b.body.sites.map((s: any) => s.siteId)).not.toContain(orgA.siteId);
  });

  it('POST /clinical/bed-compatibility prospectiva: reglas con severidad y forzable; ajenos 404, sin rol 403', async () => {
    const ok = await http()
      .post('/clinical/bed-compatibility')
      .set(como(admission))
      .send({
        careSpaceId: planta.beds[0],
        patientProfileId: p1.patientProfileId,
        levelOfCareCode: 'LOC_CARE_ICU',
      })
      .expect(200);
    // Una regla forzable exige override: no es asignable sin él.
    expect(ok.body.assignable).toBe(false);
    expect(ok.body.rules).toEqual([
      expect.objectContaining({
        code: 'LEVEL_OF_CARE',
        severity: 'OVERRIDABLE',
        overridable: true,
      }),
    ]);
    expect(ok.body.requestId).toEqual(expect.any(String));
    const general = await http()
      .post('/clinical/bed-compatibility')
      .set(como(admission))
      .send({
        careSpaceId: planta.beds[0],
        patientProfileId: p1.patientProfileId,
        levelOfCareCode: 'LOC_CARE_GENERAL',
      })
      .expect(200);
    expect(general.body).toMatchObject({ assignable: true, rules: [] });
    // Sin encuentro no se crea nada.
    const [{ n }] = await q(
      'select count(*)::int as n from clinical.encounters where patient_profile_id = ?',
      [p1.patientProfileId],
    );
    expect(n).toBe(0);
    await http()
      .post('/clinical/bed-compatibility')
      .set(como(admission))
      .send({
        careSpaceId: planta.beds[0],
        patientProfileId: pB.patientProfileId,
      })
      .expect(404);
    await http()
      .post('/clinical/bed-compatibility')
      .set(como(orgB))
      .send({
        careSpaceId: planta.beds[0],
        patientProfileId: pB.patientProfileId,
      })
      .expect(404);
    await http()
      .post('/clinical/bed-compatibility')
      .set(como(cleaner))
      .send({
        careSpaceId: planta.beds[0],
        patientProfileId: p1.patientProfileId,
      })
      .expect(403);
  });

  it('estancia vigente del paciente y profesionales a cargo: permitido y fail-closed', async () => {
    // Sin permiso clínico sobre el paciente: la misma respuesta para un
    // internado y para uno que no lo está (nada se revela antes de autorizar).
    const stayOf = (who: Record<string, string>, patient: string) =>
      http().get(`/clinical/patients/${patient}/inpatient-stay`).set(who);
    const adminA = {
      Authorization: `Bearer ${ctx.adminToken}`,
      'X-Tenant-Id': orgA.tenantId,
    };
    const before = await stayOf(adminA, p1.patientProfileId).expect(404);
    const adm = await http()
      .post('/clinical/admissions')
      .set(como(admission))
      .send({
        patientProfileId: p1.patientProfileId,
        practiceSiteId: orgA.siteId,
        levelOfCareCode: 'LOC_CARE_GENERAL',
        admissionSourceCode: 'ADM_SRC_EMERGENCY',
        reasonText: 'Ingreso de prueba',
        bed: { careSpaceId: planta.beds[1], mode: 'ASSIGN' },
      })
      .expect(201);
    expect(adm.body.requestId).toEqual(expect.any(String));
    expect(adm.body.requestId).toBe(adm.headers['x-request-id']);
    const p2 = await registrarPaciente(
      ctx,
      orgA,
      `WP2${tag}`,
      (await camposObligatoriosDePaciente(ctx)) as unknown as Record<
        string,
        unknown
      >,
    );
    const shape = (r: request.Response) => ({
      status: r.status,
      code: r.body.code,
      reason: r.body.reason ?? null,
      message: r.body.message,
    });
    for (const who of [como(admission), como(cleaner), como(nurseUnit)]) {
      const internado = await stayOf(who, p1.patientProfileId);
      const noInternado = await stayOf(who, p2.patientProfileId);
      const inexistente = await stayOf(who, randomUUID());
      expect(internado.status).toBe(404);
      expect(shape(internado)).toEqual(shape(noInternado));
      expect(shape(internado)).toEqual(shape(inexistente));
    }
    expect(shape(before)).toEqual(
      shape(await stayOf(adminA, p2.patientProfileId)),
    );
    // Con permiso (plataforma: lectura clínica y f3.adt.read) ve la estancia.
    const stay = await stayOf(adminA, p1.patientProfileId).expect(200);
    expect(stay.body.encounter?.id ?? stay.body.encounterId).toBe(
      adm.body.encounterId,
    );
    await stayOf(como(orgB), p1.patientProfileId).expect(404);

    const list = await http()
      .get(`/sites/${orgA.siteId}/attending-practitioners`)
      .set(como(admission))
      .expect(200);
    expect(Array.isArray(list.body)).toBe(true);
    await http()
      .get(`/sites/${orgA.siteId}/attending-practitioners`)
      .set(como(orgB))
      .expect(404);
    await http()
      .get(`/sites/${orgA.siteId}/attending-practitioners`)
      .set(como(cleaner))
      .expect(403);

    // Tablero: unidad y acciones por celda; encounterLocationId sólo con rol clínico.
    const board = await http()
      .get(`/sites/${orgA.siteId}/bed-board`)
      .set(como(admission))
      .expect(200);
    expect(board.body.siteId).toBe(orgA.siteId);
    const cells = board.body.units.flatMap((u: any) => u.cells);
    const occupied = cells.find((c: any) => c.id === planta.beds[1]);
    expect(occupied.unitId).toBe(planta.unit);
    expect(occupied.actions).toEqual(expect.arrayContaining(['f2.board.read']));
    const [loc] = await q(
      `select id from clinical.encounter_locations where encounter_id = ? and period_end is null and is_bed_assignment`,
      [adm.body.encounterId],
    );
    expect(occupied.occupancy.encounterLocationId).toBe(loc.id);
    const keeperBoard = await http()
      .get(`/sites/${orgA.siteId}/bed-board`)
      .set(como(cleaner))
      .expect(200);
    const keeperCell = keeperBoard.body.units
      .flatMap((u: any) => u.cells)
      .find((c: any) => c.id === planta.beds[1]);
    expect(keeperCell.occupancy.encounterLocationId ?? null).toBeNull();
    expect(keeperCell.occupancy.patient).toBeUndefined();
    expect(keeperCell.actions).not.toContain('f2.availability.admin');
  });

  it('orden de limpieza: allowedTransitions e inspectionRequired, sin datos de paciente; mutaciones con requestId', async () => {
    const bed = planta.beds[2];
    const dirty = await http()
      .post(`/care-spaces/${bed}/hygiene`)
      .set(como(cleaner))
      .set('If-Match-Ops', String(await opsVersion(ctx, bed)))
      .send({ action: 'mark-dirty' })
      .expect(200);
    expect(dirty.body.requestId).toEqual(expect.any(String));
    expect(dirty.body.requestId).toBe(dirty.headers['x-request-id']);
    expect(dirty.body.cell).toMatchObject({
      unitId: planta.unit,
      actions: expect.any(Array),
    });
    const list = await http()
      .get(`/sites/${orgA.siteId}/cleaning-orders`)
      .set(como(cleaner))
      .expect(200);
    const order = list.body.items.find(
      (o: any) => o.id === dirty.body.cleaningOrderId,
    );
    expect(order).toMatchObject({
      statusCode: 'CLN_PENDING',
      inspectionRequired: expect.any(Boolean),
    });
    expect(order.allowedTransitions).toEqual(
      expect.arrayContaining(['assign', 'start', 'cancel']),
    );
    expect(order.allowedTransitions).not.toContain('inspect');
    expect(JSON.stringify(list.body)).not.toContain('patient');
    expect(list.body.requestId).toBeUndefined();
    const started = await http()
      .post(`/cleaning-orders/${order.id}/start`)
      .set(como(cleaner))
      .set('If-Match', String(order.rowVersion))
      .expect(200);
    expect(started.body.requestId).toEqual(expect.any(String));
    expect(started.body.allowedTransitions).toEqual(
      expect.arrayContaining(['finish']),
    );
    expect(started.body.allowedTransitions).not.toContain('start');
  });
});
