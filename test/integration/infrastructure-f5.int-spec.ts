import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  camposObligatoriosDePaciente,
  type TestContext,
} from './harness';

import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { BILL } from '../../src/modules/billing/billing.concepts';
import { DUNIT } from '../../src/modules/diagnostic_units/diagnostic_units.concepts';
import { DIR } from '../../src/modules/directory/directory.concepts';
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
 * F5 · integración contra la base real (CONTRATO-F2-F5 §F5): día-cama por
 * medianoche idempotente (F5e), equipo en sala con 404 entre tenants (F5a) y
 * jefe de unidad único (F5g).
 */
describe('Infraestructura F5 · integración', () => {
  let ctx: TestContext;
  let q: ReturnType<typeof sql>;
  const http = () => request(ctx.app.getHttpServer());
  const tag = randomUUID().slice(0, 6);
  let orgA: InfraOrg;
  let orgB: InfraOrg;
  let planta: Planta;
  let billing: InfraStaff;
  let patientId: string;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    q = sql(ctx);
    orgA = await registrarOrganizacion(ctx, `F5A-${tag}`);
    orgB = await registrarOrganizacion(ctx, `F5B-${tag}`);
    planta = await armarPlanta(ctx, orgA, `F5-${tag}`, 2);
    billing = await crearPersonal(
      ctx,
      orgA,
      `F5F-${tag}`,
      DELEG.ASSIGN_ROLE_BILLING,
      { site: orgA.siteId },
    );
    const campos = (await camposObligatoriosDePaciente(
      ctx,
    )) as unknown as Record<string, unknown>;
    patientId = (await registrarPaciente(ctx, orgA, `P5${tag}`, campos))
      .patientProfileId;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('F5e: 27/10 15:00 → UCI 28/10 10:00 → egreso 30/10 09:00 = 3 días-cama (27 compartida; 28 y 29 UCI); re-ejecutar no duplica', async () => {
    const [shared, icu] = planta.beds;
    await q(
      'update practice.care_spaces set bed_category_concept_id = ? where id = ?',
      [PRAC.BED_CAT_SHARED, shared],
    );
    await q(
      'update practice.care_spaces set bed_category_concept_id = ? where id = ?',
      [PRAC.BED_CAT_ICU, icu],
    );
    const svc = randomUUID();
    await q(
      `insert into billing.service_catalog (id, practice_id, code, name, default_price, is_active, created_at, updated_at)
       values (?, ?, ?, 'Día-cama', 0, true, now(), now())`,
      [svc, orgA.practiceId, `DC-${tag}`],
    );
    for (const [code, price] of [
      ['BED_CAT_SHARED', '300.00'],
      ['BED_CAT_ICU', '900.00'],
    ]) {
      await http()
        .post('/billing/space-tariffs')
        .set(como(orgA))
        .send({
          practiceId: orgA.practiceId,
          tariffKind: 'BED_DAY',
          bedCategoryCode: code,
          serviceCatalogId: svc,
          unitPrice: price,
          validFrom: '2026-01-01',
        })
        .expect(201);
    }
    const overlap = await http()
      .post('/billing/space-tariffs')
      .set(como(orgA))
      .send({
        practiceId: orgA.practiceId,
        tariffKind: 'BED_DAY',
        bedCategoryCode: 'BED_CAT_ICU',
        serviceCatalogId: svc,
        unitPrice: '1.00',
        validFrom: '2026-06-01',
      })
      .expect(409);
    expect(overlap.body.reason).toBe('TARIFF_OVERLAP');
    const enc = randomUUID();
    await q(
      `insert into clinical.encounters (id, patient_profile_id, tenant_id, class_concept_id, status_concept_id, start_at, end_at, created_at, updated_at)
       values (?, ?, ?, ?, ?, '2026-10-27T19:00:00Z', '2026-10-30T13:00:00Z', now(), now())`,
      [
        enc,
        patientId,
        orgA.tenantId,
        CLIN.ENCOUNTER_CLASS_INPATIENT,
        CLIN.ENCOUNTER_FINISHED,
      ],
    );
    for (const [bed, from, to] of [
      [shared, '2026-10-27T19:00:00Z', '2026-10-28T14:00:00Z'],
      [icu, '2026-10-28T14:00:00Z', '2026-10-30T13:00:00Z'],
    ]) {
      await q(
        `insert into clinical.encounter_locations
           (id, tenant_id, encounter_id, practice_site_id, care_space_id, location_status_concept_id,
            period_start, period_end, is_bed_assignment, created_at, updated_at)
         values (gen_random_uuid(), ?, ?, ?, ?, ?, ?, ?, true, now(), now())`,
        [
          orgA.tenantId,
          enc,
          orgA.siteId,
          bed,
          CLIN.LOCATION_COMPLETED,
          from,
          to,
        ],
      );
    }
    const run = await http()
      .post(`/billing/encounters/${enc}/bed-day-charges/run`)
      .set(como(billing))
      .expect(200);
    expect(
      run.body.created.map((c: any) => [
        c.serviceDate,
        c.careSpaceId,
        c.unitPrice,
      ]),
    ).toEqual([
      ['2026-10-27', shared, '300.000000'],
      ['2026-10-28', icu, '900.000000'],
      ['2026-10-29', icu, '900.000000'],
    ]);
    const rows = await q(
      'select idempotency_key, tenant_id, status_concept_id from billing.charge_captures where encounter_id = ? order by service_date',
      [enc],
    );
    expect(rows).toEqual([
      {
        idempotency_key: `BEDDAY:${enc}:2026-10-27`,
        tenant_id: orgA.tenantId,
        status_concept_id: BILL.CHG_PENDING,
      },
      {
        idempotency_key: `BEDDAY:${enc}:2026-10-28`,
        tenant_id: orgA.tenantId,
        status_concept_id: BILL.CHG_PENDING,
      },
      {
        idempotency_key: `BEDDAY:${enc}:2026-10-29`,
        tenant_id: orgA.tenantId,
        status_concept_id: BILL.CHG_PENDING,
      },
    ]);
    const again = await http()
      .post(`/billing/encounters/${enc}/bed-day-charges/run`)
      .set(como(billing))
      .expect(200);
    expect(again.body).toEqual({ created: [], skipped: 3 });
    const pending = await http()
      .get(`/billing/encounters/${enc}/pending-charges`)
      .set(como(billing))
      .expect(200);
    expect(pending.body).toHaveLength(3);
    const ev = await q(
      'select count(*)::int as n from messaging.domain_events where event_type = ? and tenant_id = ?',
      ['billing.charge_capture.created', orgA.tenantId],
    );
    expect(ev[0].n).toBe(3);
    await http()
      .post(`/billing/encounters/${enc}/bed-day-charges/run`)
      .set(como(orgB))
      .expect(404);
    const nurse = await crearPersonal(
      ctx,
      orgA,
      `F5N-${tag}`,
      DELEG.ASSIGN_ROLE_NURSE,
      { site: orgA.siteId },
    );
    await http()
      .post(`/billing/encounters/${enc}/bed-day-charges/run`)
      .set(como(nurse))
      .expect(403);
  });

  it('F5e: encuentro sin movimientos y con cargos — sin objetivo no se autoriza: enfermería 403/404; sede del espacio del cargo o práctica deciden', async () => {
    const nuevoEncuentro = async () => {
      const id = randomUUID();
      await q(
        `insert into clinical.encounters (id, patient_profile_id, tenant_id, class_concept_id, status_concept_id, start_at, created_at, updated_at)
         values (?, ?, ?, ?, ?, now(), now(), now())`,
        [
          id,
          patientId,
          orgA.tenantId,
          CLIN.ENCOUNTER_CLASS_INPATIENT,
          CLIN.ENCOUNTER_FINISHED,
        ],
      );
      return id;
    };
    const cargo = (enc: string, careSpaceId: string | null) =>
      q(
        `insert into billing.charge_captures
           (id, tenant_id, practice_id, encounter_id, patient_profile_id, source_kind_concept_id, source_ref_id,
            service_date, care_space_id, quantity, status_concept_id, idempotency_key, created_at, updated_at)
         values (gen_random_uuid(), ?, ?, ?, ?, ?, gen_random_uuid(), '2026-10-27', ?, 1, ?, ?, now(), now())`,
        [
          orgA.tenantId,
          orgA.practiceId,
          enc,
          patientId,
          BILL.CHG_SRC_BED_DAY,
          careSpaceId,
          BILL.CHG_PENDING,
          `T5:${enc}`,
        ],
      );
    const nurse = await crearPersonal(
      ctx,
      orgA,
      `F5M-${tag}`,
      DELEG.ASSIGN_ROLE_NURSE,
      { site: orgA.siteId },
    );

    // Cargo sin espacio y encuentro sin movimientos: decide la práctica.
    const sinEspacio = await nuevoEncuentro();
    await cargo(sinEspacio, null);
    const denegado = await http()
      .get(`/billing/encounters/${sinEspacio}/pending-charges`)
      .set(como(nurse));
    expect([403, 404]).toContain(denegado.status);
    const admin = await http()
      .get(`/billing/encounters/${sinEspacio}/pending-charges`)
      .set(como(orgA))
      .expect(200);
    expect(admin.body).toHaveLength(1);

    // Cargo con espacio: decide la sede del espacio del cargo.
    const conEspacio = await nuevoEncuentro();
    await cargo(conEspacio, planta.beds[0]);
    const denegado2 = await http()
      .get(`/billing/encounters/${conEspacio}/pending-charges`)
      .set(como(nurse));
    expect([403, 404]).toContain(denegado2.status);
    await http()
      .get(`/billing/encounters/${conEspacio}/pending-charges`)
      .set(como(billing))
      .expect(200);

    // Sin movimientos ni cargos: no hay objetivo → se deniega aun al admin.
    const vacio = await nuevoEncuentro();
    const sinObjetivo = await http()
      .get(`/billing/encounters/${vacio}/pending-charges`)
      .set(como(orgA));
    expect([403, 404]).toContain(sinObjetivo.status);
  });

  it('F5a: ubicar un equipo en una sala propia; sala de otro tenant → 404; AE Title de 17 → 422', async () => {
    const unit = randomUUID();
    const unitSite = randomUUID();
    const equipment = randomUUID();
    await q(
      `insert into diagnostic_units.diagnostic_units (id, tenant_id, code, name, diagnostic_unit_type_concept_id, verification_status_concept_id, status_concept_id, created_at, updated_at)
       values (?, ?, ?, 'Imagen', ?, ?, ?, now(), now())`,
      [
        unit,
        orgA.tenantId,
        `DU-${tag}`,
        DUNIT.UNIT_TYPE_IMAGING,
        DUNIT.VERIFICATION_VERIFIED,
        DUNIT.UNIT_ACTIVE,
      ],
    );
    await q(
      `insert into diagnostic_units.diagnostic_unit_sites (id, diagnostic_unit_id, practice_site_id, site_role_concept_id, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, now(), now())`,
      [unitSite, unit, orgA.siteId, DUNIT.SITE_ROLE_PRIMARY, DUNIT.SITE_ACTIVE],
    );
    await q(
      `insert into diagnostic_units.diagnostic_equipment (id, diagnostic_unit_site_id, equipment_type_concept_id, operational_status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, now(), now())`,
      [
        equipment,
        unitSite,
        DUNIT.EQUIPMENT_TYPE_XRAY,
        DUNIT.EQUIPMENT_OPERATIONAL,
      ],
    );
    const room = await http()
      .post(`/sites/${orgA.siteId}/care-spaces`)
      .set(como(orgA))
      .send({
        code: `RX-${tag}`,
        name: 'Sala de rayos',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_IMAGING_ROOM',
        parentSpaceId: planta.building,
        activate: true,
        areaM2: 25,
      })
      .expect(201);
    const admin = { ...bearer(ctx.adminToken), 'X-Tenant-Id': orgA.tenantId };
    const ok = await http()
      .patch(`/diagnostic-equipment/${equipment}`)
      .set(admin)
      .send({
        careSpaceId: room.body.id,
        aeTitle: 'RX_SALA_1',
        stationName: 'RX1',
      });
    expect(ok.status).toBe(200);
    const [row] = await q(
      'select care_space_id, ae_title from diagnostic_units.diagnostic_equipment where id = ?',
      [equipment],
    );
    expect(row).toEqual({ care_space_id: room.body.id, ae_title: 'RX_SALA_1' });
    const ajeno = await http()
      .post(`/sites/${orgB.siteId}/care-spaces`)
      .set(como(orgB))
      .send({
        code: `RXB-${tag}`,
        name: 'Sala B',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_IMAGING_ROOM',
        activate: true,
        areaM2: 25,
      });
    const otro = await http()
      .patch(`/diagnostic-equipment/${equipment}`)
      .set(admin)
      .send({ careSpaceId: ajeno.body.id ?? randomUUID() });
    expect(otro.status).toBe(404);
    const largo = await http()
      .patch(`/diagnostic-equipment/${equipment}`)
      .set(admin)
      .send({ aeTitle: 'X'.repeat(17) })
      .expect(422);
    expect(largo.body.reason).toBe('AE_TITLE_INVALID');
    const [still] = await q(
      'select care_space_id from diagnostic_units.diagnostic_equipment where id = ?',
      [equipment],
    );
    expect(still.care_space_id).toBe(room.body.id);

    // F5a lecturas y recurso: detalle, estación MWL, RES_EQUIPMENT (409 si ya existe).
    const detail = await http()
      .get(`/diagnostic-equipment/${equipment}`)
      .set(admin)
      .expect(200);
    expect(detail.body).toMatchObject({
      id: equipment,
      siteId: orgA.siteId,
      aeTitle: 'RX_SALA_1',
      careSpace: {
        id: room.body.id,
        code: `RX-${tag}`,
        path: expect.stringContaining('Sala de rayos'),
      },
      schedulableResourceId: null,
    });
    await http()
      .get(`/diagnostic-equipment/${equipment}`)
      .set(como(orgB))
      .expect(404);
    const mwl = await http()
      .get(`/diagnostic-equipment/${equipment}/mwl-station`)
      .set(admin)
      .expect(200);
    expect(mwl.body).toEqual({
      scheduledStationAETitle: 'RX_SALA_1',
      scheduledStationName: 'RX1',
      spsLocation: `RX-${tag}`,
    });
    const res = await http()
      .post(`/diagnostic-equipment/${equipment}/resource`)
      .set(admin)
      .expect(201);
    const [r] = await q(
      `select resource_ref_type, resource_ref_id, tenant_id, resource_type_concept_id from scheduling.schedulable_resources where id = ?`,
      [res.body.resourceId],
    );
    expect(r).toMatchObject({
      resource_ref_type: 'diagnostic_equipment',
      resource_ref_id: equipment,
      tenant_id: orgA.tenantId,
    });
    const dup = await http()
      .post(`/diagnostic-equipment/${equipment}/resource`)
      .set(admin)
      .expect(409);
    expect(dup.body.reason).toBe('RESOURCE_ALREADY_EXISTS_FOR_EQUIPMENT');
    await http()
      .post(`/diagnostic-equipment/${equipment}/resource`)
      .set(como(orgB))
      .expect(404);

    // Mantenimiento: sólo estado operativo; la sala no (403). Enfermería no lee (403).
    const maint = await crearPersonal(
      ctx,
      orgA,
      `F5MT-${tag}`,
      DELEG.ASSIGN_ROLE_MAINTENANCE,
      { site: orgA.siteId },
    );
    await http()
      .patch(`/diagnostic-equipment/${equipment}`)
      .set(como(maint))
      .send({ operationalStatusConceptId: DUNIT.EQUIPMENT_MAINTENANCE })
      .expect(200);
    await http()
      .patch(`/diagnostic-equipment/${equipment}`)
      .set(como(maint))
      .send({ stationName: 'X' })
      .expect(403);
    const nurseE = await crearPersonal(
      ctx,
      orgA,
      `F5NE-${tag}`,
      DELEG.ASSIGN_ROLE_NURSE,
      { site: orgA.siteId },
    );
    await http()
      .get(`/diagnostic-equipment/${equipment}`)
      .set(como(nurseE))
      .expect(403);
    // Revisión de alcance F5a: un permiso de OTRA unidad de la misma sede no
    // lee ni mueve el equipo; un permiso sobre SU sala sí lo lee; mover exige
    // permiso de escritura (y sobre el destino).
    const supOtraUnidad = await crearPersonal(
      ctx,
      orgA,
      `F5SU-${tag}`,
      DELEG.ASSIGN_ROLE_NURSE_SUPERVISOR,
      { unit: planta.unit },
    );
    const leeOtra = await http()
      .get(`/diagnostic-equipment/${equipment}`)
      .set(como(supOtraUnidad));
    expect([403, 404]).toContain(leeOtra.status);
    const mueveOtra = await http()
      .patch(`/diagnostic-equipment/${equipment}`)
      .set(como(supOtraUnidad))
      .send({ careSpaceId: room.body.id });
    expect([403, 404]).toContain(mueveOtra.status);
    const supSala = await crearPersonal(
      ctx,
      orgA,
      `F5SS-${tag}`,
      DELEG.ASSIGN_ROLE_NURSE_SUPERVISOR,
      { space: room.body.id },
    );
    await http()
      .get(`/diagnostic-equipment/${equipment}`)
      .set(como(supSala))
      .expect(200);
    const room2 = await http()
      .post(`/sites/${orgA.siteId}/care-spaces`)
      .set(como(orgA))
      .send({
        code: `RX2-${tag}`,
        name: 'Sala 2',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_IMAGING_ROOM',
        parentSpaceId: planta.building,
        activate: true,
        areaM2: 25,
      })
      .expect(201);
    await http()
      .patch(`/diagnostic-equipment/${equipment}`)
      .set(como(supSala))
      .send({ careSpaceId: room2.body.id })
      .expect(403);
    const [quieto] = await q(
      'select care_space_id from diagnostic_units.diagnostic_equipment where id = ?',
      [equipment],
    );
    expect(quieto.care_space_id).toBe(room.body.id);

    const evs = await q(
      `select event_type from messaging.domain_events where aggregate_id = ? order by occurred_at`,
      [equipment],
    );
    expect(evs.map((e: any) => e.event_type)).toEqual([
      'diagnostic_units.equipment.located',
      'diagnostic_units.equipment.resource_linked',
      'diagnostic_units.equipment.status_changed',
    ]);
  });

  it('F5g: alcance SPACE con espacio propio 201; segundo jefe vigente de la unidad → 409; espacio de otro tenant → 404', async () => {
    const [m] = await q<{ id: string }>(
      'select id from directory.tenant_memberships where user_id = ? and tenant_id = ? and status_concept_id = ?',
      [orgA.ownerUserId, orgA.tenantId, DIR.MEMBERSHIP_ACTIVE],
    );
    const admin = { ...bearer(ctx.adminToken), 'X-Tenant-Id': orgA.tenantId };
    await http()
      .post(`/org/${m.id}/user-assignments`)
      .set(admin)
      .send({
        role: 'HOUSEKEEPING',
        accessScope: 'SPACE',
        careSpaceId: planta.room,
      })
      .expect(201);
    await http()
      .post(`/org/${m.id}/user-assignments`)
      .set(admin)
      .send({
        role: 'UNIT_HEAD',
        accessScope: 'UNIT',
        clinicalUnitId: planta.unit,
      })
      .expect(201);
    const second = await crearPersonal(
      ctx,
      orgA,
      `F5J-${tag}`,
      DELEG.ASSIGN_ROLE_STAFF,
      { site: orgA.siteId },
    );
    const [m2] = await q<{ id: string }>(
      'select id from directory.tenant_memberships where user_id = ? and tenant_id = ?',
      [second.userId, orgA.tenantId],
    );
    const dup = await http()
      .post(`/org/${m2.id}/user-assignments`)
      .set(admin)
      .send({
        role: 'UNIT_HEAD',
        accessScope: 'UNIT',
        clinicalUnitId: planta.unit,
      })
      .expect(409);
    expect(dup.body.reason).toBe('UNIT_HEAD_ALREADY_ASSIGNED');
    const plantaB = await armarPlanta(ctx, orgB, `F5GB-${tag}`, 1);
    await http()
      .post(`/org/${m.id}/user-assignments`)
      .set(admin)
      .send({ role: 'NURSE', accessScope: 'SPACE', careSpaceId: plantaB.room })
      .expect(404);
    const n = await q(
      'select count(*)::int as n from delegated_access.organization_user_assignments where care_space_id = ?',
      [plantaB.room],
    );
    expect(n[0].n).toBe(0);
  });
});
