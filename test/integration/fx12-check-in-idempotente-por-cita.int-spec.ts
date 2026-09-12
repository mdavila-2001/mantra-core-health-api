import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { boDepartmentConceptId } from '../../src/common/seed/bo-geography.catalog';

/**
 * FX-12 · check-in de encuentro idempotente por cita (subtarea 4.2).
 *
 * ## Qué se está protegiendo
 *
 * `POST /clinical/encounters/check-in` con `appointmentId` no puede crear un
 * encuentro nuevo cada vez que alguien vuelve a enviarlo sobre la misma cita
 * —recarga de página, doble clic, «Continuar atención» después del
 * mostrador—: debe reutilizar el encuentro en curso, y rechazar con 409 si
 * esa cita ya tiene uno finalizado. Contra la base de verdad, no contra un
 * `EntityManager` simulado: lo que importa es la FILA, no la respuesta.
 */
describe('FX-12 · check-in de encuentro idempotente por cita (4.2)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const medico = {
    email: `fx12-med-${sufijo}@example.test`,
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

  async function contarEncuentrosDeLaCita(
    appointmentId: string,
  ): Promise<number> {
    const filas = await ctx.orm.em
      .getConnection()
      .execute<{ n: string }[]>(
        `select count(*)::text as n from clinical.encounters where appointment_id = ?`,
        [appointmentId],
      );
    return Number(filas[0]?.n ?? '0');
  }

  async function altaPaciente(nationalId: string): Promise<string> {
    const alta = await http()
      .post('/iam/auth/register-patient')
      .send({
        nationalId,
        password: PASSWORD,
        email: `${nationalId.toLowerCase()}@example.test`,
        name: 'Paciente',
        lastName: 'FX-12',
        birthDate: '1990-01-01',
        phone: '+591 70000000',
        sexAtBirth: 'FEMALE',
        residenceMunicipalityConceptId: municipioId,
        issuerAdministrativeAreaConceptId: boDepartmentConceptId('SC'),
      })
      .expect(201);
    return alta.body.patientProfileId ?? alta.body.profileId;
  }

  /** Cita puntual sin encuentro: `appointmentId` leído de la reserva. */
  async function citaSinEncuentro(
    cuando: Date,
    patientProfileId: string,
  ): Promise<string> {
    const directa = await http()
      .post('/scheduling/appointments/direct')
      .set(bearer(medico.token))
      .send({
        patientProfileId,
        resourceId,
        startAt: cuando.toISOString(),
        durationMinutes: 30,
        reasonText: 'Control FX-12',
      })
      .expect(201);

    const reserva = await ctx.orm.em
      .getConnection()
      .execute<{ appointment_id: string }[]>(
        `select appointment_id from scheduling.appointment_bookings where id = ?`,
        [directa.body.bookingId],
      );
    return reserva[0].appointment_id;
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
        email: medico.email,
        password: PASSWORD,
        name: 'Elena',
        lastName: 'Salas',
        licenseNumber: `LIC-FX12-${sufijo}`,
        credentialNumber: `CRED-FX12-${sufijo}`,
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
        name: 'Consultorio FX-12',
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);
    resourceId = recurso.body.id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('reutiliza el encuentro en curso del mostrador y deja una sola fila', async () => {
    const cuando = lunesLejano(1);
    cuando.setUTCHours(9, 0, 0, 0);
    const nationalId = `FX12A${sufijo}`;

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

    const { patientProfileId, appointmentId, encounterId } = walkIn.body;

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

    expect(checkIn.body.id).toBe(encounterId);
    expect(await contarEncuentrosDeLaCita(appointmentId)).toBe(1);
  });

  it('rechaza con 409 el check-in sobre una cita cuyo encuentro ya finalizó', async () => {
    const cuando = lunesLejano(1);
    cuando.setUTCHours(10, 0, 0, 0);
    const nationalId = `FX12B${sufijo}`;

    const walkIn = await http()
      .post('/scheduling/appointments/walk-in')
      .set(bearer(medico.token))
      .send({
        patient: {
          name: 'Paciente',
          lastName: 'De Mostrador',
          nationalId,
          phone: '+591 70000002',
        },
        resourceId,
        startAt: cuando.toISOString(),
        durationMinutes: 30,
        reasonText: 'Atención de mostrador',
      })
      .expect(201);

    const { patientProfileId, appointmentId, encounterId } = walkIn.body;

    await http()
      .post(`/clinical/encounters/${encounterId}/close`)
      .set(bearer(medico.token))
      .send({})
      .expect(200);

    const rechazo = await http()
      .post('/clinical/encounters/check-in')
      .set(bearer(medico.token))
      .send({
        patientProfileId,
        tenantId: medico.tenantId,
        appointmentId,
        primaryPractitionerId: medico.hpid,
      })
      .expect(409);

    expect(rechazo.body.code).toBe('CONFLICT');
    expect(rechazo.body.details.encounterId).toBe(encounterId);
    expect(rechazo.body.details.status).toBe('ENC_FINISHED');
    expect(rechazo.body.details.endAt).not.toBeNull();
  });

  it('crea un encuentro nuevo para una cita puntual sin encuentro previo', async () => {
    const cuando = lunesLejano(2);
    cuando.setUTCHours(9, 0, 0, 0);
    const patientProfileId = await altaPaciente(`FX12C${sufijo}`);
    const appointmentId = await citaSinEncuentro(cuando, patientProfileId);

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

    expect(checkIn.body.id).toBeTruthy();
    expect(await contarEncuentrosDeLaCita(appointmentId)).toBe(1);
  });

  it('dos check-in concurrentes sobre la misma cita sin encuentro dejan una sola fila', async () => {
    const cuando = lunesLejano(2);
    cuando.setUTCHours(10, 0, 0, 0);
    const patientProfileId = await altaPaciente(`FX12D${sufijo}`);
    const appointmentId = await citaSinEncuentro(cuando, patientProfileId);

    const checkIn = () =>
      http()
        .post('/clinical/encounters/check-in')
        .set(bearer(medico.token))
        .send({
          patientProfileId,
          tenantId: medico.tenantId,
          appointmentId,
          primaryPractitionerId: medico.hpid,
        });

    const [uno, dos] = await Promise.all([checkIn(), checkIn()]);

    expect(uno.status).toBe(201);
    expect(dos.status).toBe(201);
    expect(uno.body.id).toBe(dos.body.id);
    expect(await contarEncuentrosDeLaCita(appointmentId)).toBe(1);
  });
});
