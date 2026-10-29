import { randomUUID } from 'node:crypto';
import { CONCEPTS, SEED, TokenService } from '../../src/common';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { localDate } from '../../src/modules/clinical/domain/census-calculation';
import { CARE_SPACE_OPS_PORT } from '../../src/modules/clinical/ports/care-space-ops.port';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { CareSpaceOpsDouble } from '../doubles/care-space-ops.double';
import {
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
 * F3 · flujo completo ingreso → traslado → intercambio → egreso → censo cerrado →
 * indicadores, con recarga (CONTRATO-F2-F5 F3.5, criterios 7 y 8), contra la base
 * y la API reales.
 *
 * El día que se censa es **ayer** (hora de La Paz): los movimientos se registran
 * con su hora real (`admittedAt` / `occurredAt`) y el cierre sólo se acepta tras
 * el corte. Las camas se «inauguran» hace un mes con SQL para que ayer estuvieran
 * vigentes.
 */
describe('Infraestructura F3 · censo diario e indicadores', () => {
  let ctx: TestContext;
  const double = new CareSpaceOpsDouble();
  const suffix = randomUUID().slice(0, 8);
  let http: ReturnType<typeof toolbox>['http'];
  let sql: ReturnType<typeof toolbox>['sql'];

  let orgC: InfraOrg;
  let orgD: InfraOrg;
  let unitMed: string;
  let unitFix: string;
  let nurse: Staff;
  let supervisor: Staff;
  let admission: Staff;
  let housekeeping: Staff;
  let billing: Staff;
  let nurseD: Staff;
  let ayer: string;
  let practitioner: string;
  let seq = 0;

  const at = (hhmm: string, day = ayer): string =>
    new Date(`${day}T${hhmm}:00-04:00`).toISOString();
  const H = (s: Staff, org: InfraOrg = orgC) => as(s.token, org.tenantId);

  async function bed(org: InfraOrg, unit: string): Promise<string> {
    seq += 1;
    const room = await createSpace(ctx, org, {
      code: `RC${seq}-${suffix}`,
      name: `Hab ${seq}`,
      formCode: 'LOC_FORM_ROOM',
      functionCode: 'SPACE_FN_INPATIENT_ROOM',
      clinicalUnitId: unit,
    });
    const created = await createSpace(ctx, org, {
      code: `BC${seq}-${suffix}`,
      name: `Cama ${seq}`,
      formCode: 'LOC_FORM_BED',
      functionCode: 'SPACE_FN_BED_STANDARD',
      parentSpaceId: room.id,
      bedCategoryCode: 'BED_CAT_SHARED',
      censable: true,
      clinicalUnitId: unit,
    });
    // «inaugurada» hace un mes: ayer ya estaba vigente.
    await sql(
      `update practice.care_spaces set valid_from = now() - interval '30 days' where id in (?, ?)`,
      [room.id, created.id],
    );
    return created.id;
  }

  const admitBody = (
    patientProfileId: string,
    bedId: string,
    admittedAt: string,
    org = orgC,
  ) => ({
    patientProfileId,
    practiceSiteId: org.siteId,
    attendingPractitionerId: practitioner,
    levelOfCareCode: 'LOC_CARE_GENERAL',
    admissionSourceCode: 'ADM_SRC_EMERGENCY',
    reasonText: 'Ingreso de prueba del censo',
    bed: { careSpaceId: bedId, mode: 'ASSIGN' },
    admittedAt,
  });

  const version = async (encounterId: string): Promise<number> =>
    (
      await sql('select row_version from clinical.encounters where id = ?', [
        encounterId,
      ])
    )[0].row_version;

  beforeAll(async () => {
    ctx = await bootstrapTestApp({
      overrideProviders: [{ token: CARE_SPACE_OPS_PORT, useValue: double }],
    });
    ({ http, sql } = toolbox(ctx));
    practitioner = ctx.practitionerSubtypeId;
    await ensureF2Concepts(ctx);
    const yesterday = new Date(Date.now() - 86_400_000);
    ayer = localDate(yesterday, TZ);
    orgC = await registerOrg(ctx, 'C', suffix);
    orgD = await registerOrg(ctx, 'D', suffix);
    unitMed = await createUnit(ctx, orgC, 'UN-MED', 'Medicina');
    unitFix = await createUnit(ctx, orgC, 'UN-FIX', 'Fixture');
    const site = { kind: 'SITE', siteId: orgC.siteId } as const;
    nurse = await createStaff(ctx, orgC, 'enf', ROLE.NURSE, site, suffix);
    supervisor = await createStaff(
      ctx,
      orgC,
      'sup',
      ROLE.NURSE_SUPERVISOR,
      site,
      suffix,
    );
    admission = await createStaff(
      ctx,
      orgC,
      'adm',
      ROLE.ADMISSION,
      site,
      suffix,
    );
    housekeeping = await createStaff(
      ctx,
      orgC,
      'lim',
      ROLE.HOUSEKEEPING,
      site,
      suffix,
    );
    billing = await createStaff(ctx, orgC, 'fac', ROLE.BILLING, site, suffix);
    nurseD = await createStaff(
      ctx,
      orgD,
      'enfd',
      ROLE.NURSE,
      { kind: 'SITE', siteId: orgD.siteId },
      suffix,
    );
  });

  beforeEach(() => double.reset());

  afterAll(async () => {
    await ctx?.app.close();
  });

  // ------------------------------------------------------- flujo completo
  describe('flujo completo con recarga', () => {
    const f: Record<string, any> = {};

    beforeAll(async () => {
      const [b1, b2, b3, b4, b5] = [
        await bed(orgC, unitMed),
        await bed(orgC, unitMed),
        await bed(orgC, unitMed),
        await bed(orgC, unitMed),
        await bed(orgC, unitMed),
      ];
      Object.assign(f, { b1, b2, b3, b4, b5 });
      // b5 está bloqueada durante todo el día: cuenta como cama censable, no disponible.
      await sql(
        `insert into practice.care_space_blocks
           (id, tenant_id, care_space_id, kind_concept_id, reason_concept_id, starts_at,
            created_at, updated_at, row_version)
         values (gen_random_uuid(), ?, ?, ?, ?, ?, now(), now(), 1)`,
        [
          orgC.tenantId,
          b5,
          CONCEPTS.STATE_ACTIVE,
          CONCEPTS.STATE_ACTIVE,
          at('00:00', ayer),
        ],
      );
      const [p1, p2, p3, p4] = [
        await createPatient(ctx, {
          name: 'Paciente Uno',
          gender: 'MALE',
          birthDate: '1970-01-01',
        }),
        await createPatient(ctx, {
          name: 'Paciente Dos',
          gender: 'MALE',
          birthDate: '1972-02-02',
        }),
        await createPatient(ctx, {
          name: 'Paciente Tres',
          gender: 'MALE',
          birthDate: '1975-03-03',
        }),
        await createPatient(ctx, {
          name: 'Paciente Cuatro',
          gender: 'MALE',
          birthDate: '1978-04-04',
        }),
      ];
      const post = (
        url: string,
        headers: Record<string, string>,
        body: object,
        expected = 200,
      ) => http().post(url).set(headers).send(body).expect(expected);

      // 08:00 P1 ingresa a b1; 09:00 P2 a b2; 10:00 P4 a b4
      f.e1 = (
        await post(
          '/clinical/admissions',
          H(nurse),
          admitBody(p1, b1, at('08:00')),
          201,
        )
      ).body;
      f.e2 = (
        await post(
          '/clinical/admissions',
          H(nurse),
          admitBody(p2, b2, at('09:00')),
          201,
        )
      ).body;
      f.e4 = (
        await post(
          '/clinical/admissions',
          H(nurse),
          admitBody(p4, b4, at('10:00')),
          201,
        )
      ).body;
      // 12:00 P1 se traslada b1 → b3
      f.transfer = (
        await http()
          .post(`/clinical/encounters/${f.e1.encounterId}/transfer`)
          .set(H(nurse))
          .set(ifMatch(await version(f.e1.encounterId)))
          .send({
            toCareSpaceId: b3,
            occurredAt: at('12:00'),
            reasonCode: 'CLINICAL_CONDITION',
          })
          .expect(200)
      ).body;
      // 15:00 P1 (b3) y P2 (b2) intercambian
      await post('/clinical/bed-swaps', H(nurse), {
        encounterAId: f.e1.encounterId,
        encounterBId: f.e2.encounterId,
        occurredAt: at('15:00'),
        reasonText: 'Cambio solicitado por el paciente',
      });
      // 18:00 P4 recibe el alta (estancia del día)
      await http()
        .post(`/clinical/encounters/${f.e4.encounterId}/discharge`)
        .set(H(admission))
        .set(ifMatch(await version(f.e4.encounterId)))
        .send({
          dischargeDispositionCode: 'DISP_HOME',
          occurredAt: at('18:00'),
        })
        .expect(200);
      // 20:00 P2 (ahora en b3) recibe el alta
      await http()
        .post(`/clinical/encounters/${f.e2.encounterId}/discharge`)
        .set(H(nurse))
        .set(ifMatch(await version(f.e2.encounterId)))
        .send({
          dischargeDispositionCode: 'DISP_HOME',
          occurredAt: at('20:00'),
        })
        .expect(200);
      // 22:00 P3 ingresa a la cama que quedó libre y limpia (b1)
      double.cleanAndInspect(b1);
      f.e3 = (
        await post(
          '/clinical/admissions',
          H(nurse),
          admitBody(p3, b1, at('22:00')),
          201,
        )
      ).body;
      // las órdenes de limpieza de los egresos (las crea F2; acá, como filas reales para la rotación)
      for (const [bedId, requested, started, finished, inspected] of [
        [b3, '20:00', '20:10', '20:40', '20:50'],
        [b4, '18:00', '18:30', '19:00', null],
      ] as const) {
        await sql(
          `insert into practice.cleaning_orders
             (id, tenant_id, practice_site_id, care_space_id, cleaning_type_concept_id, trigger_concept_id,
              priority_concept_id, status_concept_id, requested_at, started_at, finished_at, inspected_at,
              created_at, updated_at, row_version)
           values (gen_random_uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), now(), 1)`,
          [
            orgC.tenantId,
            orgC.siteId,
            bedId,
            PRAC.CLN_DONE,
            PRAC.CLN_DONE,
            PRAC.CLN_DONE,
            PRAC.CLN_DONE,
            at(requested),
            at(started),
            at(finished),
            inspected ? at(inspected) : null,
          ],
        );
      }
    });

    it('antes del cierre, el censo del día es una vista previa calculada que no se persiste', async () => {
      const res = await http()
        .get(`/sites/${orgC.siteId}/census?date=${ayer}&unitId=${unitMed}`)
        .set(H(nurse))
        .expect(200);
      expect(res.body.units).toHaveLength(1);
      expect(res.body.units[0]).toMatchObject({
        status: 'OPEN',
        id: null,
        counts: {
          beds_censable: 5,
          beds_available: 4,
          beds_blocked: 1,
          patients_at_cutoff: 2,
          admissions: 4,
          discharges: 2,
          deaths: 0,
          transfers_in: 0,
          transfers_out: 0,
          same_day_stays: 2,
          patient_days: 4,
          discharge_stay_days: 2,
        },
      });
      expect(
        await sql(
          'select 1 from clinical.inpatient_census_days where practice_site_id = ?',
          [orgC.siteId],
        ),
      ).toHaveLength(0);
    });

    it('un día que no terminó no se cierra: 422 CENSUS_DATE_NOT_ENDED; el rol decide quién cierra', async () => {
      const hoy = localDate(new Date(), TZ);
      const res = await http()
        .post(`/sites/${orgC.siteId}/census/${hoy}/close`)
        .set(H(supervisor))
        .send({})
        .expect(422);
      expect(res.body.reason).toBe('CENSUS_DATE_NOT_ENDED');
      const close = (s: Staff) =>
        http()
          .post(`/sites/${orgC.siteId}/census/${ayer}/close`)
          .set(H(s))
          .send({});
      expect((await close(nurse)).status).toBe(403);
      expect((await close(housekeeping)).status).toBe(403);
      expect((await close(billing)).status).toBe(403);
      expect(
        await sql(
          'select 1 from clinical.inpatient_census_days where practice_site_id = ?',
          [orgC.siteId],
        ),
      ).toHaveLength(0);
    });

    it('Admisión cierra el censo de ayer: snapshot CLOSED con huella y entradas; es idempotente', async () => {
      const res = await http()
        .post(`/sites/${orgC.siteId}/census/${ayer}/close`)
        .set(H(admission))
        .send({})
        .expect(200);
      expect(res.body.closed).toHaveLength(1);
      f.day = res.body.closed[0];
      expect(f.day).toMatchObject({
        unitId: unitMed,
        status: 'CLOSED',
        date: ayer,
        closedByUserId: admission.userId,
        contentHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      const [row] = await sql(
        'select * from clinical.inpatient_census_days where id = ?',
        [f.day.id],
      );
      expect(row).toMatchObject({
        status_concept_id: CLIN.CENSUS_CLOSED,
        beds_censable: 5,
        beds_available: 4,
        beds_blocked: 1,
        patients_at_cutoff: 2,
        admissions: 4,
        discharges: 2,
        same_day_stays: 2,
        patient_days: 4,
        discharge_stay_days: 2,
        content_hash: f.day.contentHash,
      });
      expect(new Date(row.cutoff_at).toISOString()).toBe(
        at(
          '00:00',
          new Date(Date.parse(`${ayer}T00:00:00Z`) + 86_400_000)
            .toISOString()
            .slice(0, 10),
        ),
      );
      const entries = await sql(
        'select movement_concept_id, count(*)::int as n from clinical.inpatient_census_entries where census_day_id = ? group by 1',
        [f.day.id],
      );
      const byMovement = Object.fromEntries(
        entries.map((e: any) => [e.movement_concept_id, e.n]),
      );
      expect(byMovement).toEqual({
        [CLIN.CEN_PRESENT]: 2,
        [CLIN.CEN_ADMITTED]: 4,
        [CLIN.CEN_DISCHARGED]: 2,
        [CLIN.CEN_SAME_DAY]: 2,
      });
      expect(
        await sql(
          `select 1 from messaging.domain_events where event_type = 'clinical.census_day.closed' and aggregate_id = ?`,
          [f.day.id],
        ),
      ).toHaveLength(1);

      const again = await http()
        .post(`/sites/${orgC.siteId}/census/${ayer}/close`)
        .set(H(supervisor))
        .send({})
        .expect(409);
      expect(again.body.reason).toBe('CENSUS_ALREADY_CLOSED');
      expect(
        await sql(
          'select 1 from clinical.inpatient_census_days where practice_site_id = ?',
          [orgC.siteId],
        ),
      ).toHaveLength(1);
    });

    it('un censo cerrado es inmutable en la base: UPDATE, DELETE e INSERT de entradas fallan; los rastros son de sólo inserción', async () => {
      await expect(
        sql(
          'update clinical.inpatient_census_days set patient_days = 99 where id = ?',
          [f.day.id],
        ),
      ).rejects.toMatchObject({ code: '23001' });
      await expect(
        sql('delete from clinical.inpatient_census_days where id = ?', [
          f.day.id,
        ]),
      ).rejects.toMatchObject({ code: '23001' });
      const [entry] = await sql(
        'select * from clinical.inpatient_census_entries where census_day_id = ? limit 1',
        [f.day.id],
      );
      await expect(
        sql(
          `insert into clinical.inpatient_census_entries
             (id, tenant_id, census_day_id, encounter_id, patient_profile_id, movement_concept_id, occurred_at)
           values (gen_random_uuid(), ?, ?, ?, ?, ?, now())`,
          [
            orgC.tenantId,
            f.day.id,
            entry.encounter_id,
            entry.patient_profile_id,
            CLIN.CEN_PRESENT,
          ],
        ),
      ).rejects.toMatchObject({ code: '23001' });
      await expect(
        sql(
          'update clinical.inpatient_census_entries set care_space_id = null where id = ?',
          [entry.id],
        ),
      ).rejects.toMatchObject({ code: '23001' });
    });

    it('GET del censo tras la recarga devuelve el mismo snapshot cerrado, con huella', async () => {
      const res = await http()
        .get(`/sites/${orgC.siteId}/census?date=${ayer}`)
        .set(H(billing))
        .expect(200);
      expect(res.body.units).toHaveLength(1);
      expect(res.body.units[0]).toMatchObject({
        id: f.day.id,
        status: 'CLOSED',
        contentHash: f.day.contentHash,
        counts: f.day.counts,
        adjustments: [],
        adjustedTotals: f.day.counts,
      });
      await http()
        .get(`/sites/${orgC.siteId}/census?date=2026-13-45`)
        .set(H(billing))
        .expect(422);
      await http()
        .get(`/sites/${orgC.siteId}/census?date=${ayer}`)
        .set(H(housekeeping))
        .expect(403);
    });

    it('indicadores del día cerrado coinciden con las fórmulas y la rotación sale de las órdenes de limpieza', async () => {
      const res = await http()
        .get(
          `/sites/${orgC.siteId}/inpatient-indicators?from=${ayer}&to=${ayer}&unitId=${unitMed}`,
        )
        .set(H(nurse))
        .expect(200);
      expect(res.body).toMatchObject({
        days: 1,
        bedDaysAvailable: 4,
        patientDays: 4,
        admissions: 4,
        discharges: 2,
        dischargeStayDays: 2,
        avgBeds: 4,
        occupancyPct: 100,
        alos: 1,
        bedTurnover: 0.5,
        turnoverInterval: 0,
        coverage: { daysClosed: 1, daysMissing: [] },
      });
      // egreso de P4 18:00 → disponible 19:00 (60 min); egreso de P2 20:00 → inspección 20:50 (50 min)
      expect(res.body.bedTurnaroundMinutes).toEqual({
        samples: 2,
        p50: 55,
        p90: 59,
        waitToStart: 20,
        cleaning: 30,
        inspection: 10,
      });
      expect(res.body.crossCheck).toEqual({
        occupancyFromAlos: 50,
        deltaPct: 50,
      });
    });

    it('el ajuste es una fila aparte: el snapshot no cambia, los totales ajustados sí, y los indicadores usan el valor ajustado', async () => {
      const url = `/census-days/${f.day.id}/adjustments`;
      const body = {
        fieldCode: 'patient_days',
        newValue: 3,
        reasonText: 'Un paciente no pernoctó (error de registro)',
      };
      // sólo supervisión de enfermería o la administración
      expect((await http().post(url).set(H(admission)).send(body)).status).toBe(
        403,
      );
      expect((await http().post(url).set(H(nurse)).send(body)).status).toBe(
        403,
      );
      expect(
        (await http().post(url).set(H(housekeeping)).send(body)).status,
      ).toBe(403);
      expect(
        (
          await http()
            .post(url)
            .set(H(supervisor))
            .send({ ...body, fieldCode: 'nada' })
        ).body.reason,
      ).toBe('ADJUSTMENT_FIELD_INVALID');
      expect(
        (
          await http()
            .post(url)
            .set(H(supervisor))
            .send({ ...body, reasonText: '   ' })
        ).body.reason,
      ).toBe('ADJUSTMENT_REASON_REQUIRED');
      const entry = (
        await sql(
          'select id from clinical.inpatient_census_entries where census_day_id = ? limit 1',
          [f.day.id],
        )
      )[0];
      const ok = await http()
        .post(url)
        .set(H(supervisor))
        .send({ ...body, entryRefId: entry.id })
        .expect(201);
      expect(ok.body.adjustment).toMatchObject({
        fieldCode: 'patient_days',
        previousValue: 4,
        newValue: 3,
        adjustedByUserId: supervisor.userId,
        entryRefId: entry.id,
        requestId: expect.any(String),
      });
      expect(ok.body.adjustedTotals.patient_days).toBe(3);
      // un segundo ajuste del mismo campo parte del valor ajustado
      const second = await http()
        .post(url)
        .set(as(orgC.token, orgC.tenantId))
        .send({ ...body, newValue: 2 })
        .expect(201);
      expect(second.body.adjustment.previousValue).toBe(3);
      await http()
        .post(url)
        .set(H(supervisor))
        .send({ ...body, newValue: 3 });

      // el snapshot sigue igual
      const [row] = await sql(
        'select patient_days, content_hash from clinical.inpatient_census_days where id = ?',
        [f.day.id],
      );
      expect(row).toEqual({ patient_days: 4, content_hash: f.day.contentHash });
      const view = await http()
        .get(`/sites/${orgC.siteId}/census?date=${ayer}`)
        .set(H(nurse))
        .expect(200);
      expect(view.body.units[0].counts.patient_days).toBe(4);
      expect(view.body.units[0].adjustedTotals.patient_days).toBe(3);
      expect(
        view.body.units[0].adjustments.map((a: any) => a.newValue),
      ).toEqual([3, 2, 3]);
      expect(
        await sql(
          `select 1 from messaging.domain_events where event_type = 'clinical.census_day.adjusted' and aggregate_id = ?`,
          [f.day.id],
        ),
      ).toHaveLength(3);
      // @Audited: los tres ajustes exitosos quedan sellados (los rechazados se sellan como fallo)
      expect(
        await sql(
          `select 1 from audit.audit_log where action = 'CENSUS_DAY_ADJUSTED' and entity_id = ? and outcome_concept_id = ?`,
          [f.day.id, CONCEPTS.OUTCOME_SUCCESS],
        ),
      ).toHaveLength(3);

      const ind = await http()
        .get(
          `/sites/${orgC.siteId}/inpatient-indicators?from=${ayer}&to=${ayer}&unitId=${unitMed}`,
        )
        .set(H(nurse))
        .expect(200);
      expect(ind.body.patientDays).toBe(3);
      expect(ind.body.occupancyPct).toBe(75);
      expect(ind.body.crossCheck.deltaPct).toBe(33.33); // |50 − 75| / 75
    });

    it('los ajustes tampoco se editan ni se borran', async () => {
      await expect(
        sql(
          'update clinical.inpatient_census_adjustments set new_value = 0 where census_day_id = ?',
          [f.day.id],
        ),
      ).rejects.toMatchObject({ code: '23001' });
      await expect(
        sql(
          'delete from clinical.inpatient_census_adjustments where census_day_id = ?',
          [f.day.id],
        ),
      ).rejects.toMatchObject({ code: '23001' });
    });
  });

  // ------------------------------------------------ ajuste de un día abierto
  describe('ajustes: un día abierto no se ajusta', () => {
    it('409 CENSUS_NOT_CLOSED', async () => {
      const id = randomUUID();
      await sql(
        `insert into clinical.inpatient_census_days
           (id, tenant_id, practice_site_id, clinical_unit_id, census_date, cutoff_at, status_concept_id,
            beds_censable, beds_available, beds_blocked, patients_at_cutoff, admissions, discharges, deaths,
            transfers_in, transfers_out, same_day_stays, patient_days, discharge_stay_days,
            created_at, updated_at, row_version)
         values (?, ?, ?, ?, '2025-01-01', '2025-01-02T04:00:00Z', ?, 0,0,0,0,0,0,0,0,0,0,0,0, now(), now(), 1)`,
        [id, orgC.tenantId, orgC.siteId, unitFix, CLIN.CENSUS_OPEN],
      );
      const res = await http()
        .post(`/census-days/${id}/adjustments`)
        .set(H(supervisor))
        .send({ fieldCode: 'patient_days', newValue: 1, reasonText: 'x' })
        .expect(409);
      expect(res.body.reason).toBe('CENSUS_NOT_CLOSED');
      // y la base lo respalda
      await expect(
        sql(
          `insert into clinical.inpatient_census_adjustments
             (id, tenant_id, census_day_id, field_code, previous_value, new_value, reason_text, adjusted_by_user_id, created_at)
           values (gen_random_uuid(), ?, ?, 'patient_days', 0, 1, 'x', ?, now())`,
          [orgC.tenantId, id, supervisor.userId],
        ),
      ).rejects.toMatchObject({ code: '23514' });
    });
  });

  // ---------------------------------------------------- fixture de 7 días
  describe('indicadores sobre un fixture de 7 días con valores conocidos', () => {
    const days: [number, number, number, number, number][] = [
      // [disponibles, días-paciente, ingresos, egresos, días de estancia de los egresos]
      [10, 6, 1, 1, 4],
      [10, 7, 1, 0, 0],
      [9, 7, 1, 2, 8],
      [9, 8, 2, 1, 2],
      [10, 8, 1, 1, 6],
      [10, 7, 0, 0, 0],
      [10, 7, 1, 1, 4],
    ];
    const date = (i: number) => `2026-03-0${i + 1}`;

    beforeAll(async () => {
      for (const [i, [avail, pd, adm, dis, dsd]] of days.entries()) {
        const id = randomUUID();
        await sql(
          `insert into clinical.inpatient_census_days
             (id, tenant_id, practice_site_id, clinical_unit_id, census_date, cutoff_at, status_concept_id,
              beds_censable, beds_available, beds_blocked, patients_at_cutoff, admissions, discharges, deaths,
              transfers_in, transfers_out, same_day_stays, patient_days, discharge_stay_days,
              created_at, updated_at, row_version)
           values (?, ?, ?, ?, ?, ?, ?, 0,0,0,0,0,0,0,0,0,0,0,0, now(), now(), 1)`,
          [
            id,
            orgC.tenantId,
            orgC.siteId,
            unitFix,
            date(i),
            `${date(i)}T04:00:00Z`,
            CLIN.CENSUS_OPEN,
          ],
        );
        // un solo UPDATE cierra el día (closed_at + content_hash juntos)
        await sql(
          `update clinical.inpatient_census_days
              set status_concept_id = ?, closed_at = now(), content_hash = ?,
                  beds_censable = 10, beds_available = ?, beds_blocked = 10 - ?,
                  patient_days = ?, admissions = ?, discharges = ?, discharge_stay_days = ?
            where id = ?`,
          [
            CLIN.CENSUS_CLOSED,
            'f'.repeat(64),
            avail,
            avail,
            pd,
            adm,
            dis,
            dsd,
            id,
          ],
        );
      }
    });

    it('ocupación, estancia, camas promedio, giro e intervalo coinciden con el cálculo manual', async () => {
      const res = await http()
        .get(
          `/sites/${orgC.siteId}/inpatient-indicators?from=2026-03-01&to=2026-03-07&unitId=${unitFix}`,
        )
        .set(H(supervisor))
        .expect(200);
      expect(res.body).toMatchObject({
        days: 7,
        bedDaysAvailable: 68,
        patientDays: 50,
        admissions: 7,
        discharges: 6,
        dischargeStayDays: 24,
        occupancyPct: 73.53,
        alos: 4,
        avgBeds: 9.71,
        bedTurnover: 0.62,
        turnoverInterval: 3,
        coverage: { daysClosed: 7, daysMissing: [] },
      });
      expect(res.body.bedTurnaroundMinutes.samples).toBe(0);
    });

    it('los días sin censo cerrado se declaran en coverage.daysMissing (no se inventan)', async () => {
      const res = await http()
        .get(
          `/sites/${orgC.siteId}/inpatient-indicators?from=2026-03-05&to=2026-03-10&unitId=${unitFix}`,
        )
        .set(H(billing))
        .expect(200);
      expect(res.body.coverage).toEqual({
        daysClosed: 3,
        daysMissing: ['2026-03-08', '2026-03-09', '2026-03-10'],
      });
      expect(res.body.bedDaysAvailable).toBe(30);
    });

    it('un ajuste cambia el período y queda auditado', async () => {
      const [day] = await sql(
        'select id from clinical.inpatient_census_days where census_date = ? and clinical_unit_id = ?',
        [date(0), unitFix],
      );
      await http()
        .post(`/census-days/${day.id}/adjustments`)
        .set(as(orgC.token, orgC.tenantId))
        .send({
          fieldCode: 'patient_days',
          newValue: 12,
          reasonText: 'Se omitió el censo de enfermería de la guardia',
        })
        .expect(201);
      const res = await http()
        .get(
          `/sites/${orgC.siteId}/inpatient-indicators?from=2026-03-01&to=2026-03-07&unitId=${unitFix}`,
        )
        .set(H(supervisor))
        .expect(200);
      expect(res.body.patientDays).toBe(56);
      expect(res.body.occupancyPct).toBe(82.35);
    });

    it('rangos: más de 366 días 422 INDICATOR_RANGE_TOO_LONG, invertido 422, fechas inválidas 422', async () => {
      const base = `/sites/${orgC.siteId}/inpatient-indicators`;
      expect(
        (
          await http()
            .get(`${base}?from=2025-01-01&to=2026-03-01`)
            .set(H(supervisor))
            .expect(422)
        ).body.reason,
      ).toBe('INDICATOR_RANGE_TOO_LONG');
      await http()
        .get(`${base}?from=2025-01-01&to=2025-12-31`)
        .set(H(supervisor))
        .expect(200);
      expect(
        (
          await http()
            .get(`${base}?from=2026-03-07&to=2026-03-01`)
            .set(H(supervisor))
            .expect(422)
        ).body.reason,
      ).toBe('INDICATOR_RANGE_INVALID');
      await http()
        .get(`${base}?from=ayer&to=hoy`)
        .set(H(supervisor))
        .expect(400);
    });
  });

  // --------------------------------------------------- permisos y tenants
  describe('roles (403) y aislamiento por tenant (404) en los endpoints del censo', () => {
    let dayId: string;
    beforeAll(async () => {
      dayId = (
        await sql(
          'select id from clinical.inpatient_census_days where census_date = ? and practice_site_id = ? limit 1',
          [ayer, orgC.siteId],
        )
      )[0].id;
    });

    const endpoints = (): [string, (h: Record<string, string>) => any][] => [
      [
        'census',
        (h) => http().get(`/sites/${orgC.siteId}/census?date=${ayer}`).set(h),
      ],
      [
        'census/close',
        (h) =>
          http()
            .post(`/sites/${orgC.siteId}/census/${ayer}/close`)
            .set(h)
            .send({}),
      ],
      [
        'adjustments',
        (h) =>
          http()
            .post(`/census-days/${dayId}/adjustments`)
            .set(h)
            .send({ fieldCode: 'admissions', newValue: 1, reasonText: 'x' }),
      ],
      [
        'indicators',
        (h) =>
          http()
            .get(
              `/sites/${orgC.siteId}/inpatient-indicators?from=${ayer}&to=${ayer}`,
            )
            .set(h),
      ],
    ];

    it.each(['census', 'census/close', 'adjustments', 'indicators'])(
      '%s · otro tenant ⇒ 404 uniforme',
      async (name) => {
        const call = endpoints().find(([n]) => n === name)![1];
        const res = await call(as(nurseD.token, orgD.tenantId));
        expect(res.status).toBe(404);
        expect(res.body.reason).toBe('ADT_RESOURCE_OUT_OF_SCOPE');
      },
    );

    it.each(['census', 'census/close', 'adjustments', 'indicators'])(
      '%s · Limpieza ⇒ 403',
      async (name) => {
        const call = endpoints().find(([n]) => n === name)![1];
        const res = await call(H(housekeeping));
        expect(res.status).toBe(403);
        expect(res.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
      },
    );

    it('la administración de la organización ve, cierra y ajusta, pero no opera camas; el superadmin sólo lee', async () => {
      const owner = as(orgC.token, orgC.tenantId);
      await http()
        .get(`/sites/${orgC.siteId}/census?date=${ayer}`)
        .set(owner)
        .expect(200);
      await http()
        .get(
          `/sites/${orgC.siteId}/inpatient-indicators?from=${ayer}&to=${ayer}`,
        )
        .set(owner)
        .expect(200);
      // el superadmin de plataforma (soporte) lee y no escribe
      const platform = as(ctx.adminToken, orgC.tenantId);
      await http()
        .get(`/sites/${orgC.siteId}/census?date=${ayer}`)
        .set(platform)
        .expect(200);
      await http()
        .get(
          `/sites/${orgC.siteId}/inpatient-indicators?from=${ayer}&to=${ayer}`,
        )
        .set(platform)
        .expect(200);
      expect(
        (
          await http()
            .post(`/sites/${orgC.siteId}/census/${ayer}/close`)
            .set(platform)
            .send({})
        ).status,
      ).toBe(403);
      expect(
        (
          await http()
            .post(`/census-days/${dayId}/adjustments`)
            .set(platform)
            .send({ fieldCode: 'admissions', newValue: 1, reasonText: 'x' })
        ).status,
      ).toBe(403);
      expect(
        (await http().get(`/sites/${orgC.siteId}/inpatients`).set(owner))
          .status,
      ).toBe(403);
    });
  });

  // ------------------------------------------------- cierre programado (tick)
  describe('cierre programado: POST /internal/clinical/census-close-tick', () => {
    it('sólo SYSTEM; sin contexto de tenant cierra los días vencidos de las sedes y es idempotente', async () => {
      const b = await bed(orgD, await createUnit(ctx, orgD, 'UN-TICK', 'Tick'));
      const patient = await createPatient(ctx, {
        name: 'Paciente Tick',
        gender: 'FEMALE',
        birthDate: '1990-01-01',
      });
      await http()
        .post('/clinical/admissions')
        .set(as(nurseD.token, orgD.tenantId))
        .send(admitBody(patient, b, at('10:00'), orgD))
        .expect(201);

      // una persona, aunque sea administradora de la organización, no dispara el tick
      await http()
        .post('/internal/clinical/census-close-tick')
        .set(as(orgD.token, orgD.tenantId))
        .expect(403);

      const tokens = ctx.app.get(TokenService);
      await ensureTestSession(
        ctx.orm,
        SEED.systemWorkerUserId,
        'f3-system-tick',
      );
      const system = {
        Authorization: `Bearer ${tokens.signAccessToken(SEED.systemWorkerUserId, 'f3-system-tick', ['SYSTEM'])}`,
      };
      const first = await http()
        .post('/internal/clinical/census-close-tick')
        .set(system)
        .expect(200);
      expect(first.body.failed).toBe(0);
      expect(first.body.unitsClosed).toBeGreaterThanOrEqual(1);
      const days = await sql(
        'select * from clinical.inpatient_census_days where practice_site_id = ? and census_date = ?',
        [orgD.siteId, ayer],
      );
      expect(days).toHaveLength(1);
      expect(days[0]).toMatchObject({
        status_concept_id: CLIN.CENSUS_CLOSED,
        closed_by_user_id: null, // null = worker
        patients_at_cutoff: 1,
        admissions: 1,
        beds_censable: 1,
      });
      expect(days[0].content_hash).toMatch(/^[0-9a-f]{64}$/);

      const second = await http()
        .post('/internal/clinical/census-close-tick')
        .set(system)
        .expect(200);
      expect(second.body.failed).toBe(0);
      expect(
        await sql(
          'select 1 from clinical.inpatient_census_days where practice_site_id = ? and census_date = ?',
          [orgD.siteId, ayer],
        ),
      ).toHaveLength(1);
      // el día ya cerrado de la sede C no se tocó
      const [c] = await sql(
        'select content_hash from clinical.inpatient_census_days where practice_site_id = ? and census_date = ? and clinical_unit_id = ?',
        [orgC.siteId, ayer, unitMed],
      );
      expect(c.content_hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });
});
