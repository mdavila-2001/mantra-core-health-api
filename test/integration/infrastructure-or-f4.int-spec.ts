import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  camposObligatoriosDePaciente,
  type TestContext,
} from './harness';
import { CONCEPTS } from '../../src/common';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import { PERIOP } from '../../src/modules/procedures_perioperative/procedures_perioperative.concepts';
import {
  PASSWORD,
  como,
  crearPersonal,
  registrarOrganizacion,
  registrarPaciente,
  sql,
  type InfraOrg,
  type InfraStaff,
} from './infrastructure-fixture';

/**
 * F4 · quirófanos contra la base real (CONTRATO-F2-F5 §F4.5): recurso R0 con
 * FK real, ventana reservada calculada por el trigger, solape rechazado,
 * check-list OMS bloqueante, bloques y 404 entre tenants.
 */
describe('Infraestructura F4 · quirófanos', () => {
  let ctx: TestContext;
  let q: ReturnType<typeof sql>;
  const http = () => request(ctx.app.getHttpServer());
  const tag = randomUUID().slice(0, 6);
  let orgA: InfraOrg;
  let orgB: InfraOrg;
  let manager: InfraStaff;
  let patientId: string;
  let surgeonId: string;
  let orId: string;
  const day = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);
  const at = (hhmm: string) => `${day}T${hhmm}:00.000Z`;
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    q = sql(ctx);
    orgA = await registrarOrganizacion(ctx, `F4A-${tag}`);
    orgB = await registrarOrganizacion(ctx, `F4B-${tag}`);
    const building = await http()
      .post(`/sites/${orgA.siteId}/care-spaces`)
      .set(como(orgA))
      .send({
        code: `ED4-${tag}`,
        name: 'Edificio',
        formCode: 'LOC_FORM_BUILDING',
        functionCode: 'SPACE_FN_BUILDING_GENERIC',
        activate: true,
      })
      .expect(201);
    const or = await http()
      .post(`/sites/${orgA.siteId}/care-spaces`)
      .set(como(orgA))
      .send({
        code: `QX-${tag}`,
        name: 'Quirófano 1',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_OPERATING_ROOM',
        parentSpaceId: building.body.id,
        activate: true,
        areaM2: 40,
        prepMinutes: 15,
        cleanupMinutes: 20,
        pressureCode: 'PRESSURE_POSITIVE',
        airChangesPerHour: 20,
        hvacValidatedOn: new Date().toISOString().slice(0, 10),
      });
    expect(or.status).toBe(201);
    orId = or.body.id;
    manager = await crearPersonal(
      ctx,
      orgA,
      `F4M-${tag}`,
      DELEG.ASSIGN_ROLE_OR_MANAGER,
      { site: orgA.siteId },
    );
    // Jefe de quirófano con rol de plataforma para las rutas de periop con @Roles
    // de negocio (SURGERY_SCHEDULER/PERIOP_NURSE): el guard deja pasar a SUPERADMIN.
    await q(
      `insert into iam.user_global_roles (id, user_id, role_concept_id, state_concept_id, created_at, updated_at)
       values (gen_random_uuid(), ?, ?, ?, now(), now())`,
      [manager.userId, CONCEPTS.ROLE_SUPERADMIN, CONCEPTS.STATE_ACTIVE],
    );
    const login = await http()
      .post('/iam/auth/login')
      .send({ email: `f4m-${tag}@example.test`, password: PASSWORD })
      .expect(200);
    manager.token = login.body.accessToken;
    const campos = (await camposObligatoriosDePaciente(
      ctx,
    )) as unknown as Record<string, unknown>;
    patientId = (await registrarPaciente(ctx, orgA, `P4${tag}`, campos))
      .patientProfileId;
    const [surgeon] = await q<{ profile_id: string }>(
      'select profile_id from profiles.health_practitioner_profiles limit 1',
    );
    surgeonId = surgeon.profile_id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const schedule = (
    who: { token: string; tenantId: string },
    start: string,
    end: string,
    extra: Record<string, unknown> = {},
  ) =>
    http()
      .post('/procedure-cases')
      .set(como(who))
      .send({
        custodianTenantId: who.tenantId,
        patientProfileId: patientId,
        caseType: 'ELECTIVE',
        priority: 'ROUTINE',
        primarySurgeonProfileId: surgeonId,
        practiceSiteId: orgA.siteId,
        operatingRoomId: orId,
        scheduledStartAt: start,
        scheduledEndAt: end,
        ...extra,
      });

  it('sin recurso agendable el quirófano no se programa (422)', async () => {
    const res = await schedule(manager, at('08:00'), at('10:00'));
    expect(res.status).toBe(422);
    expect(res.body.reason).toBe('OPERATING_ROOM_WITHOUT_RESOURCE');
  });

  it('R0: recurso de care_spaces con FK real care_space_id', async () => {
    const res = await http()
      .post('/scheduling/resources')
      .set(bearer(ctx.adminToken))
      .send({
        tenantId: orgA.tenantId,
        resourceType: 'ROOM',
        resourceRefType: 'care_spaces',
        resourceRefId: orId,
        name: 'Quirófano 1',
      })
      .expect(201);
    const [row] = await q(
      'select care_space_id, resource_ref_type from scheduling.schedulable_resources where id = ?',
      [res.body.id],
    );
    expect(row).toEqual({
      care_space_id: orId,
      resource_ref_type: 'care_spaces',
    });
    const dup = await http()
      .post('/scheduling/resources')
      .set(bearer(ctx.adminToken))
      .send({
        tenantId: orgA.tenantId,
        resourceType: 'ROOM',
        resourceRefType: 'care_spaces',
        resourceRefId: orId,
        name: 'Otro',
      })
      .expect(409);
    expect(dup.body.reason).toBe('RESOURCE_ALREADY_EXISTS_FOR_SPACE');
    const ev = await q(
      'select count(*)::int as n from messaging.domain_events where event_type = ? and aggregate_id = ?',
      ['scheduling.resource.linked_to_space', res.body.id],
    );
    expect(ev[0].n).toBe(1);
  });

  it('ventana reservada por el trigger (prep 15 / limpieza 20); solape de B a las 10:10 → 409; a las 10:35 → 201', async () => {
    const a = await schedule(manager, at('08:00'), at('10:00'));
    expect(a.status).toBe(201);
    ids.caseA = a.body.id;
    const [row] = await q(
      'select reserved_start_at, reserved_end_at, schedulable_resource_id, prep_minutes, cleanup_minutes from procedures_perioperative.procedure_cases where id = ?',
      [ids.caseA],
    );
    expect(new Date(row.reserved_start_at).toISOString()).toBe(at('07:45'));
    expect(new Date(row.reserved_end_at).toISOString()).toBe(at('10:20'));
    expect(row.schedulable_resource_id).toEqual(expect.any(String));
    const b = await schedule(manager, at('10:10'), at('11:00')).expect(409);
    expect(b.body.reason).toBe('OPERATING_ROOM_SLOT_CONFLICT');
    expect(b.body.details).toMatchObject({
      conflictingCaseId: ids.caseA,
      reservedEndAt: at('10:20'),
    });
    const ok = await schedule(manager, at('10:35'), at('11:30'));
    expect(ok.status).toBe(201);
    ids.caseB = ok.body.id;
    // La base es la red: un UPDATE directo que pisa la ventana de A → 23P01.
    await expect(
      q(
        'update procedures_perioperative.procedure_cases set scheduled_start_at = ? where id = ?',
        [at('09:30'), ids.caseB],
      ),
    ).rejects.toMatchObject({ code: '23P01' });
  });

  it('otro tenant programa en el quirófano de A → 404 y no crea nada', async () => {
    const before = await q(
      'select count(*)::int as n from procedures_perioperative.procedure_cases where operating_room_id = ?',
      [orId],
    );
    const res = await schedule(orgB, at('14:00'), at('15:00'));
    expect([403, 404]).toContain(res.status);
    const after = await q(
      'select count(*)::int as n from procedures_perioperative.procedure_cases where operating_room_id = ?',
      [orId],
    );
    expect(after[0].n).toBe(before[0].n);
  });

  it('check-list OMS: creación idempotente y fases bloqueantes en los eventos de sala', async () => {
    const created = await http()
      .post(`/procedure-cases/${ids.caseA}/safety-checklists`)
      .set(como(manager))
      .expect(201);
    const again = await http()
      .post(`/procedure-cases/${ids.caseA}/safety-checklists`)
      .set(como(manager))
      .expect(200);
    expect(again.body.id).toBe(created.body.id);
    expect(created.body.phases.map((p: any) => p.items.length)).toEqual([
      7, 7, 5,
    ]);
    const outOfOrder = await http()
      .post(`/procedure-cases/${ids.caseA}/room-events`)
      .set(como(manager))
      .send({ eventCode: 'ANESTHESIA_START' })
      .expect(422);
    expect(outOfOrder.body.reason).toBe('ROOM_EVENT_OUT_OF_ORDER');
    await http()
      .post(`/procedure-cases/${ids.caseA}/room-events`)
      .set(como(manager))
      .send({ eventCode: 'PATIENT_IN_ROOM' })
      .expect(201);
    const sinEntrada = await http()
      .post(`/procedure-cases/${ids.caseA}/room-events`)
      .set(como(manager))
      .send({ eventCode: 'ANESTHESIA_START' })
      .expect(422);
    expect(sinEntrada.body.reason).toBe('CHECKLIST_SIGN_IN_REQUIRED');
    const dup = await http()
      .post(`/procedure-cases/${ids.caseA}/room-events`)
      .set(como(manager))
      .send({ eventCode: 'PATIENT_IN_ROOM' })
      .expect(409);
    expect(dup.body.reason).toBe('ROOM_EVENT_ALREADY_RECORDED');
    const evs = await q(
      'select tenant_id, event_type_concept_id from procedures_perioperative.operating_room_utilization_events where procedure_case_id = ? and event_type_concept_id = ?',
      [ids.caseA, PERIOP.OR_EVENT_PATIENT_IN_ROOM],
    );
    expect(evs).toEqual([
      {
        tenant_id: orgA.tenantId,
        event_type_concept_id: PERIOP.OR_EVENT_PATIENT_IN_ROOM,
      },
    ]);
  });

  it('bloque de un servicio: un caso electivo de otro servicio dentro → 409; liberar → RELEASED', async () => {
    const blk = await http()
      .post(`/sites/${orgA.siteId}/or-blocks`)
      .set(como(manager))
      .send({
        operatingRoomId: orId,
        ownerKind: 'SERVICE',
        specialtyConceptId:
          CONCEPTS.STATE_ACTIVE /* concepto real cualquiera: otro servicio que el del caso */,
        startsAt: at('13:00'),
        endsAt: at('17:00'),
      })
      .expect(201);
    const blockId = blk.body.blocks[0].id;
    const [row] = await q(
      'select tenant_id, status_concept_id from procedures_perioperative.operating_room_blocks where id = ?',
      [blockId],
    );
    expect(row).toEqual({
      tenant_id: orgA.tenantId,
      status_concept_id: PERIOP.ORB_ACTIVE,
    });
    const res = await schedule(manager, at('13:30'), at('14:30')).expect(409);
    expect(res.body.reason).toBe('OR_BLOCK_OWNED_BY_OTHER');
    const rel = await http()
      .post(`/or-blocks/${blockId}/release`)
      .set(como(manager))
      .send({ reasonText: 'Sin casos' })
      .expect(200);
    expect(rel.body.status).toBe('ORB_RELEASED');
    await schedule(manager, at('13:30'), at('14:30')).expect(201);
    await http()
      .post(`/or-blocks/${blockId}/release`)
      .set(como(orgB))
      .send({})
      .expect(404);
  });

  it('alcance: Jefe QX de un solo quirófano no ve ni filtra por otro (404); listas acotadas', async () => {
    const building2 = await q<{ parent_space_id: string }>(
      'select parent_space_id from practice.care_spaces where id = ?',
      [orId],
    );
    const or2 = await http()
      .post(`/sites/${orgA.siteId}/care-spaces`)
      .set(como(orgA))
      .send({
        code: `QX2-${tag}`,
        name: 'Quirófano 2',
        formCode: 'LOC_FORM_ROOM',
        functionCode: 'SPACE_FN_OPERATING_ROOM',
        parentSpaceId: building2[0].parent_space_id,
        activate: true,
        areaM2: 40,
        pressureCode: 'PRESSURE_POSITIVE',
        airChangesPerHour: 20,
        hvacValidatedOn: new Date().toISOString().slice(0, 10),
      })
      .expect(201);
    const solo1 = await crearPersonal(
      ctx,
      orgA,
      `F4S-${tag}`,
      DELEG.ASSIGN_ROLE_OR_MANAGER,
      { space: orId },
    );
    await http()
      .get(`/sites/${orgA.siteId}/or-blocks?operatingRoomId=${or2.body.id}`)
      .set(como(solo1))
      .expect(404);
    await http()
      .get(
        `/sites/${orgA.siteId}/or-utilization?from=${day}&to=${day}&operatingRoomId=${or2.body.id}`,
      )
      .set(como(solo1))
      .expect(404);
    const salas = await http()
      .get(`/sites/${orgA.siteId}/operating-rooms`)
      .set(como(solo1))
      .expect(200);
    expect(salas.body.map((r: any) => r.careSpace.id)).toEqual([orId]);
    const todas = await http()
      .get(`/sites/${orgA.siteId}/operating-rooms`)
      .set(como(manager))
      .expect(200);
    expect(todas.body.map((r: any) => r.careSpace.id).sort()).toEqual(
      [orId, or2.body.id].sort(),
    );
    await http()
      .post(`/sites/${orgA.siteId}/or-blocks`)
      .set(como(solo1))
      .send({
        operatingRoomId: or2.body.id,
        ownerKind: 'SURGEON',
        surgeonProfileId: surgeonId,
        startsAt: at('18:00'),
        endsAt: at('19:00'),
      })
      .expect(403);
  });

  it('serie de bloques: días repetidos 400; fin a más de un año 422', async () => {
    await http()
      .post(`/sites/${orgA.siteId}/or-blocks`)
      .set(como(manager))
      .send({
        operatingRoomId: orId,
        ownerKind: 'SURGEON',
        surgeonProfileId: surgeonId,
        startsAt: at('19:00'),
        endsAt: at('20:00'),
        recurrence: { weekdays: [1, 1], until: day },
      })
      .expect(400);
    const lejos = new Date(Date.now() + 800 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const res = await http()
      .post(`/sites/${orgA.siteId}/or-blocks`)
      .set(como(manager))
      .send({
        operatingRoomId: orId,
        ownerKind: 'SURGEON',
        surgeonProfileId: surgeonId,
        startsAt: at('19:00'),
        endsAt: at('20:00'),
        recurrence: { weekdays: [1, 3], until: lejos },
      })
      .expect(422);
    expect(res.body.code).toBe('PRECONDITION_FAILED');
  });

  it('lecturas para la web (§F4.3): detalle con sala, reserva, check-list y eventos; lista con sala; bloque con etiqueta e If-Match; utilización con totales', async () => {
    const detail = await http()
      .get(`/procedure-cases/${ids.caseA}`)
      .set(como(manager))
      .expect(200);
    expect(detail.body.case).toMatchObject({
      operatingRoom: { id: orId, name: 'Quirófano 1' },
      prepMinutes: 15,
      cleanupMinutes: 20,
      reservedStartAt: expect.any(String),
      reservedEndAt: expect.any(String),
      caseType: expect.objectContaining({ code: expect.any(String) }),
    });
    expect(detail.body.checklist).toMatchObject({
      id: expect.any(String),
      signIn: { completedAt: null },
      timeOut: { completedAt: null },
      signOut: { completedAt: null },
    });
    expect(detail.body.roomEvents.map((e: any) => e.eventCode)).toEqual([
      'PATIENT_IN_ROOM',
    ]);
    expect(detail.body.turnoverCleaning).toBeNull();
    // Otro tenant no ve el caso.
    await http()
      .get(`/procedure-cases/${ids.caseA}`)
      .set(como(orgB))
      .expect((r) => expect([403, 404]).toContain(r.status));

    const list = await http()
      .get('/procedure-cases')
      .query({ operatingRoomId: orId })
      .set(como(manager))
      .expect(200);
    const row = list.body.items.find((c: any) => c.id === ids.caseA);
    expect(row).toMatchObject({
      operatingRoom: { id: orId },
      reservedStartAt: expect.any(String),
    });

    const blk = await http()
      .post(`/sites/${orgA.siteId}/or-blocks`)
      .set(como(manager))
      .send({
        operatingRoomId: orId,
        ownerKind: 'SURGEON',
        surgeonProfileId: surgeonId,
        startsAt: at('21:00'),
        endsAt: at('22:00'),
      })
      .expect(201);
    const block = blk.body.blocks[0];
    expect(block.owner.label).toEqual(expect.any(String));
    const blocks = await http()
      .get(`/sites/${orgA.siteId}/or-blocks`)
      .query({ operatingRoomId: orId })
      .set(como(manager))
      .expect(200);
    const listed = blocks.body.find((b: any) => b.id === block.id);
    expect(listed.owner.label).toBe(block.owner.label);
    expect(listed.cases).toEqual([]);
    const stale = await http()
      .post(`/or-blocks/${block.id}/cancel`)
      .set(como(manager))
      .set('If-Match', String(block.rowVersion + 7))
      .send({ reasonText: 'x' })
      .expect(412);
    expect(stale.body.reason).toBe('ROW_VERSION_MISMATCH');
    await http()
      .post(`/or-blocks/${block.id}/cancel`)
      .set(como(manager))
      .set('If-Match', String(block.rowVersion))
      .send({ reasonText: 'x' })
      .expect(200);

    const util = await http()
      .get(`/sites/${orgA.siteId}/or-utilization`)
      .query({ from: day, to: day })
      .set(como(manager))
      .expect(200);
    expect(util.body).toMatchObject({
      asOf: expect.any(String),
      totals: {
        sessionMinutes: expect.any(Number),
        touchMinutes: expect.any(Number),
      },
    });
    expect(util.body.totals.sessionMinutes).toBe(
      util.body.rooms.reduce((a: number, r: any) => a + r.sessionMinutes, 0),
    );
  });
});
