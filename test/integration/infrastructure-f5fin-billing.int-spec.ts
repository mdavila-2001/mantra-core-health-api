import { randomUUID } from 'node:crypto';
import { CONCEPTS, SEED, TokenService } from '../../src/common';
import { BILL } from '../../src/modules/billing/billing.concepts';
import {
  addDays,
  localDate,
} from '../../src/modules/billing/domain/zoned-time';
import { CARE_SPACE_OPS_PORT } from '../../src/modules/clinical/ports/care-space-ops.port';
import { PERIOP } from '../../src/modules/procedures_perioperative/procedures_perioperative.concepts';
import { CareSpaceOpsDouble } from '../doubles/care-space-ops.double';
import { ATRIBUTOS_QUIROFANO } from './infra-f4.fixtures';
import {
  bearer,
  bootstrapTestApp,
  ensureTestSession,
  type TestContext,
} from './harness';
import {
  ROLE,
  as,
  createPatient,
  createSpace,
  createStaff,
  createUnit,
  ensureF2Concepts,
  ifMatch,
  registerOrg,
  toolbox,
  type InfraOrg,
  type Staff,
} from './infrastructure-f3.fixtures';

const TZ = 'America/La_Paz'; // UTC-4 todo el año

/**
 * F5e · tarifas versionadas, día-cama por la regla de medianoche, quirófano por
 * tiempo, cargos devengados y factura con `chargeCaptureIds`, contra la API y la base
 * reales (ocupación escrita por el ADT de F3).
 *
 * Las fechas son relativas a hoy (hora de La Paz): la ocupación se registra con su
 * hora real (`admittedAt` / `occurredAt`), y las camas se «inauguran» hace 60 días.
 */
