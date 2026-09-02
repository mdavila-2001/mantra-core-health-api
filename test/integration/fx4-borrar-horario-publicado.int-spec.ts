import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';

/**
 * FX-4 · borrar un horario publicado avisa antes de romper nada.
 *
 * ## Qué decide esta suite
 *
 * El propietario pidió «un botón de borrar **definitivamente** plantilla de
 * horario» (TAREA-10, punto 6). Definitivamente no se deshace, y una plantilla
 * con pacientes citados no es una fila: son personas que van a presentarse un
 * día a una hora.
 *
 * Borrarla en silencio las deja sin turno **y sin enterarse**, porque borrar la
 * plantilla no dispara ningún aviso de cancelación — cancelar es otra
 * operación, con su motivo obligatorio y su aviso a la contraparte.
 *
 * La decisión tomada: **avisar y no borrar**. Estas pruebas la fijan desde
 * afuera, contra la base real, en sus dos caminos.
 *
 * ## Por qué contra la base y no sólo con mocks
 *
 * El servicio tiene pruebas unitarias que cubren la lógica, pero ahí quien
 * decide si hay citas vivas es el doble de pruebas. Lo que hace falta demostrar
 * es que la consulta encuentra de verdad las citas que cuelgan de los cupos de
 * la plantilla —dos saltos de tabla— y que el borrado se lleva consigo lo que
 * dice llevarse.
 */
