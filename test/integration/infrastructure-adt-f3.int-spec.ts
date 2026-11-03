import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  camposObligatoriosDePaciente,
  type TestContext,
} from './harness';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import {
  armarPlanta,
  como,
  crearPersonal,
  registrarOrganizacion,
  registrarPaciente,
  sql,
  type InfraOrg,
  type InfraStaff,
  type Planta,
} from './infrastructure-fixture';

/**
 * F3 · internación / ADT contra la base real (CONTRATO-F2-F5 §F3.5).
 * request → response → filas (`encounters`, `encounter_locations` con
 * `tenant_id`, A20, orden de limpieza, historia, outbox) → relectura.
 */
describe('Infraestructura F3 · internación / ADT', () => {
  let ctx: TestContext;
  let q: ReturnType<typeof sql>;
  const http = () => request(ctx.app.getHttpServer());
  const tag = randomUUID().slice(0, 6);
  let orgA: InfraOrg;
  let orgB: InfraOrg;
  let planta: Planta;
  let admission: InfraStaff;
  let cleaner: InfraStaff;
  let p1: { patientProfileId: string };
  let p2: { patientProfileId: string };
  const enc: Record<string, string> = {};

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    q = sql(ctx);
    orgA = await registrarOrganizacion(ctx, `F3A-${tag}`);
    orgB = await registrarOrganizacion(ctx, `F3B-${tag}`);
    planta = await armarPlanta(ctx, orgA, `F3-${tag}`, 3);
    admission = await crearPersonal(
      ctx,
      orgA,
      `F3M-${tag}`,
      DELEG.ASSIGN_ROLE_ADMISSION,
      { site: orgA.siteId },
    );
    cleaner = await crearPersonal(
      ctx,
      orgA,
      `F3L-${tag}`,
      DELEG.ASSIGN_ROLE_HOUSEKEEPING,
      { site: orgA.siteId },
    );
    const campos = (await camposObligatoriosDePaciente(
      ctx,
    )) as unknown as Record<string, unknown>;
    p1 = await registrarPaciente(ctx, orgA, `P1${tag}`, campos);
    p2 = await registrarPaciente(ctx, orgA, `P2${tag}`, campos);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const admit = (patientProfileId: string, bed: string) =>
    http()
      .post('/clinical/admissions')
      .set(como(admission))
      .send({
        patientProfileId,
        practiceSiteId: orgA.siteId,
        levelOfCareCode: 'LOC_CARE_GENERAL',
        admissionSourceCode: 'ADM_SRC_EMERGENCY',
        reasonText: 'Ingreso de prueba',
        bed: { careSpaceId: bed, mode: 'ASSIGN' },
      });

  const activeBedOf = async (encounterId: string) =>
    q<{ id: string; care_space_id: string; tenant_id: string }>(
      `select id, care_space_id, tenant_id from clinical.encounter_locations
        where encounter_id = ? and is_bed_assignment and location_status_concept_id = ? and period_end is null`,
      [encounterId, CLIN.LOCATION_ACTIVE],
    );

  it('ingreso con cama asignable: ENC_IMP, ubicación de cama ACTIVE con tenant, A20 OCC, outbox, historia', async () => {
    const res = await admit(p1.patientProfileId, planta.beds[0]).expect(201);
    enc.p1 = res.body.encounterId;
    expect(res.body.cell).toMatchObject({
      occupancy: 'OCC_OCCUPIED',
      v2Code: 'O',
    });
    const [e] = await q(
      'select class_concept_id, tenant_id, episode_id from clinical.encounters where id = ?',
      [enc.p1],
    );
    expect(e).toMatchObject({
      class_concept_id: CLIN.ENCOUNTER_CLASS_INPATIENT,
      tenant_id: orgA.tenantId,
    });
    expect(e.episode_id).toEqual(expect.any(String));
    expect(await activeBedOf(enc.p1)).toEqual([
      {
        id: res.body.encounterLocationId,
        care_space_id: planta.beds[0],
        tenant_id: orgA.tenantId,
      },
    ]);
    const a20 = await q(
      'select to_concept_id, v2_0116_code from practice.care_space_status_events where care_space_id = ? and axis_concept_id = ?',
      [planta.beds[0], PRAC.AXIS_OCCUPANCY],
    );
    expect(a20).toEqual([
      { to_concept_id: PRAC.OCC_OCCUPIED, v2_0116_code: 'O' },
    ]);
    const ev = await q(
      'select tenant_id from messaging.domain_events where event_type = ? and aggregate_id = ?',
      ['clinical.adt.admitted', enc.p1],
    );
    expect(ev).toEqual([{ tenant_id: orgA.tenantId }]);
    const hist = await q(
      'select tenant_id from audit.encounter_locations_history where encounter_location_id = ?',
      [res.body.encounterLocationId],
    );
    expect(hist.length).toBeGreaterThanOrEqual(1);
    expect(hist[0].tenant_id).toBe(orgA.tenantId);
  });

  it('segunda internación en la misma cama → 409 BED_NOT_ASSIGNABLE; en otra cama → 201', async () => {
    const res = await admit(p2.patientProfileId, planta.beds[0]).expect(409);
    expect(res.body.reason).toBe('BED_NOT_ASSIGNABLE');
    const ok = await admit(p2.patientProfileId, planta.beds[1]).expect(201);
    enc.p2 = ok.body.encounterId;
    const otra = await admit(p1.patientProfileId, planta.beds[2]).expect(409);
    expect(otra.body.reason).toBe('PATIENT_ALREADY_ADMITTED');
  });

  it('un insert SQL que solapa la cama ocupada → 23P01', async () => {
    await expect(
      q(
        `insert into clinical.encounter_locations
           (id, tenant_id, encounter_id, practice_site_id, care_space_id, location_status_concept_id,
            period_start, is_bed_assignment, created_at, updated_at)
         values (gen_random_uuid(), ?, ?, ?, ?, ?, now(), true, now(), now())`,
        [
          orgA.tenantId,
          enc.p2,
          orgA.siteId,
          planta.beds[0],
          CLIN.LOCATION_ACTIVE,
        ],
      ),
    ).rejects.toMatchObject({ code: '23P01' });
  });

  it('traslado: origen COMPLETED con period_end, destino ACTIVE con previo, origen sucio con orden en la cola', async () => {
    const res = await http()
      .post(`/clinical/encounters/${enc.p1}/transfer`)
      .set(como(admission))
      .send({ toCareSpaceId: planta.beds[2], reasonCode: 'CLINICAL' })
      .expect(200);
    const [from] = await q(
      'select location_status_concept_id, period_end, end_reason_concept_id from clinical.encounter_locations where id = ?',
      [res.body.fromLocationId],
    );
    expect(from).toMatchObject({
      location_status_concept_id: CLIN.LOCATION_COMPLETED,
      end_reason_concept_id: CLIN.ADT_END_TRANSFER_OUT,
    });
    expect(from.period_end).not.toBeNull();
    const [to] = await q(
      'select previous_encounter_location_id, care_space_id, period_start from clinical.encounter_locations where id = ?',
      [res.body.toLocationId],
    );
    expect(to).toMatchObject({
      previous_encounter_location_id: res.body.fromLocationId,
      care_space_id: planta.beds[2],
    });
    expect(new Date(to.period_start).getTime()).toBe(
      new Date(from.period_end).getTime(),
    );
    const [space] = await q(
      'select hygiene_status_concept_id from practice.care_spaces where id = ?',
      [planta.beds[0]],
    );
    expect(space.hygiene_status_concept_id).toBe(PRAC.HYG_DIRTY);
    const [order] = await q(
      'select trigger_concept_id, tenant_id from practice.cleaning_orders where id = ?',
      [res.body.cleaningOrderId],
    );
    expect(order).toEqual({
      trigger_concept_id: PRAC.CLN_TRG_TRANSFER,
      tenant_id: orgA.tenantId,
    });
    const cola = await http()
      .get(`/sites/${orgA.siteId}/cleaning-orders`)
      .set(como(cleaner))
      .expect(200);
    expect(cola.body.items.map((o: any) => o.id)).toContain(
      res.body.cleaningOrderId,
    );
  });

  it('intercambio A17 entre dos ocupados → 4 filas coherentes, sin violar EXCLUDE', async () => {
    const res = await http()
      .post('/clinical/bed-swaps')
      .set(como(admission))
      .send({
        encounterAId: enc.p1,
        encounterBId: enc.p2,
        reasonText: 'Cercanía al puesto de enfermería',
      })
      .expect(200);
    expect(res.body.locations).toHaveLength(4);
    expect((await activeBedOf(enc.p1))[0].care_space_id).toBe(planta.beds[1]);
    expect((await activeBedOf(enc.p2))[0].care_space_id).toBe(planta.beds[2]);
    const swapped = await q(
      'select count(*)::int as n from clinical.encounter_locations where encounter_id in (?, ?) and end_reason_concept_id = ?',
      [enc.p1, enc.p2, CLIN.ADT_END_SWAP],
    );
    expect(swapped[0].n).toBe(2);
    const ev = await q(
      'select count(*)::int as n from messaging.domain_events where event_type = ? and aggregate_id in (?, ?)',
      ['clinical.adt.swapped', enc.p1, enc.p2],
    );
    expect(ev[0].n).toBe(2);
  });

  it('egreso: encuentro FINISHED, cama H con orden DISCHARGE; sin disposición → 422', async () => {
    const sin = await http()
      .post(`/clinical/encounters/${enc.p2}/discharge`)
      .set(como(admission))
      .send({})
      .expect(422);
    expect(sin.body.reason).toBe('DISCHARGE_DISPOSITION_REQUIRED');
    const res = await http()
      .post(`/clinical/encounters/${enc.p2}/discharge`)
      .set(como(admission))
      .send({ dischargeDispositionCode: 'DISP_HOME' })
      .expect(200);
    const [e] = await q(
      'select status_concept_id, discharge_disposition_concept_id, sealed_at from clinical.encounters where id = ?',
      [enc.p2],
    );
    expect(e).toMatchObject({
      status_concept_id: CLIN.ENCOUNTER_FINISHED,
      discharge_disposition_concept_id: CLIN.DISP_HOME,
    });
    expect(e.sealed_at).not.toBeNull();
    const [order] = await q(
      'select trigger_concept_id, care_space_id from practice.cleaning_orders where id = ?',
      [res.body.cleaningOrderId],
    );
    expect(order).toEqual({
      trigger_concept_id: PRAC.CLN_TRG_DISCHARGE,
      care_space_id: planta.beds[2],
    });
    const estado = await http()
      .get(`/care-spaces/${planta.beds[2]}/operational-state`)
      .set(como(orgA))
      .expect(200);
    expect(estado.body).toMatchObject({
      v2Code: 'H',
      occupancy: { code: 'OCC_FREE' },
      hygiene: { code: 'HYG_DIRTY' },
    });
    const stay = await http()
      .get(`/clinical/encounters/${enc.p2}/stay`)
      .set(como(admission))
      .expect(200);
    expect(stay.body.movements.length).toBeGreaterThanOrEqual(2);
    expect(stay.body.encounter.status).toBe('ENCOUNTER_FINISHED');
  });

  it('censo: hoy no se cierra (422); ayer se cierra, UPDATE directo falla, ajuste sin tocar el snapshot', async () => {
    const hoy = new Date(Date.now() - 4 * 3600_000).toISOString().slice(0, 10);
    const ayer = new Date(Date.now() - 28 * 3600_000)
      .toISOString()
      .slice(0, 10);
    const no = await http()
      .post(`/sites/${orgA.siteId}/census/${hoy}/close`)
      .set(como(admission))
      .send({})
      .expect(422);
    expect(no.body.reason).toBe('CENSUS_DATE_NOT_ENDED');
    const preview = await http()
      .get(`/sites/${orgA.siteId}/census?date=${hoy}`)
      .set(como(admission))
      .expect(200);
    expect(preview.body.every((d: any) => d.status === 'OPEN')).toBe(true);
    const closed = await http()
      .post(`/sites/${orgA.siteId}/census/${ayer}/close`)
      .set(como(admission))
      .send({})
      .expect(200);
    expect(closed.body.closed.map((d: any) => d.unitId)).toContain(planta.unit);
    const dayId = closed.body.closed.find(
      (d: any) => d.unitId === planta.unit,
    ).id;
    const again = await http()
      .post(`/sites/${orgA.siteId}/census/${ayer}/close`)
      .set(como(admission))
      .send({})
      .expect(409);
    expect(again.body.reason).toBe('CENSUS_ALREADY_CLOSED');
    await expect(
      q(
        'update clinical.inpatient_census_days set admissions = 99 where id = ?',
        [dayId],
      ),
    ).rejects.toThrow();
    const adj = await http()
      .post(`/census-days/${dayId}/adjustments`)
      .set(como(orgA))
      .send({
        fieldCode: 'admissions',
        newValue: 3,
        reasonText: 'Ingreso cargado tarde',
      })
      .expect(201);
    expect(adj.body).toMatchObject({ fieldCode: 'admissions', newValue: 3 });
    const [row] = await q(
      'select admissions from clinical.inpatient_census_days where id = ?',
      [dayId],
    );
    expect(row.admissions).toBe(
      closed.body.closed.find((d: any) => d.id === dayId).counts.admissions,
    );
    const vista = await http()
      .get(`/sites/${orgA.siteId}/census?date=${ayer}&unitId=${planta.unit}`)
      .set(como(admission))
      .expect(200);
    expect(vista.body[0]).toMatchObject({
      status: 'CLOSED',
      adjustedTotals: { admissions: 3 },
    });
    const ind = await http()
      .get(
        `/sites/${orgA.siteId}/inpatient-indicators?from=${ayer}&to=${ayer}&unitId=${planta.unit}`,
      )
      .set(como(admission))
      .expect(200);
    expect(ind.body).toMatchObject({
      admissions: 3,
      coverage: { daysClosed: 1, daysMissing: [] },
    });
  });

  it('otro tenant → 404 (ingreso a cama ajena, ficha, traslado)', async () => {
    const res = await http()
      .post('/clinical/admissions')
      .set(como(orgB))
      .send({
        patientProfileId: p1.patientProfileId,
        practiceSiteId: orgA.siteId,
        levelOfCareCode: 'LOC_CARE_GENERAL',
        admissionSourceCode: 'ADM_SRC_EMERGENCY',
        reasonText: 'x',
        bed: { careSpaceId: planta.beds[0], mode: 'ASSIGN' },
      })
      .expect(404);
    expect(res.body.code).toBe('NOT_FOUND');
    await http()
      .get(`/clinical/encounters/${enc.p1}/stay`)
      .set(como(orgB))
      .expect(404);
    await http()
      .post(`/clinical/encounters/${enc.p1}/transfer`)
      .set(como(orgB))
      .send({ toCareSpaceId: planta.beds[0] })
      .expect(404);
  });

  it('Limpieza no interna (403)', async () => {
    const res = await http()
      .post('/clinical/admissions')
      .set(como(cleaner))
      .send({
        patientProfileId: p2.patientProfileId,
        practiceSiteId: orgA.siteId,
        levelOfCareCode: 'LOC_CARE_GENERAL',
        admissionSourceCode: 'ADM_SRC_EMERGENCY',
        reasonText: 'x',
      })
      .expect(403);
    expect(res.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
  });
});
