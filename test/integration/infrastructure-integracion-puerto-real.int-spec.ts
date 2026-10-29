import { randomUUID } from 'node:crypto';
import { CONCEPTS } from '../../src/common';
import { bootstrapTestApp, type TestContext } from './harness';
import {
  como,
  crearMiembro,
  crearQuirofano,
  darMembresia,
  filas,
  http as httpF4,
  ligarRecurso,
  mkOrg,
  registrarOrg,
  registrarProfesional,
} from './infra-f4.fixtures';
import {
  ROLE,
  as,
  createPatient,
  createSpace,
  createStaff,
  createUnit,
  ifMatch,
  registerOrg,
  toolbox,
  type InfraOrg,
  type Staff,
} from './infrastructure-f3.fixtures';

/**
 * Integración de F2 con F3 y F4 **sin doble**: el puerto de operación de espacios
 * (`CARE_SPACE_OPS_PORT`) es la implementación real de `practice`.
 *
 *   egreso (F3) → cama sucia + orden de limpieza (F2) → limpiar → inspeccionar →
 *   asignable de nuevo; traslado cancelado (A12) → la limpieza se revierte;
 *   salida del paciente del quirófano (F4) → orden de recambio.
 *
 * Cada paso se comprueba con SELECT sobre la base real (orden, ejes de higiene,
 * eventos A20, outbox), no con el cuerpo de la respuesta.
 */
