import { randomUUID } from 'node:crypto';
import { bootstrapTestApp, type TestContext } from './harness';
import { CONCEPTS } from '../../src/common';
import { CARE_SPACE_OPS_PORT } from '../../src/modules/procedures_perioperative/ports/care-space-ops.port';
import {
  como,
  crearMiembro,
  crearQuirofano,
  darMembresia,
  filas,
  http as httpFor,
  ligarRecurso,
  mkOrg,
  registrarOrg,
  registrarProfesional,
} from './infra-f4.fixtures';

/**
 * F4 · el día de un quirófano de punta a punta, por HTTP y contra la base real (api_f4):
 *
 *   bloque → reservar caso → check-list OMS en tres fases con sus compuertas → hechos de
 *   sala → cierre del caso (reporte firmado) → utilización, con recarga desde la base en
 *   cada paso que cambia algo.
 *
 * El único doble es el puerto de operación de espacios de F2 (`CARE_SPACE_OPS_PORT`), que
 * no existe en esta rama: registra las llamadas y devuelve una orden de limpieza conocida.
 * Todo lo demás —API, base, outbox, historia— es el real.
 *
 * Fixture etiquetada: la firma electrónica (`chart.clinical_note_signatures`) pertenece al
 * módulo clínico, ajeno a F4; se inserta por SQL con las FK relajadas sólo para esa fila.
 */