describe('Infraestructura F5e · tarifas, día-cama, quirófano por tiempo y facturación', () => {
  let ctx: TestContext;
  const double = new CareSpaceOpsDouble();
  const suffix = randomUUID().slice(0, 8);
  let http: ReturnType<typeof toolbox>['http'];
  let sql: ReturnType<typeof toolbox>['sql'];

  let orgA: InfraOrg;
  let orgB: InfraOrg;
  let unit: string;
  let nurse: Staff;
  let billing: Staff;
  let billingB: Staff;
  let nurseB: Staff;
  let system: { Authorization: string };
  let practitioner: string;
  let svcShared: string;
  let svcIcu: string;
  let svcOr: string;
  let svcB: string;
  let costCenter: string;
  let today: string;
  let seq = 0;

  const day = (back: number): string => addDays(today, -back);
  const at = (d: string, hhmm: string): string =>
    new Date(`${d}T${hhmm}:00-04:00`).toISOString();
  const H = (s: Staff, org: InfraOrg = orgA) => as(s.token, org.tenantId);
  const owner = () => as(orgA.token, orgA.tenantId);

  const version = async (encounterId: string): Promise<number> =>
    (
      await sql('select row_version from clinical.encounters where id = ?', [
        encounterId,
      ])
    )[0].row_version;

  /** Cama con su categoría, «inaugurada» hace 60 días (espacio y período de categoría). */
  async function bed(
    org: InfraOrg,
    category = 'BED_CAT_SHARED',
    extra: Record<string, unknown> = {},
  ): Promise<string> {
    seq += 1;
    const room = await createSpace(ctx, org, {
      code: `RF${seq}-${suffix}`,
      name: `Hab ${seq}`,
      formCode: 'LOC_FORM_ROOM',
      functionCode: 'SPACE_FN_INPATIENT_ROOM',
      clinicalUnitId: org === orgA ? unit : undefined,
    });
    const created = await createSpace(ctx, org, {
      code: `BF${seq}-${suffix}`,
      name: `Cama ${seq}`,
      formCode: 'LOC_FORM_BED',
      functionCode: 'SPACE_FN_BED_STANDARD',
      parentSpaceId: room.id,
      bedCategoryCode: category,
      censable: true,
      clinicalUnitId: org === orgA ? unit : undefined,
      ...extra,
    });
    await sql(
      `update practice.care_spaces set valid_from = now() - interval '60 days' where id in (?, ?)`,
      [room.id, created.id],
    );
    // La guarda de los períodos sólo deja cerrar valid_to: la inauguración retroactiva de la
    // prueba es una corrección de fixture, no una operación de la API.
    await sql(
      'alter table practice.care_space_category_periods disable trigger trg_care_space_category_periods_guard',
    );
    try {
      await sql(
        `update practice.care_space_category_periods set valid_from = now() - interval '60 days'
          where care_space_id = ?`,
        [created.id],
      );
    } finally {
      await sql(
        'alter table practice.care_space_category_periods enable trigger trg_care_space_category_periods_guard',
      );
    }
    return created.id;
  }

  async function patient(org: InfraOrg = orgA): Promise<string> {
    seq += 1;
    return createPatient(ctx, {
      name: `Paciente ${org.letter}${seq}`,
      gender: 'MALE',
      birthDate: '1970-01-01',
    });
  }

  const admitBody = (
    patientProfileId: string,
    bedId: string,
    admittedAt: string,
    org = orgA,
  ) => ({
    patientProfileId,
    practiceSiteId: org.siteId,
    attendingPractitionerId: practitioner,
    levelOfCareCode: 'LOC_CARE_GENERAL',
    admissionSourceCode: 'ADM_SRC_EMERGENCY',
    reasonText: 'Ingreso de prueba de facturación',
    bed: { careSpaceId: bedId, mode: 'ASSIGN' },
    admittedAt,
  });

  async function admit(
    patientId: string,
    bedId: string,
    admittedAt: string,
    org = orgA,
    who: Staff = nurse,
  ): Promise<string> {
    const res = await http()
      .post('/clinical/admissions')
      .set(H(who, org))
      .send(admitBody(patientId, bedId, admittedAt, org))
      .expect(201);
    return res.body.encounterId;
  }

  async function transfer(
    encounterId: string,
    toBed: string,
    occurredAt: string,
  ) {
    await http()
      .post(`/clinical/encounters/${encounterId}/transfer`)
      .set(H(nurse))
      .set(ifMatch(await version(encounterId)))
      .send({
        toCareSpaceId: toBed,
        occurredAt,
        reasonCode: 'CLINICAL_CONDITION',
      })
      .expect(200);
  }

  async function discharge(
    encounterId: string,
    occurredAt: string,
    who: Staff = nurse,
    org = orgA,
  ) {
    await http()
      .post(`/clinical/encounters/${encounterId}/discharge`)
      .set(H(who, org))
      .set(ifMatch(await version(encounterId)))
      .send({ dischargeDispositionCode: 'DISP_HOME', occurredAt })
      .expect(200);
  }

  const runBedDays = (body: Record<string, unknown> = {}) =>
    http().post('/internal/billing/bed-day-charges/run').set(system).send(body);

  const charges = (encounterId: string) =>
    sql<{
      id: string;
      service_date: string;
      status: string;
      unit_price: string | null;
      care_space_id: string;
      bed_category_concept_id: string;
      minimum_stay_charge: boolean;
      cost_center_id: string | null;
      invoice_line_id: string | null;
      idempotency_key: string;
      tenant_id: string;
      quantity: string;
    }>(
      `select id, service_date::text as service_date, status_concept_id as status, unit_price::text as unit_price,
              care_space_id, bed_category_concept_id, minimum_stay_charge, cost_center_id, invoice_line_id,
              idempotency_key, tenant_id, quantity::text as quantity
         from billing.charge_captures where encounter_id = ? order by service_date, created_at`,
      [encounterId],
    );

  const events = (type: string, aggregateId: string) =>
    sql<{ payload_json: any }>(
      'select payload_json from messaging.domain_events where event_type = ? and aggregate_id = ?',
      [type, aggregateId],
    );

  async function tariff(
    body: Record<string, unknown>,
    who: { headers: Record<string, string> } = { headers: owner() },
    expected = 201,
  ) {
    return http()
      .post('/billing/space-tariffs')
      .set(who.headers)
      .send({
        practiceId: orgA.practiceId,
        kind: 'TARIFF_BED_DAY',
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
        validFrom: '2026-01-01',
        ...body,
      })
      .expect(expected);
  }

  async function service(practiceId: string, code: string): Promise<string> {
    const id = randomUUID();
    await sql(
      `insert into billing.service_catalog
         (id, practice_id, code, name, default_price, is_active, created_at, updated_at, row_version)
       values (?, ?, ?, ?, 0, true, now(), now(), 1)`,
      [id, practiceId, `${code}-${suffix}`, code],
    );
    return id;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp({
      overrideProviders: [{ token: CARE_SPACE_OPS_PORT, useValue: double }],
    });
    ({ http, sql } = toolbox(ctx));
    practitioner = ctx.practitionerSubtypeId;
    await ensureF2Concepts(ctx);
    today = localDate(new Date(), TZ);
    orgA = await registerOrg(ctx, 'GA', suffix);
    orgB = await registerOrg(ctx, 'GB', suffix);
    unit = await createUnit(ctx, orgA, 'UN-F5E', 'Medicina');
    const siteA = { kind: 'SITE', siteId: orgA.siteId } as const;
    nurse = await createStaff(ctx, orgA, 'enf', ROLE.NURSE, siteA, suffix);
    billing = await createStaff(ctx, orgA, 'fac', ROLE.BILLING, siteA, suffix);
    const siteB = { kind: 'SITE', siteId: orgB.siteId } as const;
    nurseB = await createStaff(ctx, orgB, 'enfb', ROLE.NURSE, siteB, suffix);
    billingB = await createStaff(
      ctx,
      orgB,
      'facb',
      ROLE.BILLING,
      siteB,
      suffix,
    );
    svcShared = await service(orgA.practiceId, 'Cama compartida');
    svcIcu = await service(orgA.practiceId, 'Cama UCI');
    svcOr = await service(orgA.practiceId, 'Quirófano por tiempo');
    svcB = await service(orgB.practiceId, 'Servicio de B');
    costCenter = randomUUID();
    await sql(
      `insert into accounting.cost_centers
         (id, practice_id, code, name, status_concept_id, clinical_unit_id, created_at, updated_at, row_version)
       values (?, ?, ?, 'Medicina', ?, ?, now(), now(), 1)`,
      [
        costCenter,
        orgA.practiceId,
        `CCF-${suffix}`,
        CONCEPTS.STATE_ACTIVE,
        unit,
      ],
    );
    await ensureTestSession(ctx.orm, SEED.systemWorkerUserId, 'f5fin-system');
    system = bearer(
      ctx.app
        .get(TokenService)
        .signAccessToken(SEED.systemWorkerUserId, 'f5fin-system', ['SYSTEM']),
    );
  }, 300000);

  beforeEach(() => double.reset());

  afterAll(async () => {
    await ctx?.app.close();
  });

  // ------------------------------------------------------------ tarifas
  describe('tarifas de espacio: POST/GET /billing/space-tariffs y close', () => {
    it('permitido: Facturación crea tarifas, queda la historia y el evento; la lista las trae con vigencias', async () => {
      const shared = await tariff(
        {
          bedCategoryCode: 'BED_CAT_SHARED',
          serviceCatalogId: svcShared,
          unitPrice: '350.00',
        },
        { headers: H(billing) },
      );
      await tariff(
        {
          bedCategoryCode: 'BED_CAT_ICU',
          serviceCatalogId: svcIcu,
          unitPrice: '900.00',
        },
        { headers: H(billing) },
      );
      expect(shared.body).toMatchObject({
        kind: 'TARIFF_BED_DAY',
        bedCategoryCode: 'BED_CAT_SHARED',
        unitPrice: '350.000000',
        validFrom: '2026-01-01',
        validTo: null,
      });
      expect(
        await events('billing.space_tariff.created', shared.body.id),
      ).toHaveLength(1);
      const history = await sql(
        'select revision_no from audit.space_tariffs_history where space_tariff_id = ?',
        [shared.body.id],
      );
      expect(history).toHaveLength(1);

      const list = await http()
        .get(
          `/billing/space-tariffs?practiceId=${orgA.practiceId}&kind=TARIFF_BED_DAY`,
        )
        .set(H(billing))
        .expect(200);
      expect(list.body.items.map((t: any) => t.bedCategoryCode).sort()).toEqual(
        ['BED_CAT_ICU', 'BED_CAT_SHARED'],
      );
      const vigentes = await http()
        .get(
          `/billing/space-tariffs?practiceId=${orgA.practiceId}&onDate=2025-12-31`,
        )
        .set(H(billing))
        .expect(200);
      expect(vigentes.body.count).toBe(0);
    });

    it('el administrador de la organización también configura tarifas (ORG_ADMIN ✔)', async () => {
      await tariff({
        bedCategoryCode: 'BED_CAT_NEONATAL',
        serviceCatalogId: svcShared,
        unitPrice: '700.00',
      });
    });

    it('fail-closed por rol: Enfermería 403 al crear y al leer; el reason y los roles requeridos van en la respuesta', async () => {
      const crear = await tariff(
        {
          bedCategoryCode: 'BED_CAT_INTERMEDIATE',
          serviceCatalogId: svcShared,
          unitPrice: '100.00',
        },
        { headers: H(nurse) },
        403,
      );
      expect(crear.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
      expect(crear.body.details.requiredRoles).toEqual([
        'ORG_ADMIN',
        'BILLING',
      ]);
      await http()
        .get(`/billing/space-tariffs?practiceId=${orgA.practiceId}`)
        .set(H(nurse))
        .expect(403);
    });

    it('fail-closed por tenant: la práctica de otra organización responde 404 al crear, listar y cerrar', async () => {
      await tariff(
        {
          bedCategoryCode: 'BED_CAT_PRIVATE',
          serviceCatalogId: svcShared,
          unitPrice: '100.00',
        },
        { headers: H(billingB, orgB) },
        404,
      );
      await http()
        .get(`/billing/space-tariffs?practiceId=${orgA.practiceId}`)
        .set(H(billingB, orgB))
        .expect(404);
      const tarifaDeA = (
        await http()
          .get(`/billing/space-tariffs?practiceId=${orgA.practiceId}`)
          .set(owner())
          .expect(200)
      ).body.items[0].id;
      await http()
        .post(`/billing/space-tariffs/${tarifaDeA}/close`)
        .set(H(billingB, orgB))
        .send({ validTo: '2027-01-01' })
        .expect(404);
      await http()
        .post(`/billing/space-tariffs/${randomUUID()}/close`)
        .set(owner())
        .send({ validTo: '2027-01-01' })
        .expect(404);
    });

    it('409 TARIFF_OVERLAP si ya hay una vigente en ese período; 422 si el servicio es de otra práctica o la forma no cierra', async () => {
      const solape = await tariff(
        {
          bedCategoryCode: 'BED_CAT_SHARED',
          serviceCatalogId: svcShared,
          unitPrice: '360.00',
          validFrom: '2026-06-01',
        },
        { headers: owner() },
        409,
      );
      expect(solape.body.reason).toBe('TARIFF_OVERLAP');
      const ajeno = await tariff(
        {
          bedCategoryCode: 'BED_CAT_PRIVATE',
          serviceCatalogId: svcB,
          unitPrice: '100.00',
        },
        { headers: owner() },
        422,
      );
      expect(ajeno.body.reason).toBe('TARIFF_SERVICE_NOT_IN_PRACTICE');
      const forma = await tariff(
        {
          bedCategoryCode: 'BED_CAT_PRIVATE',
          serviceCatalogId: svcShared,
          unitPrice: '100.00',
          unitMinutes: 30,
        },
        { headers: owner() },
        422,
      );
      expect(forma.body.reason).toBe('TARIFF_SHAPE_INVALID');
      await tariff(
        {
          kind: 'TARIFF_OR_TIME',
          serviceCatalogId: svcOr,
          unitPrice: '200.00',
          unitMinutes: 45,
        },
        { headers: owner() },
        400,
      );
      await tariff(
        {
          bedCategoryCode: 'BED_CAT_PRIVATE',
          serviceCatalogId: svcShared,
          unitPrice: '10.123',
        },
        { headers: owner() },
        400,
      );
    });
  });

  // ------------------------------------------------------ día-cama
  describe('día-cama por la regla de medianoche', () => {
    const f: Record<string, any> = {};

    beforeAll(async () => {
      f.bedShared = await bed(orgA, 'BED_CAT_SHARED');
      f.bedIcu = await bed(orgA, 'BED_CAT_ICU');
      f.p1 = await patient();
      // 5 días atrás 15:00 en compartida; 4 días atrás 10:00 a UCI; egreso hace 2 días 09:00
      f.e1 = await admit(f.p1, f.bedShared, at(day(5), '15:00'));
      await transfer(f.e1, f.bedIcu, at(day(4), '10:00'));
      await discharge(f.e1, at(day(2), '09:00'));
    }, 120000);

    it('ejemplo del contrato: exactamente 3 días-cama (compartida, UCI y UCI), con tarifa y centro de costo; el día del egreso no se cobra', async () => {
      const res = await runBedDays({ encounterId: f.e1 }).expect(200);
      expect(res.body).toMatchObject({
        created: 3,
        failed: 0,
        conflicts: 0,
        tariffMissing: 0,
      });
      const rows = await charges(f.e1);
      expect(rows.map((r) => r.service_date)).toEqual([day(5), day(4), day(3)]);
      expect(rows.map((r) => r.unit_price)).toEqual([
        '350.000000',
        '900.000000',
        '900.000000',
      ]);
      expect(rows.map((r) => r.care_space_id)).toEqual([
        f.bedShared,
        f.bedIcu,
        f.bedIcu,
      ]);
      expect(
        rows.every(
          (r) => r.status === BILL.CHG_PENDING && !r.minimum_stay_charge,
        ),
      ).toBe(true);
      expect(rows.every((r) => r.cost_center_id === costCenter)).toBe(true);
      expect(rows.map((r) => r.idempotency_key)).toEqual(
        [5, 4, 3].map((n) => `BEDDAY:${f.e1}:${day(n)}`),
      );
      f.chargeIds = rows.map((r) => r.id);
      for (const id of f.chargeIds) {
        expect(await events('billing.charge_capture.created', id)).toHaveLength(
          1,
        );
        const hist = await sql(
          'select revision_no from audit.charge_captures_history where charge_capture_id = ?',
          [id],
        );
        expect(hist).toHaveLength(1);
      }
    });

    it('reaplicar el job no duplica nada (idempotente): ni filas, ni eventos', async () => {
      const antes = await sql(
        'select count(*)::int as n from messaging.domain_events',
      );
      const res = await runBedDays({ encounterId: f.e1 }).expect(200);
      expect(res.body).toMatchObject({
        created: 0,
        failed: 0,
        conflicts: 0,
        repriced: 0,
        voidedStale: 0,
      });
      expect(res.body.alreadyCaptured).toBe(3);
      expect(await charges(f.e1)).toHaveLength(3);
      const despues = await sql(
        'select count(*)::int as n from messaging.domain_events',
      );
      expect(despues[0].n).toBe(antes[0].n);
    });

    it('un cambio de tarifa con vigencia futura no altera los cargos pasados; cerrarla antes de lo devengado es 422', async () => {
      const manana = addDays(today, 1);
      const icu = (
        await http()
          .get(`/billing/space-tariffs?practiceId=${orgA.practiceId}`)
          .set(owner())
          .expect(200)
      ).body.items.find((t: any) => t.bedCategoryCode === 'BED_CAT_ICU');
      const tarde = await http()
        .post(`/billing/space-tariffs/${icu.id}/close`)
        .set(H(billing))
        .send({ validTo: day(4) })
        .expect(422);
      expect(tarde.body.reason).toBe('TARIFF_CLOSE_INVALID');
      expect(tarde.body.details.lastAccruedDate).toBe(day(3));
      await http()
        .post(`/billing/space-tariffs/${icu.id}/close`)
        .set(H(billing))
        .send({ validTo: manana })
        .expect(200);
      await tariff({
        bedCategoryCode: 'BED_CAT_ICU',
        serviceCatalogId: svcIcu,
        unitPrice: '1200.00',
        validFrom: manana,
      });
      await runBedDays({ encounterId: f.e1 }).expect(200);
      expect((await charges(f.e1)).map((r) => r.unit_price)).toEqual([
        '350.000000',
        '900.000000',
        '900.000000',
      ]);
      expect(
        await sql(
          'select 1 from audit.space_tariffs_history where space_tariff_id = ? and revision_no = 2',
          [icu.id],
        ),
      ).toHaveLength(1);
    });

    it('doble cobro imposible bajo concurrencia real: 6 corridas simultáneas sobre una estancia abierta crean cada noche una sola vez', async () => {
      const bedOpen = await bed(orgA, 'BED_CAT_SHARED');
      const p = await patient();
      const e = await admit(p, bedOpen, at(day(6), '22:00'));
      const corridas = await Promise.all(
        Array.from({ length: 6 }, () => runBedDays({ encounterId: e })),
      );
      expect(corridas.map((r) => r.status)).toEqual(Array(6).fill(200));
      const created = corridas.reduce((sum, r) => sum + r.body.created, 0);
      const failed = corridas.reduce(
        (sum, r) => sum + r.body.failed + r.body.conflicts,
        0,
      );
      const rows = await charges(e);
      // medianoches de hoy 00:00 hacia atrás: fechas de servicio día(6) … día(1)
      expect(rows.map((r) => r.service_date)).toEqual(
        [6, 5, 4, 3, 2, 1].map(day),
      );
      expect(created).toBe(6);
      expect(failed).toBe(0);
      expect(new Set(rows.map((r) => r.idempotency_key)).size).toBe(6);
    }, 120000);

    it('la base es la red: un INSERT con otra clave para la misma noche choca con el único parcial (23505)', async () => {
      const [first] = await charges(f.e1);
      await expect(
        sql(
          `insert into billing.charge_captures
             (id, tenant_id, practice_id, patient_profile_id, encounter_id, source_kind_concept_id, source_ref_id,
              service_date, care_space_id, bed_category_concept_id, minimum_stay_charge, quantity,
              status_concept_id, idempotency_key, created_at, updated_at, row_version)
           select gen_random_uuid(), tenant_id, practice_id, patient_profile_id, encounter_id, source_kind_concept_id,
                  source_ref_id, service_date, care_space_id, bed_category_concept_id, false, 1,
                  status_concept_id, 'OTRA-CLAVE', now(), now(), 1
             from billing.charge_captures where id = ?`,
          [first.id],
        ),
      ).rejects.toMatchObject({ code: '23505' });
    });

    it('estancia de un solo día (sin medianoche): un día mínimo que no cuenta como noche; sin egreso aún, nada', async () => {
      const bedMin = await bed(orgA, 'BED_CAT_SHARED');
      const pMin = await patient();
      const e2 = await admit(pMin, bedMin, at(day(3), '08:00'));
      await discharge(e2, at(day(3), '18:00'));
      const res = await runBedDays({ encounterId: e2 }).expect(200);
      expect(res.body.created).toBe(1);
      const rows = await charges(e2);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        service_date: day(3),
        minimum_stay_charge: true,
        unit_price: '350.000000',
      });
      f.minStay = rows[0].id;
    });

    it('una cama no censable no devenga día-cama', async () => {
      const b = await bed(orgA, 'BED_CAT_SHARED', { censable: false });
      const p = await patient();
      const e = await admit(p, b, at(day(4), '10:00'));
      await discharge(e, at(day(2), '10:00'));
      await runBedDays({ encounterId: e }).expect(200);
      expect(await charges(e)).toHaveLength(0);
    });

    it('sin tarifa vigente el cargo queda pendiente SIN precio con alerta tariff_missing; al crear la tarifa el siguiente corrido lo completa', async () => {
      const b = await bed(orgA, 'BED_CAT_PRIVATE');
      const p = await patient();
      const e = await admit(p, b, at(day(4), '10:00'));
      await discharge(e, at(day(2), '10:00'));
      const res = await runBedDays({ encounterId: e }).expect(200);
      expect(res.body).toMatchObject({ created: 2, tariffMissing: 2 });
      const rows = await charges(e);
      expect(rows.map((r) => r.unit_price)).toEqual([null, null]);
      for (const row of rows)
        expect(
          await events('billing.charge_capture.tariff_missing', row.id),
        ).toHaveLength(1);
      const pendientes = await http()
        .get(`/billing/encounters/${e}/pending-charges`)
        .set(H(billing))
        .expect(200);
      expect(
        pendientes.body.items.every(
          (i: any) => i.tariffMissing && i.unitPrice === null,
        ),
      ).toBe(true);

      // facturar un cargo sin precio es 422
      const sinPrecio = await http()
        .post('/billing/invoices:issue-from-encounter')
        .set(await billingGlobal())
        .send({
          practiceId: orgA.practiceId,
          patientProfileId: p,
          encounterId: e,
          chargeCaptureIds: [rows[0].id],
        })
        .expect(422);
      expect(sinPrecio.body.reason).toBe('CHARGE_WITHOUT_PRICE');

      await tariff({
        bedCategoryCode: 'BED_CAT_PRIVATE',
        serviceCatalogId: svcShared,
        unitPrice: '500.00',
      });
      const otra = await runBedDays({ encounterId: e }).expect(200);
      expect(otra.body).toMatchObject({ created: 0, repriced: 2 });
      expect((await charges(e)).map((r) => r.unit_price)).toEqual([
        '500.000000',
        '500.000000',
      ]);
    });

    it('un movimiento corregido después del cargo: lo pendiente que ya no corresponde se anula con rastro; lo demás queda', async () => {
      const b = await bed(orgA, 'BED_CAT_SHARED');
      const p = await patient();
      const e = await admit(p, b, at(day(5), '12:00'));
      await discharge(e, at(day(2), '12:00'));
      await runBedDays({ encounterId: e }).expect(200);
      expect(await charges(e)).toHaveLength(3);
      // se corrige el egreso: fue 3 días antes (A13)
      await sql(
        `update clinical.encounter_locations set period_end = ? where encounter_id = ? and care_space_id = ?`,
        [at(day(4), '12:00'), e, b],
      );
      const res = await runBedDays({ encounterId: e }).expect(200);
      expect(res.body.voidedStale).toBe(2);
      const rows = await charges(e);
      expect(
        rows.map((r) => [r.service_date, r.status === BILL.CHG_VOIDED]),
      ).toEqual([
        [day(5), false],
        [day(4), true],
        [day(3), true],
      ]);
      const anulado = rows[1];
      expect(
        await events('billing.charge_capture.voided', anulado.id),
      ).toHaveLength(1);
      const hist = await sql(
        'select revision_no from audit.charge_captures_history where charge_capture_id = ?',
        [anulado.id],
      );
      expect(hist).toHaveLength(2);
      // reaplicar no resucita lo anulado ni duplica
      const otra = await runBedDays({ encounterId: e }).expect(200);
      expect(otra.body).toMatchObject({
        created: 0,
        voidedStale: 0,
        failed: 0,
      });
      expect(
        (await charges(e)).filter((r) => r.status !== BILL.CHG_VOIDED),
      ).toHaveLength(1);
    });

    it('el cambio de categoría de la cama (PATCH de F1) cierra el período y abre otro en la misma transacción; lo devengado antes conserva su categoría', async () => {
      const b = await bed(orgA, 'BED_CAT_SHARED');
      const p = await patient();
      const e = await admit(p, b, at(day(3), '10:00'));
      await runBedDays({ encounterId: e }).expect(200);
      const antes = await charges(e);
      expect(antes).toHaveLength(3);
      const detalle = (
        await http().get(`/care-spaces/${b}`).set(owner()).expect(200)
      ).body;
      await http()
        .patch(`/care-spaces/${b}`)
        .set(owner())
        .set(ifMatch(detalle.rowVersion))
        .send({ bedCategoryCode: 'BED_CAT_ICU' })
        .expect(200);
      const periods = await sql<{
        valid_from: Date;
        valid_to: Date | null;
        cat: string;
      }>(
        `select valid_from, valid_to, bed_category_concept_id as cat from practice.care_space_category_periods
          where care_space_id = ? order by valid_from`,
        [b],
      );
      expect(periods).toHaveLength(2);
      expect(periods[0].valid_to).not.toBeNull();
      expect(new Date(periods[0].valid_to as Date).getTime()).toBe(
        new Date(periods[1].valid_from).getTime(),
      );
      expect(periods[1].valid_to).toBeNull();
      await runBedDays({ encounterId: e }).expect(200);
      const despues = await charges(e);
      expect(despues.map((r) => r.bed_category_concept_id)).toEqual(
        antes.map((r) => r.bed_category_concept_id),
      );
    });

    it('lo devengado por tenant: el cargo del encuentro de B es de B y el de A no lo ve', async () => {
      const bB = await bed(orgB, 'BED_CAT_SHARED');
      const pB = await patient(orgB);
      const eB = await admit(pB, bB, at(day(3), '10:00'), orgB, nurseB);
      await discharge(eB, at(day(1), '10:00'), nurseB, orgB);
      await runBedDays({ encounterId: eB }).expect(200);
      const rows = await charges(eB);
      expect(rows).toHaveLength(2);
      expect(
        rows.every(
          (r) => r.tenant_id === orgB.tenantId && r.unit_price === null,
        ),
      ).toBe(true);
      // Facturación de A: 404 sobre el encuentro de B; Facturación de B: lo ve (sin precio)
      await http()
        .get(`/billing/encounters/${eB}/pending-charges`)
        .set(H(billing))
        .expect(404);
      const visto = await http()
        .get(`/billing/encounters/${eB}/pending-charges`)
        .set(H(billingB, orgB))
        .expect(200);
      expect(visto.body.count).toBe(2);
      f.eB = eB;
      f.pB = pB;
    });

    it('el job pide el rol SYSTEM: una persona, aunque administre la organización, recibe 403; una fecha inválida, 422', async () => {
      await http()
        .post('/internal/billing/bed-day-charges/run')
        .set(owner())
        .send({})
        .expect(403);
      const res = await runBedDays({ date: '2026-02-30' }).expect(422);
      expect(res.body.reason).toBe('BED_DAY_DATE_INVALID');
    });

    it('con date, sólo devenga hasta ese día de servicio (incluido)', async () => {
      const b = await bed(orgA, 'BED_CAT_SHARED');
      const p = await patient();
      const e = await admit(p, b, at(day(6), '09:00'));
      await runBedDays({ encounterId: e, date: day(4) }).expect(200);
      expect((await charges(e)).map((r) => r.service_date)).toEqual([
        day(6),
        day(5),
        day(4),
      ]);
      await runBedDays({ encounterId: e }).expect(200);
      expect((await charges(e)).map((r) => r.service_date)).toEqual(
        [6, 5, 4, 3, 2, 1].map(day),
      );
    });

    // -------------------------------------------------- cargos pendientes y anulación
    it('GET pending-charges: permitido a Facturación, el administrador de la organización lo lee; Enfermería recibe 404 (no ve cargos)', async () => {
      const ok = await http()
        .get(`/billing/encounters/${f.e1}/pending-charges`)
        .set(H(billing))
        .expect(200);
      expect(ok.body.items.map((i: any) => i.serviceDate)).toEqual([
        day(5),
        day(4),
        day(3),
      ]);
      expect(ok.body.items[0]).toMatchObject({
        sourceKind: 'BED_DAY',
        status: 'PENDING',
        unitPrice: '350.000000',
      });
      await http()
        .get(`/billing/encounters/${f.e1}/pending-charges`)
        .set(owner())
        .expect(200);
      await http()
        .get(`/billing/encounters/${f.e1}/pending-charges`)
        .set(H(nurse))
        .expect(404);
      await http()
        .get(`/billing/encounters/${randomUUID()}/pending-charges`)
        .set(H(billing))
        .expect(404);
    });

    it('void: Facturación anula con motivo (auditado); Enfermería 403; B 404; sin motivo 422; dos veces 409; no se resucita al reaplicar', async () => {
      const id = f.minStay;
      await http()
        .post(`/billing/charge-captures/${id}/void`)
        .set(H(nurse))
        .send({ reason: 'No corresponde' })
        .expect(403);
      await http()
        .post(`/billing/charge-captures/${id}/void`)
        .set(H(billingB, orgB))
        .send({ reason: 'No corresponde' })
        .expect(404);
      const sinMotivo = await http()
        .post(`/billing/charge-captures/${id}/void`)
        .set(H(billing))
        .send({ reason: '   ' })
        .expect(422);
      expect(sinMotivo.body.reason).toBe('CHARGE_VOID_REASON_REQUIRED');
      const ok = await http()
        .post(`/billing/charge-captures/${id}/void`)
        .set(H(billing))
        .send({ reason: 'Ingreso duplicado por error de admisión' })
        .expect(200);
      expect(ok.body).toMatchObject({
        status: 'VOIDED',
        voidReason: 'Ingreso duplicado por error de admisión',
      });
      const ev = await events('billing.charge_capture.voided', id);
      expect(ev).toHaveLength(1);
      expect(JSON.stringify(ev[0].payload_json)).not.toContain('duplicado');
      const dos = await http()
        .post(`/billing/charge-captures/${id}/void`)
        .set(H(billing))
        .send({ reason: 'Otra vez' })
        .expect(409);
      expect(dos.body.reason).toBe('CHARGE_ALREADY_VOIDED');
      const [row] = await sql(
        'select encounter_id from billing.charge_captures where id = ?',
        [id],
      );
      await runBedDays({ encounterId: row.encounter_id }).expect(200);
      const todos = await charges(row.encounter_id);
      expect(todos).toHaveLength(1);
      expect(todos[0].status).toBe(BILL.CHG_VOIDED);
    });

    it('la base impide editar un cargo emitido o anulado aunque se intente por SQL (23001)', async () => {
      await expect(
        sql('update billing.charge_captures set quantity = 2 where id = ?', [
          f.minStay,
        ]),
      ).rejects.toMatchObject({ code: '23001' });
      await expect(
        sql('delete from billing.charge_captures where id = ?', [
          f.chargeIds[0],
        ]),
      ).rejects.toMatchObject({
        code: '23001',
      });
    });

    // -------------------------------------------------- factura con chargeCaptureIds
    /** Cabeceras de un usuario con el rol global BILLING (JWT) en el tenant de A. */
    async function billingGlobal(): Promise<Record<string, string>> {
      const sid = `f5fin-billing-${billing.userId.slice(0, 8)}`;
      await ensureTestSession(ctx.orm, billing.userId, sid);
      const token = ctx.app
        .get(TokenService)
        .signAccessToken(
          billing.userId,
          sid,
          ['USER', 'BILLING'],
          [orgA.tenantId],
        );
      return as(token, orgA.tenantId);
    }

    it('issue-from-encounter con chargeCaptureIds: una línea por cargo con su precio, los cargos pasan a INVOICED con su línea en la misma transacción; total exacto', async () => {
      const res = await http()
        .post('/billing/invoices:issue-from-encounter')
        .set(await billingGlobal())
        .send({
          practiceId: orgA.practiceId,
          patientProfileId: f.p1,
          encounterId: f.e1,
          chargeCaptureIds: f.chargeIds,
        })
        .expect(201);
      expect(res.body).toMatchObject({ total: '2150.00', lineCount: 3 });
      const rows = await charges(f.e1);
      expect(
        rows.every((r) => r.status === BILL.CHG_INVOICED && r.invoice_line_id),
      ).toBe(true);
      const lines = await sql(
        `select id, unit_price::text as unit_price, quantity::text as quantity, cost_center_id
           from billing.invoice_lines where invoice_id = ? order by unit_price`,
        [res.body.id],
      );
      expect(lines.map((l: any) => Number(l.unit_price))).toEqual([
        350, 900, 900,
      ]);
      expect(lines.every((l: any) => l.cost_center_id === costCenter)).toBe(
        true,
      );
      expect(new Set(rows.map((r) => r.invoice_line_id))).toEqual(
        new Set(lines.map((l: any) => l.id)),
      );
      for (const id of f.chargeIds)
        expect(
          await events('billing.charge_capture.invoiced', id),
        ).toHaveLength(1);
      f.invoiceId = res.body.id;

      // facturar de nuevo los mismos cargos es 409
      const otra = await http()
        .post('/billing/invoices:issue-from-encounter')
        .set(await billingGlobal())
        .send({
          practiceId: orgA.practiceId,
          patientProfileId: f.p1,
          encounterId: f.e1,
          chargeCaptureIds: [f.chargeIds[0]],
        })
        .expect(409);
      expect(otra.body.reason).toBe('CHARGE_ALREADY_INVOICED');
    });

    it('dos facturas que piden los mismos cargos a la vez: una gana (201) y la otra 409; cada cargo queda en una sola factura', async () => {
      const b = await bed(orgA, 'BED_CAT_SHARED');
      const p = await patient();
      const e = await admit(p, b, at(day(3), '10:00'));
      await discharge(e, at(day(1), '10:00'));
      await runBedDays({ encounterId: e }).expect(200);
      const ids = (await charges(e)).map((r) => r.id);
      expect(ids).toHaveLength(2);
      const headers = await billingGlobal();
      const resultados = await Promise.all(
        [1, 2].map(() =>
          http()
            .post('/billing/invoices:issue-from-encounter')
            .set(headers)
            .send({
              practiceId: orgA.practiceId,
              patientProfileId: p,
              encounterId: e,
              chargeCaptureIds: ids,
            }),
        ),
      );
      expect(resultados.map((r) => r.status).sort()).toEqual([201, 409]);
      const rows = await charges(e);
      expect(new Set(rows.map((r) => r.invoice_line_id)).size).toBe(2);
      expect(rows.every((r) => r.status === BILL.CHG_INVOICED)).toBe(true);
      const facturas = await sql(
        'select count(distinct l.invoice_id)::int as n from billing.invoice_lines l where l.id in (?, ?)',
        rows.map((r) => r.invoice_line_id),
      );
      expect(facturas[0].n).toBe(1);
    });

    it('fail-closed por tenant y por alcance: cargos de A con el token de B responden 404; otro paciente 422; Enfermería, 403', async () => {
      const bJ = {
        Authorization: bearer(
          await tokenWithRole(billingB, 'f5fin-billing-b', [orgB.tenantId]),
        ).Authorization,
        'X-Tenant-Id': orgB.tenantId,
      };
      // práctica de A con el tenant de B
      await http()
        .post('/billing/invoices:issue-from-encounter')
        .set(bJ)
        .send({
          practiceId: orgA.practiceId,
          patientProfileId: f.p1,
          encounterId: f.e1,
          chargeCaptureIds: [f.chargeIds[0]],
        })
        .expect(404);
      // cargos de A, encuentro y práctica de B
      const cruzado = await http()
        .post('/billing/invoices:issue-from-encounter')
        .set(bJ)
        .send({
          practiceId: orgB.practiceId,
          patientProfileId: f.pB,
          encounterId: f.eB,
          chargeCaptureIds: [f.chargeIds[0]],
        })
        .expect(404);
      expect(cruzado.body.reason).toBe('CHARGE_CAPTURE_NOT_FOUND');

      // cargos pendientes de otro paciente → 422
      const b = await bed(orgA, 'BED_CAT_SHARED');
      const p = await patient();
      const e = await admit(p, b, at(day(3), '10:00'));
      await discharge(e, at(day(2), '10:00'));
      await runBedDays({ encounterId: e }).expect(200);
      const [cargo] = await charges(e);
      const otroPaciente = await http()
        .post('/billing/invoices:issue-from-encounter')
        .set(await billingGlobal())
        .send({
          practiceId: orgA.practiceId,
          patientProfileId: f.p1,
          encounterId: f.e1,
          chargeCaptureIds: [cargo.id],
        })
        .expect(422);
      expect(otroPaciente.body.reason).toBe('CHARGE_NOT_OF_INVOICE');
      // sin encuentro
      const sinEncuentro = await http()
        .post('/billing/invoices:issue-from-encounter')
        .set(await billingGlobal())
        .send({
          practiceId: orgA.practiceId,
          patientProfileId: p,
          chargeCaptureIds: [cargo.id],
        })
        .expect(422);
      expect(sinEncuentro.body.reason).toBe('CHARGE_NOT_OF_INVOICE');
      // el soporte de plataforma (SECURITY_ADMIN) no factura: la política de F5e es sólo de Facturación
      const soporte = await http()
        .post('/billing/invoices:issue-from-encounter')
        .set(as(ctx.adminToken, orgA.tenantId))
        .send({
          practiceId: orgA.practiceId,
          patientProfileId: p,
          encounterId: e,
          chargeCaptureIds: [cargo.id],
        })
        .expect(403);
      expect(soporte.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
      expect((await charges(e))[0].status).toBe(BILL.CHG_PENDING);
    });

    async function tokenWithRole(
      who: Staff,
      sid: string,
      tenants: string[],
    ): Promise<string> {
      await ensureTestSession(ctx.orm, who.userId, sid);
      return ctx.app
        .get(TokenService)
        .signAccessToken(who.userId, sid, ['USER', 'BILLING'], tenants);
    }

    it('anular un cargo ya facturado lo permite con motivo y conserva su línea (la factura se corrige con nota de crédito)', async () => {
      const res = await http()
        .post(`/billing/charge-captures/${f.chargeIds[0]}/void`)
        .set(H(billing))
        .send({ reason: 'Se facturó la cama equivocada' })
        .expect(200);
      expect(res.body).toMatchObject({ status: 'VOIDED' });
      expect(res.body.invoiceLineId).not.toBeNull();
    });
  });

  // ------------------------------------------------------ quirófano por tiempo
  describe('quirófano por tiempo (hechos de sala de F4)', () => {
    const f: Record<string, any> = {};

    async function completedCase(
      room: string,
      patientId: string,
      encounterId: string,
      inAt: string,
      outAt: string | null,
      actual: [string, string] | null,
    ): Promise<string> {
      const id = randomUUID();
      await sql(
        `insert into procedures_perioperative.procedure_cases
           (id, custodian_tenant_id, patient_profile_id, encounter_id, case_number, case_type_concept_id,
            priority_concept_id, status_concept_id, practice_site_id, operating_room_id,
            actual_start_at, actual_end_at, created_at, updated_at, row_version)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now(), 1)`,
        [
          id,
          orgA.tenantId,
          patientId,
          encounterId,
          `ORT-${id.slice(0, 8)}`,
          CONCEPTS.CASE_TYPE_ELECTIVE,
          CONCEPTS.CASE_PRIORITY_ROUTINE,
          CONCEPTS.CASE_COMPLETED,
          orgA.siteId,
          room,
          actual?.[0] ?? null,
          actual?.[1] ?? null,
        ],
      );
      const event = (type: string, when: string) =>
        sql(
          `insert into procedures_perioperative.operating_room_utilization_events
             (id, operating_room_id, procedure_case_id, event_type_concept_id, occurred_at, created_at, tenant_id)
           values (gen_random_uuid(), ?, ?, ?, ?, now(), ?)`,
          [room, id, type, when, orgA.tenantId],
        );
      await event(PERIOP.OR_EVENT_PATIENT_IN_ROOM, inAt);
      if (outAt) await event(PERIOP.OR_EVENT_PATIENT_OUT_OF_ROOM, outAt);
      return id;
    }

    beforeAll(async () => {
      f.room = (
        await createSpace(ctx, orgA, {
          code: `QX-${suffix}`,
          name: 'Quirófano 1',
          formCode: 'LOC_FORM_ROOM',
          functionCode: 'SPACE_FN_OPERATING_ROOM',
          ...ATRIBUTOS_QUIROFANO,
          clinicalUnitId: unit,
          activate: true,
        })
      ).id;
      f.bed = await bed(orgA, 'BED_CAT_SHARED');
      f.patient = await patient();
      f.encounter = await admit(f.patient, f.bed, at(day(2), '07:00'));
      await tariff(
        {
          kind: 'TARIFF_OR_TIME',
          serviceCatalogId: svcOr,
          unitPrice: '200.00',
          unitMinutes: 30,
          minimumUnits: 2,
        },
        { headers: H(billing) },
      );
    }, 120000);

    const runOrTime = (body: Record<string, unknown> = {}) =>
      http()
        .post('/internal/billing/or-time-charges/run')
        .set(system)
        .send(body);

    it('un caso de 95 minutos con unidad de 30 son 4 unidades (redondeo hacia arriba), con tarifa y centro de costo; reaplicar no duplica', async () => {
      f.case = await completedCase(
        f.room,
        f.patient,
        f.encounter,
        at(day(1), '10:00'),
        at(day(1), '11:35'),
        [at(day(1), '10:10'), at(day(1), '11:20')],
      );
      const res = await runOrTime({ caseId: f.case }).expect(200);
      expect(res.body).toMatchObject({
        cases: 1,
        created: 1,
        failed: 0,
        tariffMissing: 0,
      });
      const rows = await sql(
        `select quantity::text as quantity, unit_price::text as unit_price, service_date::text as service_date,
                care_space_id, cost_center_id, idempotency_key, source_ref_id, status_concept_id
           from billing.charge_captures where source_ref_id = ?`,
        [f.case],
      );
      expect(rows).toEqual([
        {
          quantity: '4',
          unit_price: '200.000000',
          service_date: day(1),
          care_space_id: f.room,
          cost_center_id: costCenter,
          idempotency_key: `ORTIME:${f.case}`,
          source_ref_id: f.case,
          status_concept_id: BILL.CHG_PENDING,
        },
      ]);
      const otra = await runOrTime({ caseId: f.case }).expect(200);
      expect(otra.body).toMatchObject({ created: 0, alreadyCaptured: 1 });
      expect(
        await sql(
          'select 1 from billing.charge_captures where source_ref_id = ?',
          [f.case],
        ),
      ).toHaveLength(1);
    });

    it('sin hechos de sala usa inicio y fin reales; el mínimo de la tarifa manda; un caso sin tiempos no se devenga', async () => {
      const corto = await completedCase(
        f.room,
        f.patient,
        f.encounter,
        at(day(1), '12:00'),
        null,
        [at(day(1), '12:00'), at(day(1), '12:20')],
      );
      const sinTiempos = await completedCase(
        f.room,
        f.patient,
        f.encounter,
        at(day(1), '13:00'),
        null,
        null,
      );
      const res = await runOrTime({}).expect(200);
      expect(res.body.created).toBeGreaterThanOrEqual(1);
      const rows = await sql(
        'select quantity::text as quantity from billing.charge_captures where source_ref_id = ?',
        [corto],
      );
      expect(rows).toEqual([{ quantity: '2' }]); // 20 min → 1 unidad, pero el mínimo es 2
      expect(
        await sql(
          'select 1 from billing.charge_captures where source_ref_id = ?',
          [sinTiempos],
        ),
      ).toHaveLength(0);
    });

    it('dos corridas simultáneas devengan el caso una sola vez', async () => {
      const caso = await completedCase(
        f.room,
        f.patient,
        f.encounter,
        at(day(1), '15:00'),
        at(day(1), '16:00'),
        null,
      );
      const res = await Promise.all(
        [1, 2, 3].map(() => runOrTime({ caseId: caso })),
      );
      expect(res.map((r) => r.status)).toEqual([200, 200, 200]);
      expect(
        await sql(
          'select 1 from billing.charge_captures where source_ref_id = ?',
          [caso],
        ),
      ).toHaveLength(1);
    });

    it('charge-items/post rechaza el cargo de sala con 422 ROOM_CHARGE_IS_AUTOMATIC; uno que no es de sala sigue su camino (404 si el caso es ajeno)', async () => {
      const sala = await http()
        .post(`/procedure-cases/${f.case}/charge-items/post`)
        .set(as(ctx.adminToken, orgA.tenantId))
        .send({
          items: [
            {
              chargeType: 'OR_TIME',
              billableItemId: randomUUID(),
              quantity: '4',
            },
          ],
        })
        .expect(422);
      expect(sala.body.reason).toBe('ROOM_CHARGE_IS_AUTOMATIC');
      const ajeno = await http()
        .post(`/procedure-cases/${f.case}/charge-items/post`)
        .set(as(ctx.adminToken, orgB.tenantId))
        .send({
          items: [
            {
              chargeType: 'SUPPLY',
              billableItemId: randomUUID(),
              quantity: '1',
            },
          ],
        })
        .expect(404);
      expect(ajeno.body.reason).not.toBe('ROOM_CHARGE_IS_AUTOMATIC');
    });

    it('el job de quirófano pide el rol SYSTEM', async () => {
      await http()
        .post('/internal/billing/or-time-charges/run')
        .set(owner())
        .send({})
        .expect(403);
    });
  });
});
