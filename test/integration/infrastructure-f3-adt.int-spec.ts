import { randomUUID } from 'node:crypto';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { CARE_SPACE_OPS_PORT } from '../../src/modules/practice/services/care-space-ops.port';
import { CareSpaceOpsDouble } from '../doubles/care-space-ops.double';
import { bootstrapTestApp, type TestContext } from './harness';
import {
  ROLE,
  as,
  assign,
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

/**
 * F3 de infraestructura · internación / ADT (CONTRATO-F2-F5 F3.3 y F3.5), contra
 * la base real y la API HTTP real.
 *
 * El estado operativo de la cama (higiene, limpieza) es de F2: lo da el doble de
 * `test/doubles/care-space-ops.double.ts`, que lee de la base lo que F3 escribe
 * (la ocupación) y guarda en memoria lo de F2. Todo lo de F3 —ubicaciones,
 * incidentes, versión del encuentro, historia, outbox— se comprueba con SELECT.
 *
 * Cada endpoint tiene un caso permitido y uno que falla cerrado por tenant (404)
 * y por rol (403).
 */
describe('Infraestructura F3 · internación / ADT', () => {
  let ctx: TestContext;
  const double = new CareSpaceOpsDouble();
  const suffix = randomUUID().slice(0, 8);
  let http: ReturnType<typeof toolbox>['http'];
  let sql: ReturnType<typeof toolbox>['sql'];

  let orgA: InfraOrg;
  let orgB: InfraOrg;
  let unitMed: string;
  let unitIcu: string;
  let nurse: Staff;
  let supervisor: Staff;
  let admission: Staff;
  let housekeeping: Staff;
  let infection: Staff;
  let nurseOtherUnit: Staff;
  let nurseB: Staff;
  let practitioner: string;
  let seq = 0;

  const nurseH = () => as(nurse.token, orgA.tenantId);
  const supH = () => as(supervisor.token, orgA.tenantId);
  const admH = () => as(admission.token, orgA.tenantId);
  const cleanH = () => as(housekeeping.token, orgA.tenantId);

  /** Una habitación con una cama estándar. */
  async function newBed(
    opts: {
      room?: Record<string, unknown>;
      bed?: Record<string, unknown>;
      unit?: string;
    } = {},
  ): Promise<{ roomId: string; bedId: string }> {
    const n = (seq += 1);
    const room = await createSpace(ctx, orgA, {
      code: `R${n}-${suffix}`,
      name: `Hab ${n}`,
      formCode: 'LOC_FORM_ROOM',
      functionCode: 'SPACE_FN_INPATIENT_ROOM',
      clinicalUnitId: opts.unit ?? unitMed,
      ...opts.room,
    });
    const bed = await createSpace(ctx, orgA, {
      code: `B${n}-${suffix}`,
      name: `Cama ${n}`,
      formCode: 'LOC_FORM_BED',
      functionCode: 'SPACE_FN_BED_STANDARD',
      parentSpaceId: room.id,
      bedCategoryCode: 'BED_CAT_SHARED',
      censable: true,
      clinicalUnitId: opts.unit ?? unitMed,
      ...opts.bed,
    });
    return { roomId: room.id, bedId: bed.id };
  }

  /** Otra cama en una habitación ya creada. */
  async function bedInRoom(roomId: string): Promise<string> {
    const n = (seq += 1);
    const bed = await createSpace(ctx, orgA, {
      code: `B${n}-${suffix}`,
      name: `Cama ${n}`,
      formCode: 'LOC_FORM_BED',
      functionCode: 'SPACE_FN_BED_STANDARD',
      parentSpaceId: roomId,
      bedCategoryCode: 'BED_CAT_SHARED',
      censable: true,
      clinicalUnitId: unitMed,
    });
    return bed.id;
  }

  const man = (name = 'Juan Pérez') =>
    createPatient(ctx, { name, gender: 'MALE', birthDate: '1980-05-10' });
  const woman = (name = 'María Rojas') =>
    createPatient(ctx, { name, gender: 'FEMALE', birthDate: '1985-03-02' });

  const admitBody = (
    patientProfileId: string,
    bedId: string | null,
    extra: Record<string, unknown> = {},
  ) => ({
    patientProfileId,
    practiceSiteId: orgA.siteId,
    attendingPractitionerId: practitioner,
    levelOfCareCode: 'LOC_CARE_GENERAL',
    admissionSourceCode: 'ADM_SRC_EMERGENCY',
    reasonText: 'Dolor abdominal agudo',
    ...(bedId ? { bed: { careSpaceId: bedId, mode: 'ASSIGN' } } : {}),
    ...extra,
  });

  /** Ingresa un paciente y devuelve el ingreso. */
  async function admit(
    patientId: string,
    bedId: string | null,
    extra: Record<string, unknown> = {},
    headers: Record<string, string> = nurseH(),
  ): Promise<any> {
    const res = await http()
      .post('/clinical/admissions')
      .set(headers)
      .send(
        admitBody(patientId, bedId, {
          admittedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
          ...extra,
        }),
      )
      .expect(201);
    return res.body;
  }

  async function encounterRow(id: string): Promise<any> {
    const [row] = await sql('select * from clinical.encounters where id = ?', [
      id,
    ]);
    return row;
  }

  async function locations(encounterId: string): Promise<any[]> {
    return sql(
      `select * from clinical.encounter_locations where encounter_id = ?
        order by period_start nulls first, created_at`,
      [encounterId],
    );
  }

  async function events(type: string, aggregateId: string): Promise<any[]> {
    return sql(
      `select * from messaging.domain_events
        where event_type = ? and aggregate_id = ? order by occurred_at`,
      [type, aggregateId],
    );
  }

  const version = async (encounterId: string): Promise<number> =>
    (await encounterRow(encounterId)).row_version;

  beforeAll(async () => {
    ctx = await bootstrapTestApp({
      overrideProviders: [{ token: CARE_SPACE_OPS_PORT, useValue: double }],
    });
    ({ http, sql } = toolbox(ctx));
    practitioner = ctx.practitionerSubtypeId;
    await ensureF2Concepts(ctx);
    orgA = await registerOrg(ctx, 'A', suffix);
    orgB = await registerOrg(ctx, 'B', suffix);
    unitMed = await createUnit(ctx, orgA, 'UN-MED', 'Medicina');
    unitIcu = await createUnit(ctx, orgA, 'UN-UCI', 'Terapia');
    const site = { kind: 'SITE', siteId: orgA.siteId } as const;
    nurse = await createStaff(ctx, orgA, 'enf', ROLE.NURSE, site, suffix);
    supervisor = await createStaff(
      ctx,
      orgA,
      'sup',
      ROLE.NURSE_SUPERVISOR,
      site,
      suffix,
    );
    admission = await createStaff(
      ctx,
      orgA,
      'adm',
      ROLE.ADMISSION,
      site,
      suffix,
    );
    housekeeping = await createStaff(
      ctx,
      orgA,
      'lim',
      ROLE.HOUSEKEEPING,
      site,
      suffix,
    );
    infection = await createStaff(
      ctx,
      orgA,
      'inf',
      ROLE.INFECTION_CONTROL,
      site,
      suffix,
    );
    nurseOtherUnit = await createStaff(
      ctx,
      orgA,
      'otra',
      ROLE.NURSE,
      { kind: 'UNIT', unitId: unitIcu },
      suffix,
    );
    nurseB = await createStaff(
      ctx,
      orgB,
      'enfb',
      ROLE.NURSE,
      { kind: 'SITE', siteId: orgB.siteId },
      suffix,
    );
  });

  beforeEach(() => double.reset());

  afterAll(async () => {
    await ctx?.app.close();
  });

  // ------------------------------------------------------------- ingreso
  describe('ingreso con cama (POST /clinical/admissions)', () => {
    it('201: encuentro ENC_IMP, ubicación de cama activa, historia, outbox y evento A20 por el puerto', async () => {
      const { bedId } = await newBed();
      const patient = await man();
      const out = await admit(patient, bedId);

      expect(out).toMatchObject({
        encounterId: expect.any(String),
        encounterLocationId: expect.any(String),
        episodeId: expect.any(String),
      });
      expect(out.cell).toMatchObject({
        careSpaceId: bedId,
        occupancy: { code: 'OCC_OCCUPIED' },
        assignable: false,
      });

      const enc = await encounterRow(out.encounterId);
      expect(enc.class_concept_id).toBe(CLIN.ENCOUNTER_CLASS_INPATIENT);
      expect(enc.status_concept_id).toBe(CLIN.ENCOUNTER_IN_PROGRESS);
      expect(enc.level_of_care_concept_id).toBe(CLIN.LOC_CARE_GENERAL);
      expect(enc.admission_source_concept_id).toBe(CLIN.ADM_SRC_EMERGENCY);
      expect(enc.primary_practitioner_id).toBe(practitioner);
      expect(enc.tenant_id).toBe(orgA.tenantId);

      const [loc] = await locations(out.encounterId);
      expect(loc).toMatchObject({
        care_space_id: bedId,
        is_bed_assignment: true, // la deriva la base de la forma del espacio
        location_status_concept_id: CLIN.LOCATION_ACTIVE,
        movement_type_concept_id: CLIN.ADT_ADMIT,
        period_end: null,
        tenant_id: orgA.tenantId,
        placement_incident_id: null,
      });
      expect(loc.clinical_unit_id).toBe(unitMed);
      expect(loc.bed_category_concept_id).toEqual(expect.any(String));

      const history = await sql(
        'select * from audit.encounter_locations_history where encounter_location_id = ?',
        [loc.id],
      );
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        revision_no: 1,
        tenant_id: orgA.tenantId,
      });

      const [event] = await events('clinical.adt.admitted', out.encounterId);
      expect(event.payload_json).toMatchObject({
        encounterId: out.encounterId,
        careSpaceId: bedId,
        bedMode: 'ASSIGN',
        tenantId: orgA.tenantId,
        actorUserId: nurse.userId,
      });
      expect(JSON.stringify(event.payload_json)).not.toContain('Juan');

      expect(double.callsTo('recordOccupancyChange')[0]).toMatchObject({
        careSpaceId: bedId,
        input: { from: 'OCC_FREE', to: 'OCC_OCCUPIED', sourceRefId: loc.id },
      });
    });

    it('sin cama queda «pendiente de cama»: la sede se asienta en una ubicación sin cama', async () => {
      const out = await admit(await woman(), null);
      expect(out.encounterLocationId).toBeUndefined();
      const rows = await locations(out.encounterId);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        is_bed_assignment: false,
        care_space_id: null,
        practice_site_id: orgA.siteId,
        location_status_concept_id: CLIN.LOCATION_ACTIVE,
      });
    });

    it('un paciente, una internación en curso: 409 PATIENT_ALREADY_ADMITTED', async () => {
      const patient = await man();
      const first = await admit(patient, null);
      const { bedId } = await newBed();
      const res = await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(admitBody(patient, bedId))
        .expect(409);
      expect(res.body.reason).toBe('PATIENT_ALREADY_ADMITTED');
      expect(res.body.details.encounterId).toBe(first.encounterId);
      // y la cama quedó libre
      expect(
        (await double.getOperationalState(ctx.orm.em.fork(), bedId)).occupancy,
      ).toBe('OCC_FREE');
    });

    it('códigos de catálogo inválidos y fechas futuras: 422', async () => {
      const patient = await man();
      const bad = await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(admitBody(patient, null, { levelOfCareCode: 'LOC_CARE_NADA' }))
        .expect(422);
      expect(bad.body.reason).toBe('ADT_CODE_INVALID');
      const future = await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(
          admitBody(patient, null, {
            admittedAt: new Date(Date.now() + 3_600_000).toISOString(),
          }),
        )
        .expect(422);
      expect(future.body.reason).toBe('OCCURRED_AT_IN_FUTURE');
      expect(
        (
          await sql(
            'select count(*)::int as n from clinical.encounters where patient_profile_id = ?',
            [patient],
          )
        )[0].n,
      ).toBe(0);
    });

    it('reservar deja la cama bloqueada para otro: la segunda asignación responde 409 BED_NOT_ASSIGNABLE (OCCUPANCY)', async () => {
      const { bedId } = await newBed();
      const first = await admit(await man(), bedId, {}, nurseH());
      expect(first.encounterLocationId).toBeDefined();
      const res = await http()
        .post('/clinical/admissions')
        .set(admH())
        .send(admitBody(await woman(), bedId))
        .expect(409);
      expect(res.body.reason).toBe('BED_NOT_ASSIGNABLE');
      expect(res.body.details.violations).toEqual([
        expect.objectContaining({ rule: 'OCCUPANCY', severity: 'BLOCKING' }),
      ]);
    });

    it('RESERVE: la cama queda reservada y bloquea a otro; bed-assignment la convierte en ocupación', async () => {
      const { bedId } = await newBed();
      const patient = await man();
      const out = await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(
          admitBody(patient, bedId, {
            bed: { careSpaceId: bedId, mode: 'RESERVE' },
          }),
        )
        .expect(201);
      const encounterId = out.body.encounterId;
      const rows = await locations(encounterId);
      expect(rows.map((r) => r.location_status_concept_id).sort()).toEqual(
        [CLIN.LOCATION_ACTIVE, CLIN.LOCATION_RESERVED].sort(),
      );
      expect(rows.find((r) => r.care_space_id === bedId)).toMatchObject({
        location_status_concept_id: CLIN.LOCATION_RESERVED,
        movement_type_concept_id: CLIN.ADT_RESERVE,
        period_end: null,
      });
      const blocked = await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(admitBody(await woman(), bedId))
        .expect(409);
      expect(blocked.body.reason).toBe('BED_NOT_ASSIGNABLE');

      // convertir la reserva en ocupación
      const v = await version(encounterId);
      const assigned = await http()
        .post(`/clinical/encounters/${encounterId}/bed-assignment`)
        .set(nurseH())
        .set(ifMatch(v))
        .send({ careSpaceId: bedId, mode: 'ASSIGN' })
        .expect(200);
      const after = await locations(encounterId);
      const bedRows = after.filter((r) => r.care_space_id === bedId);
      expect(bedRows.map((r) => r.location_status_concept_id).sort()).toEqual(
        [CLIN.LOCATION_ACTIVE, CLIN.LOCATION_CANCELLED].sort(),
      );
      expect(
        bedRows.find(
          (r) => r.location_status_concept_id === CLIN.LOCATION_CANCELLED,
        ).end_reason_concept_id,
      ).toBe(CLIN.ADT_END_RESERVATION_CONVERTED);
      expect(assigned.body.encounterLocationId).toBe(
        bedRows.find(
          (r) => r.location_status_concept_id === CLIN.LOCATION_ACTIVE,
        ).id,
      );
      // la ubicación «sin cama» se cerró al tener cama
      expect(
        after.find((r) => !r.is_bed_assignment).location_status_concept_id,
      ).toBe(CLIN.LOCATION_COMPLETED);
      expect(await version(encounterId)).toBe(v + 1);

      // versión vieja: 412; sin If-Match: 428
      await http()
        .post(`/clinical/encounters/${encounterId}/bed-assignment`)
        .set(nurseH())
        .set(ifMatch(v))
        .send({ careSpaceId: bedId, mode: 'ASSIGN' })
        .expect(412);
      await http()
        .post(`/clinical/encounters/${encounterId}/bed-assignment`)
        .set(nurseH())
        .send({ careSpaceId: bedId, mode: 'ASSIGN' })
        .expect(428);
    });

    it('una cama no puede asignarse a quien ya tiene cama: 409 ENCOUNTER_ALREADY_HAS_BED (usar traslado)', async () => {
      const a = await newBed();
      const b = await newBed();
      const out = await admit(await man(), a.bedId);
      const res = await http()
        .post(`/clinical/encounters/${out.encounterId}/bed-assignment`)
        .set(nurseH())
        .set(ifMatch(await version(out.encounterId)))
        .send({ careSpaceId: b.bedId, mode: 'ASSIGN' })
        .expect(409);
      expect(res.body.reason).toBe('ENCOUNTER_ALREADY_HAS_BED');
    });

    it('un espacio que no es cama: 422 SPACE_NOT_A_BED', async () => {
      const { roomId } = await newBed();
      const res = await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(admitBody(await man(), roomId))
        .expect(422);
      expect(res.body.reason).toBe('SPACE_NOT_A_BED');
    });
  });

  // ------------------------------------------------ compatibilidad e incidente
  describe('compatibilidad de cama, forzado e incidente', () => {
    async function femaleBed() {
      return newBed({ room: { sexRestrictionCode: 'SEX_FEMALE' } });
    }

    it('bed-compatibility informa las incompatibilidades sin escribir nada', async () => {
      const { bedId } = await femaleBed();
      const out = await admit(await man(), null);
      const res = await http()
        .post(`/clinical/encounters/${out.encounterId}/bed-compatibility`)
        .set(nurseH())
        .send({ careSpaceId: bedId })
        .expect(200);
      expect(res.body.assignable).toBe(false);
      expect(res.body.violations).toEqual([
        expect.objectContaining({ rule: 'SEX', severity: 'OVERRIDABLE' }),
      ]);
      expect(
        (await locations(out.encounterId)).filter((r) => r.is_bed_assignment),
      ).toHaveLength(0);
      const ok = await http()
        .post(`/clinical/encounters/${out.encounterId}/bed-compatibility`)
        .set(nurseH())
        .send({ careSpaceId: (await newBed()).bedId })
        .expect(200);
      expect(ok.body).toEqual({ assignable: true, violations: [] });
    });

    it('varón en habitación de mujeres: 422 sin override; 403 si el que fuerza no es supervisión; 422 con justificación corta; 201 con override y queda el incidente', async () => {
      const { bedId } = await femaleBed();
      const patient = await man();
      const sinOverride = await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(admitBody(patient, bedId))
        .expect(422);
      expect(sinOverride.body.reason).toBe(
        'BED_COMPATIBILITY_OVERRIDE_REQUIRED',
      );
      expect(sinOverride.body.details.violations[0]).toMatchObject({
        rule: 'SEX',
      });

      const override = {
        justification: 'No hay otra cama disponible y el cuadro es urgente.',
        ruleCodes: ['SEX'],
      };
      const enfermera = await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(admitBody(patient, bedId, { override }))
        .expect(403);
      expect(enfermera.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
      expect(enfermera.body.details.requiredRoles).toContain(
        'NURSE_SUPERVISOR',
      );

      const corta = await http()
        .post('/clinical/admissions')
        .set(supH())
        .send(
          admitBody(patient, bedId, {
            override: { justification: 'urgente', ruleCodes: ['SEX'] },
          }),
        )
        .expect(422);
      expect(corta.body.reason).toBe('OVERRIDE_JUSTIFICATION_TOO_SHORT');

      const incompleta = await http()
        .post('/clinical/admissions')
        .set(supH())
        .send(
          admitBody(patient, bedId, {
            override: { ...override, ruleCodes: ['AGE'] },
          }),
        )
        .expect(422);
      expect(incompleta.body.reason).toBe(
        'BED_COMPATIBILITY_OVERRIDE_REQUIRED',
      );

      const noForzable = await http()
        .post('/clinical/admissions')
        .set(supH())
        .send(
          admitBody(patient, bedId, {
            override: { ...override, ruleCodes: ['SEX', 'HYGIENE'] },
          }),
        )
        .expect(422);
      expect(noForzable.body.reason).toBe('OVERRIDE_RULE_NOT_OVERRIDABLE');
      // nada de lo anterior escribió
      expect(
        (
          await sql(
            'select count(*)::int as n from clinical.encounters where patient_profile_id = ?',
            [patient],
          )
        )[0].n,
      ).toBe(0);

      const ok = await http()
        .post('/clinical/admissions')
        .set(supH())
        .send(admitBody(patient, bedId, { override }))
        .expect(201);
      expect(ok.body.incidentId).toEqual(expect.any(String));
      const [incident] = await sql(
        'select * from clinical.placement_incidents where id = ?',
        [ok.body.incidentId],
      );
      expect(incident).toMatchObject({
        encounter_id: ok.body.encounterId,
        encounter_location_id: ok.body.encounterLocationId,
        care_space_id: bedId,
        status_concept_id: CLIN.PLC_INC_OPEN,
        authorized_by_user_id: supervisor.userId,
        justification_text: override.justification,
        tenant_id: orgA.tenantId,
      });
      expect(incident.violations_json).toEqual([
        { rule: 'SEX', detail: expect.any(String) },
      ]);
      const [loc] = await locations(ok.body.encounterId);
      expect(loc.placement_incident_id).toBe(incident.id);
      expect(
        await sql(
          'select 1 from audit.placement_incidents_history where placement_incident_id = ?',
          [incident.id],
        ),
      ).toHaveLength(1);
      expect(
        await events('clinical.adt.placement_override', incident.id),
      ).toHaveLength(1);
      // y el incidente aparece en la ficha de la estancia
      const stay = await http()
        .get(`/clinical/encounters/${ok.body.encounterId}/stay`)
        .set(nurseH())
        .expect(200);
      expect(stay.body.incidents).toEqual([
        expect.objectContaining({ id: incident.id, status: 'PLC_INC_OPEN' }),
      ]);
    });

    it('revisar el incidente: enfermería 403, supervisión 200, control de infecciones 200; transiciones inválidas 409', async () => {
      const { bedId } = await femaleBed();
      const ok = await http()
        .post('/clinical/admissions')
        .set(supH())
        .send(
          admitBody(await man(), bedId, {
            override: {
              justification: 'Única cama libre en la sala de medicina.',
              ruleCodes: ['SEX'],
            },
          }),
        )
        .expect(201);
      const id = ok.body.incidentId;
      await http()
        .patch(`/clinical/placement-incidents/${id}`)
        .set(nurseH())
        .send({ status: 'REVIEWED', reviewNote: 'visto' })
        .expect(403);
      const reviewed = await http()
        .patch(`/clinical/placement-incidents/${id}`)
        .set(supH())
        .send({
          status: 'REVIEWED',
          reviewNote: 'Se justificó por falta de camas.',
        })
        .expect(200);
      expect(reviewed.body).toEqual({ id, status: 'REVIEWED' });
      const [row] = await sql(
        'select * from clinical.placement_incidents where id = ?',
        [id],
      );
      expect(row).toMatchObject({
        status_concept_id: CLIN.PLC_INC_REVIEWED,
        reviewed_by_user_id: supervisor.userId,
        review_note: 'Se justificó por falta de camas.',
      });
      const again = await http()
        .patch(`/clinical/placement-incidents/${id}`)
        .set(supH())
        .send({ status: 'REVIEWED', reviewNote: 'otra vez' })
        .expect(409);
      expect(again.body.reason).toBe('PLACEMENT_INCIDENT_INVALID_TRANSITION');
      await http()
        .patch(`/clinical/placement-incidents/${id}`)
        .set(as(infection.token, orgA.tenantId))
        .send({
          status: 'CLOSED',
          reviewNote: 'Cerrado por control de infecciones.',
        })
        .expect(200);
      expect(
        await sql(
          'select revision_no from audit.placement_incidents_history where placement_incident_id = ? order by revision_no',
          [id],
        ),
      ).toHaveLength(3);
      await http()
        .patch(`/clinical/placement-incidents/${id}`)
        .set(supH())
        .send({ status: 'CLOSED', reviewNote: 'ya cerrado' })
        .expect(409);
    });

    it('aislamiento aéreo a una cama sin AIIR: 409 BED_NOT_ASSIGNABLE, sin opción de forzar; en un AIIR validado, 201', async () => {
      const common = await newBed();
      const aiir = await newBed({
        room: {
          pressureCode: 'PRESSURE_NEGATIVE',
          airChangesPerHour: 12,
          hvacValidatedOn: new Date().toISOString().slice(0, 10),
        },
      });
      const patient = await man();
      const forzado = {
        override: {
          justification: 'Aislamiento aéreo indicado por infectología.',
          ruleCodes: ['ISOLATION_AIRBORNE'],
        },
        isolationPrecautionCode: 'ISO_AIRBORNE',
      };
      const res = await http()
        .post('/clinical/admissions')
        .set(supH())
        .send(admitBody(patient, common.bedId, forzado))
        .expect(409);
      expect(res.body.reason).toBe('BED_NOT_ASSIGNABLE');
      expect(res.body.details.violations).toEqual([
        expect.objectContaining({
          rule: 'ISOLATION_AIRBORNE',
          severity: 'BLOCKING',
        }),
      ]);
      const ok = await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(
          admitBody(patient, aiir.bedId, {
            isolationPrecautionCode: 'ISO_AIRBORNE',
          }),
        )
        .expect(201);
      expect(
        (await encounterRow(ok.body.encounterId))
          .isolation_precaution_concept_id,
      ).not.toBeNull();
    });

    it('nivel de cuidado: un encuentro intensivo en cama estándar es forzable; en cama de UTI no', async () => {
      const uci = await newBed({
        unit: unitIcu,
        bed: {
          functionCode: 'SPACE_FN_BED_ICU',
          bedCategoryCode: 'BED_CAT_ICU',
        },
      });
      const std = await newBed();
      const patient = await man();
      const icuBody = { levelOfCareCode: 'LOC_CARE_ICU' };
      const r = await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(admitBody(patient, std.bedId, icuBody))
        .expect(422);
      expect(r.body.details.violations[0]).toMatchObject({
        rule: 'LEVEL_OF_CARE',
      });
      await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(admitBody(patient, uci.bedId, icuBody))
        .expect(201);
    });

    it('habitación compartida: el segundo paciente de otro sexo es incompatible (regla de alojamiento del mismo sexo)', async () => {
      const first = await newBed();
      const second = await bedInRoom(first.roomId);
      await admit(await woman(), first.bedId);
      const res = await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(admitBody(await man(), second))
        .expect(422);
      expect(res.body.details.violations[0]).toMatchObject({ rule: 'SEX' });
      await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(admitBody(await woman('Ana Quispe'), second))
        .expect(201);
    });

    it('cohorte de aislamiento: exige además el aval de control de infecciones', async () => {
      const first = await newBed();
      const second = await bedInRoom(first.roomId);
      await admit(await man('Pedro Gómez'), first.bedId, {
        isolationPrecautionCode: 'ISO_CONTACT',
        isolationOrganismText: 'MRSA',
      });
      const patient = await man('Luis Arce');
      const override = {
        justification: 'Cohorte autorizada: mismo organismo (MRSA) confirmado.',
        ruleCodes: ['ISOLATION_COHORT'],
      };
      const body = admitBody(patient, second, {
        isolationPrecautionCode: 'ISO_CONTACT',
        isolationOrganismText: 'MRSA',
        override,
      });
      const sinAval = await http()
        .post('/clinical/admissions')
        .set(supH())
        .send(body)
        .expect(403);
      expect(sinAval.body.details.requiredRoles).toEqual(['INFECTION_CONTROL']);
      // control de infecciones por sí solo no fuerza (la política exige supervisión de enfermería)
      await http()
        .post('/clinical/admissions')
        .set(as(infection.token, orgA.tenantId))
        .send(body)
        .expect(403);
      // supervisión + aval: un usuario con los dos roles
      const both = await createStaff(
        ctx,
        orgA,
        'dobl',
        ROLE.NURSE_SUPERVISOR,
        { kind: 'SITE', siteId: orgA.siteId },
        suffix,
      );
      await assign(ctx, both.membershipId, ROLE.INFECTION_CONTROL, {
        kind: 'SITE',
        siteId: orgA.siteId,
      });
      await http()
        .post('/clinical/admissions')
        .set(as(both.token, orgA.tenantId))
        .send(body)
        .expect(201);
    });
  });

  // ------------------------------------------------------------- traslado
  describe('traslado (POST /clinical/encounters/:id/transfer)', () => {
    it('cierra el origen, abre el destino, ensucia el origen con su orden y avanza la versión', async () => {
      const from = await newBed();
      const to = await newBed();
      const out = await admit(await man(), from.bedId);
      const v = await version(out.encounterId);
      const t = new Date(Date.now() - 60_000);
      const res = await http()
        .post(`/clinical/encounters/${out.encounterId}/transfer`)
        .set(nurseH())
        .set(ifMatch(v))
        .send({
          toCareSpaceId: to.bedId,
          occurredAt: t.toISOString(),
          reasonCode: 'CLINICAL_CONDITION',
        })
        .expect(200);

      const rows = (await locations(out.encounterId)).filter(
        (r) => r.is_bed_assignment,
      );
      const origin = rows.find((r) => r.care_space_id === from.bedId);
      const dest = rows.find((r) => r.care_space_id === to.bedId);
      expect(origin).toMatchObject({
        location_status_concept_id: CLIN.LOCATION_COMPLETED,
        end_reason_concept_id: CLIN.ADT_END_TRANSFER_OUT,
      });
      expect(new Date(origin.period_end).toISOString()).toBe(t.toISOString());
      expect(dest).toMatchObject({
        location_status_concept_id: CLIN.LOCATION_ACTIVE,
        movement_type_concept_id: CLIN.ADT_TRANSFER,
        previous_encounter_location_id: origin.id,
        period_end: null,
      });
      expect(new Date(dest.period_start).toISOString()).toBe(t.toISOString());
      expect(res.body).toMatchObject({
        fromLocationId: origin.id,
        toLocationId: dest.id,
      });

      const order = double.openOrderOf(from.bedId)!;
      expect(order).toMatchObject({
        trigger: 'TRANSFER',
        terminal: false,
        sourceRefId: origin.id,
      });
      expect(res.body.cleaningOrderId).toBe(order.id);
      expect(
        (await double.getOperationalState(ctx.orm.em.fork(), from.bedId))
          .assignable,
      ).toBe(false);
      expect(await version(out.encounterId)).toBe(v + 1);

      const [event] = await events('clinical.adt.transferred', out.encounterId);
      expect(event.payload_json).toMatchObject({
        fromLocationId: origin.id,
        toLocationId: dest.id,
        previousEncounterLocationId: origin.id,
        cleaningOrderId: order.id,
      });
      const occ = double
        .callsTo('recordOccupancyChange')
        .map((c: any) => [c.careSpaceId, c.input.from, c.input.to]);
      expect(occ).toEqual(
        expect.arrayContaining([
          [from.bedId, 'OCC_OCCUPIED', 'OCC_FREE'],
          [to.bedId, 'OCC_FREE', 'OCC_OCCUPIED'],
        ]),
      );
      expect(
        await sql(
          'select 1 from audit.encounter_locations_history where encounter_location_id = ?',
          [origin.id],
        ),
      ).toHaveLength(2);
    });

    it('todo o nada: si el puerto falla a mitad, el origen sigue abierto, no hay destino y la versión no cambia', async () => {
      const from = await newBed();
      const to = await newBed();
      const out = await admit(await man(), from.bedId);
      const v = await version(out.encounterId);
      double.failNextMarkDirty = new Error('falla simulada de F2');
      await http()
        .post(`/clinical/encounters/${out.encounterId}/transfer`)
        .set(nurseH())
        .set(ifMatch(v))
        .send({ toCareSpaceId: to.bedId, reasonCode: 'CLINICAL_CONDITION' })
        .expect(500);
      const rows = (await locations(out.encounterId)).filter(
        (r) => r.is_bed_assignment,
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        care_space_id: from.bedId,
        location_status_concept_id: CLIN.LOCATION_ACTIVE,
        period_end: null,
      });
      expect(await version(out.encounterId)).toBe(v);
      expect(
        await events('clinical.adt.transferred', out.encounterId),
      ).toHaveLength(0);
      expect(
        await sql(
          'select 1 from clinical.encounter_locations where care_space_id = ?',
          [to.bedId],
        ),
      ).toHaveLength(0);
    });

    it('validaciones: misma cama 422, destino ocupado 409, sin cama 409, fecha futura o anterior al inicio 422, versión vieja 412', async () => {
      const a = await newBed();
      const b = await newBed();
      const c = await newBed();
      const out = await admit(await man(), a.bedId);
      const other = await admit(await woman(), b.bedId);
      void other;
      const v = await version(out.encounterId);
      const post = (
        body: object,
        headers: Record<string, string> = ifMatch(v),
      ) =>
        http()
          .post(`/clinical/encounters/${out.encounterId}/transfer`)
          .set(nurseH())
          .set(headers)
          .send({ reasonCode: 'CLINICAL_CONDITION', ...body });
      expect(
        (await post({ toCareSpaceId: a.bedId }).expect(422)).body.reason,
      ).toBe('TRANSFER_TO_SAME_BED');
      const ocupado = await post({ toCareSpaceId: b.bedId }).expect(409);
      expect(ocupado.body.reason).toBe('BED_NOT_ASSIGNABLE');
      expect(
        (
          await post({
            toCareSpaceId: c.bedId,
            occurredAt: new Date(Date.now() + 3_600_000).toISOString(),
          }).expect(422)
        ).body.reason,
      ).toBe('OCCURRED_AT_IN_FUTURE');
      expect(
        (
          await post({
            toCareSpaceId: c.bedId,
            occurredAt: new Date(Date.now() - 86_400_000).toISOString(),
          }).expect(422)
        ).body.reason,
      ).toBe('OCCURRED_AT_BEFORE_CURRENT_START');
      await post({ toCareSpaceId: c.bedId }, ifMatch(v + 7)).expect(412);
      const pendiente = await admit(await man('Sin Cama'), null);
      const sinCama = await http()
        .post(`/clinical/encounters/${pendiente.encounterId}/transfer`)
        .set(nurseH())
        .set(ifMatch(await version(pendiente.encounterId)))
        .send({ toCareSpaceId: c.bedId, reasonCode: 'CLINICAL_CONDITION' })
        .expect(409);
      expect(sinCama.body.reason).toBe('ENCOUNTER_HAS_NO_BED');
    });

    it('traslado a una cama reservada propia: la reserva se convierte y no hay doble ocupación', async () => {
      const from = await newBed();
      const to = await newBed();
      const out = await admit(await man(), from.bedId);
      await http()
        .post(`/clinical/encounters/${out.encounterId}/bed-assignment`)
        .set(nurseH())
        .set(ifMatch(await version(out.encounterId)))
        .send({ careSpaceId: to.bedId, mode: 'RESERVE' })
        .expect(200);
      expect(
        (await double.getOperationalState(ctx.orm.em.fork(), to.bedId))
          .occupancy,
      ).toBe('OCC_RESERVED');
      await http()
        .post(`/clinical/encounters/${out.encounterId}/transfer`)
        .set(nurseH())
        .set(ifMatch(await version(out.encounterId)))
        .send({ toCareSpaceId: to.bedId, reasonCode: 'CLINICAL_CONDITION' })
        .expect(200);
      const rows = (await locations(out.encounterId)).filter(
        (r) => r.care_space_id === to.bedId,
      );
      expect(rows.map((r) => r.location_status_concept_id).sort()).toEqual(
        [CLIN.LOCATION_ACTIVE, CLIN.LOCATION_CANCELLED].sort(),
      );
    });
  });

  // ------------------------------------------------------------ intercambio
  describe('intercambio A17 (POST /clinical/bed-swaps)', () => {
    it('dos pacientes cambian de cama: 4 filas coherentes, ninguna violación de EXCLUDE, sin camas sucias', async () => {
      const a = await newBed();
      const b = await newBed();
      const ea = await admit(await man(), a.bedId);
      const eb = await admit(await man('Otro Varón'), b.bedId);
      const t = new Date(Date.now() - 30_000);
      const res = await http()
        .post('/clinical/bed-swaps')
        .set(nurseH())
        .send({
          encounterAId: ea.encounterId,
          encounterBId: eb.encounterId,
          occurredAt: t.toISOString(),
          reasonText: 'Cambio por cercanía al puesto de enfermería',
        })
        .expect(200);
      const rowsA = (await locations(ea.encounterId)).filter(
        (r) => r.is_bed_assignment,
      );
      const rowsB = (await locations(eb.encounterId)).filter(
        (r) => r.is_bed_assignment,
      );
      expect(rowsA).toHaveLength(2);
      expect(rowsB).toHaveLength(2);
      const openA = rowsA.find((r) => r.period_end === null);
      const openB = rowsB.find((r) => r.period_end === null);
      expect(openA).toMatchObject({
        care_space_id: b.bedId,
        movement_type_concept_id: CLIN.ADT_SWAP,
        location_status_concept_id: CLIN.LOCATION_ACTIVE,
      });
      expect(openB).toMatchObject({
        care_space_id: a.bedId,
        movement_type_concept_id: CLIN.ADT_SWAP,
        location_status_concept_id: CLIN.LOCATION_ACTIVE,
      });
      const closedA = rowsA.find((r) => r.period_end !== null);
      expect(closedA).toMatchObject({
        care_space_id: a.bedId,
        end_reason_concept_id: CLIN.ADT_END_SWAP,
        location_status_concept_id: CLIN.LOCATION_COMPLETED,
      });
      expect(openA.previous_encounter_location_id).toBe(closedA.id);
      expect(new Date(closedA.period_end).toISOString()).toBe(t.toISOString());
      expect(new Date(openA.period_start).toISOString()).toBe(t.toISOString());
      expect(res.body.locations).toHaveLength(2);
      // las camas siguen ocupadas: nadie las dejó sucias
      expect(double.callsTo('markDirtyFromSource')).toHaveLength(0);
      expect(
        (await double.getOperationalState(ctx.orm.em.fork(), a.bedId))
          .occupancy,
      ).toBe('OCC_OCCUPIED');
      expect(await events('clinical.adt.swapped', ea.encounterId)).toHaveLength(
        1,
      );
      // y la base lo confirma: una sola fila activa por cama
      const activas = await sql(
        `select care_space_id, count(*)::int as n from clinical.encounter_locations
          where care_space_id in (?, ?) and location_status_concept_id = ? and period_end is null
          group by care_space_id`,
        [a.bedId, b.bedId, CLIN.LOCATION_ACTIVE],
      );
      expect(activas.map((r: any) => r.n)).toEqual([1, 1]);
    });

    it('compatibilidad cruzada: un varón cambiado a la cama de una mujer en habitación de mujeres exige forzar', async () => {
      const f = await newBed({ room: { sexRestrictionCode: 'SEX_FEMALE' } });
      const m = await newBed();
      const ef = await admit(await woman(), f.bedId);
      const em = await admit(await man(), m.bedId);
      const body = {
        encounterAId: ef.encounterId,
        encounterBId: em.encounterId,
        reasonText: 'Intercambio solicitado',
      };
      const res = await http()
        .post('/clinical/bed-swaps')
        .set(nurseH())
        .send(body)
        .expect(422);
      expect(res.body.reason).toBe('BED_COMPATIBILITY_OVERRIDE_REQUIRED');
      // sin cambios
      expect(
        (await locations(em.encounterId)).filter((r) => r.is_bed_assignment),
      ).toHaveLength(1);
      const ok = await http()
        .post('/clinical/bed-swaps')
        .set(supH())
        .send({
          ...body,
          override: {
            justification: 'Dos pacientes cambian de lugar por pedido médico.',
            ruleCodes: ['SEX'],
          },
        })
        .expect(200);
      expect(ok.body.incidentIds).toHaveLength(1);
    });

    it('errores: el mismo encuentro 409, sin dos camas ocupadas 409', async () => {
      const a = await newBed();
      const ea = await admit(await man(), a.bedId);
      const mismo = await http()
        .post('/clinical/bed-swaps')
        .set(nurseH())
        .send({
          encounterAId: ea.encounterId,
          encounterBId: ea.encounterId,
          reasonText: 'x',
        })
        .expect(409);
      expect(mismo.body.reason).toBe('SWAP_SAME_ENCOUNTER');
      const pendiente = await admit(await woman(), null);
      const sin = await http()
        .post('/clinical/bed-swaps')
        .set(nurseH())
        .send({
          encounterAId: ea.encounterId,
          encounterBId: pendiente.encounterId,
          reasonText: 'x',
        })
        .expect(409);
      expect(sin.body.reason).toBe('SWAP_REQUIRES_TWO_OCCUPIED_BEDS');
    });
  });

  // --------------------------------------------------------------- egreso
  describe('egreso (POST /clinical/encounters/:id/discharge)', () => {
    it('cierra ubicación y encuentro, ensucia la cama con su orden y no se asigna hasta limpiar e inspeccionar', async () => {
      const { bedId } = await newBed();
      const out = await admit(await man(), bedId);
      const v = await version(out.encounterId);
      const t = new Date(Date.now() - 5_000);
      const res = await http()
        .post(`/clinical/encounters/${out.encounterId}/discharge`)
        .set(admH())
        .set(ifMatch(v))
        .send({
          dischargeDispositionCode: 'DISP_HOME',
          occurredAt: t.toISOString(),
          closeEpisode: true,
        })
        .expect(200);
      const enc = await encounterRow(out.encounterId);
      expect(enc.status_concept_id).toBe(CLIN.ENCOUNTER_FINISHED);
      expect(enc.discharge_disposition_concept_id).toBe(CLIN.DISP_HOME);
      expect(new Date(enc.end_at).toISOString()).toBe(t.toISOString());
      expect(enc.content_hash).toMatch(/^[0-9a-f]{64}$/);
      const [loc] = (await locations(out.encounterId)).filter(
        (r) => r.is_bed_assignment,
      );
      expect(loc).toMatchObject({
        location_status_concept_id: CLIN.LOCATION_COMPLETED,
        end_reason_concept_id: CLIN.ADT_END_DISCHARGE,
      });
      expect(new Date(loc.period_end).toISOString()).toBe(t.toISOString());
      const order = double.openOrderOf(bedId)!;
      expect(order).toMatchObject({
        trigger: 'DISCHARGE',
        terminal: false,
        sourceRefId: loc.id,
      });
      expect(res.body).toEqual({
        encounterId: out.encounterId,
        cleaningOrderId: order.id,
      });
      const [episode] = await sql(
        'select * from clinical.care_episodes where id = ?',
        [out.episodeId],
      );
      expect(episode.status_concept_id).toBe(CLIN.EPISODE_FINISHED);
      expect(
        await events('clinical.adt.discharged', out.encounterId),
      ).toHaveLength(1);

      // la cama no es asignable hasta que se limpia e inspecciona
      const next = await man('Siguiente');
      const sucia = await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(admitBody(next, bedId))
        .expect(409);
      expect(sucia.body.details.violations).toEqual([
        expect.objectContaining({ rule: 'HYGIENE', severity: 'BLOCKING' }),
      ]);
      double.cleanAndInspect(bedId);
      await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(admitBody(next, bedId))
        .expect(201);
    });

    it('con aislamiento la limpieza es terminal', async () => {
      const { bedId } = await newBed();
      const out = await admit(await man(), bedId, {
        isolationPrecautionCode: 'ISO_CONTACT',
        isolationOrganismText: 'MRSA',
      });
      await http()
        .post(`/clinical/encounters/${out.encounterId}/discharge`)
        .set(nurseH())
        .set(ifMatch(await version(out.encounterId)))
        .send({
          dischargeDispositionCode: 'DISP_HOME',
          occurredAt: new Date(Date.now() - 1_000).toISOString(),
        })
        .expect(200);
      expect(double.openOrderOf(bedId)).toMatchObject({
        terminal: true,
        trigger: 'DISCHARGE',
      });
      expect(
        (await double.getOperationalState(ctx.orm.em.fork(), bedId))
          .terminalCleaningRequired,
      ).toBe(true);
    });

    it('un fallecimiento queda como disposición DISP_DEATH', async () => {
      const { bedId } = await newBed();
      const out = await admit(await man(), bedId);
      await http()
        .post(`/clinical/encounters/${out.encounterId}/discharge`)
        .set(nurseH())
        .set(ifMatch(await version(out.encounterId)))
        .send({
          dischargeDispositionCode: 'DEATH',
          occurredAt: new Date(Date.now() - 1_000).toISOString(),
        })
        .expect(200);
      expect(
        (await encounterRow(out.encounterId)).discharge_disposition_concept_id,
      ).toBe(CLIN.DISP_DEATH);
    });

    it('errores: disposición inválida 422, ya egresado 409, versión vieja 412, fecha futura 422; pendiente de cama también egresa', async () => {
      const { bedId } = await newBed();
      const out = await admit(await man(), bedId);
      const v = await version(out.encounterId);
      const url = `/clinical/encounters/${out.encounterId}/discharge`;
      const body = {
        dischargeDispositionCode: 'DISP_HOME',
        occurredAt: new Date(Date.now() - 1_000).toISOString(),
      };
      expect(
        (
          await http()
            .post(url)
            .set(nurseH())
            .set(ifMatch(v))
            .send({ ...body, dischargeDispositionCode: 'NADA' })
            .expect(422)
        ).body.reason,
      ).toBe('ADT_CODE_INVALID');
      expect(
        (
          await http()
            .post(url)
            .set(nurseH())
            .set(ifMatch(v))
            .send({
              ...body,
              occurredAt: new Date(Date.now() + 3_600_000).toISOString(),
            })
            .expect(422)
        ).body.reason,
      ).toBe('OCCURRED_AT_IN_FUTURE');
      await http()
        .post(url)
        .set(nurseH())
        .set(ifMatch(v + 3))
        .send(body)
        .expect(412);
      await http()
        .post(url)
        .set(nurseH())
        .set(ifMatch(v))
        .send(body)
        .expect(200);
      expect(
        (
          await http()
            .post(url)
            .set(nurseH())
            .set(ifMatch(v + 1))
            .send(body)
            .expect(409)
        ).body.reason,
      ).toBe('ENCOUNTER_NOT_IN_PROGRESS');

      const pend = await admit(await woman(), null);
      const res = await http()
        .post(`/clinical/encounters/${pend.encounterId}/discharge`)
        .set(nurseH())
        .set(ifMatch(await version(pend.encounterId)))
        .send(body)
        .expect(200);
      expect(res.body.cleaningOrderId).toBeNull();
      expect((await encounterRow(pend.encounterId)).status_concept_id).toBe(
        CLIN.ENCOUNTER_FINISHED,
      );
    });

    it('al dar egreso se cancelan las reservas que quedaban', async () => {
      const a = await newBed();
      const r = await newBed();
      const out = await admit(await man(), a.bedId);
      await http()
        .post(`/clinical/encounters/${out.encounterId}/bed-assignment`)
        .set(nurseH())
        .set(ifMatch(await version(out.encounterId)))
        .send({ careSpaceId: r.bedId, mode: 'RESERVE' })
        .expect(200);
      await http()
        .post(`/clinical/encounters/${out.encounterId}/discharge`)
        .set(nurseH())
        .set(ifMatch(await version(out.encounterId)))
        .send({
          dischargeDispositionCode: 'DISP_HOME',
          occurredAt: new Date(Date.now() - 1_000).toISOString(),
        })
        .expect(200);
      const [res] = (await locations(out.encounterId)).filter(
        (x) => x.care_space_id === r.bedId,
      );
      expect(res).toMatchObject({
        location_status_concept_id: CLIN.LOCATION_CANCELLED,
        end_reason_concept_id: CLIN.ADT_END_RESERVATION_CANCELLED,
      });
    });
  });

  // ---------------------------------------------------------- cancelaciones
  describe('cancelar reserva y traslado (POST /clinical/encounter-locations/:id/cancel)', () => {
    it('cancela una reserva y la cama vuelve a poder asignarse', async () => {
      const a = await newBed();
      const r = await newBed();
      const out = await admit(await man(), a.bedId);
      const reserved = await http()
        .post(`/clinical/encounters/${out.encounterId}/bed-assignment`)
        .set(nurseH())
        .set(ifMatch(await version(out.encounterId)))
        .send({ careSpaceId: r.bedId, mode: 'RESERVE' })
        .expect(200);
      const res = await http()
        .post(
          `/clinical/encounter-locations/${reserved.body.encounterLocationId}/cancel`,
        )
        .set(admH())
        .send({ reasonText: 'El paciente ya no necesita esa cama' })
        .expect(200);
      expect(res.body.kind).toBe('RESERVATION');
      const [row] = await sql(
        'select * from clinical.encounter_locations where id = ?',
        [reserved.body.encounterLocationId],
      );
      expect(row).toMatchObject({
        location_status_concept_id: CLIN.LOCATION_CANCELLED,
        end_reason_concept_id: CLIN.ADT_END_RESERVATION_CANCELLED,
      });
      await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(admitBody(await woman(), r.bedId))
        .expect(201);
    });

    it('cancela un traslado dentro de la ventana: reabre la ubicación previa y revierte la limpieza', async () => {
      const from = await newBed();
      const to = await newBed();
      const out = await admit(await man(), from.bedId);
      const tr = await http()
        .post(`/clinical/encounters/${out.encounterId}/transfer`)
        .set(nurseH())
        .set(ifMatch(await version(out.encounterId)))
        .send({ toCareSpaceId: to.bedId, reasonCode: 'ERROR_ADMINISTRATIVO' })
        .expect(200);
      const res = await http()
        .post(`/clinical/encounter-locations/${tr.body.toLocationId}/cancel`)
        .set(nurseH())
        .send({ reasonText: 'Se trasladó a la cama equivocada' })
        .expect(200);
      expect(res.body.kind).toBe('TRANSFER');
      const rows = (await locations(out.encounterId)).filter(
        (r) => r.is_bed_assignment,
      );
      const dest = rows.find((r) => r.id === tr.body.toLocationId);
      const origin = rows.find((r) => r.id === tr.body.fromLocationId);
      expect(dest).toMatchObject({
        location_status_concept_id: CLIN.LOCATION_CANCELLED,
        end_reason_concept_id: CLIN.ADT_END_TRANSFER_CANCELLED,
      });
      expect(origin).toMatchObject({
        location_status_concept_id: CLIN.LOCATION_ACTIVE,
        period_end: null,
        end_reason_concept_id: null,
      });
      expect(double.callsTo('revertDirtyFromSource')).toHaveLength(1);
      expect(double.openOrderOf(from.bedId)).toBeUndefined();
      expect(
        await events('clinical.adt.transfer_cancelled', out.encounterId),
      ).toHaveLength(1);
    });

    it('fuera de la ventana de cancelación: 409 ADT_CANCEL_WINDOW_EXPIRED', async () => {
      const from = await newBed();
      const to = await newBed();
      const out = await admit(await man(), from.bedId, {
        admittedAt: new Date(Date.now() - 6 * 3_600_000).toISOString(),
      });
      const tr = await http()
        .post(`/clinical/encounters/${out.encounterId}/transfer`)
        .set(nurseH())
        .set(ifMatch(await version(out.encounterId)))
        .send({
          toCareSpaceId: to.bedId,
          reasonCode: 'CLINICAL_CONDITION',
          occurredAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
        })
        .expect(200);
      const res = await http()
        .post(`/clinical/encounter-locations/${tr.body.toLocationId}/cancel`)
        .set(nurseH())
        .send({ reasonText: 'tarde' })
        .expect(409);
      expect(res.body.reason).toBe('ADT_CANCEL_WINDOW_EXPIRED');
    });

    it('si alguien ya ocupa la cama previa, o la limpieza ya empezó: 409 PREVIOUS_BED_NO_LONGER_AVAILABLE', async () => {
      const from = await newBed();
      const to = await newBed();
      const out = await admit(await man(), from.bedId);
      const tr = await http()
        .post(`/clinical/encounters/${out.encounterId}/transfer`)
        .set(nurseH())
        .set(ifMatch(await version(out.encounterId)))
        .send({ toCareSpaceId: to.bedId, reasonCode: 'CLINICAL_CONDITION' })
        .expect(200);
      // la limpieza ya no se puede revertir
      double.supportsRevert = false;
      const a = await http()
        .post(`/clinical/encounter-locations/${tr.body.toLocationId}/cancel`)
        .set(nurseH())
        .send({ reasonText: 'x' })
        .expect(409);
      expect(a.body.reason).toBe('PREVIOUS_BED_NO_LONGER_AVAILABLE');
      expect(a.body.details.why).toBe('CLEANING_STARTED');
      double.supportsRevert = true;
      // otro paciente ocupa la cama previa
      double.cleanAndInspect(from.bedId);
      await admit(await woman(), from.bedId, {
        admittedAt: new Date().toISOString(),
      });
      const b = await http()
        .post(`/clinical/encounter-locations/${tr.body.toLocationId}/cancel`)
        .set(nurseH())
        .send({ reasonText: 'x' })
        .expect(409);
      expect(b.body.reason).toBe('PREVIOUS_BED_NO_LONGER_AVAILABLE');
      expect(b.body.details.why).toBe('OCCUPIED');
    });

    it('una ubicación que no es reserva ni traslado no se cancela: 409 LOCATION_NOT_CANCELLABLE', async () => {
      const { bedId } = await newBed();
      const out = await admit(await man(), bedId);
      const res = await http()
        .post(`/clinical/encounter-locations/${out.encounterLocationId}/cancel`)
        .set(nurseH())
        .send({ reasonText: 'x' })
        .expect(409);
      expect(res.body.reason).toBe('LOCATION_NOT_CANCELLABLE');
    });
  });

  // ------------------------------------------------------- censo vivo y ficha
  describe('censo vivo y ficha de internación', () => {
    it('GET /sites/:siteId/inpatients lista los internados con cama, nivel y días de estancia; paginado', async () => {
      const bed = await newBed({ unit: unitIcu });
      const out = await admit(await man('Zacarías Mamani'), bed.bedId);
      const first = await http()
        .get(`/sites/${orgA.siteId}/inpatients?unitId=${unitIcu}`)
        .set(nurseH())
        .expect(200);
      const mine = first.body.items.find(
        (i: any) => i.encounterId === out.encounterId,
      );
      expect(mine).toMatchObject({
        patient: {
          displayName: 'Zacarías Mamani',
          initials: 'ZM',
          administrativeGender: expect.any(String),
        },
        bed: {
          careSpaceId: bed.bedId,
          encounterLocationId: out.encounterLocationId,
        },
        levelOfCare: 'LOC_CARE_GENERAL',
        losDays: 1,
      });
      expect(first.body.generatedAt).toEqual(expect.any(String));
      // paginación por cursor
      await admit(
        await man('Segundo Internado'),
        (await newBed({ unit: unitIcu })).bedId,
      );
      const page1 = await http()
        .get(`/sites/${orgA.siteId}/inpatients?unitId=${unitIcu}&limit=1`)
        .set(nurseH())
        .expect(200);
      expect(page1.body.items).toHaveLength(1);
      expect(page1.body.nextCursor).toEqual(expect.any(String));
      const page2 = await http()
        .get(
          `/sites/${orgA.siteId}/inpatients?unitId=${unitIcu}&limit=1&cursor=${page1.body.nextCursor}`,
        )
        .set(nurseH())
        .expect(200);
      expect(page2.body.items).toHaveLength(1);
      expect(page2.body.items[0].encounterId).not.toBe(
        page1.body.items[0].encounterId,
      );
      await http()
        .get(`/sites/${orgA.siteId}/inpatients?cursor=basura`)
        .set(nurseH())
        .expect(422);
    });

    it('GET /clinical/encounters/:id/stay trae el encuentro y todos sus movimientos', async () => {
      const a = await newBed();
      const b = await newBed();
      const out = await admit(await man(), a.bedId);
      await http()
        .post(`/clinical/encounters/${out.encounterId}/transfer`)
        .set(nurseH())
        .set(ifMatch(await version(out.encounterId)))
        .send({ toCareSpaceId: b.bedId, reasonCode: 'CLINICAL_CONDITION' })
        .expect(200);
      const stay = await http()
        .get(`/clinical/encounters/${out.encounterId}/stay`)
        .set(nurseH())
        .expect(200);
      expect(stay.body.encounter).toMatchObject({
        id: out.encounterId,
        status: 'ENCOUNTER_IN_PROGRESS',
        levelOfCare: 'LOC_CARE_GENERAL',
      });
      expect(
        stay.body.movements.map((m: any) => [m.movement, m.status]),
      ).toEqual([
        ['ADT_ADMIT', 'LOCATION_COMPLETED'],
        ['ADT_TRANSFER', 'LOCATION_ACTIVE'],
      ]);
      expect(stay.body.movements[0].endReason).toBe('ADT_END_TRANSFER_OUT');
    });
  });

  // -------------------------------------------------------- concurrencia real
  describe('concurrencia real contra la base', () => {
    it('dos ingresos simultáneos a la misma cama: uno 201 y el otro 409; en la base hay una sola fila activa', async () => {
      const { bedId } = await newBed();
      const [p1, p2] = [await man('Carrera Uno'), await woman('Carrera Dos')];
      const fire = (patient: string, headers: Record<string, string>) =>
        http()
          .post('/clinical/admissions')
          .set(headers)
          .send(admitBody(patient, bedId));
      const results = await Promise.all([fire(p1, nurseH()), fire(p2, admH())]);
      const statuses = results.map((r) => r.status).sort();
      expect(statuses).toEqual([201, 409]);
      const loser = results.find((r) => r.status === 409)!;
      expect(['BED_NOT_ASSIGNABLE', 'BED_DOUBLE_OCCUPANCY']).toContain(
        loser.body.reason,
      );
      const active = await sql(
        `select count(*)::int as n from clinical.encounter_locations
          where care_space_id = ? and location_status_concept_id = ? and period_end is null`,
        [bedId, CLIN.LOCATION_ACTIVE],
      );
      expect(active[0].n).toBe(1);
      // el que perdió no dejó nada a medias: su encuentro no existe
      const winner = results.find((r) => r.status === 201)!;
      const encounters = await sql(
        'select id from clinical.encounters where patient_profile_id in (?, ?) and class_concept_id = ?',
        [p1, p2, CLIN.ENCOUNTER_CLASS_INPATIENT],
      );
      expect(encounters.map((e: any) => e.id)).toEqual([
        winner.body.encounterId,
      ]);
    });

    it('la base es la red: si el pre-chequeo se equivoca (estado falso de «libre»), el EXCLUDE responde 409 BED_DOUBLE_OCCUPANCY', async () => {
      const { bedId } = await newBed();
      await admit(await man(), bedId);
      double.lie(bedId, { occupancy: 'OCC_FREE', assignable: true });
      const intruso = await man('Intruso Falso');
      const res = await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(admitBody(intruso, bedId))
        .expect(409);
      expect(res.body.reason).toBe('BED_DOUBLE_OCCUPANCY');
      // y el intento fallido no dejó encuentro huérfano
      expect(
        (
          await sql(
            'select count(*)::int as n from clinical.encounters where patient_profile_id = ?',
            [intruso],
          )
        )[0].n,
      ).toBe(0);
    });

    it('un INSERT directo que solape la ocupación activa falla con 23P01 (la base lo impide aunque la API tenga un bug)', async () => {
      const { bedId } = await newBed();
      const first = await admit(await man(), bedId);
      const intruder = await admit(await woman(), null);
      await expect(
        sql(
          `insert into clinical.encounter_locations
             (id, encounter_id, tenant_id, practice_site_id, care_space_id, location_status_concept_id,
              period_start, movement_type_concept_id, created_at, updated_at, row_version)
           values (gen_random_uuid(), ?, ?, ?, ?, ?, now(), ?, now(), now(), 1)`,
          [
            intruder.encounterId,
            orgA.tenantId,
            orgA.siteId,
            bedId,
            CLIN.LOCATION_ACTIVE,
            CLIN.ADT_ADMIT,
          ],
        ),
      ).rejects.toMatchObject({ code: '23P01' });
      // incluso declarándose «no cama»: la base deriva la bandera de la forma del espacio
      await expect(
        sql(
          `insert into clinical.encounter_locations
             (id, encounter_id, tenant_id, practice_site_id, care_space_id, location_status_concept_id,
              period_start, is_bed_assignment, movement_type_concept_id, created_at, updated_at, row_version)
           values (gen_random_uuid(), ?, ?, ?, ?, ?, now(), false, ?, now(), now(), 1)`,
          [
            intruder.encounterId,
            orgA.tenantId,
            orgA.siteId,
            bedId,
            CLIN.LOCATION_ACTIVE,
            CLIN.ADT_ADMIT,
          ],
        ),
      ).rejects.toMatchObject({ code: '23P01' });
      void first;
    });
  });

  // ----------------------------------------------------- checkIn rechaza camas
  describe('check-in no ocupa camas (cambio mínimo en EncountersService)', () => {
    it('POST /clinical/encounters/check-in con una cama: 422 BED_ASSIGNMENT_REQUIRES_ADT; con un consultorio sigue funcionando', async () => {
      const { bedId } = await newBed();
      const consultorio = await createSpace(ctx, orgA, {
        code: `CONS-${suffix}`,
        name: 'Consultorio',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_CONSULTING_ROOM',
      });
      const patient = await man('Ambulatorio');
      const body = (careSpaceId: string) => ({
        patientProfileId: patient,
        tenantId: orgA.tenantId,
        primaryPractitionerId: practitioner,
        location: { practiceSiteId: orgA.siteId, careSpaceId },
      });
      const cama = await http()
        .post('/clinical/encounters/check-in')
        .set(as(ctx.adminToken, orgA.tenantId))
        .send(body(bedId))
        .expect(422);
      expect(cama.body.reason).toBe('BED_ASSIGNMENT_REQUIRES_ADT');
      expect(
        await sql(
          'select 1 from clinical.encounters where patient_profile_id = ?',
          [patient],
        ),
      ).toHaveLength(0);
      const ok = await http()
        .post('/clinical/encounters/check-in')
        .set(as(ctx.adminToken, orgA.tenantId))
        .send(body(consultorio.id))
        .expect(201);
      expect(ok.body.locationIds).toHaveLength(1);
    });
  });

  // ------------------------------------------- bloqueo de clausura por ocupación
  describe('clausura bloqueada por ocupación (RETIRE_BLOCKER_PROVIDERS)', () => {
    it('una cama con paciente o reserva aparece en retire-check; libre, no', async () => {
      const { bedId } = await newBed();
      const owner = as(orgA.token, orgA.tenantId);
      const libre = await http()
        .get(`/care-spaces/${bedId}/retire-check`)
        .set(owner)
        .expect(200);
      expect(libre.body.blockers.map((b: any) => b.kind)).not.toContain(
        'ACTIVE_BED_OCCUPANCY',
      );
      const out = await admit(await man(), bedId);
      const ocupada = await http()
        .get(`/care-spaces/${bedId}/retire-check`)
        .set(owner)
        .expect(200);
      const blocker = ocupada.body.blockers.find(
        (b: any) => b.kind === 'ACTIVE_BED_OCCUPANCY',
      );
      expect(blocker).toMatchObject({
        count: 1,
        sampleIds: [out.encounterId],
        nextAction: expect.any(String),
      });
      // clausurar la habitación (padre) también lo ve: el subárbol
      const [{ parent_space_id: roomId }] = await sql(
        'select parent_space_id from practice.care_spaces where id = ?',
        [bedId],
      );
      const room = await http()
        .get(`/care-spaces/${roomId}/retire-check`)
        .set(owner)
        .expect(200);
      expect(room.body.blockers.map((b: any) => b.kind)).toContain(
        'ACTIVE_BED_OCCUPANCY',
      );
      // y la clausura real responde 409
      const [{ row_version: rv }] = await sql(
        'select row_version from practice.care_spaces where id = ?',
        [bedId],
      );
      const clausura = await http()
        .post(`/care-spaces/${bedId}/lifecycle`)
        .set(owner)
        .set(ifMatch(rv))
        .send({ action: 'retire', reason: 'Prueba' })
        .expect(409);
      expect(clausura.body.reason).toBe('SPACE_RETIRE_BLOCKED');
    });

    it('una reserva (sin paciente instalado) también bloquea', async () => {
      const { bedId } = await newBed();
      await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(
          admitBody(await man(), bedId, {
            bed: { careSpaceId: bedId, mode: 'RESERVE' },
          }),
        )
        .expect(201);
      const res = await http()
        .get(`/care-spaces/${bedId}/retire-check`)
        .set(as(orgA.token, orgA.tenantId))
        .expect(200);
      expect(res.body.blockers.map((b: any) => b.kind)).toContain(
        'ACTIVE_BED_OCCUPANCY',
      );
    });
  });

  // ------------------------------------------------- roles y 404 cruzado por tenant
  describe('roles (403) y aislamiento por tenant (404) en cada endpoint', () => {
    let ctxEnc: {
      encounterId: string;
      otherEncounterId: string;
      locationId: string;
      bedId: string;
      incidentId: string;
      reservationId: string;
    };

    beforeAll(async () => {
      const a = await newBed({ room: { sexRestrictionCode: 'SEX_FEMALE' } });
      const out = await http()
        .post('/clinical/admissions')
        .set(supH())
        .send(
          admitBody(await man('Para Permisos'), a.bedId, {
            override: {
              justification: 'Caso de prueba de permisos con justificación.',
              ruleCodes: ['SEX'],
            },
          }),
        )
        .expect(201);
      const r = await newBed();
      const res = await http()
        .post(`/clinical/encounters/${out.body.encounterId}/bed-assignment`)
        .set(nurseH())
        .set(ifMatch(await version(out.body.encounterId)))
        .send({ careSpaceId: r.bedId, mode: 'RESERVE' })
        .expect(200);
      const other = await admit(
        await woman('Otra Para Permisos'),
        (await newBed()).bedId,
      );
      ctxEnc = {
        encounterId: out.body.encounterId,
        otherEncounterId: other.encounterId,
        locationId: out.body.encounterLocationId,
        bedId: a.bedId,
        incidentId: out.body.incidentId,
        reservationId: res.body.encounterLocationId,
      };
    });

    type Call = (headers: Record<string, string>) => any;
    const endpoints = (): [string, Call][] => [
      [
        'bed-compatibility',
        (h) =>
          http()
            .post(
              `/clinical/encounters/${ctxEnc.encounterId}/bed-compatibility`,
            )
            .set(h)
            .send({ careSpaceId: ctxEnc.bedId }),
      ],
      [
        'admissions',
        (h) =>
          http()
            .post('/clinical/admissions')
            .set(h)
            .send(admitBody(randomUUID(), null)),
      ],
      [
        'bed-assignment',
        (h) =>
          http()
            .post(`/clinical/encounters/${ctxEnc.encounterId}/bed-assignment`)
            .set(h)
            .set(ifMatch(1))
            .send({ careSpaceId: ctxEnc.bedId, mode: 'RESERVE' }),
      ],
      [
        'transfer',
        (h) =>
          http()
            .post(`/clinical/encounters/${ctxEnc.encounterId}/transfer`)
            .set(h)
            .set(ifMatch(1))
            .send({ toCareSpaceId: ctxEnc.bedId, reasonCode: 'X1' }),
      ],
      [
        'bed-swaps',
        (h) =>
          http().post('/clinical/bed-swaps').set(h).send({
            encounterAId: ctxEnc.encounterId,
            encounterBId: ctxEnc.otherEncounterId,
            reasonText: 'x',
          }),
      ],
      [
        'discharge',
        (h) =>
          http()
            .post(`/clinical/encounters/${ctxEnc.encounterId}/discharge`)
            .set(h)
            .set(ifMatch(1))
            .send({
              dischargeDispositionCode: 'DISP_HOME',
              occurredAt: new Date(Date.now() - 1000).toISOString(),
            }),
      ],
      [
        'cancel',
        (h) =>
          http()
            .post(
              `/clinical/encounter-locations/${ctxEnc.reservationId}/cancel`,
            )
            .set(h)
            .send({ reasonText: 'x' }),
      ],
      [
        'inpatients',
        (h) => http().get(`/sites/${orgA.siteId}/inpatients`).set(h),
      ],
      [
        'stay',
        (h) =>
          http().get(`/clinical/encounters/${ctxEnc.encounterId}/stay`).set(h),
      ],
      [
        'placement-incidents',
        (h) =>
          http()
            .patch(`/clinical/placement-incidents/${ctxEnc.incidentId}`)
            .set(h)
            .send({ status: 'REVIEWED', reviewNote: 'x' }),
      ],
    ];

    it.each([
      'bed-compatibility',
      'admissions',
      'bed-assignment',
      'transfer',
      'bed-swaps',
      'discharge',
      'cancel',
      'inpatients',
      'stay',
      'placement-incidents',
    ])(
      '%s · otro tenant ⇒ 404 uniforme, sin revelar si existe',
      async (name) => {
        const call = endpoints().find(([n]) => n === name)![1];
        // una enfermera del tenant B contra recursos del tenant A, en el contexto de B
        const res = await call(as(nurseB.token, orgB.tenantId));
        expect(res.status).toBe(404);
        expect(res.body.reason).toBe('ADT_RESOURCE_OUT_OF_SCOPE');
        // la respuesta es idéntica a la de un id que no existe en ningún tenant
        expect(res.body.message).toBe('Recurso no encontrado');
        expect(res.body.details).toBeUndefined();
        // y no hay forma de entrar al tenant A con un token de B
        const forged = await call({ ...as(nurseB.token, orgA.tenantId) });
        expect([403, 404]).toContain(forged.status);
      },
    );

    it.each([
      'bed-compatibility',
      'admissions',
      'bed-assignment',
      'transfer',
      'bed-swaps',
      'discharge',
      'cancel',
      'inpatients',
      'stay',
      'placement-incidents',
    ])(
      '%s · Limpieza nunca opera ni ve pacientes ⇒ 403 INFRA_ACTION_NOT_ALLOWED',
      async (name) => {
        const call = endpoints().find(([n]) => n === name)![1];
        const res = await call(cleanH());
        expect(res.status).toBe(403);
        expect(res.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
      },
    );

    it('el administrador de la organización no opera camas (separación de funciones)', async () => {
      const owner = as(orgA.token, orgA.tenantId);
      for (const [, call] of endpoints()) {
        const res = await call(owner);
        expect(res.status).toBe(403);
      }
    });

    it('el alcance cuenta: una enfermera de otra unidad no opera la cama de Medicina; y un rol vencido deja de valer', async () => {
      const { bedId } = await newBed();
      const patient = await man();
      const res = await http()
        .post('/clinical/admissions')
        .set(as(nurseOtherUnit.token, orgA.tenantId))
        .send(admitBody(patient, bedId))
        .expect(403);
      expect(res.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
      // una asignación vencida
      const expired = await createStaff(
        ctx,
        orgA,
        'venc',
        ROLE.NURSE,
        { kind: 'SITE', siteId: orgA.siteId },
        suffix,
      );
      await sql(
        `update delegated_access.organization_user_assignments set valid_to = now() - interval '1 minute'
          where tenant_membership_id = ?`,
        [expired.membershipId],
      );
      await http()
        .post('/clinical/admissions')
        .set(as(expired.token, orgA.tenantId))
        .send(admitBody(patient, bedId))
        .expect(403);
      // una enfermera con alcance de unidad sí opera su unidad
      const own = await createStaff(
        ctx,
        orgA,
        'unidad',
        ROLE.NURSE,
        { kind: 'UNIT', unitId: unitMed },
        suffix,
      );
      await http()
        .post('/clinical/admissions')
        .set(as(own.token, orgA.tenantId))
        .send(admitBody(patient, bedId))
        .expect(201);
    });

    it('Admisión asigna, traslada y da egreso, pero no fuerza la compatibilidad', async () => {
      const { bedId } = await newBed({
        room: { sexRestrictionCode: 'SEX_FEMALE' },
      });
      const override = {
        justification: 'Admisión intenta forzar sin ser supervisión.',
        ruleCodes: ['SEX'],
      };
      await http()
        .post('/clinical/admissions')
        .set(admH())
        .send(admitBody(await man(), bedId, { override }))
        .expect(403);
    });
  });

  // ------------------------------------------------- autoridad sobre la ubicación actual
  describe('la autoridad sale de la ubicación actual, no de una reserva ajena', () => {
    const victimName = `Paciente Reservado ${suffix}`;
    let attackerX: Staff;
    let bedY: string;
    let bedX: string;
    let victim: any;

    async function setUp() {
      bedY = (await newBed()).bedId;
      bedX = (await newBed()).bedId;
      victim = await admit(await man(victimName), bedY);
      attackerX = await createStaff(
        ctx,
        orgA,
        'atk',
        ROLE.NURSE,
        { kind: 'SPACE', careSpaceId: bedX },
        suffix,
      );
    }
    const atk = () => as(attackerX.token, orgA.tenantId);

    it('quien sólo tiene alcance sobre OTRA cama no puede crear la reserva: 403 y nada se escribe', async () => {
      await setUp();
      const before = await locations(victim.encounterId);
      const v = await version(victim.encounterId);
      const res = await http()
        .post(`/clinical/encounters/${victim.encounterId}/bed-assignment`)
        .set(atk())
        .set(ifMatch(v))
        .send({ careSpaceId: bedX, mode: 'RESERVE' })
        .expect(403);
      expect(res.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
      expect(await locations(victim.encounterId)).toHaveLength(before.length);
      expect(await version(victim.encounterId)).toBe(v);
    });

    it('aunque exista una reserva sobre su cama, no puede leer la estancia ni el nombre, ni dar el alta', async () => {
      await setUp();
      // Una reserva legítima de quien sí opera al paciente deja una fila sobre bedX.
      await http()
        .post(`/clinical/encounters/${victim.encounterId}/bed-assignment`)
        .set(nurseH())
        .set(ifMatch(await version(victim.encounterId)))
        .send({ careSpaceId: bedX, mode: 'RESERVE' })
        .expect(200);

      const stay = await http()
        .get(`/clinical/encounters/${victim.encounterId}/stay`)
        .set(atk());
      expect(stay.status).toBe(403);
      expect(JSON.stringify(stay.body)).not.toContain(victimName);

      const v = await version(victim.encounterId);
      const discharge = await http()
        .post(`/clinical/encounters/${victim.encounterId}/discharge`)
        .set(atk())
        .set(ifMatch(v))
        .send({
          dischargeDispositionCode: 'DISP_HOME',
          occurredAt: new Date(Date.now() - 1_000).toISOString(),
        });
      expect(discharge.status).toBe(403);
      expect((await encounterRow(victim.encounterId)).status_concept_id).toBe(
        CLIN.ENCOUNTER_IN_PROGRESS,
      );
      expect(await version(victim.encounterId)).toBe(v);

      // Quien sí tiene alcance sobre la cama actual lee la estancia con el nombre.
      const ok = await http()
        .get(`/clinical/encounters/${victim.encounterId}/stay`)
        .set(nurseH())
        .expect(200);
      expect(JSON.stringify(ok.body)).toContain(victimName);
    });

    it('traslado: exige alcance sobre el origen (aunque lo tenga sobre el destino); sin escribir', async () => {
      await setUp();
      const bedZ = (await newBed()).bedId;
      await assign(ctx, attackerX.membershipId, ROLE.NURSE, {
        kind: 'SPACE',
        careSpaceId: bedZ,
      });
      const before = await locations(victim.encounterId);
      const v = await version(victim.encounterId);
      await http()
        .post(`/clinical/encounters/${victim.encounterId}/transfer`)
        .set(atk())
        .set(ifMatch(v))
        .send({ toCareSpaceId: bedZ, reasonCode: 'ERROR_ADMINISTRATIVO' })
        .expect(403);
      expect(await locations(victim.encounterId)).toHaveLength(before.length);
      expect(await version(victim.encounterId)).toBe(v);
    });

    it('intercambio: exige alcance sobre las dos camas ocupadas; con una sola, 403 sin escribir', async () => {
      await setUp();
      const bedW = (await newBed()).bedId;
      const other = await admit(await man(), bedW);
      const onlyY = await createStaff(
        ctx,
        orgA,
        'cruz',
        ROLE.NURSE,
        { kind: 'SPACE', careSpaceId: bedY },
        suffix,
      );
      await http()
        .post('/clinical/bed-swaps')
        .set(as(onlyY.token, orgA.tenantId))
        .send({
          encounterAId: victim.encounterId,
          encounterBId: other.encounterId,
          reasonText: 'Intercambio entre camas por afinidad clínica',
        })
        .expect(403);
      const rows = (await locations(victim.encounterId)).filter(
        (r) => r.is_bed_assignment,
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].care_space_id).toBe(bedY);
    });

    describe('camas de otra sede', () => {
      let site2: string;
      let bed2: string;
      beforeAll(async () => {
        const res = await http()
          .post(`/practices/${orgA.practiceId}/sites`)
          .set(as(orgA.token, orgA.tenantId))
          .send({ code: `F3-SEDE2-${suffix}`, name: 'Sede dos' })
          .expect(201);
        site2 = res.body.id;
        const room = await createSpace(
          ctx,
          { ...orgA, siteId: site2 },
          {
            code: `R2-${suffix}`,
            name: 'Hab sede 2',
            formCode: 'LOC_FORM_ROOM',
            functionCode: 'SPACE_FN_INPATIENT_ROOM',
          },
        );
        const bed = await createSpace(
          ctx,
          { ...orgA, siteId: site2 },
          {
            code: `B2-${suffix}`,
            name: 'Cama sede 2',
            formCode: 'LOC_FORM_BED',
            functionCode: 'SPACE_FN_BED_STANDARD',
            parentSpaceId: room.id,
            bedCategoryCode: 'BED_CAT_SHARED',
            censable: true,
          },
        );
        bed2 = bed.id;
      });

      it('asignar una cama de otra sede a un encuentro pendiente de cama ⇒ 422 BED_SITE_MISMATCH, sin escribir', async () => {
        const wide = await createStaff(
          ctx,
          orgA,
          'ancho',
          ROLE.NURSE,
          { kind: 'TENANT' },
          suffix,
        );
        const pending = await admit(await man(), null);
        const before = await locations(pending.encounterId);
        const v = await version(pending.encounterId);
        const res = await http()
          .post(`/clinical/encounters/${pending.encounterId}/bed-assignment`)
          .set(as(wide.token, orgA.tenantId))
          .set(ifMatch(v))
          .send({ careSpaceId: bed2, mode: 'ASSIGN' });
        expect(res.status).toBe(422);
        expect(res.body.reason).toBe('BED_SITE_MISMATCH');
        expect(await locations(pending.encounterId)).toHaveLength(
          before.length,
        );
        expect(await version(pending.encounterId)).toBe(v);
      });

      it('quien sólo opera la otra sede no puede asignar su cama a un encuentro de ésta: 403', async () => {
        const only2 = await createStaff(
          ctx,
          orgA,
          'sede2',
          ROLE.NURSE,
          { kind: 'SITE', siteId: site2 },
          suffix,
        );
        const pending = await admit(await man(), null);
        await http()
          .post(`/clinical/encounters/${pending.encounterId}/bed-assignment`)
          .set(as(only2.token, orgA.tenantId))
          .set(ifMatch(await version(pending.encounterId)))
          .send({ careSpaceId: bed2, mode: 'ASSIGN' })
          .expect(403);
        expect(
          (await locations(pending.encounterId)).filter(
            (r) => r.is_bed_assignment,
          ),
        ).toHaveLength(0);
      });
    });

    it('tras el alta la estancia sigue legible por quien operaba al paciente y no por un ajeno', async () => {
      await setUp();
      await http()
        .post(`/clinical/encounters/${victim.encounterId}/discharge`)
        .set(nurseH())
        .set(ifMatch(await version(victim.encounterId)))
        .send({
          dischargeDispositionCode: 'DISP_HOME',
          occurredAt: new Date(Date.now() - 1_000).toISOString(),
        })
        .expect(200);
      await http()
        .get(`/clinical/encounters/${victim.encounterId}/stay`)
        .set(nurseH())
        .expect(200);
      await http()
        .get(`/clinical/encounters/${victim.encounterId}/stay`)
        .set(atk())
        .expect(403);
    });
  });

  // ------------------------------------------------- idempotencia y contratos varios
  describe('contratos varios', () => {
    it('sin sesión 401', async () => {
      await http().post('/clinical/admissions').send({}).expect(401);
      await http().get(`/sites/${orgA.siteId}/inpatients`).expect(401);
    });

    it('validación de cuerpo: 400 con campos desconocidos y UUID inválidos', async () => {
      await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send({ ...admitBody(randomUUID(), null), colado: 1 })
        .expect(400);
      await http()
        .post('/clinical/encounters/no-es-uuid/transfer')
        .set(nurseH())
        .set(ifMatch(1))
        .send({})
        .expect(400);
    });
  });
});