describe('Infraestructura F4 · flujo completo del quirófano', () => {
  let ctx: TestContext;
  const http = () => httpFor(ctx);
  const sufijo = randomUUID().slice(0, 8);
  const orgA = mkOrg('A', sufijo);
  const ordenLimpieza = randomUUID();
  const llamadasAlPuerto: { careSpaceId: string; source: any }[] = [];
  const puertoDoble = {
    assertBookable: async () => undefined,
    markDirtyFromSource: async (
      _tx: unknown,
      careSpaceId: string,
      source: any,
    ) => {
      llamadasAlPuerto.push({ careSpaceId, source });
      return { cleaningOrderId: ordenLimpieza };
    },
  };

  let jefe: { token: string; tenantId: string; userId: string };
  let cirujano: string;
  let paciente: string;
  let qx: any;

  const TRAUMA = CONCEPTS.TEAM_ROLE_SURGEON;
  /** Hora local de La Paz (UTC−4). */
  const lp = (fecha: string, hhmm: string) => `${fecha}T${hhmm}:00-04:00`;
  /** El día de la operación: ya pasó, para que los hechos de sala puedan registrarse. */
  const DIA = '2026-10-20';

  beforeAll(async () => {
    ctx = await bootstrapTestApp({
      overrideProviders: [{ token: CARE_SPACE_OPS_PORT, value: puertoDoble }],
    });
    paciente = ctx.patientSubtypeId;
    await registrarOrg(ctx, orgA, 'A', sufijo);
    const medico = await registrarProfesional(ctx, 'cirujano', sufijo);
    await darMembresia(ctx, medico.userId, orgA.tenantId);
    cirujano = medico.hpid;
    jefe = await crearMiembro(ctx, orgA, 'jefe', sufijo, ['PERIOP_ADMIN']);
    qx = await crearQuirofano(ctx, orgA, 'QX-FLUJO');
    await ligarRecurso(ctx, orgA, qx.id, 'Recurso QX-FLUJO');
  }, 240000);

  afterAll(async () => {
    await ctx.app.close();
  });

  const caso = (over: Record<string, unknown>) =>
    http()
      .post('/procedure-cases')
      .set(como(jefe))
      .send({
        custodianTenantId: orgA.tenantId,
        patientProfileId: paciente,
        caseType: 'ELECTIVE',
        priority: 'ROUTINE',
        primarySurgeonProfileId: cirujano,
        surgicalSpecialtyConceptId: TRAUMA,
        operatingRoomId: qx.id,
        ...over,
      });

  const evento = (casoId: string, eventCode: string, hhmm: string) =>
    http()
      .post(`/procedure-cases/${casoId}/room-events`)
      .set(como(jefe))
      .send({ eventCode, occurredAt: lp(DIA, hhmm) });

  const leerChecklist = async (casoId: string, checklistId: string) =>
    (
      await http()
        .get(`/procedure-cases/${casoId}/safety-checklists/${checklistId}`)
        .set(como(jefe))
        .expect(200)
    ).body;

  /** Responde todos los ítems de una fase como «confirmado». */
  const completarFase = async (
    casoId: string,
    checklistId: string,
    phase: string,
  ) => {
    const lista = await leerChecklist(casoId, checklistId);
    // Sólo los ítems que aún no tienen respuesta (una por ítem).
    const items = lista.phases
      .find((p: any) => p.phase === phase)
      .items.filter((i: any) => !i.response);
    return http()
      .post(
        `/procedure-cases/${casoId}/safety-checklists/${checklistId}/responses`,
      )
      .set(como(jefe))
      .send({
        phase,
        respondedByProfileId: cirujano,
        responses: items.map((i: any) => ({
          itemId: i.id,
          status: 'CONFIRMED',
        })),
      });
  };

  let bloqueId: string;
  let casoId: string;
  let checklistId: string;

  it('1 · el bloque del servicio y el caso reservado dentro de él (con prep y limpieza)', async () => {
    const b = await http()
      .post(`/sites/${orgA.siteId}/or-blocks`)
      .set(como(jefe))
      .send({
        operatingRoomId: qx.id,
        ownerKind: 'SERVICE',
        surgicalSpecialtyConceptId: TRAUMA,
        startsAt: lp('2030-11-04', '08:00'),
        endsAt: lp('2030-11-04', '14:00'),
      })
      .expect(201);
    bloqueId = b.body.blocks[0].id;

    const c = await caso({
      scheduledStartAt: lp('2030-11-04', '08:00'),
      scheduledEndAt: lp('2030-11-04', '10:00'),
    }).expect(201);
    casoId = c.body.id;
    expect(c.body.operatingRoomBlockId).toBe(bloqueId);

    // Recarga desde la base: el caso quedó ligado al bloque y con su ventana reservada.
    const [fila] = await filas(
      ctx,
      `select operating_room_block_id, reserved_start_at, reserved_end_at
         from procedures_perioperative.procedure_cases where id = ?`,
      [casoId],
    );
    expect(fila.operating_room_block_id).toBe(bloqueId);
    expect(new Date(fila.reserved_start_at).getTime()).toBeLessThanOrEqual(
      new Date(lp('2030-11-04', '08:00')).getTime(),
    );
    expect(new Date(fila.reserved_end_at).getTime()).toBeGreaterThanOrEqual(
      new Date(lp('2030-11-04', '10:00')).getTime(),
    );
  });

  it('2 · el día de la operación: se mueven bloque y caso al pasado (fixture) y se recargan', async () => {
    await filas(
      ctx,
      `update procedures_perioperative.operating_room_blocks
          set starts_at = ?::timestamptz, ends_at = ?::timestamptz,
              release_at = ?::timestamptz - interval '72 hours'
        where id = ?`,
      [lp(DIA, '08:00'), lp(DIA, '14:00'), lp(DIA, '08:00'), bloqueId],
    );
    await filas(
      ctx,
      `update procedures_perioperative.procedure_cases
          set scheduled_start_at = ?, scheduled_end_at = ? where id = ?`,
      [lp(DIA, '08:00'), lp(DIA, '10:00'), casoId],
    );
    const leido = await http()
      .get(`/procedure-cases/${casoId}`)
      .set(como(jefe))
      .expect(200);
    expect(new Date(leido.body.case.scheduledStartAt).getTime()).toBe(
      new Date(lp(DIA, '08:00')).getTime(),
    );
    // El trigger recalculó la ventana reservada con el cambio de horario.
    expect(
      new Date(leido.body.case.reservedStartAt).getTime(),
    ).toBeLessThanOrEqual(new Date(lp(DIA, '08:00')).getTime());
    expect(new Date(leido.body.case.reservedEndAt).getTime()).toBeLessThan(
      new Date(lp('2026-10-21', '00:00')).getTime(),
    );
  });

  it('3 · compuertas de sala: orden, futuro, y cada fase del check-list exigida por su hecho', async () => {
    // Fuera de orden: la anestesia no puede ser lo primero.
    expect(
      (await evento(casoId, 'ANESTHESIA_START', '08:20').expect(422)).body
        .reason,
    ).toBe('ROOM_EVENT_OUT_OF_ORDER');
    // En el futuro.
    const futuro = await http()
      .post(`/procedure-cases/${casoId}/room-events`)
      .set(como(jefe))
      .send({
        eventCode: 'PATIENT_IN_ROOM',
        occurredAt: lp('2031-01-01', '08:00'),
      })
      .expect(422);
    expect(futuro.body.reason).toBe('OCCURRED_AT_IN_FUTURE');

    // La entrada del paciente no pide check-list.
    const entrada = await evento(casoId, 'PATIENT_IN_ROOM', '08:10').expect(
      201,
    );
    expect(entrada.body.utilizationEventId).toBeTruthy();
    expect(
      (await evento(casoId, 'PATIENT_IN_ROOM', '08:11').expect(409)).body
        .reason,
    ).toBe('ROOM_EVENT_ALREADY_RECORDED');

    // Sin check-list, la anestesia no empieza.
    expect(
      (await evento(casoId, 'ANESTHESIA_START', '08:20').expect(422)).body
        .reason,
    ).toBe('CHECKLIST_SIGN_IN_REQUIRED');

    const creado = await http()
      .post(`/procedure-cases/${casoId}/safety-checklists`)
      .set(como(jefe))
      .send({ coordinatorProfileId: cirujano })
      .expect(201);
    checklistId = creado.body.id;
    // Idempotente: un segundo alta devuelve el mismo check-list.
    const otra = await http()
      .post(`/procedure-cases/${casoId}/safety-checklists`)
      .set(como(jefe))
      .send({ coordinatorProfileId: cirujano })
      .expect(200);
    expect(otra.body.id).toBe(checklistId);

    // La base impone el orden de las fases y la API lo dice con un motivo claro.
    const sinFase = await completarFase(casoId, checklistId, 'TIME_OUT');
    expect(sinFase.status).toBe(422);
    expect(sinFase.body.reason).toBe('CHECKLIST_PHASE_OUT_OF_ORDER');

    // Una respuesta parcial no completa la fase: la anestesia sigue bloqueada.
    const lista = await leerChecklist(casoId, checklistId);
    const primerItem = lista.phases[0].items[0];
    await http()
      .post(
        `/procedure-cases/${casoId}/safety-checklists/${checklistId}/responses`,
      )
      .set(como(jefe))
      .send({
        phase: 'SIGN_IN',
        respondedByProfileId: cirujano,
        responses: [{ itemId: primerItem.id, status: 'CONFIRMED' }],
      })
      .expect(201);
    expect(
      (await leerChecklist(casoId, checklistId)).phases[0].completedAt,
    ).toBeNull();
    expect(
      (await evento(casoId, 'ANESTHESIA_START', '08:20').expect(422)).body
        .reason,
    ).toBe('CHECKLIST_SIGN_IN_REQUIRED');

    // Entrada completa → la anestesia empieza; la incisión pide la Pausa.
    await completarFase(casoId, checklistId, 'SIGN_IN').then((r) =>
      expect(r.status).toBe(201),
    );
    await evento(casoId, 'ANESTHESIA_START', '08:20').expect(201);
    expect(
      (await evento(casoId, 'INCISION', '08:40').expect(422)).body.reason,
    ).toBe('CHECKLIST_TIME_OUT_REQUIRED');
    await completarFase(casoId, checklistId, 'TIME_OUT').then((r) =>
      expect(r.status).toBe(201),
    );
    await evento(casoId, 'INCISION', '08:40').expect(201);
    await evento(casoId, 'CLOSURE', '09:40').expect(201);

    // La salida del paciente pide la Salida del check-list.
    expect(
      (await evento(casoId, 'PATIENT_OUT_OF_ROOM', '10:10').expect(422)).body
        .reason,
    ).toBe('CHECKLIST_SIGN_OUT_REQUIRED');
    expect(llamadasAlPuerto).toHaveLength(0);
    await completarFase(casoId, checklistId, 'SIGN_OUT').then((r) =>
      expect(r.status).toBe(201),
    );
    const salida = await evento(casoId, 'PATIENT_OUT_OF_ROOM', '10:10').expect(
      201,
    );
    // El quirófano queda sucio: la orden de limpieza la devuelve el puerto (F2).
    expect(salida.body.cleaningOrderId).toBe(ordenLimpieza);
    expect(llamadasAlPuerto).toHaveLength(1);
    expect(llamadasAlPuerto[0]).toMatchObject({
      careSpaceId: qx.id,
      source: { trigger: 'OR_TURNOVER', sourceRefId: casoId, terminal: false },
    });
  });

  it('4 · recarga: el check-list quedó completo y los cinco hechos persistidos, en orden', async () => {
    const lista = await leerChecklist(casoId, checklistId);
    expect(lista.phases.map((p: any) => p.phase)).toEqual([
      'SIGN_IN',
      'TIME_OUT',
      'SIGN_OUT',
    ]);
    for (const fase of lista.phases) {
      expect(fase.completedAt).not.toBeNull();
      expect(fase.items.length).toBeGreaterThan(0);
      expect(
        fase.items.every((i: any) => i.response?.status === 'CONFIRMED'),
      ).toBe(true);
    }
    expect(lista.phases.map((p: any) => p.items.length)).toEqual([7, 7, 5]);
    expect(lista.statusConceptId).toBe(CONCEPTS.CHECKLIST_COMPLETED);

    const filasEv = await filas(
      ctx,
      `select e.occurred_at
         from procedures_perioperative.operating_room_utilization_events e
        where e.procedure_case_id = ? and e.operating_room_block_id = ?
          and e.event_type_concept_id <> ?
        order by e.occurred_at`,
      [casoId, bloqueId, CONCEPTS.OR_EVENT_RESERVED],
    );
    // Además de los cinco hechos, el alta del caso dejó su evento de reserva (con el bloque).
    const [{ reservas }] = await filas(
      ctx,
      `select count(*)::int as reservas
         from procedures_perioperative.operating_room_utilization_events
        where procedure_case_id = ? and operating_room_block_id = ? and event_type_concept_id = ?`,
      [casoId, bloqueId, CONCEPTS.OR_EVENT_RESERVED],
    );
    expect(reservas).toBe(1);
    expect(filasEv.map((f) => new Date(f.occurred_at).toISOString())).toEqual(
      ['08:10', '08:20', '08:40', '09:40', '10:10'].map((h) =>
        new Date(lp(DIA, h)).toISOString(),
      ),
    );

    // Cada hecho dejó su evento en el outbox, en la misma transacción.
    const [{ n }] = await filas(
      ctx,
      `select count(*)::int as n from messaging.domain_events
        where event_type = 'periop.case.room_event_recorded' and aggregate_id = ?`,
      [casoId],
    );
    expect(n).toBe(5);
    const [{ m }] = await filas(
      ctx,
      `select count(*)::int as m from messaging.domain_events
        where event_type = 'periop.checklist.phase_completed' and aggregate_id = ?`,
      [checklistId],
    );
    expect(m).toBe(3);
  });

  it('5 · cierre: el reporte no se firma sin la Salida; con las tres fases el caso queda COMPLETADO', async () => {
    // Un segundo caso, sin Salida: firmar su reporte se rechaza y no cambia el estado.
    const dos = await caso({
      operatingRoomId: qx.id,
      surgicalSpecialtyConceptId: undefined,
      caseType: 'URGENT',
      urgencyReasonText: 'Prueba de compuerta de cierre',
      scheduledStartAt: lp('2030-11-05', '08:00'),
      scheduledEndAt: lp('2030-11-05', '09:00'),
    }).expect(201);
    const borrador = (id: string) =>
      http()
        .post(`/procedure-cases/${id}/operative-reports`)
        .set(como(jefe))
        .send({
          procedureCodeConceptId: CONCEPTS.STATE_ACTIVE,
          authorProfileId: cirujano,
          procedureDescription: 'Procedimiento de prueba',
          disposition: 'PACU',
        });
    const rep2 = await borrador(dos.body.id);
    expect(rep2.status).toBe(201);
    const firma = await firmaFixture();
    const sinSalida = await http()
      .post(
        `/procedure-cases/${dos.body.id}/operative-reports/${rep2.body.id}/sign`,
      )
      .set(como(jefe))
      .send({ signatureId: firma });
    expect(sinSalida.status).toBe(422);
    expect(sinSalida.body.reason).toBe('CHECKLIST_SIGN_OUT_REQUIRED');
    const [estado2] = await filas(
      ctx,
      'select status_concept_id from procedures_perioperative.procedure_cases where id = ?',
      [dos.body.id],
    );
    expect(estado2.status_concept_id).not.toBe(CONCEPTS.CASE_COMPLETED);

    // El caso del día, con las tres fases completas, sí se cierra.
    const rep = await borrador(casoId);
    expect(rep.status).toBe(201);
    const firmado = await http()
      .post(`/procedure-cases/${casoId}/operative-reports/${rep.body.id}/sign`)
      .set(como(jefe))
      .send({ signatureId: await firmaFixture() });
    expect(firmado.status).toBe(200);
    expect(firmado.body.caseStatusConceptId).toBe(CONCEPTS.CASE_COMPLETED);

    // Recarga: persistido, y ya no admite hechos de sala.
    const leido = await http()
      .get(`/procedure-cases/${casoId}`)
      .set(como(jefe))
      .expect(200);
    expect(leido.body.case.statusConceptId).toBe(CONCEPTS.CASE_COMPLETED);
    const [fila] = await filas(
      ctx,
      'select status_concept_id from procedures_perioperative.procedure_cases where id = ?',
      [casoId],
    );
    expect(fila.status_concept_id).toBe(CONCEPTS.CASE_COMPLETED);
    expect(
      (await evento(casoId, 'CLOSURE', '10:30').expect(422)).body.reason,
    ).toBe('CASE_NOT_ACTIVE_FOR_ROOM_EVENTS');
  });

  it('6 · utilización: el fixture conocido da los minutos y el porcentaje exactos, por sala y por bloque', async () => {
    // Sesión 08:00–14:00 = 360 min; con paciente anestesiado 08:20–10:10 = 110 min.
    const porSala = await http()
      .get(`/sites/${orgA.siteId}/or-utilization`)
      .query({ from: DIA, to: DIA, operatingRoomId: qx.id, groupBy: 'room' })
      .set(como(jefe))
      .expect(200);
    expect(porSala.body.items).toHaveLength(1);
    expect(porSala.body.items[0]).toMatchObject({
      operatingRoomId: qx.id,
      date: DIA,
      sessionMinutes: 360,
      touchMinutes: 110,
      roomUtilizationPct: 30.56,
      casesCount: 1,
      turnoverMinutesP50: null,
      // Entró a las 08:10 y estaba agendado a las 08:00 (tolerancia 0): no fue puntual.
      firstCaseOnTimePct: 0,
    });

    const porBloque = await http()
      .get(`/sites/${orgA.siteId}/or-utilization`)
      .query({ from: DIA, to: DIA, operatingRoomId: qx.id, groupBy: 'block' })
      .set(como(jefe))
      .expect(200);
    const fila = porBloque.body.items.find((i: any) => i.blockId === bloqueId);
    expect(fila).toBeDefined();
    expect(fila.allocatedMinutes).toBe(360);
  });

  it('7 · inducción: exige plan aprobado y la Entrada del check-list; con ambas el caso pasa a EN CURSO', async () => {
    const c = await caso({
      surgicalSpecialtyConceptId: undefined,
      caseType: 'URGENT',
      urgencyReasonText: 'Prueba de la compuerta de inducción',
      scheduledStartAt: lp('2030-11-06', '08:00'),
      scheduledEndAt: lp('2030-11-06', '09:00'),
    }).expect(201);
    const id = c.body.id;
    const inducir = () =>
      http()
        .post(`/procedure-cases/${id}/anesthesia-events`)
        .set(como(jefe))
        .send({
          eventType: 'INDUCTION',
          occurredAt: lp(DIA, '07:00'),
          performedByProfileId: cirujano,
        });

    expect((await inducir().expect(422)).body.reason).toBe(
      'INDUCTION_REQUIRES_APPROVED_ANESTHESIA_PLAN',
    );
    const plan = await http()
      .post(`/procedure-cases/${id}/anesthesia-plans`)
      .set(como(jefe))
      .send({
        anesthesiologistProfileId: cirujano,
        anesthesiaType: 'GENERAL',
        airwayAssessment: {
          assessedByProfileId: cirujano,
          difficultAirwayExpected: false,
        },
      })
      .expect(201);
    await http()
      .post(`/procedure-cases/${id}/anesthesia-plans/${plan.body.id}/approve`)
      .set(como(jefe))
      .send({})
      .expect((r) => expect([200, 201]).toContain(r.status));
    // Plan aprobado pero sin Entrada: la compuerta del check-list.
    expect((await inducir().expect(422)).body.reason).toBe(
      'CHECKLIST_SIGN_IN_REQUIRED',
    );

    const cl = await http()
      .post(`/procedure-cases/${id}/safety-checklists`)
      .set(como(jefe))
      .send({ coordinatorProfileId: cirujano })
      .expect(201);
    expect((await completarFase(id, cl.body.id, 'SIGN_IN')).status).toBe(201);
    await inducir().expect(201);

    const [fila] = await filas(
      ctx,
      'select status_concept_id, actual_start_at from procedures_perioperative.procedure_cases where id = ?',
      [id],
    );
    expect(fila.status_concept_id).toBe(CONCEPTS.SURGICAL_CASE_IN_PROGRESS);
    expect(fila.actual_start_at).not.toBeNull();
  });

  /** Inserta la firma electrónica que el cierre del reporte referencia (ver cabecera). */
  async function firmaFixture(): Promise<string> {
    const id = randomUUID();
    await ctx.orm.em.fork().transactional(async (tx) => {
      await tx.execute('set local session_replication_role = replica');
      await tx.execute(
        `insert into chart.clinical_note_signatures
           (id, clinical_note_version_id, signer_profile_id, signature_type_concept_id, signed_at)
         values (?, ?, ?, ?, now())`,
        [id, randomUUID(), cirujano, CONCEPTS.STATE_ACTIVE],
      );
    });
    return id;
  }
});
