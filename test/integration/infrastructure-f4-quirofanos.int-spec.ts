import { randomUUID } from 'node:crypto';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { CONCEPTS } from '../../src/common';
import { deterministicId } from '../../src/common/constants/concepts';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { PERIOP } from '../../src/modules/procedures_perioperative/procedures_perioperative.concepts';
import {
  como,
  crearEspacio,
  crearMiembro,
  crearQuirofano,
  crearSede,
  filas,
  http as httpFor,
  darMembresia,
  ligarRecurso,
  mkOrg,
  registrarOrg,
  registrarProfesional,
} from './infra-f4.fixtures';

/**
 * F4 · quirófanos, contra la base real (api_f4) y por HTTP.
 *
 * Cada endpoint tiene un caso permitido y uno que falla cerrado por tenant (id de otra
 * organización → 404) y por rol (403). Las reglas del contrato (F4.5) se demuestran con
 * datos persistidos y vistos por SQL, y la concurrencia con dos peticiones simultáneas.
 *
 * Sin dobles: la API, la base, el outbox y el puerto de operación de espacios de F2
 * (`CARE_SPACE_OPS_PORT`, la implementación real de `practice`) son los reales.
 */
describe('Infraestructura F4 · quirófanos', () => {
  let ctx: TestContext;
  const http = () => httpFor(ctx);
  const sufijo = randomUUID().slice(0, 8);
  const orgA = mkOrg('A', sufijo);
  const orgB = mkOrg('B', sufijo);
  let jefe: { token: string; tenantId: string; userId: string };
  let enfermera: { token: string; tenantId: string; userId: string };
  let sinRol: { token: string; tenantId: string; userId: string };
  let jefeB: { token: string; tenantId: string; userId: string };
  let cirujano: string;
  /** Un profesional de OTRA organización (la suya propia, sin vínculo con A ni con B). */
  let profesionalAjeno: string;
  let paciente: string;
  let qxB: any;

  // «Especialidades»: la FK sólo pide un concepto del catálogo; las semillas de especialidades
  // médicas no se cargan en este entorno de pruebas.
  const TRAUMA = CONCEPTS.TEAM_ROLE_SURGEON;
  const CARDIO = CONCEPTS.TEAM_ROLE_ASSISTANT;

  /** Hora local de La Paz (UTC−4, la zona por omisión de la sede) en ISO. */
  const lp = (fecha: string, hhmm: string) => `${fecha}T${hhmm}:00-04:00`;

  async function quirofano(code: string, extra: Record<string, unknown> = {}) {
    const qx = await crearQuirofano(ctx, orgA, code, extra);
    await ligarRecurso(ctx, orgA, qx.id, `Recurso ${code}`);
    return qx;
  }

  const caso = (token: typeof jefe, over: Record<string, unknown>) =>
    http()
      .post('/procedure-cases')
      .set(como(token))
      .send({
        custodianTenantId: orgA.tenantId,
        patientProfileId: paciente,
        caseType: 'ELECTIVE',
        priority: 'ROUTINE',
        primarySurgeonProfileId: cirujano,
        ...over,
      });

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    paciente = ctx.patientSubtypeId;
    await registrarOrg(ctx, orgA, 'A', sufijo);
    await registrarOrg(ctx, orgB, 'B', sufijo);
    // El cirujano es un profesional real, miembro de A y de B; el ajeno sólo de su organización.
    const medico = await registrarProfesional(ctx, 'cirujano', sufijo);
    await darMembresia(ctx, medico.userId, orgA.tenantId);
    await darMembresia(ctx, medico.userId, orgB.tenantId);
    cirujano = medico.hpid;
    profesionalAjeno = (await registrarProfesional(ctx, 'ajeno', sufijo)).hpid;
    jefe = await crearMiembro(ctx, orgA, 'jefe', sufijo, ['PERIOP_ADMIN']);
    enfermera = await crearMiembro(ctx, orgA, 'enf', sufijo, ['PERIOP_NURSE']);
    sinRol = await crearMiembro(ctx, orgA, 'sinrol', sufijo, []);
    jefeB = await crearMiembro(ctx, orgB, 'jefeb', sufijo, ['PERIOP_ADMIN']);
    qxB = await crearQuirofano(ctx, orgB, 'QX-B1');
    await ligarRecurso(ctx, orgB, qxB.id, 'Recurso QX-B1');
  }, 240000);

  afterAll(async () => {
    await ctx.app.close();
  });

  // ------------------------------------------------------------ F4.5-1 · programar
  describe('programar un caso: el quirófano es un espacio (validaciones 1 a 5)', () => {
    it('un consultorio → 422 OPERATING_ROOM_INVALID_FUNCTION y no se crea el caso', async () => {
      const cons = await crearEspacio(ctx, orgA, orgA.siteId, {
        code: 'CONS-F4',
        name: 'Consultorio',
        functionCode: 'SPACE_FN_CONSULTING_ROOM',
        activate: true,
      });
      const res = await caso(jefe, {
        operatingRoomId: cons.id,
        scheduledStartAt: lp('2030-03-04', '08:00'),
        scheduledEndAt: lp('2030-03-04', '10:00'),
      }).expect(422);
      expect(res.body.reason).toBe('OPERATING_ROOM_INVALID_FUNCTION');
      const [{ n }] = await filas(
        ctx,
        'select count(*)::int as n from procedures_perioperative.procedure_cases where operating_room_id = ?',
        [cons.id],
      );
      expect(n).toBe(0);
    });

    it('un quirófano de otra sede de la misma organización → 422 OPERATING_ROOM_SITE_MISMATCH', async () => {
      const sede2 = await crearSede(ctx, orgA, `F4-SEDE-2-${sufijo}`);
      const qx2 = await crearQuirofano(ctx, orgA, 'QX-OTRA-SEDE', {}, sede2);
      const res = await caso(jefe, {
        operatingRoomId: qx2.id,
        practiceSiteId: orgA.siteId,
        scheduledStartAt: lp('2030-03-04', '08:00'),
        scheduledEndAt: lp('2030-03-04', '10:00'),
      }).expect(422);
      expect(res.body.reason).toBe('OPERATING_ROOM_SITE_MISMATCH');
    });

    it('un quirófano de otro tenant → 404 (nunca revela que existe)', async () => {
      const res = await caso(jefe, {
        operatingRoomId: qxB.id,
        scheduledStartAt: lp('2030-03-04', '08:00'),
        scheduledEndAt: lp('2030-03-04', '10:00'),
      }).expect(404);
      expect(res.body.reason).toBe('OPERATING_ROOM_NOT_FOUND');
    });

    it('un quirófano sin recurso agendable → 422 OPERATING_ROOM_WITHOUT_RESOURCE', async () => {
      const sinRecurso = await crearQuirofano(ctx, orgA, 'QX-SIN-RECURSO');
      const res = await caso(jefe, {
        operatingRoomId: sinRecurso.id,
        scheduledStartAt: lp('2030-03-04', '08:00'),
        scheduledEndAt: lp('2030-03-04', '10:00'),
      }).expect(422);
      expect(res.body.reason).toBe('OPERATING_ROOM_WITHOUT_RESOURCE');
    });

    it('un quirófano suspendido → 422 OPERATING_ROOM_NOT_AVAILABLE', async () => {
      const qx = await quirofano('QX-SUSPENDIDO');
      const detalle = await http()
        .get(`/care-spaces/${qx.id}`)
        .set(como(orgA))
        .expect(200);
      await http()
        .post(`/care-spaces/${qx.id}/lifecycle`)
        .set(como(orgA))
        .set({ 'If-Match': `"${detalle.body.rowVersion}"` })
        .send({ action: 'suspend', reason: 'Prueba F4' })
        .expect(200);
      const res = await caso(jefe, {
        operatingRoomId: qx.id,
        scheduledStartAt: lp('2030-03-04', '08:00'),
        scheduledEndAt: lp('2030-03-04', '10:00'),
      }).expect(422);
      expect(res.body.reason).toBe('OPERATING_ROOM_NOT_AVAILABLE');
    });

    it('la sala en mantenimiento bloquea la agenda (por el puerto): 422 con el bloqueo; fuera de la ventana sí se programa', async () => {
      const qx = await quirofano('QX-MANT');
      const bloqueoId = randomUUID();
      await filas(
        ctx,
        `insert into practice.care_space_blocks
           (id, tenant_id, care_space_id, kind_concept_id, reason_concept_id, starts_at,
            expected_end_at, created_at, updated_at)
         values (?, ?, ?, ?, ?, '2030-03-05T00:00:00Z', '2030-03-05T23:59:00Z', now(), now())`,
        [
          bloqueoId,
          orgA.tenantId,
          qx.id,
          PRAC.BLOCK_MAINTENANCE,
          PRAC.BLOCK_MAINTENANCE,
        ],
      );
      const dentro = await caso(jefe, {
        operatingRoomId: qx.id,
        scheduledStartAt: lp('2030-03-05', '08:00'),
        scheduledEndAt: lp('2030-03-05', '10:00'),
      }).expect(422);
      expect(dentro.body.reason).toBe('OPERATING_ROOM_NOT_AVAILABLE');
      expect(dentro.body.details.block).toMatchObject({ id: bloqueoId });
      await caso(jefe, {
        operatingRoomId: qx.id,
        scheduledStartAt: lp('2030-03-07', '08:00'),
        scheduledEndAt: lp('2030-03-07', '10:00'),
      }).expect(201);
    });
  });

  // ------------------------------------------------------------ F4.5-2 · prep + limpieza
  describe('reserva con preparación y limpieza (INV-38)', () => {
    let qx: any;
    let casoA: any;
    beforeAll(async () => {
      qx = await quirofano('QX-VENTANA');
    });

    it('A 08:00–10:00 con prep 15 y limpieza 20 reserva 07:45–10:20 y lo persiste el trigger', async () => {
      const res = await caso(jefe, {
        operatingRoomId: qx.id,
        scheduledStartAt: lp('2030-03-11', '08:00'),
        scheduledEndAt: lp('2030-03-11', '10:00'),
      }).expect(201);
      casoA = res.body;
      expect(new Date(res.body.reservedStartAt).toISOString()).toBe(
        '2030-03-11T11:45:00.000Z',
      );
      expect(new Date(res.body.reservedEndAt).toISOString()).toBe(
        '2030-03-11T14:20:00.000Z',
      );
      const [fila] = await filas(
        ctx,
        `select reserved_start_at, reserved_end_at, prep_minutes, cleanup_minutes, schedulable_resource_id
           from procedures_perioperative.procedure_cases where id = ?`,
        [res.body.id],
      );
      expect(new Date(fila.reserved_start_at).toISOString()).toBe(
        '2030-03-11T11:45:00.000Z',
      );
      expect(new Date(fila.reserved_end_at).toISOString()).toBe(
        '2030-03-11T14:20:00.000Z',
      );
      expect(fila.prep_minutes).toBe(15);
      expect(fila.cleanup_minutes).toBe(20);
      expect(fila.schedulable_resource_id).toBe(res.body.schedulableResourceId);
    });

    it('B a las 10:10 → 409 con la ventana reservada del caso A', async () => {
      const res = await caso(jefe, {
        operatingRoomId: qx.id,
        scheduledStartAt: lp('2030-03-11', '10:10'),
        scheduledEndAt: lp('2030-03-11', '11:00'),
      }).expect(409);
      expect(res.body.reason).toBe('OPERATING_ROOM_SLOT_CONFLICT');
      expect(res.body.details.conflictingCaseId).toBe(casoA.id);
      expect(new Date(res.body.details.reservedEndAt).toISOString()).toBe(
        '2030-03-11T14:20:00.000Z',
      );
    });

    it('B a las 10:35 → 201 (su ventana empieza 10:20, justo donde termina la de A)', async () => {
      await caso(jefe, {
        operatingRoomId: qx.id,
        scheduledStartAt: lp('2030-03-11', '10:35'),
        scheduledEndAt: lp('2030-03-11', '11:30'),
      }).expect(201);
    });

    it('un INSERT SQL directo que solapa ventanas lo rechaza la base con 23P01 (la red, sin pasar por la API)', async () => {
      // Misma sala, mismo tenant: clona A con otro número y un horario que pisa su limpieza.
      await expect(
        filas(
          ctx,
          `insert into procedures_perioperative.procedure_cases
             (id, custodian_tenant_id, patient_profile_id, case_number, case_type_concept_id,
              priority_concept_id, status_concept_id, primary_surgeon_profile_id, practice_site_id,
              operating_room_id, scheduled_start_at, scheduled_end_at, prep_minutes, cleanup_minutes,
              created_at, updated_at, row_version)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '2030-03-11T14:10:00Z', '2030-03-11T14:50:00Z',
                   15, 20, now(), now(), 1)`,
          [
            randomUUID(),
            orgA.tenantId,
            paciente,
            `SQL-${sufijo}`,
            CONCEPTS.CASE_TYPE_ELECTIVE,
            CONCEPTS.CASE_PRIORITY_ROUTINE,
            CONCEPTS.CASE_SCHEDULED,
            cirujano,
            orgA.siteId,
            qx.id,
          ],
        ),
      ).rejects.toMatchObject({ code: '23P01' });
    });

    it('dos reservas simultáneas de la misma ventana: una gana (201) y la otra 409 por la base', async () => {
      const q = await quirofano('QX-CARRERA');
      const intentos = await Promise.all(
        [1, 2].map(() =>
          caso(jefe, {
            operatingRoomId: q.id,
            scheduledStartAt: lp('2030-03-12', '08:00'),
            scheduledEndAt: lp('2030-03-12', '09:00'),
          }),
        ),
      );
      expect(intentos.map((r) => r.status).sort()).toEqual([201, 409]);
      const perdedor = intentos.find((r) => r.status === 409)!;
      expect(perdedor.body.reason).toBe('OPERATING_ROOM_SLOT_CONFLICT');
      const [{ n }] = await filas(
        ctx,
        `select count(*)::int as n from procedures_perioperative.procedure_cases
          where operating_room_id = ?`,
        [q.id],
      );
      expect(n).toBe(1);
    });

    it('reprogramar mueve la ventana y revalida: a la ventana ocupada → 409; a una libre → 200 y trigger actualizado', async () => {
      const q = await quirofano('QX-REPROG');
      const a = await caso(jefe, {
        operatingRoomId: q.id,
        scheduledStartAt: lp('2030-03-13', '08:00'),
        scheduledEndAt: lp('2030-03-13', '09:00'),
      }).expect(201);
      const b = await caso(jefe, {
        operatingRoomId: q.id,
        scheduledStartAt: lp('2030-03-13', '12:00'),
        scheduledEndAt: lp('2030-03-13', '13:00'),
      }).expect(201);
      const choque = await http()
        .patch(`/procedure-cases/${b.body.id}`)
        .set(como(jefe))
        .send({
          scheduledStartAt: lp('2030-03-13', '09:10'),
          scheduledEndAt: lp('2030-03-13', '10:00'),
        })
        .expect(409);
      expect(choque.body.reason).toBe('OPERATING_ROOM_SLOT_CONFLICT');
      expect(choque.body.details.conflictingCaseId).toBe(a.body.id);
      await http()
        .patch(`/procedure-cases/${b.body.id}`)
        .set(como(jefe))
        .send({
          scheduledStartAt: lp('2030-03-13', '15:00'),
          scheduledEndAt: lp('2030-03-13', '16:00'),
        })
        .expect(200);
      const [fila] = await filas(
        ctx,
        'select reserved_start_at, reserved_end_at from procedures_perioperative.procedure_cases where id = ?',
        [b.body.id],
      );
      expect(new Date(fila.reserved_start_at).toISOString()).toBe(
        '2030-03-13T18:45:00.000Z',
      );
      expect(new Date(fila.reserved_end_at).toISOString()).toBe(
        '2030-03-13T20:20:00.000Z',
      );
    });
  });

  // ------------------------------------------------------------ F4.5-3 · bloques
  describe('bloques por servicio o cirujano', () => {
    let qx: any;
    beforeAll(async () => {
      qx = await quirofano('QX-BLOQUES');
    });

    const bloque = (token: typeof jefe, over: Record<string, unknown> = {}) =>
      http()
        .post(`/sites/${orgA.siteId}/or-blocks`)
        .set(como(token))
        .send({
          operatingRoomId: qx.id,
          ownerKind: 'SERVICE',
          surgicalSpecialtyConceptId: TRAUMA,
          startsAt: lp('2030-04-01', '08:00'),
          endsAt: lp('2030-04-01', '14:00'),
          ...over,
        });

    it('el jefe de quirófano crea un bloque; queda con liberación a −72 h, historia y evento', async () => {
      const res = await bloque(jefe).expect(201);
      expect(res.body.blocks).toHaveLength(1);
      const id = res.body.blocks[0].id;
      const [fila] = await filas(
        ctx,
        `select status_concept_id, starts_at, ends_at, release_at, tenant_id, owner_kind_concept_id
           from procedures_perioperative.operating_room_blocks where id = ?`,
        [id],
      );
      expect(fila.status_concept_id).toBe(PERIOP.ORB_ACTIVE);
      expect(fila.owner_kind_concept_id).toBe(PERIOP.ORB_OWNER_SERVICE);
      expect(fila.tenant_id).toBe(orgA.tenantId);
      expect(new Date(fila.starts_at).toISOString()).toBe(
        '2030-04-01T12:00:00.000Z',
      );
      expect(new Date(fila.release_at).toISOString()).toBe(
        '2030-03-29T12:00:00.000Z',
      );
      const hist = await filas(
        ctx,
        'select revision_no, tenant_id from audit.operating_room_blocks_history where operating_room_block_id = ?',
        [id],
      );
      expect(hist).toHaveLength(1);
      expect(hist[0].tenant_id).toBe(orgA.tenantId);
      const ev = await filas(
        ctx,
        `select payload_json from messaging.domain_events
          where event_type = 'periop.or_block.created' and payload_json->'blockIds' @> ?::jsonb`,
        [JSON.stringify([id])],
      );
      expect(ev).toHaveLength(1);
    });

    it('un bloque que solapa a otro activo → 409 OR_BLOCK_OVERLAP', async () => {
      const res = await bloque(jefe, {
        startsAt: lp('2030-04-01', '13:00'),
        endsAt: lp('2030-04-01', '16:00'),
        surgicalSpecialtyConceptId: CARDIO,
      }).expect(409);
      expect(res.body.reason).toBe('OR_BLOCK_OVERLAP');
    });

    it('dos altas simultáneas del mismo tiempo: una gana y la otra 409 (EXCLUDE de la base)', async () => {
      const q = await quirofano('QX-BLOQUES-CARRERA');
      const intentos = await Promise.all(
        [1, 2].map(() =>
          http()
            .post(`/sites/${orgA.siteId}/or-blocks`)
            .set(como(jefe))
            .send({
              operatingRoomId: q.id,
              ownerKind: 'SERVICE',
              surgicalSpecialtyConceptId: TRAUMA,
              startsAt: lp('2030-04-02', '08:00'),
              endsAt: lp('2030-04-02', '12:00'),
            }),
        ),
      );
      expect(intentos.map((r) => r.status).sort()).toEqual([201, 409]);
      expect(intentos.find((r) => r.status === 409)!.body.reason).toBe(
        'OR_BLOCK_OVERLAP',
      );
    });

    it('la serie semanal crea sus instancias (lunes y miércoles) y se acorta cancelando las posteriores', async () => {
      const q = await quirofano('QX-SERIE');
      const res = await http()
        .post(`/sites/${orgA.siteId}/or-blocks`)
        .set(como(jefe))
        .send({
          operatingRoomId: q.id,
          ownerKind: 'SERVICE',
          specialtyCode: 'TEAM_SURGEON',
          startsAt: lp('2030-04-08', '08:00'),
          endsAt: lp('2030-04-08', '14:00'),
          releaseHours: 48,
          recurrence: { weekdays: [1, 3], until: '2030-04-24' },
        })
        .expect(201);
      expect(res.body.seriesId).toBeDefined();
      // lun 8, mié 10, lun 15, mié 17, lun 22, mié 24
      expect(res.body.blocks).toHaveLength(6);
      const [serie] = await filas(
        ctx,
        `select weekdays, start_time, end_time, release_hours, valid_to
           from procedures_perioperative.operating_room_block_series where id = ?`,
        [res.body.seriesId],
      );
      expect(serie.release_hours).toBe(48);
      expect(String(serie.start_time)).toBe('08:00:00');

      const acortada = await http()
        .patch(`/or-block-series/${res.body.seriesId}`)
        .set(como(jefe))
        .send({ validTo: '2030-04-16' })
        .expect(200);
      expect(acortada.body.cancelledBlockIds).toHaveLength(3); // 17, 22, 24
      const [{ n }] = await filas(
        ctx,
        `select count(*)::int as n from procedures_perioperative.operating_room_blocks
          where series_id = ? and status_concept_id = ?`,
        [res.body.seriesId, PERIOP.ORB_CANCELLED],
      );
      expect(n).toBe(3);
    });

    it('validaciones: dueño obligatorio, sala de otra sede, consultorio, pasado y más de 400 instancias', async () => {
      expect(
        (
          await bloque(jefe, { surgicalSpecialtyConceptId: undefined }).expect(
            422,
          )
        ).body.reason,
      ).toBe('OR_BLOCK_OWNER_REQUIRED');
      expect(
        (await bloque(jefe, { ownerKind: 'SURGEON' }).expect(422)).body.reason,
      ).toBe('OR_BLOCK_OWNER_REQUIRED');
      expect(
        (
          await bloque(jefe, {
            startsAt: lp('2020-04-01', '08:00'),
            endsAt: lp('2020-04-01', '14:00'),
          }).expect(422)
        ).body.reason,
      ).toBe('OR_BLOCK_IN_PAST');
      const cons = await crearEspacio(ctx, orgA, orgA.siteId, {
        code: 'CONS-BLOQ',
        name: 'Consultorio',
        functionCode: 'SPACE_FN_CONSULTING_ROOM',
        activate: true,
      });
      expect(
        (await bloque(jefe, { operatingRoomId: cons.id }).expect(422)).body
          .reason,
      ).toBe('OR_BLOCK_INVALID_ROOM');
      const sede2 = await crearSede(ctx, orgA, `F4-SEDE-3-${sufijo}`);
      const otraSede = await crearQuirofano(ctx, orgA, 'QX-SEDE3', {}, sede2);
      expect(
        (await bloque(jefe, { operatingRoomId: otraSede.id }).expect(422)).body
          .reason,
      ).toBe('OR_BLOCK_INVALID_ROOM');
      expect(
        (
          await bloque(jefe, {
            startsAt: lp('2031-01-06', '08:00'),
            endsAt: lp('2031-01-06', '10:00'),
            recurrence: {
              weekdays: [0, 1, 2, 3, 4, 5, 6],
              until: '2033-01-01',
            },
          }).expect(422)
        ).body.reason,
      ).toBe('OR_BLOCK_TOO_MANY_INSTANCES');
    });

    it('un caso de OTRO servicio dentro del bloque → 409 OR_BLOCK_OWNED_BY_OTHER; del mismo servicio se liga; urgencia pasa', async () => {
      const q = await quirofano('QX-DUENO');
      const b = await http()
        .post(`/sites/${orgA.siteId}/or-blocks`)
        .set(como(jefe))
        .send({
          operatingRoomId: q.id,
          ownerKind: 'SERVICE',
          surgicalSpecialtyConceptId: TRAUMA,
          startsAt: lp('2030-05-06', '08:00'),
          endsAt: lp('2030-05-06', '14:00'),
        })
        .expect(201);
      const blockId = b.body.blocks[0].id;

      const ajeno = await caso(jefe, {
        operatingRoomId: q.id,
        surgicalSpecialtyConceptId: CARDIO,
        scheduledStartAt: lp('2030-05-06', '09:00'),
        scheduledEndAt: lp('2030-05-06', '10:00'),
      }).expect(409);
      expect(ajeno.body.reason).toBe('OR_BLOCK_OWNED_BY_OTHER');
      expect(ajeno.body.details.blockId).toBe(blockId);
      expect(ajeno.body.details.owner).toMatchObject({
        kind: 'SERVICE',
        surgicalSpecialtyConceptId: TRAUMA,
      });

      const propio = await caso(jefe, {
        operatingRoomId: q.id,
        surgicalSpecialtyConceptId: TRAUMA,
        scheduledStartAt: lp('2030-05-06', '09:00'),
        scheduledEndAt: lp('2030-05-06', '10:00'),
      }).expect(201);
      expect(propio.body.operatingRoomBlockId).toBe(blockId);

      const urgente = await caso(jefe, {
        operatingRoomId: q.id,
        surgicalSpecialtyConceptId: CARDIO,
        caseType: 'URGENT',
        urgencyReasonText: 'Apendicitis aguda',
        scheduledStartAt: lp('2030-05-06', '12:00'),
        scheduledEndAt: lp('2030-05-06', '13:00'),
      }).expect(201);
      expect(urgente.body.operatingRoomBlockId).toBeNull();
    });

    it('tras el tick de liberación (−72 h) sin casos el bloque queda RELEASED y el mismo caso ajeno → 201', async () => {
      const q = await quirofano('QX-TICK');
      const b = await http()
        .post(`/sites/${orgA.siteId}/or-blocks`)
        .set(como(jefe))
        .send({
          operatingRoomId: q.id,
          ownerKind: 'SERVICE',
          surgicalSpecialtyConceptId: TRAUMA,
          startsAt: lp('2030-05-13', '08:00'),
          endsAt: lp('2030-05-13', '14:00'),
        })
        .expect(201);
      const blockId = b.body.blocks[0].id;
      const ajeno = {
        operatingRoomId: q.id,
        surgicalSpecialtyConceptId: CARDIO,
        scheduledStartAt: lp('2030-05-13', '09:00'),
        scheduledEndAt: lp('2030-05-13', '10:00'),
      };
      await caso(jefe, ajeno).expect(409);

      // El plazo de liberación llegó: release_at ≤ ahora (la hora ya cumplida se fija por SQL).
      await filas(
        ctx,
        `update procedures_perioperative.operating_room_blocks
            set release_at = now() - interval '1 minute' where id = ?`,
        [blockId],
      );
      // Sólo SYSTEM/SYSTEM_WORKER pueden disparar el tick.
      await http()
        .post('/internal/periop/or-blocks-release-tick')
        .set(como(jefe))
        .expect(403);
      const tick = await http()
        .post('/internal/periop/or-blocks-release-tick')
        .set(bearer(ctx.adminToken))
        .set({ 'X-Tenant-Id': orgA.tenantId })
        .expect(200);
      expect(tick.body.blockIds).toContain(blockId);

      const [fila] = await filas(
        ctx,
        `select status_concept_id, released_at, released_by_user_id, released_minutes
           from procedures_perioperative.operating_room_blocks where id = ?`,
        [blockId],
      );
      expect(fila.status_concept_id).toBe(PERIOP.ORB_RELEASED);
      expect(fila.released_by_user_id).toBeNull(); // automático
      expect(fila.released_minutes).toBe(360);
      const ev = await filas(
        ctx,
        `select payload_json from messaging.domain_events
          where event_type = 'periop.or_block.released' and aggregate_id = ?`,
        [blockId],
      );
      expect(ev[0].payload_json).toMatchObject({ automatic: true });

      await caso(jefe, ajeno).expect(201);
      // Idempotente: un segundo tick no encuentra nada de ese bloque.
      const otro = await http()
        .post('/internal/periop/or-blocks-release-tick')
        .set(bearer(ctx.adminToken))
        .set({ 'X-Tenant-Id': orgA.tenantId })
        .expect(200);
      expect(otro.body.blockIds).not.toContain(blockId);
    });

    it('el tick NO libera un bloque con casos ligados', async () => {
      const q = await quirofano('QX-TICK-CASOS');
      const b = await http()
        .post(`/sites/${orgA.siteId}/or-blocks`)
        .set(como(jefe))
        .send({
          operatingRoomId: q.id,
          ownerKind: 'SERVICE',
          surgicalSpecialtyConceptId: TRAUMA,
          startsAt: lp('2030-05-20', '08:00'),
          endsAt: lp('2030-05-20', '14:00'),
        })
        .expect(201);
      const blockId = b.body.blocks[0].id;
      await caso(jefe, {
        operatingRoomId: q.id,
        surgicalSpecialtyConceptId: TRAUMA,
        scheduledStartAt: lp('2030-05-20', '09:00'),
        scheduledEndAt: lp('2030-05-20', '10:00'),
      }).expect(201);
      await filas(
        ctx,
        `update procedures_perioperative.operating_room_blocks
            set release_at = now() - interval '1 minute' where id = ?`,
        [blockId],
      );
      const tick = await http()
        .post('/internal/periop/or-blocks-release-tick')
        .set(bearer(ctx.adminToken))
        .set({ 'X-Tenant-Id': orgA.tenantId })
        .expect(200);
      expect(tick.body.blockIds).not.toContain(blockId);
      const [{ status_concept_id }] = await filas(
        ctx,
        'select status_concept_id from procedures_perioperative.operating_room_blocks where id = ?',
        [blockId],
      );
      expect(status_concept_id).toBe(PERIOP.ORB_ACTIVE);
    });

    it('liberar y cancelar a mano: motivo obligatorio, 409 si ya no está activo, 422 con casos', async () => {
      const q = await quirofano('QX-LIBERAR');
      const crear = (dia: string) =>
        http()
          .post(`/sites/${orgA.siteId}/or-blocks`)
          .set(como(jefe))
          .send({
            operatingRoomId: q.id,
            ownerKind: 'SERVICE',
            surgicalSpecialtyConceptId: TRAUMA,
            startsAt: lp(dia, '08:00'),
            endsAt: lp(dia, '14:00'),
          })
          .expect(201);
      const b1 = (await crear('2030-06-03')).body.blocks[0].id;
      const b2 = (await crear('2030-06-04')).body.blocks[0].id;
      const b3 = (await crear('2030-06-05')).body.blocks[0].id;

      await http()
        .post(`/or-blocks/${b1}/release`)
        .set(como(jefe))
        .send({})
        .expect(400);
      const lib = await http()
        .post(`/or-blocks/${b1}/release`)
        .set(como(jefe))
        .send({ reasonText: 'Sin demanda esta semana' })
        .expect(200);
      expect(lib.body).toMatchObject({
        status: 'RELEASED',
        releasedMinutes: 360,
      });
      const [fila] = await filas(
        ctx,
        'select released_by_user_id, release_reason from procedures_perioperative.operating_room_blocks where id = ?',
        [b1],
      );
      expect(fila.released_by_user_id).toBe(jefe.userId);
      expect(fila.release_reason).toBe('Sin demanda esta semana');
      expect(
        (
          await http()
            .post(`/or-blocks/${b1}/release`)
            .set(como(jefe))
            .send({ reasonText: 'otra vez' })
            .expect(409)
        ).body.reason,
      ).toBe('OR_BLOCK_NOT_ACTIVE');

      await caso(jefe, {
        operatingRoomId: q.id,
        surgicalSpecialtyConceptId: TRAUMA,
        scheduledStartAt: lp('2030-06-04', '09:00'),
        scheduledEndAt: lp('2030-06-04', '10:00'),
      }).expect(201);
      const conCasos = await http()
        .post(`/or-blocks/${b2}/cancel`)
        .set(como(jefe))
        .send({ reasonText: 'Cambio de agenda' })
        .expect(422);
      expect(conCasos.body.reason).toBe('OR_BLOCK_HAS_CASES');
      expect(conCasos.body.details.caseIds).toHaveLength(1);

      const canc = await http()
        .post(`/or-blocks/${b3}/cancel`)
        .set(como(jefe))
        .send({ reasonText: 'Cambio de agenda' })
        .expect(200);
      expect(canc.body.status).toBe('CANCELLED');
    });

    it('lectura: bloques con minutos usados y casos ligados (sin datos del paciente); quirófanos de la sede', async () => {
      const q = await quirofano('QX-LECTURA');
      const b = await http()
        .post(`/sites/${orgA.siteId}/or-blocks`)
        .set(como(jefe))
        .send({
          operatingRoomId: q.id,
          ownerKind: 'SERVICE',
          surgicalSpecialtyConceptId: TRAUMA,
          startsAt: lp('2030-06-10', '08:00'),
          endsAt: lp('2030-06-10', '14:00'),
        })
        .expect(201);
      await caso(jefe, {
        operatingRoomId: q.id,
        surgicalSpecialtyConceptId: TRAUMA,
        scheduledStartAt: lp('2030-06-10', '09:00'),
        scheduledEndAt: lp('2030-06-10', '10:30'),
      }).expect(201);
      const lista = await http()
        .get(`/sites/${orgA.siteId}/or-blocks`)
        .query({
          from: lp('2030-06-10', '00:00'),
          to: lp('2030-06-11', '00:00'),
          operatingRoomId: q.id,
        })
        .set(como(jefe))
        .expect(200);
      expect(lista.body.items).toHaveLength(1);
      expect(lista.body.items[0]).toMatchObject({
        id: b.body.blocks[0].id,
        usedMinutes: 90,
        status: 'ACTIVE',
      });
      expect(JSON.stringify(lista.body)).not.toContain(paciente);

      const salas = await http()
        .get(`/sites/${orgA.siteId}/operating-rooms`)
        .query({ date: '2030-06-10' })
        .set(como(jefe))
        .expect(200);
      const sala = salas.body.items.find((s: any) => s.careSpace.id === q.id);
      expect(sala).toMatchObject({
        prepMinutes: 15,
        cleanupMinutes: 20,
        cell: null,
      });
      expect(sala.resourceId).toEqual(expect.any(String));
      expect(sala.todayCases).toHaveLength(1);
      expect(sala.todayBlocks).toHaveLength(1);
      expect(JSON.stringify(salas.body)).not.toContain(paciente);
    });
  });

  // ------------------------------------------------------------ fail-closed por endpoint
  describe('fail-closed: tenant (404) y rol (403) en cada endpoint', () => {
    let bloqueB: string;
    let casoB: string;
    beforeAll(async () => {
      const b = await http()
        .post(`/sites/${orgB.siteId}/or-blocks`)
        .set(como(jefeB))
        .send({
          operatingRoomId: qxB.id,
          ownerKind: 'SERVICE',
          surgicalSpecialtyConceptId: TRAUMA,
          startsAt: lp('2030-07-01', '08:00'),
          endsAt: lp('2030-07-01', '14:00'),
        })
        .expect(201);
      bloqueB = b.body.blocks[0].id;
      const c = await http()
        .post('/procedure-cases')
        .set(como(jefeB))
        .send({
          custodianTenantId: orgB.tenantId,
          patientProfileId: paciente,
          caseType: 'ELECTIVE',
          priority: 'ROUTINE',
          primarySurgeonProfileId: cirujano,
          operatingRoomId: qxB.id,
          scheduledStartAt: lp('2030-07-02', '08:00'),
          scheduledEndAt: lp('2030-07-02', '10:00'),
        });
      expect(c.status).toBe(201);
      casoB = c.body.id;
    });

    const rango = { from: '2030-07-01T00:00:00Z', to: '2030-07-31T00:00:00Z' };

    it('GET operating-rooms / or-blocks / or-utilization de la sede de otra organización → 404', async () => {
      await http()
        .get(`/sites/${orgB.siteId}/operating-rooms`)
        .set(como(jefe))
        .expect(404);
      await http()
        .get(`/sites/${orgB.siteId}/or-blocks`)
        .query(rango)
        .set(como(jefe))
        .expect(404);
      await http()
        .get(`/sites/${orgB.siteId}/or-utilization`)
        .query({ from: '2030-07-01', to: '2030-07-02' })
        .set(como(jefe))
        .expect(404);
    });

    it('POST or-blocks con la sede o el quirófano de otra organización → 404', async () => {
      await http()
        .post(`/sites/${orgB.siteId}/or-blocks`)
        .set(como(jefe))
        .send({
          operatingRoomId: qxB.id,
          ownerKind: 'SERVICE',
          surgicalSpecialtyConceptId: TRAUMA,
          startsAt: lp('2030-07-08', '08:00'),
          endsAt: lp('2030-07-08', '14:00'),
        })
        .expect(404);
      await http()
        .post(`/sites/${orgA.siteId}/or-blocks`)
        .set(como(jefe))
        .send({
          operatingRoomId: qxB.id,
          ownerKind: 'SERVICE',
          surgicalSpecialtyConceptId: TRAUMA,
          startsAt: lp('2030-07-08', '08:00'),
          endsAt: lp('2030-07-08', '14:00'),
        })
        .expect(404);
    });

    it('release / cancel / PATCH serie de un bloque de otra organización → 404 y el bloque no cambia', async () => {
      await http()
        .post(`/or-blocks/${bloqueB}/release`)
        .set(como(jefe))
        .send({ reasonText: 'intento ajeno' })
        .expect(404);
      await http()
        .post(`/or-blocks/${bloqueB}/cancel`)
        .set(como(jefe))
        .send({ reasonText: 'intento ajeno' })
        .expect(404);
      await http()
        .patch(`/or-block-series/${randomUUID()}`)
        .set(como(jefe))
        .send({ validTo: '2030-08-01' })
        .expect(404);
      const [{ status_concept_id }] = await filas(
        ctx,
        'select status_concept_id from procedures_perioperative.operating_room_blocks where id = ?',
        [bloqueB],
      );
      expect(status_concept_id).toBe(PERIOP.ORB_ACTIVE);
    });

    it('checklist y room-events de un caso de otra organización → 404', async () => {
      await http()
        .post(`/procedure-cases/${casoB}/safety-checklists`)
        .set(como(jefe))
        .send({})
        .expect(404);
      await http()
        .post(`/procedure-cases/${casoB}/room-events`)
        .set(como(jefe))
        .send({
          eventCode: 'PATIENT_IN_ROOM',
          occurredAt: new Date().toISOString(),
        })
        .expect(404);
      await http()
        .get(`/procedure-cases/${casoB}/safety-checklists/${randomUUID()}`)
        .set(como(jefe))
        .expect(404);
    });

    it('el detalle y la lista de casos no cruzan organizaciones', async () => {
      await http().get(`/procedure-cases/${casoB}`).set(como(jefe)).expect(404);
      const lista = await http()
        .get('/procedure-cases')
        .set(como(jefe))
        .expect(200);
      expect(lista.body.items.map((c: any) => c.id)).not.toContain(casoB);
    });

    it('sin rol → 403 INFRA_ACTION_NOT_ALLOWED en bloques, lectura y utilización', async () => {
      const crear = await http()
        .post(`/sites/${orgA.siteId}/or-blocks`)
        .set(como(sinRol))
        .send({
          operatingRoomId: (await quirofano('QX-403')).id,
          ownerKind: 'SERVICE',
          surgicalSpecialtyConceptId: TRAUMA,
          startsAt: lp('2030-07-15', '08:00'),
          endsAt: lp('2030-07-15', '14:00'),
        })
        .expect(403);
      expect(crear.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
      await http()
        .get(`/sites/${orgA.siteId}/operating-rooms`)
        .set(como(sinRol))
        .expect(403);
      await http()
        .get(`/sites/${orgA.siteId}/or-blocks`)
        .query(rango)
        .set(como(sinRol))
        .expect(403);
      await http()
        .get(`/sites/${orgA.siteId}/or-utilization`)
        .query({ from: '2030-07-01', to: '2030-07-02' })
        .set(como(sinRol))
        .expect(403);
    });

    it('la enfermera perioperatoria ve la agenda pero no crea bloques ni la utilización', async () => {
      await http()
        .get(`/sites/${orgA.siteId}/operating-rooms`)
        .set(como(enfermera))
        .expect(200);
      await http()
        .post(`/sites/${orgA.siteId}/or-blocks`)
        .set(como(enfermera))
        .send({
          operatingRoomId: (await quirofano('QX-ENF')).id,
          ownerKind: 'SERVICE',
          surgicalSpecialtyConceptId: TRAUMA,
          startsAt: lp('2030-07-16', '08:00'),
          endsAt: lp('2030-07-16', '14:00'),
        })
        .expect(403);
      await http()
        .get(`/sites/${orgA.siteId}/or-utilization`)
        .query({ from: '2030-07-01', to: '2030-07-02' })
        .set(como(enfermera))
        .expect(403);
    });

    it('el dueño de la organización ve la utilización y la agenda, pero no crea bloques (el contrato los reserva al jefe de quirófano)', async () => {
      await http()
        .get(`/sites/${orgA.siteId}/operating-rooms`)
        .set(como(orgA))
        .expect(200);
      await http()
        .get(`/sites/${orgA.siteId}/or-utilization`)
        .query({ from: '2030-07-01', to: '2030-07-02' })
        .set(como(orgA))
        .expect(200);
      await http()
        .post(`/sites/${orgA.siteId}/or-blocks`)
        .set(como(orgA))
        .send({
          operatingRoomId: (await quirofano('QX-OWNER')).id,
          ownerKind: 'SERVICE',
          surgicalSpecialtyConceptId: TRAUMA,
          startsAt: lp('2030-07-17', '08:00'),
          endsAt: lp('2030-07-17', '14:00'),
        })
        .expect(403);
    });

    it('un jefe de quirófano por asignación delegada (OR_MANAGER) sobre el espacio opera; sobre otro quirófano no', async () => {
      const delegado = await crearMiembro(ctx, orgA, 'deleg', sufijo, []);
      const suyo = await quirofano('QX-DELEG-SUYO');
      const otro = await quirofano('QX-DELEG-OTRO');
      const OR_MANAGER = deterministicId(
        'delegated_access:ASSIGN_ROLE_OR_MANAGER',
      );
      // F2 siembra este concepto; hasta que integre, la prueba lo deja en el catálogo (sólo la FK lo pide).
      const [existe] = await filas(
        ctx,
        'select id from terminology.catalog_concepts where id = ?',
        [OR_MANAGER],
      );
      if (!existe) {
        const [molde] = await filas(
          ctx,
          'select * from terminology.catalog_concepts where id = ?',
          [CONCEPTS.TEAM_ROLE_SURGEON],
        );
        const columnas = Object.keys(molde);
        const valores = columnas.map((c) =>
          c === 'id'
            ? OR_MANAGER
            : c === 'code'
              ? 'DA_ASSIGN_OR_MANAGER'
              : c === 'display'
                ? 'Jefe de quirófano'
                : molde[c],
        );
        await filas(
          ctx,
          `insert into terminology.catalog_concepts (${columnas.join(',')}) values (${columnas.map(() => '?').join(',')})`,
          valores,
        );
      }
      const [membresia] = await filas(
        ctx,
        'select id from directory.tenant_memberships where user_id = ? and tenant_id = ?',
        [delegado.userId, orgA.tenantId],
      );
      await filas(
        ctx,
        `insert into delegated_access.organization_user_assignments
           (id, tenant_membership_id, care_space_id, assignment_role_concept_id, access_scope_concept_id,
            valid_from, status_concept_id, created_at, updated_at)
         values (?, ?, ?, ?, ?, now() - interval '1 day', ?, now(), now())`,
        [
          randomUUID(),
          membresia.id,
          suyo.id,
          OR_MANAGER,
          DELEG.SCOPE_SPACE,
          CONCEPTS.STATE_ACTIVE,
        ],
      );
      const cuerpo = (qxId: string, dia: string) => ({
        operatingRoomId: qxId,
        ownerKind: 'SERVICE',
        surgicalSpecialtyConceptId: TRAUMA,
        startsAt: lp(dia, '08:00'),
        endsAt: lp(dia, '14:00'),
      });
      await http()
        .post(`/sites/${orgA.siteId}/or-blocks`)
        .set(como(delegado))
        .send(cuerpo(suyo.id, '2030-07-22'))
        .expect(201);
      const ajeno = await http()
        .post(`/sites/${orgA.siteId}/or-blocks`)
        .set(como(delegado))
        .send(cuerpo(otro.id, '2030-07-22'))
        .expect(403);
      expect(ajeno.body.reason).toBe('INFRA_ACTION_NOT_ALLOWED');
    });
  });

  // ------------------------------------------------------------ IDOR de perfiles
  describe('profesionales citados por el cliente: sólo de la organización activa', () => {
    const inexistente = '99999999-9999-4999-8999-999999999999';
    /** Lo que se compara entre «ajeno» e «inexistente»: nada que distinga a uno del otro. */
    const forma = (res: any) => ({
      status: res.status,
      reason: res.body.reason,
      message: res.body.message,
      fields: res.body.details?.fields,
      cuerpo: JSON.stringify(res.body).includes(profesionalAjeno),
    });

    it('check-list: coordinador ajeno e inexistente responden lo mismo (422), no se crea nada; uno propio sí', async () => {
      const q = await quirofano('QX-IDOR-CL');
      const c = await caso(jefe, {
        operatingRoomId: q.id,
        scheduledStartAt: lp('2030-09-02', '08:00'),
        scheduledEndAt: lp('2030-09-02', '10:00'),
      }).expect(201);
      const crear = (coordinatorProfileId: string) =>
        http()
          .post(`/procedure-cases/${c.body.id}/safety-checklists`)
          .set(como(jefe))
          .send({ coordinatorProfileId });
      const ajeno = await crear(profesionalAjeno);
      const noExiste = await crear(inexistente);
      expect(ajeno.status).toBe(422);
      expect(ajeno.body.reason).toBe('PRACTITIONER_NOT_IN_TENANT');
      expect(forma(ajeno)).toEqual({ ...forma(noExiste), cuerpo: false });
      expect(forma(ajeno).cuerpo).toBe(false);
      const [{ n }] = await filas(
        ctx,
        'select count(*)::int as n from procedures_perioperative.surgical_safety_checklists where procedure_case_id = ?',
        [c.body.id],
      );
      expect(n).toBe(0);

      const propio = await crear(cirujano).expect(201);
      const [fila] = await filas(
        ctx,
        'select coordinator_profile_id from procedures_perioperative.surgical_safety_checklists where id = ?',
        [propio.body.id],
      );
      expect(fila.coordinator_profile_id).toBe(cirujano);
    });

    it('bloque de cirujano: dueño ajeno e inexistente → 422 igual; propio → 201', async () => {
      const q = await quirofano('QX-IDOR-BLQ');
      const crear = (surgeonProfileId: string, dia: string) =>
        http()
          .post(`/sites/${orgA.siteId}/or-blocks`)
          .set(como(jefe))
          .send({
            operatingRoomId: q.id,
            ownerKind: 'SURGEON',
            surgeonProfileId,
            startsAt: lp(dia, '08:00'),
            endsAt: lp(dia, '14:00'),
          });
      const ajeno = await crear(profesionalAjeno, '2030-09-09');
      const noExiste = await crear(inexistente, '2030-09-09');
      expect(ajeno.status).toBe(422);
      expect(ajeno.body.reason).toBe('PRACTITIONER_NOT_IN_TENANT');
      expect(forma(ajeno)).toEqual({ ...forma(noExiste), cuerpo: false });
      await crear(cirujano, '2030-09-09').expect(201);
    });

    it('programar: cirujano o solicitante ajenos → 422 y no se crea el caso; el propio sí', async () => {
      const q = await quirofano('QX-IDOR-CASO');
      const base = {
        operatingRoomId: q.id,
        scheduledStartAt: lp('2030-09-16', '08:00'),
        scheduledEndAt: lp('2030-09-16', '10:00'),
      };
      const cirujanoAjeno = await caso(jefe, {
        ...base,
        primarySurgeonProfileId: profesionalAjeno,
      }).expect(422);
      expect(cirujanoAjeno.body.reason).toBe('PRACTITIONER_NOT_IN_TENANT');
      expect(cirujanoAjeno.body.details.fields).toEqual([
        'primarySurgeonProfileId',
      ]);
      const solicitanteAjeno = await caso(jefe, {
        ...base,
        requestedByProfileId: profesionalAjeno,
      }).expect(422);
      expect(solicitanteAjeno.body.details.fields).toEqual([
        'requestedByProfileId',
      ]);
      const [{ n }] = await filas(
        ctx,
        'select count(*)::int as n from procedures_perioperative.procedure_cases where operating_room_id = ?',
        [q.id],
      );
      expect(n).toBe(0);
      await caso(jefe, { ...base, requestedByProfileId: cirujano }).expect(201);
    });

    it('el resto del módulo: equipo, quien firma la fase del check-list, plan de anestesia (anidado) y autor del reporte', async () => {
      const q = await quirofano('QX-IDOR-RESTO');
      const c = await caso(jefe, {
        operatingRoomId: q.id,
        scheduledStartAt: lp('2030-09-23', '08:00'),
        scheduledEndAt: lp('2030-09-23', '10:00'),
      }).expect(201);
      const id = c.body.id;
      const intentos: [string, string, Record<string, unknown>, string][] = [
        [
          'team-members',
          'practitionerProfileId',
          { role: 'ASSISTANT', practitionerProfileId: profesionalAjeno },
          'practitionerProfileId',
        ],
        [
          `safety-checklists/${randomUUID()}/responses`,
          'respondedByProfileId',
          {
            phase: 'SIGN_IN',
            respondedByProfileId: profesionalAjeno,
            responses: [],
          },
          'respondedByProfileId',
        ],
        [
          'anesthesia-plans',
          'anesthesiologistProfileId',
          {
            anesthesiologistProfileId: profesionalAjeno,
            anesthesiaType: 'GENERAL',
            airwayAssessment: {
              assessedByProfileId: profesionalAjeno,
              difficultAirwayExpected: false,
            },
          },
          'anesthesiologistProfileId',
        ],
        [
          'operative-reports',
          'authorProfileId',
          { authorProfileId: profesionalAjeno, procedureDescription: 'x' },
          'authorProfileId',
        ],
        [
          'pacu-stays',
          'admittedByProfileId',
          { admittedByProfileId: profesionalAjeno },
          'admittedByProfileId',
        ],
      ];
      for (const [ruta, , cuerpo, campo] of intentos) {
        const res = await http()
          .post(`/procedure-cases/${id}/${ruta}`)
          .set(como(jefe))
          .send(cuerpo);
        expect({ ruta, status: res.status, reason: res.body.reason }).toEqual({
          ruta,
          status: 422,
          reason: 'PRACTITIONER_NOT_IN_TENANT',
        });
        expect(res.body.details.fields).toContain(campo);
      }
      // El campo anidado se nombra con su ruta.
      const anidado = await http()
        .post(`/procedure-cases/${id}/anesthesia-plans`)
        .set(como(jefe))
        .send({
          anesthesiologistProfileId: cirujano,
          anesthesiaType: 'GENERAL',
          airwayAssessment: {
            assessedByProfileId: profesionalAjeno,
            difficultAirwayExpected: false,
          },
        })
        .expect(422);
      expect(anidado.body.details.fields).toEqual([
        'airwayAssessment.assessedByProfileId',
      ]);
      const [{ n }] = await filas(
        ctx,
        'select count(*)::int as n from procedures_perioperative.procedure_case_team_members where procedure_case_id = ?',
        [id],
      );
      expect(n).toBe(1); // sólo el cirujano principal que se siembra al programar
    });

    it('el profesional con afiliación sólo DECLARADA a una sede de la organización no cuenta; con afiliación APROBADA sí', async () => {
      const declarado = await registrarProfesional(ctx, 'declarado', sufijo);
      const q = await quirofano('QX-IDOR-AFIL');
      const afiliar = (estado: string) =>
        filas(
          ctx,
          `insert into profiles.practitioner_affiliations
             (id, practitioner_profile_id, organization_name, practice_site_id, start_date,
              status_concept_id, created_at, updated_at)
           values (?, ?, ?, ?, current_date, ?, now(), now())`,
          [
            randomUUID(),
            declarado.hpid,
            `Hospital A ${sufijo}`,
            orgA.siteId,
            estado,
          ],
        );
      const intentar = () =>
        caso(jefe, {
          operatingRoomId: q.id,
          primarySurgeonProfileId: declarado.hpid,
          scheduledStartAt: lp('2030-09-30', '08:00'),
          scheduledEndAt: lp('2030-09-30', '10:00'),
        });
      await afiliar(PROF.AFFILIATION_DECLARED);
      expect((await intentar().expect(422)).body.reason).toBe(
        'PRACTITIONER_NOT_IN_TENANT',
      );
      await filas(
        ctx,
        'update profiles.practitioner_affiliations set status_concept_id = ? where practitioner_profile_id = ?',
        [PROF.AFFILIATION_APPROVED, declarado.hpid],
      );
      await intentar().expect(201);
    });

    it('fail-closed por tenant: el cirujano de A no es válido para B salvo que B también lo tenga; el de B sí lo tiene', async () => {
      // El cirujano es miembro de A y de B (se vinculó en la preparación): ambos lo aceptan.
      const b = await http()
        .post('/procedure-cases')
        .set(como(jefeB))
        .send({
          custodianTenantId: orgB.tenantId,
          patientProfileId: paciente,
          caseType: 'ELECTIVE',
          priority: 'ROUTINE',
          primarySurgeonProfileId: cirujano,
          operatingRoomId: qxB.id,
          scheduledStartAt: lp('2030-10-07', '08:00'),
          scheduledEndAt: lp('2030-10-07', '10:00'),
        })
        .expect(201);
      expect(b.body.operatingRoomId).toBe(qxB.id);
      // El profesional ajeno no es de B tampoco.
      await http()
        .post('/procedure-cases')
        .set(como(jefeB))
        .send({
          custodianTenantId: orgB.tenantId,
          patientProfileId: paciente,
          caseType: 'ELECTIVE',
          priority: 'ROUTINE',
          primarySurgeonProfileId: profesionalAjeno,
          operatingRoomId: qxB.id,
          scheduledStartAt: lp('2030-10-08', '08:00'),
          scheduledEndAt: lp('2030-10-08', '10:00'),
        })
        .expect(422);
    });
  });

  // ------------------------------------------------------------ clausura
  describe('clausura (INV-11): casos futuros y bloques bloquean', () => {
    it('un quirófano con un caso programado y un bloque activo no se clausura: 409 con FUTURE_OR_CASE y FUTURE_OR_BLOCK', async () => {
      const q = await quirofano('QX-CLAUSURA');
      await http()
        .post(`/sites/${orgA.siteId}/or-blocks`)
        .set(como(jefe))
        .send({
          operatingRoomId: q.id,
          ownerKind: 'SERVICE',
          surgicalSpecialtyConceptId: TRAUMA,
          startsAt: lp('2030-08-05', '08:00'),
          endsAt: lp('2030-08-05', '14:00'),
        })
        .expect(201);
      await caso(jefe, {
        operatingRoomId: q.id,
        surgicalSpecialtyConceptId: TRAUMA,
        scheduledStartAt: lp('2030-08-05', '09:00'),
        scheduledEndAt: lp('2030-08-05', '10:00'),
      }).expect(201);

      const check = await http()
        .get(`/care-spaces/${q.id}/retire-check`)
        .set(como(orgA))
        .expect(200);
      const kinds = check.body.blockers.map((b: any) => b.kind);
      expect(kinds).toEqual(
        expect.arrayContaining(['FUTURE_OR_CASE', 'FUTURE_OR_BLOCK']),
      );

      const detalle = await http()
        .get(`/care-spaces/${q.id}`)
        .set(como(orgA))
        .expect(200);
      const res = await http()
        .post(`/care-spaces/${q.id}/lifecycle`)
        .set(como(orgA))
        .set({ 'If-Match': `"${detalle.body.rowVersion}"` })
        .send({ action: 'retire', reason: 'Cierre del quirófano' })
        .expect(409);
      expect(res.body.reason).toBe('SPACE_RETIRE_BLOCKED');
    });
  });
});
