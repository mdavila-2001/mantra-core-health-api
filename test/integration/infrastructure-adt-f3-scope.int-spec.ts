import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  camposObligatoriosDePaciente,
  type TestContext,
} from './harness';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
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
 * F3 · alcance por unidad (revisión de seguridad): un permiso acotado a la
 * unidad A no ve, no cierra y no reabre nada de la unidad B; la ficha de una
 * estancia sin movimientos no se sirve sin autorización.
 */
describe('Infraestructura F3 · alcance por unidad (fail-closed)', () => {
  let ctx: TestContext;
  let q: ReturnType<typeof sql>;
  const http = () => request(ctx.app.getHttpServer());
  const tag = randomUUID().slice(0, 6);
  let org: InfraOrg;
  let unitA: Planta;
  let unitB: Planta;
  let siteStaff: InfraStaff;
  let unitStaff: InfraStaff;
  let patient: { patientProfileId: string };
  const fecha = new Date(Date.now() - 3 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    q = sql(ctx);
    org = await registrarOrganizacion(ctx, `F3S-${tag}`);
    unitA = await armarPlanta(ctx, org, `F3SA-${tag}`, 2);
    unitB = await armarPlanta(ctx, org, `F3SB-${tag}`, 1);
    siteStaff = await crearPersonal(
      ctx,
      org,
      `F3SS-${tag}`,
      DELEG.ASSIGN_ROLE_ADMISSION,
      { site: org.siteId },
    );
    unitStaff = await crearPersonal(
      ctx,
      org,
      `F3SU-${tag}`,
      DELEG.ASSIGN_ROLE_ADMISSION,
      { unit: unitA.unit },
    );
    const campos = (await camposObligatoriosDePaciente(
      ctx,
    )) as unknown as Record<string, unknown>;
    patient = await registrarPaciente(ctx, org, `PS${tag}`, campos);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('censo: la unidad A no ve la unidad B (404) y la vista sólo trae A', async () => {
    await http()
      .get(`/sites/${org.siteId}/census?date=${fecha}&unitId=${unitB.unit}`)
      .set(como(unitStaff))
      .expect(404);
    const vista = await http()
      .get(`/sites/${org.siteId}/census?date=${fecha}`)
      .set(como(unitStaff))
      .expect(200);
    expect(vista.body.map((d: any) => d.unitId)).toEqual([unitA.unit]);
    await http()
      .get(
        `/sites/${org.siteId}/inpatient-indicators?from=${fecha}&to=${fecha}&unitId=${unitB.unit}`,
      )
      .set(como(unitStaff))
      .expect(404);
  });

  it('censo: cerrar la unidad B desde A → 403 y no se cierra ninguna; sin unitIds cierra sólo A', async () => {
    const res = await http()
      .post(`/sites/${org.siteId}/census/${fecha}/close`)
      .set(como(unitStaff))
      .send({ unitIds: [unitA.unit, unitB.unit] })
      .expect(403);
    expect(res.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
    const nada = await q(
      'select count(*)::int as n from clinical.inpatient_census_days where practice_site_id = ?',
      [org.siteId],
    );
    expect(nada[0].n).toBe(0);
    const ok = await http()
      .post(`/sites/${org.siteId}/census/${fecha}/close`)
      .set(como(unitStaff))
      .send({})
      .expect(200);
    expect(ok.body.closed.map((d: any) => d.unitId)).toEqual([unitA.unit]);
    const filas = await q(
      'select clinical_unit_id from clinical.inpatient_census_days where practice_site_id = ?',
      [org.siteId],
    );
    expect(filas).toEqual([{ clinical_unit_id: unitA.unit }]);
  });

  it('tablero: unitId de otra unidad → 404; la cola de limpieza igual', async () => {
    const nurse = await crearPersonal(
      ctx,
      org,
      `F3SN-${tag}`,
      DELEG.ASSIGN_ROLE_NURSE,
      { unit: unitA.unit },
    );
    await http()
      .get(`/sites/${org.siteId}/bed-board?unitId=${unitB.unit}`)
      .set(como(nurse))
      .expect(404);
    const tablero = await http()
      .get(`/sites/${org.siteId}/bed-board`)
      .set(como(nurse))
      .expect(200);
    const ids = tablero.body.units.flatMap((u: any) =>
      u.cells.map((c: any) => c.id),
    );
    expect(ids.sort()).toEqual([...unitA.beds].sort());
    await http()
      .get(`/sites/${org.siteId}/cleaning-orders?unitId=${unitB.unit}`)
      .set(como(nurse))
      .expect(404);
  });

  it('anular un traslado cuyo espacio previo está fuera del alcance → 403 y nada cambia', async () => {
    const alta = await http()
      .post('/clinical/admissions')
      .set(como(siteStaff))
      .send({
        patientProfileId: patient.patientProfileId,
        practiceSiteId: org.siteId,
        levelOfCareCode: 'LOC_CARE_GENERAL',
        admissionSourceCode: 'ADM_SRC_EMERGENCY',
        reasonText: 'Ingreso',
        bed: { careSpaceId: unitB.beds[0], mode: 'ASSIGN' },
      })
      .expect(201);
    const traslado = await http()
      .post(`/clinical/encounters/${alta.body.encounterId}/transfer`)
      .set(como(siteStaff))
      .send({ toCareSpaceId: unitA.beds[0] })
      .expect(200);
    const res = await http()
      .post(
        `/clinical/encounter-locations/${traslado.body.toLocationId}/cancel`,
      )
      .set(como(unitStaff))
      .send({ reasonText: 'Error de carga' })
      .expect(403);
    expect(res.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
    const [loc] = await q(
      'select location_status_concept_id from clinical.encounter_locations where id = ?',
      [traslado.body.toLocationId],
    );
    expect(loc.location_status_concept_id).toBe(CLIN.LOCATION_ACTIVE);
    // Ingresar sin cama exige rol de nivel sede.
    await http()
      .post('/clinical/admissions')
      .set(como(unitStaff))
      .send({
        patientProfileId: patient.patientProfileId,
        practiceSiteId: org.siteId,
        levelOfCareCode: 'LOC_CARE_GENERAL',
        admissionSourceCode: 'ADM_SRC_EMERGENCY',
        reasonText: 'x',
      })
      .expect(403);
  });

  it('estancia sin movimientos: se autoriza igual (sin sede → 404), también para el OWNER', async () => {
    const id = randomUUID();
    await q(
      `insert into clinical.encounters (id, patient_profile_id, tenant_id, class_concept_id, status_concept_id, start_at, created_at, updated_at)
       values (?, ?, ?, ?, ?, now(), now(), now())`,
      [
        id,
        patient.patientProfileId,
        org.tenantId,
        CLIN.ENCOUNTER_CLASS_AMBULATORY,
        CLIN.ENCOUNTER_IN_PROGRESS,
      ],
    );
    await http()
      .get(`/clinical/encounters/${id}/stay`)
      .set(como(unitStaff))
      .expect(404);
    await http()
      .get(`/clinical/encounters/${id}/stay`)
      .set(como(org))
      .expect(404);
  });
});