describe('FX-4 · borrar un horario publicado', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const medico = {
    email: `fx4-med-${sufijo}@example.test`,
    token: '',
    hpid: '',
    tenantId: '',
  };
  const paciente = { nationalId: `FX4${sufijo}`, token: '', pid: '' };

  let resourceId = '';
  let templateId = '';
  let bookingId = '';

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  /** El lunes siguiente: fijar una fecha literal haría caducar la suite. */
  function proximoLunes(): Date {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7));
    return d;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        email: medico.email,
        password: PASSWORD,
        name: 'Rocío',
        lastName: 'Vega',
        licenseNumber: `LIC-FX4-${sufijo}`,
        credentialNumber: `CRED-FX4-${sufijo}`,
      })
      .expect(201);
    medico.hpid = alta.body.practitionerProfileId;

    const login = await http()
      .post('/iam/auth/login')
      .send({ email: medico.email, password: PASSWORD })
      .expect(200);
    medico.token = login.body.accessToken;
    medico.tenantId = (claims(medico.token)['tenants'] as string[])[0];

    const altaPaciente = await http()
      .post('/iam/auth/register-patient')
      .send({
        nationalId: paciente.nationalId,
        password: PASSWORD,
        email: `fx4-pac-${sufijo}@example.test`,
        name: 'Carla',
        lastName: 'Ríos',
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
        name: 'Consultorio FX-4',
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);
    resourceId = recurso.body.id;

    const plantilla = await http()
      .post(`/scheduling/resources/${resourceId}/templates`)
      .set(bearer(medico.token))
      .send({
        name: 'Tardes FX-4',
        slotMinutes: 30,
        rules: [
          {
            dayOfWeek: 1,
            startTime: '14:00:00',
            endTime: '16:00:00',
            slotMinutes: 30,
            capacityPerSlot: 1,
          },
        ],
      })
      .expect(201);
    templateId = plantilla.body.id;

    const desde = proximoLunes();
    await http()
      .post(`/scheduling/templates/${templateId}/generate-slots`)
      .set(bearer(medico.token))
      .send({
        from: desde.toISOString(),
        to: new Date(desde.getTime() + 24 * 3600 * 1000).toISOString(),
      })
      .expect(201);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  /** Cuántas filas quedan de la plantilla, sus franjas y sus cupos. */
  async function restosDeLaPlantilla(): Promise<number> {
    const filas = await ctx.orm.em.getConnection().execute<{ n: string }[]>(
      `select (select count(*) from scheduling.schedule_templates where id = ?)
            + (select count(*) from scheduling.schedule_rules where schedule_template_id = ?)
            + (select count(*) from scheduling.bookable_slots where schedule_template_id = ?)
         as n`,
      [templateId, templateId, templateId],
    );
    return Number(filas[0].n);
  }

  it('el paciente reserva y el profesional acepta: hay compromiso', async () => {
    const cupo = await ctx.orm.em.getConnection().execute<{ id: string }[]>(
      `select id from scheduling.bookable_slots
        where schedule_template_id = ? order by start_at limit 1`,
      [templateId],
    );

    const hold = await http()
      .post(`/scheduling/slots/${cupo[0].id}/holds`)
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
    bookingId = solicitud.body.id;

    await http()
      .post(`/scheduling/bookings/${bookingId}/accept`)
      .set(bearer(medico.token))
      .send({})
      .expect(200);
  });

  it('con una cita comprometida NO borra: responde 409 y la nombra', async () => {
    const rechazo = await http()
      .delete(`/scheduling/templates/${templateId}`)
      .set(bearer(medico.token))
      .expect(409);

    expect(rechazo.body.details.liveBookings).toBe(1);
    expect(rechazo.body.details.totalBookings).toBe(1);
    expect(rechazo.body.details.bookingIds).toContain(bookingId);
    expect(rechazo.body.details.truncated).toBe(false);

    // Lo que importa no es el 409: es que el horario siga en pie. Un aviso que
    // llega después del borrado no sirve de nada.
    expect(await restosDeLaPlantilla()).toBeGreaterThan(0);
  });

  it('el aviso no filtra al paciente: ids, nunca nombres', async () => {
    const rechazo = await http()
      .delete(`/scheduling/templates/${templateId}`)
      .set(bearer(medico.token))
      .expect(409);

    // Quien recibe esto es la pantalla, que ya sabe pedir cada cita con su
    // permiso. Mandar nombres acá los expondría a cualquiera que administre
    // agendas, incluida gente que no atiende a ese paciente.
    const cuerpo = JSON.stringify(rechazo.body.details);
    expect(cuerpo).not.toMatch(/Carla|Ríos/);
  });

  it('borrar una agenda ajena es 403, no un 409', async () => {
    // Un profesional distinto: el permiso se comprueba ANTES de mirar si hay
    // citas, así que ni siquiera se entera de cuántas hay.
    const otro = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        email: `fx4-otro-${sufijo}@example.test`,
        password: PASSWORD,
        name: 'Iván',
        lastName: 'Molina',
        licenseNumber: `LIC-FX4O-${sufijo}`,
        credentialNumber: `CRED-FX4O-${sufijo}`,
      })
      .expect(201);
    expect(otro.body.practitionerProfileId).toBeDefined();

    const loginOtro = await http()
      .post('/iam/auth/login')
      .send({ email: `fx4-otro-${sufijo}@example.test`, password: PASSWORD })
      .expect(200);

    await http()
      .delete(`/scheduling/templates/${templateId}`)
      .set(bearer(loginOtro.body.accessToken))
      .expect(403);
  });

  it('cancelar NO libera el horario: el historial sigue frenando', async () => {
    await http()
      .post(`/scheduling/bookings/${bookingId}/cancel`)
      .set(bearer(medico.token))
      .send({
        cancelledBy: 'PROVIDER',
        reasonText: 'El profesional retira el horario publicado',
      })
      .expect(200);

    const rechazo = await http()
      .delete(`/scheduling/templates/${templateId}`)
      .set(bearer(medico.token))
      .expect(409);

    // Ya no hay compromiso, pero la cita cancelada sigue existiendo y su
    // `bookable_slot_id` es NOT NULL: fija su cupo para siempre. Borrarlo sería
    // borrar el registro de que esa persona tuvo un turno.
    expect(rechazo.body.details.liveBookings).toBe(0);
    expect(rechazo.body.details.totalBookings).toBe(1);
    expect(rechazo.body.message).toMatch(/historial/i);
    expect(await restosDeLaPlantilla()).toBeGreaterThan(0);
  });

  it('un horario que nunca tuvo pacientes sí se borra, con sus cupos', async () => {
    // Plantilla aparte, sin una sola reserva en su historia: es el único caso
    // que un borrado duro puede resolver sin destruir nada.
    const limpia = await http()
      .post(`/scheduling/resources/${resourceId}/templates`)
      .set(bearer(medico.token))
      .send({
        name: 'Nunca usada FX-4',
        slotMinutes: 30,
        rules: [
          {
            dayOfWeek: 3,
            startTime: '09:00:00',
            endTime: '11:00:00',
            slotMinutes: 30,
            capacityPerSlot: 1,
          },
        ],
      })
      .expect(201);

    const desde = proximoLunes();
    await http()
      .post(`/scheduling/templates/${limpia.body.id}/generate-slots`)
      .set(bearer(medico.token))
      .send({
        from: desde.toISOString(),
        to: new Date(desde.getTime() + 7 * 24 * 3600 * 1000).toISOString(),
      })
      .expect(201);

    const borrado = await http()
      .delete(`/scheduling/templates/${limpia.body.id}`)
      .set(bearer(medico.token))
      .expect(200);

    expect(borrado.body.id).toBe(limpia.body.id);
    expect(borrado.body.deletedRules).toBe(1);
    expect(borrado.body.deletedSlots).toBeGreaterThan(0);

    const restos = await ctx.orm.em.getConnection().execute<{ n: string }[]>(
      `select (select count(*) from scheduling.schedule_templates where id = ?)
            + (select count(*) from scheduling.schedule_rules where schedule_template_id = ?)
            + (select count(*) from scheduling.bookable_slots where schedule_template_id = ?)
         as n`,
      [limpia.body.id, limpia.body.id, limpia.body.id],
    );
    // Ni la plantilla, ni sus franjas, ni sus cupos: los cupos son derivados y
    // conservarlos sin plantilla dejaría horarios ofertándose sin dueño.
    expect(Number(restos[0].n)).toBe(0);

    // Y el segundo intento es 404, no un 200 silencioso.
    await http()
      .delete(`/scheduling/templates/${limpia.body.id}`)
      .set(bearer(medico.token))
      .expect(404);
  });
});
