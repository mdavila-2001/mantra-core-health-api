import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { CONCEPTS } from '../../src/common';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  camposObligatoriosDePaciente,
  identidadProfesional,
} from './harness';

/**
 * P23 · cambiar un horario que tiene citas, contra la base real.
 *
 * «Cambiar mi horario» es, para la pantalla, retirar el horario vigente y
 * publicar el nuevo (`agenda-create.ts#retirarVigenteYCrear`). El retiro ya no
 * frena con 409 (M4 · H1.S2.M2); esta suite fija lo que lo hace SEGURO:
 *
 * 1. La cita viva sigue en su cupo y confirmada.
 * 2. Ningún cupo del horario retirado se vuelve a ofrecer —ni el de la cita, ni
 *    el de una cita cancelada—, tampoco cuando la cita viva se cancela después.
 * 3. El horario nuevo no genera un turno encima de la cita conservada.
 * 4. Una retención concurrente con el retiro no lo tumba.
 *
 * Datos sintéticos: personas y agendas inventadas, creadas por la suite.
 */
describe('P23 · cambiar un horario con citas', () => {
  let ctx: TestContext;
  let camposDePaciente: Awaited<
    ReturnType<typeof camposObligatoriosDePaciente>
  >;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const medico = {
    email: `p23-med-${sufijo}@example.test`,
    token: '',
    hpid: '',
    tenantId: '',
  };
  const paciente = { nationalId: `P23${sufijo}`, token: '', pid: '' };
  const otro = { email: `p23-otro-${sufijo}@example.test`, token: '' };

  let resourceId = '';
  let viejoId = '';
  let nuevoId = '';
  let lunes = new Date();
  let citaViva = { id: '', slotId: '' };
  let citaCancelada = { id: '', slotId: '' };

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  function proximoLunes(): Date {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7));
    return d;
  }

  const ventana = () => ({
    from: lunes.toISOString(),
    to: new Date(lunes.getTime() + 24 * 3600 * 1000).toISOString(),
  });

  async function sql<T>(query: string, params: unknown[]): Promise<T[]> {
    return ctx.orm.em.getConnection().execute<T[]>(query, params);
  }

  async function cuposDe(templateId: string) {
    return sql<{
      id: string;
      start_at: Date;
      end_at: Date;
      status_concept_id: string;
    }>(
      `select id, start_at, end_at, status_concept_id from scheduling.bookable_slots
        where schedule_template_id = ? order by start_at`,
      [templateId],
    );
  }

  async function ofrecidos(): Promise<string[]> {
    const res = await http()
      .get('/scheduling/slots')
      .query({ resourceId, ...ventana(), onlyAvailable: true })
      .set(bearer(paciente.token))
      .expect(200);
    return res.body.items.map((i: { id: string }) => i.id);
  }

  async function reservar(slotId: string): Promise<string> {
    const hold = await http()
      .post(`/scheduling/slots/${slotId}/holds`)
      .set(bearer(paciente.token))
      .send({ patientProfileId: paciente.pid })
      .expect(201);
    const solicitud = await http()
      .post(`/scheduling/holds/${hold.body.holdToken}/request`)
      .set(bearer(paciente.token))
      .send({
        tenantId: medico.tenantId,
        patientProfileId: paciente.pid,
        channel: 'PORTAL',
        reasonText: 'Control de rutina',
      })
      .expect(201);
    await http()
      .post(`/scheduling/bookings/${solicitud.body.id}/accept`)
      .set(bearer(medico.token))
      .send({})
      .expect(200);
    return solicitud.body.id;
  }

  async function publicar(nombre: string, minutos: number): Promise<string> {
    const plantilla = await http()
      .post(`/scheduling/resources/${resourceId}/templates`)
      .set(bearer(medico.token))
      .send({
        name: nombre,
        slotMinutes: minutos,
        rules: [
          {
            dayOfWeek: 1,
            startTime: '14:00:00',
            endTime: '16:00:00',
            slotMinutes: minutos,
            capacityPerSlot: 1,
          },
        ],
      })
      .expect(201);
    return plantilla.body.id;
  }

  async function profesional(email: string, nombre: string, lic: string) {
    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(email),
        email,
        password: PASSWORD,
        name: nombre,
        lastName: 'Sintético',
        licenseNumber: `LIC-${lic}-${sufijo}`,
        credentialNumber: `CRED-${lic}-${sufijo}`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return {
      hpid: alta.body.practitionerProfileId as string,
      token: login.body.accessToken as string,
    };
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    camposDePaciente = await camposObligatoriosDePaciente(ctx);
    lunes = proximoLunes();

    const m = await profesional(medico.email, 'Elena', 'P23');
    medico.hpid = m.hpid;
    medico.token = m.token;
    medico.tenantId = (claims(medico.token)['tenants'] as string[])[0];
    otro.token = (await profesional(otro.email, 'Tomás', 'P23O')).token;

    const altaPaciente = await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId: paciente.nationalId,
        password: PASSWORD,
        email: `p23-pac-${sufijo}@example.test`,
        name: 'Lucía',
        lastName: 'Sintética',
      })
      .expect(201);
    paciente.pid =
      altaPaciente.body.patientProfileId ?? altaPaciente.body.profileId;
    const loginPaciente = await http()
      .post('/iam/auth/login')
      .send({ nationalId: paciente.nationalId, password: PASSWORD })
      .expect(200);
    paciente.token = loginPaciente.body.accessToken;

    const recurso = await http()
      .post('/scheduling/resources')
      .set(bearer(medico.token))
      .send({
        tenantId: medico.tenantId,
        resourceType: 'PRACTITIONER',
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: medico.hpid,
        name: 'Consultorio P23',
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);
    resourceId = recurso.body.id;

    viejoId = await publicar('Tardes P23 · 30 min', 30);
    await http()
      .post(`/scheduling/templates/${viejoId}/generate-slots`)
      .set(bearer(medico.token))
      .send(ventana())
      .expect(201);

    // Una cita viva en el primer turno y una cancelada en el segundo: las dos
    // son historia que el retiro conserva.
    const [primero, segundo] = await cuposDe(viejoId);
    citaViva = { id: await reservar(primero.id), slotId: primero.id };
    citaCancelada = { id: await reservar(segundo.id), slotId: segundo.id };
    await http()
      .post(`/scheduling/bookings/${citaCancelada.id}/cancel`)
      .set(bearer(paciente.token))
      .send({ cancelledBy: 'PATIENT', reasonText: 'No puedo asistir' })
      .expect(200);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('el cupo de la cita cancelada se volvió a ofrecer antes del cambio', async () => {
    // Punto de partida: sin esto, el «no se ofrece» de después no probaría nada.
    expect(await ofrecidos()).toContain(citaCancelada.slotId);
  });

  it('otro profesional no puede retirar el horario: 403, y no se toca nada', async () => {
    await http()
      .delete(`/scheduling/templates/${viejoId}`)
      .set(bearer(otro.token))
      .expect(403);
    const cupos = await cuposDe(viejoId);
    expect(cupos.length).toBeGreaterThan(2);
    expect(
      cupos.every((c) => c.status_concept_id !== CONCEPTS.SLOT_BLOCKED),
    ).toBe(true);
  });

  it('retirar con una cita viva responde 200 y la conserva', async () => {
    const res = await http()
      .delete(`/scheduling/templates/${viejoId}`)
      .set(bearer(medico.token))
      .expect(200);

    expect(res.body.liveBookings).toBe(1);
    expect(res.body.liveBookingIds).toEqual([citaViva.id]);
    expect(res.body.keptSlots).toBe(2);
    expect(res.body.releasedSlots).toBeGreaterThan(0);
    expect(res.body.cancelledBookings).toBe(0);
  });

  it('los dos cupos conservados quedan cerrados y ninguno del horario viejo se ofrece', async () => {
    const cupos = await cuposDe(viejoId);
    expect(cupos.map((c) => c.id).sort()).toEqual(
      [citaViva.slotId, citaCancelada.slotId].sort(),
    );
    expect(
      cupos.every((c) => c.status_concept_id === CONCEPTS.SLOT_BLOCKED),
    ).toBe(true);

    const ofrecen = await ofrecidos();
    expect(ofrecen).not.toContain(citaViva.slotId);
    expect(ofrecen).not.toContain(citaCancelada.slotId);
  });

  it('la cita viva sigue confirmada en su cupo de siempre', async () => {
    const [cita] = await sql<{
      bookable_slot_id: string;
      status_concept_id: string;
    }>(
      'select bookable_slot_id, status_concept_id from scheduling.appointment_bookings where id = ?',
      [citaViva.id],
    );
    expect(cita.bookable_slot_id).toBe(citaViva.slotId);
    expect(cita.status_concept_id).toBe(CONCEPTS.BOOKING_CONFIRMED);
  });

  it('el horario nuevo de 45 min se publica y no genera un turno encima de la cita', async () => {
    nuevoId = await publicar('Tardes P23 · 45 min', 45);
    const gen = await http()
      .post(`/scheduling/templates/${nuevoId}/generate-slots`)
      .set(bearer(medico.token))
      .send(ventana())
      .expect(201);
    // 14:00, 14:45 y 15:30 (el último se completa hasta 16:15); el de las
    // 14:00 pisa la cita de 14:00–14:30 y se omite.
    expect(gen.body.omittedByCommitments).toBe(1);
    expect(gen.body.created).toBe(2);

    const cupos = await cuposDe(nuevoId);
    const [viva] = await sql<{
      start_at: Date | string;
      end_at: Date | string;
    }>('select start_at, end_at from scheduling.bookable_slots where id = ?', [
      citaViva.slotId,
    ]);
    // Ninguno se cruza con la cita, y todos duran lo que dice el horario nuevo.
    // El driver devuelve las marcas de tiempo crudas: se comparan como instantes.
    const t = (v: Date | string) => new Date(v).getTime();
    for (const c of cupos) {
      expect(
        t(c.start_at) >= t(viva.end_at) || t(c.end_at) <= t(viva.start_at),
      ).toBe(true);
      expect(t(c.end_at) - t(c.start_at)).toBe(45 * 60_000);
    }
    const ofrecen = await ofrecidos();
    expect(cupos.every((c) => ofrecen.includes(c.id))).toBe(true);
  });

  it('cancelada la cita viva, su cupo del horario retirado no vuelve a ofrecerse', async () => {
    await http()
      .post(`/scheduling/bookings/${citaViva.id}/cancel`)
      .set(bearer(medico.token))
      .send({
        cancelledBy: 'PROVIDER',
        reasonText: 'Cambio de horario de atención',
      })
      .expect(200);

    const [cupo] = await sql<{ status_concept_id: string }>(
      'select status_concept_id from scheduling.bookable_slots where id = ?',
      [citaViva.slotId],
    );
    expect(cupo.status_concept_id).toBe(CONCEPTS.SLOT_BLOCKED);
    expect(await ofrecidos()).not.toContain(citaViva.slotId);
  });

  it('retener un cupo del horario retirado se rechaza: 422', async () => {
    await http()
      .post(`/scheduling/slots/${citaCancelada.slotId}/holds`)
      .set(bearer(paciente.token))
      .send({ patientProfileId: paciente.pid })
      .expect(422);
  });

  it('una retención concurrente con el retiro no lo tumba ni deja huérfanos', async () => {
    const [libre] = await cuposDe(nuevoId);
    const [hold, retiro] = await Promise.all([
      http()
        .post(`/scheduling/slots/${libre.id}/holds`)
        .set(bearer(paciente.token))
        .send({ patientProfileId: paciente.pid }),
      http()
        .delete(`/scheduling/templates/${nuevoId}`)
        .set(bearer(medico.token)),
    ]);

    expect(retiro.status).toBe(200);
    // O la retención llegó antes y el retiro la soltó con su cupo libre, o llegó
    // después y encontró el cupo borrado: nunca un 5xx.
    expect([201, 404]).toContain(hold.status);
    const restos = await sql<{ n: string }>(
      `select count(*) as n from scheduling.slot_holds h
         join scheduling.bookable_slots s on s.id = h.bookable_slot_id
        where s.schedule_template_id = ?`,
      [nuevoId],
    );
    expect(Number(restos[0].n)).toBe(0);
    expect(await cuposDe(nuevoId)).toHaveLength(0);
  });
});
