import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  identidadProfesional,
} from './harness';
import { boDepartmentConceptId } from '../../src/common/seed/bo-geography.catalog';

/**
 * FX-13 · el encuentro clínico de la cita viaja en la reserva (subtarea 4.3).
 *
 * ## Qué se está protegiendo
 *
 * `GET /scheduling/bookings` y `GET /scheduling/bookings/:id` tienen que
 * decir `encounterId` para que el front pueda cruzar la reserva con
 * `ChartNote.encounterId` sin estimar por fecha. Contra la base de verdad,
 * no contra un `EntityManager` simulado: lo que importa es que el lote por
 * lote lea la fila que el check-in acaba de escribir.
 */
describe('FX-13 · el encuentro de la reserva (4.3)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const medico = {
    email: `fx13-med-${sufijo}@example.test`,
    token: '',
    hpid: '',
    tenantId: '',
  };

  let resourceId = '';
  let municipioId = '';

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  /** Un lunes lejano: la agenda de esta suite no se cruza con la de otra. */
  function lunesLejano(semanas: number): Date {
    const d = new Date();
    d.setUTCHours(12, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7) + semanas * 7);
    return d;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const municipios = await ctx.orm.em
      .getConnection()
      .execute<{ id: string }[]>(
        `select id from terminology.catalog_concepts
          where code like 'geo:bo:municipality:%' order by code limit 1`,
      );
    municipioId = municipios[0]?.id ?? '';

    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(medico.email),
        email: medico.email,
        password: PASSWORD,
        name: 'Elena',
        lastName: 'Salas',
        licenseNumber: `LIC-FX13-${sufijo}`,
        credentialNumber: `CRED-FX13-${sufijo}`,
      })
      .expect(201);
    medico.hpid = alta.body.practitionerProfileId;

    const login = await http()
      .post('/iam/auth/login')
      .send({ email: medico.email, password: PASSWORD })
      .expect(200);
    medico.token = login.body.accessToken;
    medico.tenantId = (claims(medico.token)['tenants'] as string[])[0];

    const recurso = await http()
      .post('/scheduling/resources')
      .set(bearer(medico.token))
      .send({
        tenantId: medico.tenantId,
        resourceType: 'PRACTITIONER',
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: medico.hpid,
        name: 'Consultorio FX-13',
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);
    resourceId = recurso.body.id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('el walk-in trae su encounterId en el listado y en el detalle', async () => {
    const cuando = lunesLejano(1);
    cuando.setUTCHours(9, 0, 0, 0);
    const nationalId = `FX13A${sufijo}`;

    const walkIn = await http()
      .post('/scheduling/appointments/walk-in')
      .set(bearer(medico.token))
      .send({
        patient: {
          name: 'Paciente',
          lastName: 'De Mostrador',
          nationalId,
          phone: '+591 70000001',
        },
        resourceId,
        startAt: cuando.toISOString(),
        durationMinutes: 30,
        reasonText: 'Atención de mostrador',
      })
      .expect(201);

    const { patientProfileId, bookingId, appointmentId, encounterId } =
      walkIn.body;

    const listado = await http()
      .get(`/scheduling/bookings?patientProfileId=${patientProfileId}`)
      .set(bearer(medico.token))
      .expect(200);

    const item = listado.body.items.find(
      (i: { id: string }) => i.id === bookingId,
    );
    expect(item).toBeDefined();
    expect(item.appointmentId).toBe(appointmentId);
    expect(item.encounterId).toBe(encounterId);

    const detalle = await http()
      .get(`/scheduling/bookings/${bookingId}`)
      .set(bearer(medico.token))
      .expect(200);

    expect(detalle.body.appointmentId).toBe(appointmentId);
    expect(detalle.body.encounterId).toBe(encounterId);
  });

  let patientProfileId = '';
  let bookingId = '';
  let appointmentId = '';

  it('una cita puntual sin encuentro trae encounterId null en el listado', async () => {
    const cuando = lunesLejano(2);
    cuando.setUTCHours(9, 0, 0, 0);
    const nationalId = `FX13B${sufijo}`;

    const altaPaciente = await http()
      .post('/iam/auth/register-patient')
      .send({
        nationalId,
        password: PASSWORD,
        email: `${nationalId.toLowerCase()}@example.test`,
        name: 'Paciente',
        lastName: 'FX-13',
        birthDate: '1990-01-01',
        phone: '+591 70000002',
        sexAtBirth: 'FEMALE',
        residenceMunicipalityConceptId: municipioId,
        issuerAdministrativeAreaConceptId: boDepartmentConceptId('SC'),
      })
      .expect(201);
    patientProfileId =
      altaPaciente.body.patientProfileId ?? altaPaciente.body.profileId;

    const directa = await http()
      .post('/scheduling/appointments/direct')
      .set(bearer(medico.token))
      .send({
        patientProfileId,
        resourceId,
        startAt: cuando.toISOString(),
        durationMinutes: 30,
        reasonText: 'Control FX-13',
      })
      .expect(201);
    bookingId = directa.body.bookingId;

    const listadoAntes = await http()
      .get(`/scheduling/bookings?patientProfileId=${patientProfileId}`)
      .set(bearer(medico.token))
      .expect(200);
    const itemAntes = listadoAntes.body.items.find(
      (i: { id: string }) => i.id === bookingId,
    );
    expect(itemAntes).toBeDefined();
    expect(itemAntes.encounterId).toBeNull();

    const reserva = await ctx.orm.em
      .getConnection()
      .execute<{ appointment_id: string }[]>(
        `select appointment_id from scheduling.appointment_bookings where id = ?`,
        [bookingId],
      );
    appointmentId = reserva[0].appointment_id;
  });

  it('tras el check-in, el listado trae el encounterId que devolvió', async () => {
    const checkIn = await http()
      .post('/clinical/encounters/check-in')
      .set(bearer(medico.token))
      .send({
        patientProfileId,
        tenantId: medico.tenantId,
        appointmentId,
        primaryPractitionerId: medico.hpid,
      })
      .expect(201);

    const listadoDespues = await http()
      .get(`/scheduling/bookings?patientProfileId=${patientProfileId}`)
      .set(bearer(medico.token))
      .expect(200);
    const itemDespues = listadoDespues.body.items.find(
      (i: { id: string }) => i.id === bookingId,
    );
    expect(itemDespues.encounterId).toBe(checkIn.body.id);
  });
});
