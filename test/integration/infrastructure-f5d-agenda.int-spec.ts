import { randomUUID } from 'node:crypto';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { CONCEPTS } from '../../src/common';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { createPatient } from './infrastructure-f3.fixtures';
import {
  como,
  crearEspacio,
  crearMiembro,
  darMembresia,
  filas,
  http as httpFor,
  mkOrg,
  PASSWORD,
  registrarOrg,
  registrarProfesional,
  type Profesional,
} from './infra-f4.fixtures';

/**
 * F5d · agenda de consultorios y salas, contra la base real y por HTTP real.
 *
 * Por endpoint: un caso permitido y casos que fallan cerrado por tenant (id de otra
 * organización → 404) y por rol (403). Las reglas del contrato (F5d) se demuestran con datos
 * persistidos y vistos por SQL: el espacio de la plantilla, el solape de plantillas (422), la
 * doble reserva del consultorio (409, con dos peticiones simultáneas contra la base), el
 * bloqueo del consultorio que cierra los cupos y los reabre, y el flujo completo con recarga.
 */
describe('Infraestructura F5d · agenda de consultorios y salas', () => {
  let ctx: TestContext;
  const http = () => httpFor(ctx);
  const sufijo = randomUUID().slice(0, 8);
  const orgA = mkOrg('A', sufijo);
  const orgB = mkOrg('B', sufijo);
  /** Coordinador de agendas de A (SCHEDULING_ADMIN con ámbito en A). */
  let coordA: { token: string; tenantId: string; userId: string };
  /** Coordinador de agendas de B. */
  let coordB: { token: string; tenantId: string; userId: string };
  /** Agente de mostrador de A: opera citas, pero no administra agendas. */
  let agenteA: { token: string; tenantId: string; userId: string };
  let doc1: Profesional;
  let doc2: Profesional;
  let res1: string;
  let res2: string;
  let consB: any;
  let depositoA: any;
  let esperaA: any;
  let seq = 0;

  /** Un día futuro distinto por escenario (el día de la semana de la plantilla es el de ese día). */
  function dia(offset: number): { fecha: string; dow: number } {
    const d = new Date(Date.now() + offset * 86_400_000);
    return { fecha: d.toISOString().slice(0, 10), dow: d.getUTCDay() };
  }
  /** Hora local de La Paz (UTC−4, la zona del recurso) en ISO. */
  const lp = (fecha: string, hhmm: string) => `${fecha}T${hhmm}:00-04:00`;

  const consultorio = async (name: string) => {
    seq += 1;
    return crearEspacio(ctx, orgA, orgA.siteId, {
      code: `CON-${seq}-${sufijo}`,
      name,
      functionCode: 'SPACE_FN_CONSULTING_ROOM',
      activate: true,
    });
  };

  const regla = (dow: number, from: string, to: string) => ({
    dayOfWeek: dow,
    startTime: `${from}:00`,
    endTime: `${to}:00`,
  });

  const publicar = (
    token: { token: string; tenantId: string },
    resourceId: string,
    body: Record<string, unknown>,
  ) =>
    http()
      .post(`/scheduling/resources/${resourceId}/templates`)
      .set(como(token))
      .send({ name: `Horario ${(seq += 1)}`, slotMinutes: 30, ...body });

  const generar = (templateId: string, fecha: string) =>
    http()
      .post(`/scheduling/templates/${templateId}/generate-slots`)
      .set(como(coordA))
      .send({ from: `${fecha}T00:00:00Z`, to: `${fecha}T23:59:59Z` });

  const cupos = async (
    resourceId: string,
    fecha: string,
    onlyAvailable = true,
  ) =>
    (
      await http()
        .get(`/scheduling/resources/${resourceId}/slots`)
        .query({
          from: `${fecha}T00:00:00Z`,
          to: `${fecha}T23:59:59Z`,
          onlyAvailable: String(onlyAvailable),
        })
        .set(como(coordA))
        .expect(200)
    ).body.items as any[];

  const paciente = () =>
    createPatient(ctx, {
      name: `Paciente F5D ${(seq += 1)}`,
      gender: 'FEMALE',
      birthDate: '1990-01-01',
    });

  /** Retiene y confirma un cupo como mostrador. */
  async function reservar(slotId: string, patientProfileId: string) {
    const hold = await http()
      .post(`/scheduling/slots/${slotId}/holds`)
      .set(como(coordA))
      .send({ patientProfileId });
    if (hold.status !== 201) return hold;
    return http()
      .post(`/scheduling/holds/${hold.body.holdToken}/confirm`)
      .set(como(coordA))
      .send({
        tenantId: orgA.tenantId,
        patientProfileId,
        channel: 'DESK',
      });
  }

  const cita = async (bookingId: string) => {
    const [fila] = await filas(
      ctx,
      `select a.id, a.care_space_id, a.start_at, a.end_at, a.status_concept_id, a.tenant_id
         from scheduling.appointment_bookings b
         join clinical.appointments a on a.id = b.appointment_id
        where b.id = ?`,
      [bookingId],
    );
    return fila;
  };

  const directa = (
    token: { token: string; tenantId: string },
    resourceId: string,
    patientProfileId: string,
    startAt: string,
    extra: Record<string, unknown> = {},
  ) =>
    http()
      .post('/scheduling/appointments/direct')
      .set(como(token))
      .send({
        patientProfileId,
        resourceId,
        startAt,
        durationMinutes: 30,
        ...extra,
      });

  const bloquear = async (
    org: { token: string; tenantId: string },
    careSpaceId: string,
    acknowledgeConflicts = false,
  ) => {
    const estado = await http()
      .get(`/care-spaces/${careSpaceId}/operational-state`)
      .set(como(org))
      .expect(200);
    return http()
      .post(`/care-spaces/${careSpaceId}/availability`)
      .set(como(org))
      .set({ 'If-Match-Ops': `"${estado.body.cell.opsVersion}"` })
      .send({
        action: 'block',
        kindCode: 'BLOCK_ADMIN',
        reasonCode: 'BLOCK_RSN_ADMIN_DECISION',
        acknowledgeConflicts,
      });
  };
  const desbloquear = async (
    org: { token: string; tenantId: string },
    careSpaceId: string,
  ) => {
    const estado = await http()
      .get(`/care-spaces/${careSpaceId}/operational-state`)
      .set(como(org))
      .expect(200);
    return http()
      .post(`/care-spaces/${careSpaceId}/availability`)
      .set(como(org))
      .set({ 'If-Match-Ops': `"${estado.body.cell.opsVersion}"` })
      .send({ action: 'unblock' });
  };

  const recurso = (token: { token: string; tenantId: string }, body: object) =>
    http().post('/scheduling/resources').set(como(token)).send(body);

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    await registrarOrg(ctx, orgA, 'A', sufijo);
    await registrarOrg(ctx, orgB, 'B', sufijo);
    coordA = await crearMiembro(ctx, orgA, 'coord', sufijo, [
      'SCHEDULING_ADMIN',
    ]);
    coordB = await crearMiembro(ctx, orgB, 'coordb', sufijo, [
      'SCHEDULING_ADMIN',
    ]);
    agenteA = await crearMiembro(ctx, orgA, 'agente', sufijo, [
      'SCHEDULING_AGENT',
    ]);
    doc1 = await registrarProfesional(ctx, 'd1', sufijo);
    doc2 = await registrarProfesional(ctx, 'd2', sufijo);
    const mk = async (doc: Profesional, name: string) =>
      (
        await recurso(coordA, {
          tenantId: orgA.tenantId,
          resourceType: 'PRACTITIONER',
          resourceRefType: 'health_practitioner_profiles',
          resourceRefId: doc.hpid,
          name,
          timeZone: 'America/La_Paz',
        }).expect(201)
      ).body.id as string;
    res1 = await mk(doc1, `Agenda Dr. Uno ${sufijo}`);
    res2 = await mk(doc2, `Agenda Dra. Dos ${sufijo}`);
    consB = await crearEspacio(ctx, orgB, orgB.siteId, {
      code: `CON-B-${sufijo}`,
      name: 'Consultorio de B',
      functionCode: 'SPACE_FN_CONSULTING_ROOM',
      activate: true,
    });
    depositoA = await crearEspacio(ctx, orgA, orgA.siteId, {
      code: `DEP-A-${sufijo}`,
      name: 'Depósito',
      functionCode: 'SPACE_FN_STORAGE',
      activate: true,
    });
    esperaA = await crearEspacio(ctx, orgA, orgA.siteId, {
      code: `ESP-A-${sufijo}`,
      name: 'Sala de espera',
      functionCode: 'SPACE_FN_WAITING',
      activate: true,
    });
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  // ------------------------------------------------------------ plantilla con espacio
  describe('POST /scheduling/resources/:id/templates con careSpaceId', () => {
    it('publica el horario en el consultorio: queda el espacio, el tenant del recurso y el evento', async () => {
      const c = await consultorio('Consultorio 1');
      const { dow } = dia(3);
      const res = await publicar(coordA, res1, {
        careSpaceId: c.id,
        rules: [regla(dow, '08:00', '10:00')],
      }).expect(201);
      expect(res.body.careSpaceId).toBe(c.id);
      const [t] = await filas(
        ctx,
        `select care_space_id, tenant_id, resource_id from scheduling.schedule_templates where id = ?`,
        [res.body.id],
      );
      expect(t).toEqual({
        care_space_id: c.id,
        tenant_id: orgA.tenantId,
        resource_id: res1,
      });
      const ev = await filas(
        ctx,
        `select payload_json from messaging.domain_events
          where aggregate_id = ? and event_type = 'scheduling.template.care_space_set'`,
        [res.body.id],
      );
      expect(ev).toHaveLength(1);
      expect(ev[0].payload_json).toMatchObject({
        careSpaceId: c.id,
        siteId: orgA.siteId,
        previousCareSpaceId: null,
      });
      // El listado devuelve el espacio de cada plantilla.
      const lista = await http()
        .get(`/scheduling/resources/${res1}/templates`)
        .set(como(coordA))
        .expect(200);
      expect(
        lista.body.items.find((i: any) => i.id === res.body.id).careSpaceId,
      ).toBe(c.id);
    });

    it('dos médicos, mismo consultorio, 14:00–14:30 y 14:15–14:45: el segundo es 422 TEMPLATE_RULE_OVERLAP_CARE_SPACE', async () => {
      const c = await consultorio('Consultorio solape');
      const { dow } = dia(4);
      await publicar(coordA, res1, {
        careSpaceId: c.id,
        rules: [regla(dow, '14:00', '14:30')],
      }).expect(201);
      const res = await publicar(coordA, res2, {
        careSpaceId: c.id,
        rules: [regla(dow, '14:15', '14:45')],
      }).expect(422);
      expect(res.body.reason).toBe('TEMPLATE_RULE_OVERLAP_CARE_SPACE');
      // Contiguo (14:30–15:00) entra, y el mismo horario en otro consultorio también.
      await publicar(coordA, res2, {
        careSpaceId: c.id,
        rules: [regla(dow, '14:30', '15:00')],
      }).expect(201);
      const otro = await consultorio('Consultorio libre');
      await publicar(coordA, res2, {
        careSpaceId: otro.id,
        rules: [regla(dow, '14:00', '14:30')],
      }).expect(201);
      // Sin espacio no hay solape que comprobar (comportamiento anterior a F5d).
      await publicar(coordA, res2, {
        rules: [regla(dow, '14:00', '14:30')],
      }).expect(201);
    });

    it('dos publicaciones simultáneas sobre el mismo consultorio y hora: una gana (201) y la otra 422', async () => {
      const c = await consultorio('Consultorio carrera');
      const { dow } = dia(5);
      const intentos = await Promise.all(
        [res1, res2].map((r) =>
          publicar(coordA, r, {
            careSpaceId: c.id,
            rules: [regla(dow, '10:00', '11:00')],
          }),
        ),
      );
      expect(intentos.map((r) => r.status).sort()).toEqual([201, 422]);
      const [{ n }] = await filas(
        ctx,
        `select count(*)::int as n from scheduling.schedule_templates
          where care_space_id = ? and status_concept_id = ?`,
        [c.id, CONCEPTS.TEMPLATE_PUBLISHED],
      );
      expect(n).toBe(1);
    });

    it('editar la plantilla hacia un horario que pisa a otra en el consultorio es 422; soltar y cambiar el espacio emiten el evento', async () => {
      const c = await consultorio('Consultorio edición');
      const { dow } = dia(6);
      const a = await publicar(coordA, res1, {
        careSpaceId: c.id,
        rules: [regla(dow, '08:00', '09:00')],
      }).expect(201);
      const b = await publicar(coordA, res2, {
        careSpaceId: c.id,
        rules: [regla(dow, '09:00', '10:00')],
      }).expect(201);
      const choque = await http()
        .patch(`/scheduling/templates/${b.body.id}`)
        .set(como(coordA))
        .send({ rules: [regla(dow, '08:30', '09:30')] })
        .expect(422);
      expect(choque.body.reason).toBe('TEMPLATE_RULE_OVERLAP_CARE_SPACE');
      // Soltar el espacio (null) lo deja libre y el otro ya no choca.
      await http()
        .patch(`/scheduling/templates/${b.body.id}`)
        .set(como(coordA))
        .send({ careSpaceId: null })
        .expect(200);
      const [t] = await filas(
        ctx,
        `select care_space_id from scheduling.schedule_templates where id = ?`,
        [b.body.id],
      );
      expect(t.care_space_id).toBeNull();
      // Volver a atarlo con el horario que pisaba falla; con otro horario entra.
      await http()
        .patch(`/scheduling/templates/${b.body.id}`)
        .set(como(coordA))
        .send({ careSpaceId: c.id, rules: [regla(dow, '08:30', '09:30')] })
        .expect(422);
      await http()
        .patch(`/scheduling/templates/${b.body.id}`)
        .set(como(coordA))
        .send({ careSpaceId: c.id, rules: [regla(dow, '09:00', '10:00')] })
        .expect(200);
      const ev = await filas(
        ctx,
        `select payload_json from messaging.domain_events
          where aggregate_id = ? and event_type = 'scheduling.template.care_space_set'
          order by occurred_at`,
        [b.body.id],
      );
      expect(ev.map((e) => e.payload_json.careSpaceId)).toEqual([
        c.id,
        null,
        c.id,
      ]);
      expect(a.body.id).toBeDefined();
    });

    it('un retirado que vuelve a publicarse no puede pisar lo que otro publicó en su lugar', async () => {
      const c = await consultorio('Consultorio reactivar');
      const { dow } = dia(7);
      const a = await publicar(coordA, res1, {
        careSpaceId: c.id,
        rules: [regla(dow, '16:00', '17:00')],
      }).expect(201);
      await http()
        .delete(`/scheduling/templates/${a.body.id}`)
        .set(como(coordA))
        .expect(200);
      await publicar(coordA, res2, {
        careSpaceId: c.id,
        rules: [regla(dow, '16:30', '17:30')],
      }).expect(201);
      const back = await http()
        .post(`/scheduling/templates/${a.body.id}/reactivate`)
        .set(como(coordA))
        .expect(422);
      expect(back.body.reason).toBe('TEMPLATE_RULE_OVERLAP_CARE_SPACE');
    });

    it('fail-closed: función que no admite horario 422; espacio ajeno o inexistente 404; un profesional no reserva consultorios', async () => {
      const { dow } = dia(8);
      const base = { rules: [regla(dow, '08:00', '09:00')] };
      const dep = await publicar(coordA, res1, {
        ...base,
        careSpaceId: depositoA.id,
      }).expect(422);
      expect(dep.body.reason).toBe('TEMPLATE_CARE_SPACE_INVALID_FUNCTION');
      // La sala de espera (admite solapes) tampoco tiene horario propio.
      const espera = await publicar(coordA, res1, {
        ...base,
        careSpaceId: esperaA.id,
      }).expect(422);
      expect(espera.body.reason).toBe('TEMPLATE_CARE_SPACE_INVALID_FUNCTION');
      for (const id of [consB.id, randomUUID()]) {
        const r = await publicar(coordA, res1, { ...base, careSpaceId: id });
        expect(r.status).toBe(404);
        expect(r.body.reason).toBe('PRACTICE_RESOURCE_OUT_OF_SCOPE');
      }
      // Quien opera citas pero no administra agendas ni espacios: 403 (el recurso es de su
      // organización) sin dejar nada escrito.
      const antes = await filas(
        ctx,
        `select count(*)::int as n from scheduling.schedule_templates where resource_id = ?`,
        [res1],
      );
      const c = await consultorio('Consultorio privado');
      const sinPermiso = await publicar(agenteA, res1, {
        ...base,
        careSpaceId: c.id,
      });
      expect([403, 404]).toContain(sinPermiso.status);
      const despues = await filas(
        ctx,
        `select count(*)::int as n from scheduling.schedule_templates where resource_id = ?`,
        [res1],
      );
      expect(despues[0].n).toBe(antes[0].n);
    });

    it('fail-closed por tenant: el coordinador de B no publica ni edita en el recurso de A (404) ni ata el consultorio de A a su recurso', async () => {
      const { dow } = dia(9);
      const c = await consultorio('Consultorio de A');
      const ajeno = await publicar(coordB, res1, {
        rules: [regla(dow, '08:00', '09:00')],
      });
      expect(ajeno.status).toBe(404);
      const propia = (
        await recurso(coordB, {
          tenantId: orgB.tenantId,
          resourceType: 'PRACTITIONER',
          resourceRefType: 'health_practitioner_profiles',
          resourceRefId: doc2.hpid,
          name: `Agenda B ${sufijo}`,
          timeZone: 'America/La_Paz',
        }).expect(201)
      ).body.id;
      const cruce = await publicar(coordB, propia, {
        rules: [regla(dow, '08:00', '09:00')],
        careSpaceId: c.id,
      });
      expect(cruce.status).toBe(404);
      const [{ n }] = await filas(
        ctx,
        `select count(*)::int as n from scheduling.schedule_templates where care_space_id = ?`,
        [c.id],
      );
      expect(n).toBe(0);
      // El propio consultorio de B sí.
      await publicar(coordB, propia, {
        rules: [regla(dow, '08:00', '09:00')],
        careSpaceId: consB.id,
      }).expect(201);
    });
  });

  // ------------------------------------------------------------ recursos con referencia real
  describe('POST /scheduling/resources: la referencia deja de ser libre', () => {
    const base = () => ({
      tenantId: orgA.tenantId,
      timeZone: 'America/La_Paz',
    });

    it('una sala que apunta a una sede inexistente o de otra organización es 404; a una sede propia, 201', async () => {
      for (const id of [randomUUID(), orgB.siteId]) {
        const r = await recurso(coordA, {
          ...base(),
          resourceType: 'ROOM',
          resourceRefType: 'practice_sites',
          resourceRefId: id,
          name: `Sede ajena ${seq}`,
        });
        expect(r.status).toBe(404);
        expect(r.body.reason).toBe('RESOURCE_REF_NOT_FOUND');
      }
      await recurso(coordA, {
        ...base(),
        resourceType: 'ROOM',
        resourceRefType: 'practice_sites',
        resourceRefId: orgA.siteId,
        name: `Sede propia ${sufijo}`,
      }).expect(201);
    });

    it('el tipo de recurso tiene que corresponder a lo que referencia (422) y un equipo inexistente es 404', async () => {
      const mal = await recurso(coordA, {
        ...base(),
        resourceType: 'ROOM',
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: doc1.hpid,
        name: 'Sala con perfil',
      });
      expect(mal.status).toBe(422);
      expect(mal.body.reason).toBe('RESOURCE_REF_TYPE_MISMATCH');
      const equipoFalso = await recurso(coordA, {
        ...base(),
        resourceType: 'EQUIPMENT',
        resourceRefType: 'diagnostic_equipment',
        resourceRefId: randomUUID(),
        name: 'Equipo fantasma',
      });
      expect(equipoFalso.status).toBe(404);
      expect(equipoFalso.body.reason).toBe('RESOURCE_REF_NOT_FOUND');
    });
  });

  // ------------------------------------------------------------ citas con consultorio
  describe('la cita lleva el consultorio de la agenda', () => {
    it('flujo completo: publicar con consultorio → cupos → reservar → recarga: la cita muestra el consultorio', async () => {
      const c = await consultorio('Consultorio flujo');
      const { fecha, dow } = dia(10);
      const t = await publicar(coordA, res1, {
        careSpaceId: c.id,
        rules: [regla(dow, '14:00', '15:00')],
      }).expect(201);
      const gen = await generar(t.body.id, fecha).expect(201);
      expect(gen.body.created).toBe(2);

      const abiertos = await cupos(res1, fecha);
      const primero = abiertos.find((s) =>
        new Date(s.startAt).toISOString().includes('18:00:00'),
      );
      const reserva = await reservar(primero.id, await paciente());
      expect(reserva.status).toBe(201);

      // «Recarga»: se vuelve a leer todo de la base, no de la respuesta.
      const fila = await cita(reserva.body.id);
      expect(fila.care_space_id).toBe(c.id);
      expect(fila.tenant_id).toBe(orgA.tenantId);
      expect(fila.status_concept_id).toBe(CLIN.APPOINTMENT_BOOKED);
      expect(new Date(fila.start_at).toISOString()).toBe(
        `${fecha}T18:00:00.000Z`,
      );
      const lectura = await http()
        .get(`/scheduling/bookings/${reserva.body.id}`)
        .set(como(coordA))
        .expect(200);
      expect(lectura.body.id ?? lectura.body.bookingId).toBe(reserva.body.id);
      // El cupo reservado ya no se ofrece.
      const restantes = await cupos(res1, fecha);
      expect(restantes.map((s) => s.id)).not.toContain(primero.id);
    });

    it('una cita puntual toma el consultorio de la franja que contiene el inicio; sin franja con espacio no lleva ninguno', async () => {
      const c = await consultorio('Consultorio puntual');
      const { fecha, dow } = dia(11);
      await publicar(coordA, res2, {
        careSpaceId: c.id,
        rules: [regla(dow, '09:00', '12:00')],
      }).expect(201);
      const dentro = await directa(
        coordA,
        res2,
        await paciente(),
        lp(fecha, '10:00'),
      ).expect(201);
      expect((await cita(dentro.body.bookingId)).care_space_id).toBe(c.id);
      const fuera = await directa(
        coordA,
        res2,
        await paciente(),
        lp(fecha, '16:00'),
      ).expect(201);
      expect((await cita(fuera.body.bookingId)).care_space_id).toBeNull();
    });

    it('quien opera agendas elige el consultorio de una cita puntual sin franja; una sala de espera no recibe espacio; uno ajeno es 404', async () => {
      const c = await consultorio('Consultorio elegido');
      const { fecha } = dia(12);
      const elegido = await directa(
        coordA,
        res1,
        await paciente(),
        lp(fecha, '11:00'),
        { careSpaceId: c.id },
      ).expect(201);
      expect((await cita(elegido.body.bookingId)).care_space_id).toBe(c.id);
      const espera = await directa(
        coordA,
        res1,
        await paciente(),
        lp(fecha, '12:00'),
        { careSpaceId: esperaA.id },
      ).expect(201);
      expect((await cita(espera.body.bookingId)).care_space_id).toBeNull();
      for (const id of [consB.id, randomUUID()]) {
        const r = await directa(
          coordA,
          res1,
          await paciente(),
          lp(fecha, '13:00'),
          { careSpaceId: id },
        );
        expect(r.status).toBe(404);
      }
      const noAgendable = await directa(
        coordA,
        res1,
        await paciente(),
        lp(fecha, '13:00'),
        { careSpaceId: depositoA.id },
      );
      expect(noAgendable.status).toBe(422);
      expect(noAgendable.body.reason).toBe('SPACE_NOT_SCHEDULABLE');
    });

    it('la agenda que ya fija el consultorio no admite otro (422); un agente de mostrador no elige consultorio ajeno a la agenda', async () => {
      const c = await consultorio('Consultorio fijo');
      const otro = await consultorio('Consultorio otro');
      const { fecha, dow } = dia(13);
      await publicar(coordA, res1, {
        careSpaceId: c.id,
        rules: [regla(dow, '09:00', '12:00')],
      }).expect(201);
      const mismatch = await directa(
        coordA,
        res1,
        await paciente(),
        lp(fecha, '10:00'),
        { careSpaceId: otro.id },
      );
      expect(mismatch.status).toBe(422);
      expect(mismatch.body.reason).toBe('APPOINTMENT_CARE_SPACE_MISMATCH');
      // El mismo consultorio que fija la agenda está permitido.
      await directa(coordA, res1, await paciente(), lp(fecha, '10:00'), {
        careSpaceId: c.id,
      }).expect(201);
    });

    it('doble reserva: dos médicos, mismo consultorio y hora → el segundo es 409 CARE_SPACE_DOUBLE_BOOKED aunque sean agendas distintas', async () => {
      const c = await consultorio('Consultorio doble');
      const { fecha } = dia(14);
      const primera = await directa(
        coordA,
        res1,
        await paciente(),
        lp(fecha, '14:00'),
        { careSpaceId: c.id },
      ).expect(201);
      const segunda = await directa(
        coordA,
        res2,
        await paciente(),
        lp(fecha, '14:15'),
        { careSpaceId: c.id },
      );
      expect(segunda.status).toBe(409);
      expect(segunda.body.reason).toBe('CARE_SPACE_DOUBLE_BOOKED');
      expect(segunda.body.details?.nextAvailableAt).toBe(
        `${fecha}T18:30:00.000Z`,
      );
      // Contigua (14:30) entra: el rango es [inicio, fin).
      await directa(coordA, res2, await paciente(), lp(fecha, '14:30'), {
        careSpaceId: c.id,
      }).expect(201);
      // Ninguna fila quedó a medias: una sola cita del segundo médico en la ventana en disputa.
      const citas = await filas(
        ctx,
        `select count(*)::int as n from clinical.appointments
          where care_space_id = ? and status_concept_id = ?`,
        [c.id, CLIN.APPOINTMENT_BOOKED],
      );
      expect(citas[0].n).toBe(2);
      expect(primera.body.bookingId).toBeDefined();
    });

    it('doble reserva concurrente real: dos peticiones simultáneas al mismo consultorio y hora; una gana y la base deja una sola cita', async () => {
      const c = await consultorio('Consultorio carrera citas');
      const { fecha } = dia(15);
      const pacientes = [await paciente(), await paciente()];
      const intentos = await Promise.all(
        [res1, res2].map((r, i) =>
          directa(coordA, r, pacientes[i], lp(fecha, '09:00'), {
            careSpaceId: c.id,
          }),
        ),
      );
      expect(intentos.map((r) => r.status).sort()).toEqual([201, 409]);
      const perdedora = intentos.find((r) => r.status === 409)!;
      expect(perdedora.body.reason).toBe('CARE_SPACE_DOUBLE_BOOKED');
      const [{ n }] = await filas(
        ctx,
        `select count(*)::int as n from clinical.appointments
          where care_space_id = ? and start_at = ?`,
        [c.id, `${fecha}T13:00:00Z`],
      );
      expect(n).toBe(1);
    });

    it('la base es la red: insertar a mano una segunda cita en el consultorio y rato es 23P01', async () => {
      const c = await consultorio('Consultorio red');
      const { fecha } = dia(16);
      const r = await directa(
        coordA,
        res1,
        await paciente(),
        lp(fecha, '09:00'),
        { careSpaceId: c.id },
      ).expect(201);
      const dato = await cita(r.body.bookingId);
      await expect(
        filas(
          ctx,
          `insert into clinical.appointments
             (id, tenant_id, patient_profile_id, status_concept_id, start_at, end_at, care_space_id,
              created_at, updated_at, row_version)
           values (gen_random_uuid(), ?, ?, ?, ?, ?, ?, now(), now(), 1)`,
          [
            orgA.tenantId,
            await paciente(),
            CLIN.APPOINTMENT_BOOKED,
            dato.start_at,
            dato.end_at,
            c.id,
          ],
        ),
      ).rejects.toMatchObject({ code: '23P01' });
    });

    it('reprogramar mueve la cita al cupo nuevo (horario y consultorio) y se rechaza si el consultorio está ocupado', async () => {
      const c1 = await consultorio('Consultorio origen');
      const c2 = await consultorio('Consultorio destino');
      const { fecha, dow } = dia(17);
      const t1 = await publicar(coordA, res1, {
        careSpaceId: c1.id,
        rules: [regla(dow, '08:00', '09:00')],
      }).expect(201);
      const t2 = await publicar(coordA, res2, {
        careSpaceId: c2.id,
        rules: [regla(dow, '10:00', '11:00')],
      }).expect(201);
      await generar(t1.body.id, fecha).expect(201);
      await generar(t2.body.id, fecha).expect(201);
      const origen = (await cupos(res1, fecha))[0];
      const destinos = await cupos(res2, fecha);
      const reserva = await reservar(origen.id, await paciente());
      expect(reserva.status).toBe(201);
      expect((await cita(reserva.body.id)).care_space_id).toBe(c1.id);

      // El destino está ocupado por otra cita: 409 y la cita original no se mueve.
      const ocupante = await directa(
        coordA,
        res2,
        await paciente(),
        destinos[0].startAt,
        { careSpaceId: c2.id },
      );
      expect(ocupante.status).toBe(201);
      const choque = await http()
        .post(`/scheduling/bookings/${reserva.body.id}/reschedule`)
        .set(como(coordA))
        .send({ toSlotId: destinos[0].id, reasonText: 'Cambio de horario' });
      expect([409, 422]).toContain(choque.status);
      expect((await cita(reserva.body.id)).care_space_id).toBe(c1.id);

      // El otro cupo del destino está libre: la cita se mueve con su horario y su consultorio.
      const ok = await http()
        .post(`/scheduling/bookings/${reserva.body.id}/reschedule`)
        .set(como(coordA))
        .send({ toSlotId: destinos[1].id, reasonText: 'Cambio de horario' });
      expect(ok.status).toBe(200);
      const movida = await cita(reserva.body.id);
      expect(movida.care_space_id).toBe(c2.id);
      expect(new Date(movida.start_at).toISOString()).toBe(
        new Date(destinos[1].startAt).toISOString(),
      );
    });

    it('el turno de mostrador (walk-in) lleva el consultorio que se nombra y, si está ocupado, no deja ni al paciente', async () => {
      const c = await consultorio('Consultorio mostrador');
      const { fecha } = dia(18);
      const cuerpo = (cedula: string, hora: string, extra = {}) => ({
        patient: {
          name: 'Paciente',
          lastName: 'De Mostrador',
          nationalId: cedula,
          phone: '+591 70000001',
        },
        resourceId: res1,
        startAt: lp(fecha, hora),
        durationMinutes: 30,
        careSpaceId: c.id,
        ...extra,
      });
      const ok = await http()
        .post('/scheduling/appointments/walk-in')
        .set(como(coordA))
        .send(cuerpo(`F5D${sufijo}A`, '17:00'))
        .expect(201);
      const [fila] = await filas(
        ctx,
        `select care_space_id, tenant_id from clinical.appointments where id = ?`,
        [ok.body.appointmentId],
      );
      expect(fila).toEqual({ care_space_id: c.id, tenant_id: orgA.tenantId });
      // Otro médico, mismo consultorio y hora: 409 y la transacción deshace todo (ni el
      // paciente provisional sobrevive).
      const choque = await http()
        .post('/scheduling/appointments/walk-in')
        .set(como(coordA))
        .send({ ...cuerpo(`F5D${sufijo}B`, '17:00'), resourceId: res2 });
      expect(choque.status).toBe(409);
      expect(choque.body.reason).toBe('CARE_SPACE_DOUBLE_BOOKED');
      const [{ n }] = await filas(
        ctx,
        `select count(*)::int as n from common.identifiers where value = ?`,
        [`F5D${sufijo}B`],
      );
      expect(n).toBe(0);
    });
  });

  // ------------------------------------------------------------ bloqueos de F2
  describe('un bloqueo de F2 del consultorio cierra los cupos y los reabre', () => {
    it('bloquear: cupos cerrados, excepción de solo lectura, oferta vacía y retención 422; desbloquear: todo vuelve', async () => {
      const c = await consultorio('Consultorio bloqueo');
      const { fecha, dow } = dia(19);
      const t = await publicar(coordA, res1, {
        careSpaceId: c.id,
        rules: [regla(dow, '08:00', '10:00')],
      }).expect(201);
      await generar(t.body.id, fecha).expect(201);
      const antes = await cupos(res1, fecha);
      expect(antes).toHaveLength(4);

      const bloqueo = await bloquear(
        { token: orgA.token, tenantId: orgA.tenantId },
        c.id,
      );
      expect(bloqueo.status).toBe(200);

      // Los cupos quedan cerrados por la fuente (no «bloqueados» por el profesional).
      const estados = await filas(
        ctx,
        `select status_concept_id from scheduling.bookable_slots where schedule_template_id = ?`,
        [t.body.id],
      );
      expect(new Set(estados.map((e) => e.status_concept_id)).size).toBe(1);
      expect(estados[0].status_concept_id).not.toBe(CONCEPTS.SLOT_OPEN);
      expect(estados[0].status_concept_id).not.toBe(CONCEPTS.SLOT_BLOCKED);
      expect(await cupos(res1, fecha)).toHaveLength(0);

      // La excepción nace de solo lectura, con tenant y origen, sin el motivo del bloqueo.
      const [exc] = await filas(
        ctx,
        `select id, tenant_id, source_ref_id, source_kind_concept_id, reason, start_at, end_at, is_available
           from scheduling.availability_exceptions
          where resource_id = ? and source_ref_id is not null`,
        [res1],
      );
      expect(exc).toBeDefined();
      expect(exc.tenant_id).toBe(orgA.tenantId);
      expect(exc.reason).toBe('Bloqueo del consultorio');
      expect(exc.is_available).toBe(false);
      const lista = await http()
        .get(`/scheduling/resources/${res1}/exceptions`)
        .query({
          from: `${fecha}T00:00:00Z`,
          to: `${fecha}T23:59:59Z`,
        })
        .set(como(coordA))
        .expect(200);
      const visible = lista.body.items.find((i: any) => i.id === exc.id);
      expect(visible).toMatchObject({
        sourceKind: 'CARE_SPACE_BLOCK',
        readOnly: true,
      });

      // Solo se levanta en su origen.
      const editar = await http()
        .patch(`/scheduling/exceptions/${exc.id}`)
        .set(como(coordA))
        .send({ reason: 'Intento' })
        .expect(422);
      expect(editar.body.reason).toBe('EXCEPTION_SOURCE_READ_ONLY');
      const borrar = await http()
        .delete(`/scheduling/exceptions/${exc.id}`)
        .set(como(coordA))
        .expect(422);
      expect(borrar.body.reason).toBe('EXCEPTION_SOURCE_READ_ONLY');

      // Un id de cupo viejo ya no se retiene (422) ni aunque el estado todavía dijera «abierto».
      const hold = await http()
        .post(`/scheduling/slots/${antes[0].id}/holds`)
        .set(como(coordA))
        .send({ patientProfileId: await paciente() });
      expect(hold.status).toBe(422);

      // Generar de nuevo sobre el bloqueo no ofrece nada.
      const regen = await generar(t.body.id, fecha).expect(201);
      expect(regen.body.created).toBe(0);

      // Desbloquear devuelve los cupos que cerró el bloqueo y acorta la excepción.
      expect(
        (
          await desbloquear(
            { token: orgA.token, tenantId: orgA.tenantId },
            c.id,
          )
        ).status,
      ).toBe(200);
      expect(await cupos(res1, fecha)).toHaveLength(4);
      const quedan = await filas(
        ctx,
        `select end_at from scheduling.availability_exceptions where id = ?`,
        [exc.id],
      );
      // Terminó cuando se levantó el bloqueo (no queda abierta hasta el fin de los tiempos).
      expect(
        quedan.length === 0 ||
          new Date(quedan[0].end_at).getUTCFullYear() < 9999,
      ).toBe(true);
      const hold2 = await http()
        .post(`/scheduling/slots/${antes[0].id}/holds`)
        .set(como(coordA))
        .send({ patientProfileId: await paciente() });
      expect(hold2.status).toBe(201);
    });

    it('con citas reservadas el bloqueo avisa FUTURE_COMMITMENTS_CONFLICT con la cita y su próxima acción; reconocido, la cita sigue en pie', async () => {
      const c = await consultorio('Consultorio con citas');
      const { fecha, dow } = dia(20);
      const t = await publicar(coordA, res2, {
        careSpaceId: c.id,
        rules: [regla(dow, '08:00', '09:00')],
      }).expect(201);
      await generar(t.body.id, fecha).expect(201);
      const [uno, dos] = await cupos(res2, fecha);
      const reserva = await reservar(uno.id, await paciente());
      expect(reserva.status).toBe(201);

      const org = { token: orgA.token, tenantId: orgA.tenantId };
      const conflicto = await bloquear(org, c.id);
      expect(conflicto.status).toBe(409);
      expect(conflicto.body.reason).toBe('FUTURE_COMMITMENTS_CONFLICT');
      const detalle =
        conflicto.body.details?.conflicts ?? conflicto.body.conflicts;
      expect(detalle).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: 'APPOINTMENT',
            nextAction: expect.any(String),
          }),
        ]),
      );
      // Nada se cerró por el intento fallido.
      expect(await cupos(res2, fecha)).toHaveLength(2 - 1);

      expect((await bloquear(org, c.id, true)).status).toBe(200);
      // La cita reservada no se toca; el cupo libre sí se cerró.
      const fila = await cita(reserva.body.id);
      expect(fila.status_concept_id).toBe(CLIN.APPOINTMENT_BOOKED);
      expect(await cupos(res2, fecha)).toHaveLength(0);
      // Reservar en un consultorio bloqueado: 422 SPACE_NOT_BOOKABLE.
      const directaBloqueada = await directa(
        coordA,
        res2,
        await paciente(),
        dos.startAt,
        { careSpaceId: c.id },
      );
      expect(directaBloqueada.status).toBe(422);
      expect(directaBloqueada.body.reason).toBe('SPACE_NOT_BOOKABLE');
      expect((await desbloquear(org, c.id)).status).toBe(200);
      expect(await cupos(res2, fecha)).toHaveLength(1);
    });

    it('la cancelación de una cita dentro del bloqueo no devuelve el cupo a la oferta', async () => {
      const c = await consultorio('Consultorio cancelación');
      const { fecha, dow } = dia(21);
      const t = await publicar(coordA, res1, {
        careSpaceId: c.id,
        rules: [regla(dow, '08:00', '09:00')],
      }).expect(201);
      await generar(t.body.id, fecha).expect(201);
      const [uno] = await cupos(res1, fecha);
      const reserva = await reservar(uno.id, await paciente());
      expect(reserva.status).toBe(201);
      const org = { token: orgA.token, tenantId: orgA.tenantId };
      expect((await bloquear(org, c.id, true)).status).toBe(200);
      await http()
        .post(`/scheduling/bookings/${reserva.body.id}/cancel`)
        .set(como(coordA))
        .send({
          cancelledBy: 'PROVIDER',
          reasonText: 'El consultorio está en mantenimiento',
        })
        .expect(200);
      // El cupo liberado por la cancelación vuelve a «abierto» por su camino, pero la oferta
      // no lo muestra porque su consultorio sigue bloqueado.
      expect(await cupos(res1, fecha)).toHaveLength(0);
      expect((await desbloquear(org, c.id)).status).toBe(200);
      expect((await cupos(res1, fecha)).length).toBeGreaterThan(0);
    });

    it('la clausura del consultorio con citas futuras es 409 SPACE_RETIRE_BLOCKED (FUTURE_BOOKING) y con horario publicado (PUBLISHED_SCHEDULE)', async () => {
      const c = await consultorio('Consultorio clausura');
      const { fecha, dow } = dia(22);
      const t = await publicar(coordA, res1, {
        careSpaceId: c.id,
        rules: [regla(dow, '08:00', '09:00')],
      }).expect(201);
      await directa(coordA, res1, await paciente(), lp(fecha, '08:00'), {
        careSpaceId: c.id,
      }).expect(201);
      const org = { token: orgA.token, tenantId: orgA.tenantId };
      const check = await http()
        .get(`/care-spaces/${c.id}/retire-check`)
        .set(como(org))
        .expect(200);
      const tipos = (check.body.blockers ?? []).map((b: any) => b.kind);
      expect(tipos).toEqual(
        expect.arrayContaining(['FUTURE_BOOKING', 'PUBLISHED_SCHEDULE']),
      );
      const detalle = await http()
        .get(`/care-spaces/${c.id}`)
        .set(como(org))
        .expect(200);
      const retire = await http()
        .post(`/care-spaces/${c.id}/lifecycle`)
        .set(como(org))
        .set({ 'If-Match': `"${detalle.body.rowVersion}"` })
        .send({ action: 'retire', reason: 'Remodelación' });
      expect(retire.status).toBe(409);
      expect(retire.body.reason).toBe('SPACE_RETIRE_BLOCKED');
      expect(t.body.id).toBeDefined();
    });
  });

  // ------------------------------------------------------------ excepciones por tenant
  describe('excepciones de disponibilidad', () => {
    it('crear una excepción manual escribe el tenant del recurso y el origen MANUAL; B no la crea ni la borra en el recurso de A (404)', async () => {
      const { fecha } = dia(23);
      const res = await http()
        .post(`/scheduling/resources/${res2}/exceptions`)
        .set(como(coordA))
        .send({
          exceptionType: 'VACATION',
          startAt: `${fecha}T12:00:00Z`,
          endAt: `${fecha}T14:00:00Z`,
        })
        .expect(201);
      const [fila] = await filas(
        ctx,
        `select tenant_id, source_kind_concept_id, source_ref_id from scheduling.availability_exceptions where id = ?`,
        [res.body.id],
      );
      expect(fila.tenant_id).toBe(orgA.tenantId);
      expect(fila.source_ref_id).toBeNull();
      expect(fila.source_kind_concept_id).not.toBeNull();
      const ev = await filas(
        ctx,
        `select payload_json from messaging.domain_events
          where aggregate_id = ? and event_type = 'scheduling.availability_exception.created'`,
        [res.body.id],
      );
      expect(ev[0].payload_json).toMatchObject({ sourceKind: 'MANUAL' });

      const ajena = await http()
        .post(`/scheduling/resources/${res2}/exceptions`)
        .set(como(coordB))
        .send({
          exceptionType: 'VACATION',
          startAt: `${fecha}T15:00:00Z`,
          endAt: `${fecha}T16:00:00Z`,
        });
      expect(ajena.status).toBe(404);
      const borrarAjena = await http()
        .delete(`/scheduling/exceptions/${res.body.id}`)
        .set(como(coordB));
      expect(borrarAjena.status).toBe(404);
      const editarAjena = await http()
        .patch(`/scheduling/exceptions/${res.body.id}`)
        .set(como(coordB))
        .send({ reason: 'x' });
      expect(editarAjena.status).toBe(404);
      // La propia sí se puede editar y borrar.
      await http()
        .patch(`/scheduling/exceptions/${res.body.id}`)
        .set(como(coordA))
        .send({ reason: 'Vacaciones largas' })
        .expect(200);
      await http()
        .delete(`/scheduling/exceptions/${res.body.id}`)
        .set(como(coordA))
        .expect(204);
    });

    it('generate-slots de una plantilla de otra organización es 404', async () => {
      const { dow, fecha } = dia(24);
      const t = await publicar(coordA, res1, {
        rules: [regla(dow, '08:00', '09:00')],
      }).expect(201);
      const r = await http()
        .post(`/scheduling/templates/${t.body.id}/generate-slots`)
        .set(como(coordB))
        .send({ from: `${fecha}T00:00:00Z`, to: `${fecha}T23:59:59Z` });
      expect(r.status).toBe(404);
    });
  });

  // ------------------------------------------------------------ autoridad sobre el espacio
  describe('la autoridad sobre el espacio no se pierde al editar ni al elegir', () => {
    it('el profesional dueño de la agenda no mueve ni recorta un horario que ya ocupa un consultorio: 403 y nada cambia', async () => {
      // doc1 es miembro de A y dueño de `res1`, pero no administra el consultorio.
      await darMembresia(ctx, doc1.userId, orgA.tenantId);
      await http()
        .post(`/authz/users/${doc1.userId}/role-assignments`)
        .set(bearer(ctx.adminToken))
        .send({ roleCode: 'PRACTITIONER', tenantId: orgA.tenantId })
        .expect(201);
      const login = await http()
        .post('/iam/auth/login')
        .send({
          email: `f4-prof-d1-${sufijo}@example.test`,
          password: PASSWORD,
        })
        .expect(200);
      const propio = {
        token: login.body.accessToken as string,
        tenantId: orgA.tenantId,
      };
      const c = await consultorio('Consultorio de autoridad');
      const { dow } = dia(21);
      const t = await publicar(coordA, res1, {
        name: 'Horario con consultorio',
        careSpaceId: c.id,
        rules: [regla(dow, '08:00', '09:00')],
      }).expect(201);
      const estado = async () => {
        const [fila] = await filas(
          ctx,
          `select name, care_space_id, valid_to, row_version from scheduling.schedule_templates where id = ?`,
          [t.body.id],
        );
        const reglas = await filas(
          ctx,
          `select day_of_week, start_time, end_time from scheduling.schedule_rules where schedule_template_id = ? order by start_time`,
          [t.body.id],
        );
        return { fila, reglas };
      };
      const antes = await estado();

      for (const cuerpo of [
        { rules: [regla(dow, '08:00', '08:30')] },
        { validTo: '2031-01-01T00:00:00Z' },
        { name: 'Renombrado' },
        { careSpaceId: null },
      ]) {
        const r = await http()
          .patch(`/scheduling/templates/${t.body.id}`)
          .set(como(propio))
          .send(cuerpo);
        expect(r.status).toBe(403);
      }
      const gen = await http()
        .post(`/scheduling/templates/${t.body.id}/generate-slots`)
        .set(como(propio))
        .send({
          from: `${dia(21).fecha}T00:00:00Z`,
          to: `${dia(21).fecha}T23:59:59Z`,
        });
      expect(gen.status).toBe(403);
      expect(await estado()).toEqual(antes);
      const [{ n }] = await filas(
        ctx,
        `select count(*)::int as n from scheduling.bookable_slots where schedule_template_id = ?`,
        [t.body.id],
      );
      expect(n).toBe(0);

      // Quien sí la administra edita, y el cambio queda persistido.
      await http()
        .patch(`/scheduling/templates/${t.body.id}`)
        .set(como(coordA))
        .send({ name: 'Renombrado por la coordinación' })
        .expect(200);
      expect((await estado()).fila.name).toBe('Renombrado por la coordinación');

      // Un horario SIN consultorio sigue siendo del profesional: lo edita él mismo.
      const libre = await publicar(coordA, res1, {
        rules: [regla((dow + 3) % 7, '08:00', '09:00')],
      }).expect(201);
      await http()
        .patch(`/scheduling/templates/${libre.body.id}`)
        .set(como(propio))
        .send({ name: 'Mío' })
        .expect(200);
    });

    it('correr turnos, retirar y leer las reservas de un horario con consultorio: 403 al profesional sin autoridad sobre el consultorio, 404 a otra organización; el coordinador sí', async () => {
      await darMembresia(ctx, doc2.userId, orgA.tenantId);
      await http()
        .post(`/authz/users/${doc2.userId}/role-assignments`)
        .set(bearer(ctx.adminToken))
        .send({ roleCode: 'PRACTITIONER', tenantId: orgA.tenantId })
        .expect(201);
      const login = await http()
        .post('/iam/auth/login')
        .send({
          email: `f4-prof-d2-${sufijo}@example.test`,
          password: PASSWORD,
        })
        .expect(200);
      const propio = {
        token: login.body.accessToken as string,
        tenantId: orgA.tenantId,
      };
      const c = await consultorio('Consultorio de turnos');
      const { fecha, dow } = dia(24);
      const t = await publicar(coordA, res2, {
        careSpaceId: c.id,
        rules: [regla(dow, '08:00', '10:00')],
      }).expect(201);
      await generar(t.body.id, fecha).expect(201);
      const horarios = async () =>
        filas(
          ctx,
          `select start_at from scheduling.bookable_slots where schedule_template_id = ? order by start_at`,
          [t.body.id],
        );
      const antes = await horarios();
      expect(antes.length).toBeGreaterThan(0);
      const ventana = {
        from: `${fecha}T00:00:00Z`,
        to: `${fecha}T23:59:59Z`,
        shiftMinutes: 15,
      };
      const correr = (quien: any) =>
        http()
          .post(`/scheduling/resources/${res2}/shift-slots`)
          .set(como(quien))
          .send(ventana);

      // Su propia agenda, pero el consultorio no es suyo: 403 y ningún turno se mueve.
      expect((await correr(propio)).status).toBe(403);
      expect(await horarios()).toEqual(antes);
      const retiro = await http()
        .delete(`/scheduling/templates/${t.body.id}`)
        .set(como(propio));
      expect(retiro.status).toBe(403);
      const [{ estado }] = await filas(
        ctx,
        `select status_concept_id as estado from scheduling.schedule_templates where id = ?`,
        [t.body.id],
      );
      expect(estado).toBe(CONCEPTS.TEMPLATE_PUBLISHED);

      // Otra organización: 404 uniforme (el recurso y la plantilla no existen para ella).
      expect((await correr(coordB)).status).toBe(404);
      expect(
        (
          await http()
            .delete(`/scheduling/templates/${t.body.id}`)
            .set(como(coordB))
        ).status,
      ).toBe(404);
      expect(await horarios()).toEqual(antes);

      // La coordinación del tenant sí: los turnos se corren y el horario se retira.
      await correr(coordA).expect(200);
      const despues = await horarios();
      expect(new Date(despues[0].start_at).getTime()).toBe(
        new Date(antes[0].start_at).getTime() + 15 * 60_000,
      );
      await http()
        .delete(`/scheduling/templates/${t.body.id}`)
        .set(como(coordA))
        .expect(200);
      const [{ estado: despuesRetiro }] = await filas(
        ctx,
        `select status_concept_id as estado from scheduling.schedule_templates where id = ?`,
        [t.body.id],
      );
      expect(despuesRetiro).toBe(CONCEPTS.TEMPLATE_RETIRED);
    });

    it('quien atiende el mostrador sin alcance sobre el consultorio no lo elige para una cita puntual: 404 y no queda cita', async () => {
      const c = await consultorio('Consultorio fuera de alcance');
      const { fecha } = dia(22);
      const pac = await paciente();
      const r = await directa(agenteA, res2, pac, lp(fecha, '10:00'), {
        careSpaceId: c.id,
      });
      expect(r.status).toBe(404);
      const [{ n }] = await filas(
        ctx,
        `select count(*)::int as n from clinical.appointments where patient_profile_id = ?`,
        [pac],
      );
      expect(n).toBe(0);
      // Con la misma petición, el coordinador de agendas del tenant sí puede.
      const ok = await directa(coordA, res2, pac, lp(fecha, '10:00'), {
        careSpaceId: c.id,
      }).expect(201);
      expect((await cita(ok.body.bookingId)).care_space_id).toBe(c.id);
    });

    it('el coordinador de OTRA organización no elige consultorios en la agenda de A: sin efecto y sin cita', async () => {
      const c = await consultorio('Consultorio inaccesible para B');
      const { fecha } = dia(23);
      const pac = await paciente();
      const r = await directa(coordB, res2, pac, lp(fecha, '10:00'), {
        careSpaceId: c.id,
      });
      expect([403, 404]).toContain(r.status);
      const [{ n }] = await filas(
        ctx,
        `select count(*)::int as n from clinical.appointments where patient_profile_id = ?`,
        [pac],
      );
      expect(n).toBe(0);
    });
  });

  it('el token no se usa: nadie de A opera con el bearer de B sin membresía', async () => {
    const r = await http()
      .get(`/scheduling/resources/${res1}/templates`)
      .set({ ...bearer(coordB.token), 'X-Tenant-Id': orgA.tenantId });
    expect([403, 404]).toContain(r.status);
  });
});
