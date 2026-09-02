import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';

/**
 * FX-7 · quién ve el motivo de un bloqueo, y cuánto ve (9c).
 *
 * ## La decisión que fija
 *
 * El propietario del proyecto pidió que el paciente pueda ver por qué su médico
 * bloqueó un rato. La respuesta se partió en dos a propósito:
 *
 * - **El motivo catalogado sí.** «Vacaciones», «Congreso o capacitación»: es
 *   una etiqueta de una lista cerrada y no puede contener nada que el
 *   profesional no haya elegido a propósito. Le sirve para no viajar en vano.
 * - **El texto libre no.** Es lo que el médico escribe al elegir «Otro», y ahí
 *   puede aparecer cualquier cosa — «junta médica por el caso de la Sra.
 *   Pérez» son datos clínicos de un tercero.
 *
 * Y con el mismo alcance que el historial: **sólo del médico con el que tiene
 * cita**. Sin ese vínculo, cuándo se toma vacaciones un doctor no es
 * información suya.
 *
 * ## Por qué contra la base
 *
 * La prueba unitaria cubre la proyección con el actor simulado. Lo que sólo se
 * ve acá es que el **guard de roles** deje pasar al paciente —el endpoint era
 * de profesional y admin— y que la comprobación del vínculo consulte de verdad
 * las citas. Un `@Roles` mal puesto no se nota con mocks.
 */
describe('FX-7 · el motivo de un bloqueo, según quién mire', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';
  const TEXTO_LIBRE = 'Junta por el caso de la Sra. Pérez';

  const medico = {
    email: `fx7-med-${sufijo}@example.test`,
    token: '',
    hpid: '',
    tenantId: '',
  };
  const conCita = { nationalId: `FX7A${sufijo}`, token: '', pid: '' };
  const sinCita = { nationalId: `FX7B${sufijo}`, token: '', pid: '' };

  let resourceId = '';

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

  /** Registra un paciente y devuelve su token y su perfil. */
  async function altaPaciente(quien: {
    nationalId: string;
    token: string;
    pid: string;
  }): Promise<void> {
    const alta = await http()
      .post('/iam/auth/register-patient')
      .send({
        nationalId: quien.nationalId,
        password: PASSWORD,
        email: `${quien.nationalId.toLowerCase()}@example.test`,
        name: 'Ana',
        lastName: 'Quispe',
      })
      .expect(201);
    quien.pid = alta.body.patientProfileId ?? alta.body.profileId;

    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId: quien.nationalId, password: PASSWORD })
      .expect(200);
    quien.token = login.body.accessToken;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        email: medico.email,
        password: PASSWORD,
        name: 'Elena',
        lastName: 'Salas',
        licenseNumber: `LIC-FX7-${sufijo}`,
        credentialNumber: `CRED-FX7-${sufijo}`,
      })
      .expect(201);
    medico.hpid = alta.body.practitionerProfileId;

    const login = await http()
      .post('/iam/auth/login')
      .send({ email: medico.email, password: PASSWORD })
      .expect(200);
    medico.token = login.body.accessToken;
    medico.tenantId = (claims(medico.token)['tenants'] as string[])[0];

    await altaPaciente(conCita);
    await altaPaciente(sinCita);

    const recurso = await http()
      .post('/scheduling/resources')
      .set(bearer(medico.token))
      .send({
        tenantId: medico.tenantId,
        resourceType: 'PRACTITIONER',
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: medico.hpid,
        name: 'Consultorio FX-7',
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);
    resourceId = recurso.body.id;

    // Un horario, un cupo y una cita: es lo que crea el vínculo del paciente
    // con esta agenda.
    const plantilla = await http()
      .post(`/scheduling/resources/${resourceId}/templates`)
      .set(bearer(medico.token))
      .send({
        name: 'Mañanas FX-7',
        slotMinutes: 30,
        rules: [
          {
            dayOfWeek: 1,
            startTime: '08:00:00',
            endTime: '10:00:00',
            slotMinutes: 30,
            capacityPerSlot: 1,
          },
        ],
      })
      .expect(201);

    const desde = proximoLunes();
    await http()
      .post(`/scheduling/templates/${plantilla.body.id}/generate-slots`)
      .set(bearer(medico.token))
      .send({
        from: desde.toISOString(),
        to: new Date(desde.getTime() + 24 * 3600 * 1000).toISOString(),
      })
      .expect(201);

    const cupo = await ctx.orm.em.getConnection().execute<{ id: string }[]>(
      `select id from scheduling.bookable_slots
        where schedule_template_id = ? order by start_at limit 1`,
      [plantilla.body.id],
    );
    const hold = await http()
      .post(`/scheduling/slots/${cupo[0].id}/holds`)
      .set(bearer(conCita.token))
      .send({ patientProfileId: conCita.pid })
      .expect(201);
    await http()
      .post(`/scheduling/holds/${hold.body.holdToken}/request`)
      .set(bearer(conCita.token))
      .send({
        tenantId: medico.tenantId,
        patientProfileId: conCita.pid,
        channel: 'PORTAL',
        reasonText: 'Control',
      })
      .expect(201);

    // Y el bloqueo, con motivo «Otro» + texto libre: es el caso que hace
    // peligroso mostrar el texto.
    await http()
      .post(`/scheduling/resources/${resourceId}/exceptions`)
      .set(bearer(medico.token))
      .send({
        exceptionType: 'OTHER',
        reason: TEXTO_LIBRE,
        startAt: '2030-05-06T13:00:00Z',
        endAt: '2030-05-06T17:00:00Z',
      })
      .expect(201);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const VENTANA = 'from=2030-05-01T00:00:00Z&to=2030-05-31T00:00:00Z';

  it('el profesional ve la etiqueta y el texto libre, que es suyo', async () => {
    const res = await http()
      .get(`/scheduling/resources/${resourceId}/exceptions?${VENTANA}`)
      .set(bearer(medico.token))
      .expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].reasonLabel).toBe('Otro');
    expect(res.body.items[0].reason).toBe(TEXTO_LIBRE);
  });

  it('el paciente con cita ve la etiqueta y NUNCA el texto libre', async () => {
    const res = await http()
      .get(`/scheduling/resources/${resourceId}/exceptions?${VENTANA}`)
      .set(bearer(conCita.token))
      .expect(200);

    expect(res.body.items).toHaveLength(1);
    // Le dice que hay un bloqueo sin decirle cuál: «Otro» es honesto.
    expect(res.body.items[0].reasonLabel).toBe('Otro');
    expect(res.body.items[0].reason).toBeUndefined();
    // La comprobación que importa: el apellido del tercero no sale por ningún
    // campo, ni siquiera uno que se agregue mañana sin pensar.
    expect(JSON.stringify(res.body)).not.toContain('Pérez');
  });

  it('el paciente SIN cita con ese médico no lee nada', async () => {
    // Misma regla que el historial: sólo del médico con el que tiene cita.
    // Sin vínculo, cuándo se toma vacaciones un doctor no es asunto suyo.
    await http()
      .get(`/scheduling/resources/${resourceId}/exceptions?${VENTANA}`)
      .set(bearer(sinCita.token))
      .expect(403);
  });

  it('sin sesión no se lee, como antes', async () => {
    await http()
      .get(`/scheduling/resources/${resourceId}/exceptions?${VENTANA}`)
      .expect(401);
  });
});