describe('Infraestructura · F2 con F3 y F4 por el puerto real (sin doble)', () => {
  let ctx: TestContext;
  const suffix = randomUUID().slice(0, 8);
  let http: ReturnType<typeof toolbox>['http'];
  let sql: ReturnType<typeof toolbox>['sql'];

  let org: InfraOrg;
  let unit: string;
  let nurse: Staff;
  let admission: Staff;
  let cleaner: Staff;
  let practitioner: string;
  let seq = 0;

  const nurseH = () => as(nurse.token, org.tenantId);
  const admH = () => as(admission.token, org.tenantId);
  const cleanH = () => as(cleaner.token, org.tenantId);

  async function newBed(): Promise<string> {
    const n = (seq += 1);
    const room = await createSpace(ctx, org, {
      code: `R${n}-${suffix}`,
      name: `Hab ${n}`,
      formCode: 'LOC_FORM_ROOM',
      functionCode: 'SPACE_FN_INPATIENT_ROOM',
      clinicalUnitId: unit,
    });
    const bed = await createSpace(ctx, org, {
      code: `B${n}-${suffix}`,
      name: `Cama ${n}`,
      formCode: 'LOC_FORM_BED',
      functionCode: 'SPACE_FN_BED_STANDARD',
      parentSpaceId: room.id,
      bedCategoryCode: 'BED_CAT_SHARED',
      censable: true,
      clinicalUnitId: unit,
    });
    return bed.id;
  }

  const patient = (name: string) =>
    createPatient(ctx, { name, gender: 'MALE', birthDate: '1980-05-10' });

  const admitBody = (
    patientProfileId: string,
    bedId: string,
    admittedAt = new Date(Date.now() - 2 * 3_600_000),
  ) => ({
    patientProfileId,
    practiceSiteId: org.siteId,
    attendingPractitionerId: practitioner,
    levelOfCareCode: 'LOC_CARE_GENERAL',
    admissionSourceCode: 'ADM_SRC_EMERGENCY',
    reasonText: 'Dolor abdominal agudo',
    bed: { careSpaceId: bedId, mode: 'ASSIGN' },
    admittedAt: admittedAt.toISOString(),
  });

  async function admit(
    patientId: string,
    bedId: string,
    admittedAt?: Date,
  ): Promise<any> {
    return (
      await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(admitBody(patientId, bedId, admittedAt))
        .expect(201)
    ).body;
  }

  const encounterVersion = async (id: string): Promise<number> =>
    (
      await sql('select row_version from clinical.encounters where id = ?', [
        id,
      ])
    )[0].row_version;

  /** Eje de higiene, orden abierta y versión operativa de un espacio, leídos de la base. */
  async function hygieneOf(spaceId: string): Promise<{
    code: string;
    terminal: boolean;
  }> {
    const [row] = await sql(
      `select c.code, cs.terminal_cleaning_required as terminal
         from practice.care_spaces cs
         join terminology.catalog_concepts c on c.id = cs.hygiene_status_concept_id
        where cs.id = ?`,
      [spaceId],
    );
    return {
      code: String(row.code).replace('practice:', ''),
      terminal: row.terminal,
    };
  }

  const ordersOf = (spaceId: string) =>
    sql(
      `select o.id, o.row_version, o.source_ref_id, o.cancel_reason,
              st.code as status, tr.code as trigger, ty.code as type
         from practice.cleaning_orders o
         join terminology.catalog_concepts st on st.id = o.status_concept_id
         join terminology.catalog_concepts tr on tr.id = o.trigger_concept_id
         join terminology.catalog_concepts ty on ty.id = o.cleaning_type_concept_id
        where o.care_space_id = ?
        order by o.created_at`,
      [spaceId],
    );

  const outbox = (type: string, aggregateId: string) =>
    sql(
      `select * from messaging.domain_events
        where event_type = ? and aggregate_id = ?`,
      [type, aggregateId],
    );

  const operationalState = async (spaceId: string): Promise<any> =>
    (
      await http()
        .get(`/care-spaces/${spaceId}/operational-state`)
        .set(nurseH())
        .expect(200)
    ).body;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    ({ http, sql } = toolbox(ctx));
    practitioner = ctx.practitionerSubtypeId;
    org = await registerOrg(ctx, 'I', suffix);
    unit = await createUnit(ctx, org, 'UN-INT', 'Medicina');
    const site = { kind: 'SITE', siteId: org.siteId } as const;
    nurse = await createStaff(ctx, org, 'enf', ROLE.NURSE, site, suffix);
    admission = await createStaff(
      ctx,
      org,
      'adm',
      ROLE.ADMISSION,
      site,
      suffix,
    );
    cleaner = await createStaff(
      ctx,
      org,
      'lim',
      ROLE.HOUSEKEEPING,
      site,
      suffix,
    );
  }, 240000);

  afterAll(async () => {
    await ctx?.app.close();
  });

  describe('F3 egreso → F2 limpieza', () => {
    let bedId: string;
    let encounterId: string;
    let orderId: string;
    let locationId: string;

    it('el egreso deja la cama sucia, crea la orden de limpieza y publica los eventos', async () => {
      bedId = await newBed();
      const out = await admit(await patient('Juan Pérez'), bedId);
      encounterId = out.encounterId;
      expect(out.cell).toMatchObject({
        careSpaceId: bedId,
        occupancy: { code: 'OCC_OCCUPIED' },
        assignable: false,
      });
      expect((await hygieneOf(bedId)).code).toBe('HYG_INSPECTED');

      const res = await http()
        .post(`/clinical/encounters/${encounterId}/discharge`)
        .set(admH())
        .set(ifMatch(await encounterVersion(encounterId)))
        .send({
          dischargeDispositionCode: 'DISP_HOME',
          occurredAt: new Date(Date.now() - 5_000).toISOString(),
        })
        .expect(200);
      orderId = res.body.cleaningOrderId;
      expect(orderId).toEqual(expect.any(String));

      const [location] = await sql(
        `select id from clinical.encounter_locations
          where encounter_id = ? and is_bed_assignment`,
        [encounterId],
      );
      locationId = location.id;
      const orders = await ordersOf(bedId);
      expect(orders).toHaveLength(1);
      expect(orders[0]).toMatchObject({
        id: orderId,
        status: 'practice:CLN_PENDING',
        trigger: 'practice:CLN_TRG_DISCHARGE',
        type: 'practice:CLEAN_DISCHARGE',
        source_ref_id: locationId,
      });
      expect(await hygieneOf(bedId)).toEqual({
        code: 'HYG_DIRTY',
        terminal: false,
      });
      // rastro A20: ocupación (O → libre) e higiene (limpia → sucia), ambos por ADT
      const events = await sql(
        `select a.code as axis, f.code as from_code, t.code as to_code, s.code as source
           from practice.care_space_status_events e
           join terminology.catalog_concepts a on a.id = e.axis_concept_id
           left join terminology.catalog_concepts f on f.id = e.from_concept_id
           join terminology.catalog_concepts t on t.id = e.to_concept_id
           join terminology.catalog_concepts s on s.id = e.source_concept_id
          where e.care_space_id = ? and e.source_ref_id = ?`,
        [bedId, locationId],
      );
      expect(events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            axis: 'practice:AXIS_HYGIENE',
            to_code: 'practice:HYG_DIRTY',
            source: 'practice:SRC_ADT',
          }),
          expect.objectContaining({
            axis: 'practice:AXIS_OCCUPANCY',
            from_code: 'practice:OCC_OCCUPIED',
            to_code: 'practice:OCC_FREE',
          }),
        ]),
      );
      expect(
        await outbox('practice.cleaning_order.created', orderId),
      ).toHaveLength(1);
    });

    it('sucia no es asignable: un ingreso a esa cama es 409 por higiene', async () => {
      const state = await operationalState(bedId);
      expect(state.cell).toMatchObject({
        assignable: false,
        hygiene: { code: 'HYG_DIRTY' },
        occupancy: { code: 'OCC_FREE' },
      });
      const res = await http()
        .post('/clinical/admissions')
        .set(nurseH())
        .send(admitBody(await patient('Siguiente'), bedId))
        .expect(409);
      expect(res.body.details.violations).toEqual([
        expect.objectContaining({ rule: 'HYGIENE', severity: 'BLOCKING' }),
      ]);
    });

    it('limpiar → inspeccionar: la orden se cierra, la cama queda limpia y vuelve a ser asignable', async () => {
      const version = async (): Promise<number> =>
        (await ordersOf(bedId)).find((o: any) => o.id === orderId)!.row_version;
      await http()
        .post(`/cleaning-orders/${orderId}/start`)
        .set(cleanH())
        .set(ifMatch(await version()))
        .expect(200);
      expect((await hygieneOf(bedId)).code).toBe('HYG_CLEANING');
      await http()
        .post(`/cleaning-orders/${orderId}/finish`)
        .set(cleanH())
        .set(ifMatch(await version()))
        .send({})
        .expect(200);
      // Limpieza opera la orden pero no la inspecciona
      const propio = await http()
        .post(`/cleaning-orders/${orderId}/inspect`)
        .set(cleanH())
        .set(ifMatch(await version()))
        .send({ result: 'PASS' });
      expect(propio.status).toBe(403);
      expect(propio.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
      await http()
        .post(`/cleaning-orders/${orderId}/inspect`)
        .set(nurseH())
        .set(ifMatch(await version()))
        .send({ result: 'PASS' })
        .expect(200);

      expect((await ordersOf(bedId))[0].status).toBe('practice:CLN_INSPECTED');
      expect((await hygieneOf(bedId)).code).toBe('HYG_INSPECTED');
      expect((await operationalState(bedId)).cell).toMatchObject({
        assignable: true,
        occupancy: { code: 'OCC_FREE' },
      });

      // recarga: otro ingreso entra en la cama
      const reingreso = await admit(
        await patient('Después'),
        bedId,
        new Date(),
      );
      expect(reingreso.cell).toMatchObject({
        careSpaceId: bedId,
        occupancy: { code: 'OCC_OCCUPIED' },
      });
    });
  });

  describe('F3 traslado cancelado (A12) → F2 revierte la limpieza', () => {
    it('sin empezar la limpieza: la orden se cancela por reversión y la cama de origen vuelve a estar inspeccionada y ocupada', async () => {
      const from = await newBed();
      const to = await newBed();
      const out = await admit(await patient('María Rojas'), from);
      const tr = await http()
        .post(`/clinical/encounters/${out.encounterId}/transfer`)
        .set(nurseH())
        .set(ifMatch(await encounterVersion(out.encounterId)))
        .send({ toCareSpaceId: to, reasonCode: 'ERROR_ADMINISTRATIVO' })
        .expect(200);
      expect((await hygieneOf(from)).code).toBe('HYG_DIRTY');
      const [dirty] = await ordersOf(from);
      expect(dirty).toMatchObject({
        id: tr.body.cleaningOrderId,
        status: 'practice:CLN_PENDING',
        trigger: 'practice:CLN_TRG_TRANSFER',
      });

      await http()
        .post(`/clinical/encounter-locations/${tr.body.toLocationId}/cancel`)
        .set(nurseH())
        .send({ reasonText: 'Cama equivocada' })
        .expect(200);

      const [reverted] = await ordersOf(from);
      expect(reverted).toMatchObject({
        id: dirty.id,
        status: 'practice:CLN_CANCELLED',
        cancel_reason: 'SOURCE_REVERTED',
      });
      expect(await hygieneOf(from)).toEqual({
        code: 'HYG_INSPECTED',
        terminal: false,
      });
      expect((await operationalState(from)).cell).toMatchObject({
        occupancy: { code: 'OCC_OCCUPIED' },
        openCleaningOrderId: null,
      });
      expect(
        await outbox('practice.cleaning_order.cancelled', dirty.id),
      ).toHaveLength(1);
    });

    it('con la limpieza ya empezada no se revierte: 409 PREVIOUS_BED_NO_LONGER_AVAILABLE y nada cambia', async () => {
      const from = await newBed();
      const to = await newBed();
      const out = await admit(await patient('Pedro Gómez'), from);
      const tr = await http()
        .post(`/clinical/encounters/${out.encounterId}/transfer`)
        .set(nurseH())
        .set(ifMatch(await encounterVersion(out.encounterId)))
        .send({ toCareSpaceId: to, reasonCode: 'CLINICAL_CONDITION' })
        .expect(200);
      const [order] = await ordersOf(from);
      await http()
        .post(`/cleaning-orders/${order.id}/start`)
        .set(cleanH())
        .set(ifMatch(order.row_version))
        .expect(200);

      const res = await http()
        .post(`/clinical/encounter-locations/${tr.body.toLocationId}/cancel`)
        .set(nurseH())
        .send({ reasonText: 'Cama equivocada' })
        .expect(409);
      expect(res.body.reason).toBe('PREVIOUS_BED_NO_LONGER_AVAILABLE');
      expect((await ordersOf(from))[0].status).toBe('practice:CLN_IN_PROGRESS');
      const [dest] = await sql(
        `select l.location_status_concept_id as status
           from clinical.encounter_locations l where l.id = ?`,
        [tr.body.toLocationId],
      );
      expect(dest.status).not.toBeNull();
    });
  });

  describe('F4 salida del paciente del quirófano → F2 orden de recambio', () => {
    it('PATIENT_OUT_OF_ROOM crea la orden CLEAN_OR_TURNOVER de la sala y deja la sala sucia', async () => {
      const orgF4 = mkOrg('Q', suffix);
      await registrarOrg(ctx, orgF4, 'Q', suffix);
      const medico = await registrarProfesional(ctx, 'cirujano', suffix);
      await darMembresia(ctx, medico.userId, orgF4.tenantId);
      const jefe = await crearMiembro(ctx, orgF4, 'jefe', suffix, [
        'PERIOP_ADMIN',
      ]);
      const qx = await crearQuirofano(ctx, orgF4, 'QX-PUERTO');
      await ligarRecurso(ctx, orgF4, qx.id, 'Recurso QX-PUERTO');
      const dia = '2026-10-20';
      const lp = (fecha: string, hhmm: string) => `${fecha}T${hhmm}:00-04:00`;

      const creado = await httpF4(ctx)
        .post('/procedure-cases')
        .set(como(jefe))
        .send({
          custodianTenantId: orgF4.tenantId,
          patientProfileId: ctx.patientSubtypeId,
          caseType: 'ELECTIVE',
          priority: 'ROUTINE',
          primarySurgeonProfileId: medico.hpid,
          surgicalSpecialtyConceptId: CONCEPTS.TEAM_ROLE_SURGEON,
          operatingRoomId: qx.id,
          scheduledStartAt: lp('2030-11-04', '08:00'),
          scheduledEndAt: lp('2030-11-04', '10:00'),
        })
        .expect(201);
      const casoId = creado.body.id;
      await filas(
        ctx,
        `update procedures_perioperative.procedure_cases
            set scheduled_start_at = ?, scheduled_end_at = ? where id = ?`,
        [lp(dia, '08:00'), lp(dia, '10:00'), casoId],
      );

      const evento = (eventCode: string, hhmm: string) =>
        httpF4(ctx)
          .post(`/procedure-cases/${casoId}/room-events`)
          .set(como(jefe))
          .send({ eventCode, occurredAt: lp(dia, hhmm) });
      const fase = async (checklistId: string, phase: string) => {
        const lista = (
          await httpF4(ctx)
            .get(`/procedure-cases/${casoId}/safety-checklists/${checklistId}`)
            .set(como(jefe))
            .expect(200)
        ).body;
        const items = lista.phases
          .find((p: any) => p.phase === phase)
          .items.filter((i: any) => !i.response);
        await httpF4(ctx)
          .post(
            `/procedure-cases/${casoId}/safety-checklists/${checklistId}/responses`,
          )
          .set(como(jefe))
          .send({
            phase,
            respondedByProfileId: medico.hpid,
            responses: items.map((i: any) => ({
              itemId: i.id,
              status: 'CONFIRMED',
            })),
          })
          .expect(201);
      };

      await evento('PATIENT_IN_ROOM', '08:10').expect(201);
      const checklist = await httpF4(ctx)
        .post(`/procedure-cases/${casoId}/safety-checklists`)
        .set(como(jefe))
        .send({ coordinatorProfileId: medico.hpid })
        .expect(201);
      await fase(checklist.body.id, 'SIGN_IN');
      await evento('ANESTHESIA_START', '08:20').expect(201);
      await fase(checklist.body.id, 'TIME_OUT');
      await evento('INCISION', '08:40').expect(201);
      await evento('CLOSURE', '09:40').expect(201);
      await fase(checklist.body.id, 'SIGN_OUT');
      expect(await ordersOf(qx.id)).toHaveLength(0);

      const salida = await evento('PATIENT_OUT_OF_ROOM', '10:10').expect(201);
      const orders = await ordersOf(qx.id);
      expect(orders).toHaveLength(1);
      expect(salida.body.cleaningOrderId).toBe(orders[0].id);
      expect(orders[0]).toMatchObject({
        status: 'practice:CLN_PENDING',
        trigger: 'practice:CLN_TRG_OR_TURNOVER',
        type: 'practice:CLEAN_OR_TURNOVER',
        source_ref_id: casoId,
      });
      expect((await hygieneOf(qx.id)).code).toBe('HYG_DIRTY');
      expect(
        await outbox('practice.cleaning_order.created', orders[0].id),
      ).toHaveLength(1);
      // la orden es del tenant de la sala, no de otro
      const [tenant] = await sql(
        'select tenant_id from practice.cleaning_orders where id = ?',
        [orders[0].id],
      );
      expect(tenant.tenant_id).toBe(orgF4.tenantId);
    });
  });
});
