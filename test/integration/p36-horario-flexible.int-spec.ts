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
 * P36 · horario flexible, sin turnos fijos, contra la base real.
 *
 * El médico declara cuándo atiende sin cortarlo en turnos; el paciente pide la
 * hora que quiera dentro de la franja. Lo que esta suite fija:
 *
 * 1. La plantilla guarda el modo (`schedule_templates.flexible_hours`) y lo
 *    devuelve al leerla; generar cupos no materializa ninguno.
 * 2. Las horas libres se calculan en lectura y respetan lo ya tomado.
 * 3. **Dos pacientes que piden horas que se pisan, a la vez, dejan UNA
 *    retención**: el candado del profesional serializa los pedidos. Se cuentan
 *    filas, no respuestas.
 * 4. La reserva se confirma por el camino de siempre y el cupo queda tomado.
 * 5. Autorización: sin sesión 401; un rol que no reserva, 403; un paciente que
 *    reserva a nombre de otro, 403 — y ninguno deja filas.
 */
describe('P36 · horario flexible sin turnos fijos', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const medico = {
    email: `p36-med-${sufijo}@example.test`,
    token: '',
    hpid: '',
    tenantId: '',
  };
  const ana = { nationalId: `P36A${sufijo}`, token: '', pid: '' };
  const beto = { nationalId: `P36B${sufijo}`, token: '', pid: '' };

  let resourceId = '';
  let templateId = '';
  let municipioId = '';

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  /** Un lunes lejano a las 00:00 UTC: la agenda no se cruza con otra suite. */
  function lunesLejano(semanas: number): Date {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7) + semanas * 7);
    return d;
  }
  const lunes = lunesLejano(5);
  const a = (h: number, m = 0): Date =>
    new Date(lunes.getTime() + (h * 60 + m) * 60_000);

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
        name: 'Paciente',
        lastName: 'Sintético',
        birthDate: '1990-01-01',
        phone: '+591 70000000',
        sexAtBirth: 'FEMALE',
        residenceMunicipalityConceptId: municipioId,
        issuerAdministrativeAreaConceptId: boDepartmentConceptId('SC'),
      })
      .expect(201);
    quien.pid = alta.body.patientProfileId ?? alta.body.profileId;

    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId: quien.nationalId, password: PASSWORD })
      .expect(200);
    quien.token = login.body.accessToken;
  }

  /** Cupos de la plantilla flexible, y en qué estado. */
  async function cuposDeLaPlantilla(): Promise<
    { id: string; start_at: Date; end_at: Date; remaining_capacity: number }[]
  > {
    return ctx.orm.em.getConnection().execute(
      `select id, start_at, end_at, remaining_capacity
           from scheduling.bookable_slots
          where schedule_template_id = ? order by start_at`,
      [templateId],
    );
  }

  /** Los encabezados del paciente: su sesión y la organización del médico. */
  const comoPaciente = (quien: { token: string }) => ({
    ...bearer(quien.token),
    'X-Tenant-Id': medico.tenantId,
  });

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
        licenseNumber: `LIC-P36-${sufijo}`,
        credentialNumber: `CRED-P36-${sufijo}`,
      })
      .expect(201);
    medico.hpid = alta.body.practitionerProfileId;

    const login = await http()
      .post('/iam/auth/login')
      .send({ email: medico.email, password: PASSWORD })
      .expect(200);
    medico.token = login.body.accessToken;
    medico.tenantId = (claims(medico.token)['tenants'] as string[])[0];

    await altaPaciente(ana);
    await altaPaciente(beto);

    const recurso = await http()
      .post('/scheduling/resources')
      .set(bearer(medico.token))
      .send({
        tenantId: medico.tenantId,
        resourceType: 'PRACTITIONER',
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: medico.hpid,
        name: 'Consultorio P36',
        timeZone: 'UTC',
        capacity: 1,
      })
      .expect(201);
    resourceId = recurso.body.id;
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('el médico publica un horario flexible: el modo queda en la base y vuelve al leerlo', async () => {
    const plantilla = await http()
      .post(`/scheduling/resources/${resourceId}/templates`)
      .set(bearer(medico.token))
      .send({
        name: 'Lunes flexible',
        flexibleHours: true,
        slotMinutes: 20,
        rules: [{ dayOfWeek: 1, startTime: '08:00', endTime: '10:00' }],
      })
      .expect(201);
    templateId = plantilla.body.id;
    expect(plantilla.body.flexibleHours).toBe(true);

    const fila = await ctx.orm.em
      .getConnection()
      .execute<{ flexible_hours: boolean; slot_minutes: number }[]>(
        `select flexible_hours, slot_minutes
           from scheduling.schedule_templates where id = ?`,
        [templateId],
      );
    expect(fila[0]).toEqual({ flexible_hours: true, slot_minutes: 20 });

    const franjas = await ctx.orm.em
      .getConnection()
      .execute<
        { slot_minutes: number | null; capacity_per_slot: number | null }[]
      >(
        `select slot_minutes, capacity_per_slot
           from scheduling.schedule_rules where schedule_template_id = ?`,
        [templateId],
      );
    expect(franjas).toEqual([{ slot_minutes: null, capacity_per_slot: null }]);

    const lectura = await http()
      .get(`/scheduling/resources/${resourceId}/templates`)
      .set(bearer(medico.token))
      .expect(200);
    const publicada = lectura.body.items.find(
      (item: { id: string }) => item.id === templateId,
    );
    expect(publicada.flexibleHours).toBe(true);
  });

  it('una franja flexible que declara capacidad por turno se rechaza (422)', async () => {
    await http()
      .post(`/scheduling/resources/${resourceId}/templates`)
      .set(bearer(medico.token))
      .send({
        name: 'Mal declarada',
        flexibleHours: true,
        rules: [
          {
            dayOfWeek: 3,
            startTime: '08:00',
            endTime: '10:00',
            capacityPerSlot: 4,
          },
        ],
      })
      .expect(422);
  });

  it('generar cupos de la plantilla flexible no materializa ninguno', async () => {
    const generado = await http()
      .post(`/scheduling/templates/${templateId}/generate-slots`)
      .set(bearer(medico.token))
      .send({
        from: lunes.toISOString(),
        to: new Date(lunes.getTime() + 7 * 86_400_000).toISOString(),
      })
      .expect(201);
    expect(generado.body.created).toBe(0);
    expect(await cuposDeLaPlantilla()).toHaveLength(0);
  });

  it('el paciente ve las horas libres de la franja, cada 15 minutos', async () => {
    const libres = await http()
      .get(`/scheduling/resources/${resourceId}/flexible-availability`)
      .query({ from: lunes.toISOString(), to: a(24).toISOString() })
      .set(comoPaciente(ana))
      .expect(200);

    expect(libres.body.stepMinutes).toBe(15);
    // 08:00 … 09:30: la última que deja entrar una consulta de 20 antes de las 10.
    expect(
      libres.body.items.map((i: { startAt: string }) => i.startAt),
    ).toEqual(
      [0, 15, 30, 45, 60, 75, 90].map((min) => a(8, min).toISOString()),
    );
    expect(libres.body.items[0].endAt).toBe(a(8, 20).toISOString());
  });

  it('dos pacientes que piden a la vez horas que se pisan dejan UNA retención', async () => {
    const pedir = (quien: typeof ana, h: number, m: number) =>
      http()
        .post(`/scheduling/resources/${resourceId}/flexible-holds`)
        .set(comoPaciente(quien))
        .send({ startAt: a(h, m).toISOString(), patientProfileId: quien.pid });

    const [deAna, deBeto] = await Promise.all([
      pedir(ana, 8, 10),
      pedir(beto, 8, 20),
    ]);
    const codigos = [deAna.status, deBeto.status].sort();
    expect(codigos).toEqual([201, 409]);

    // Se cuentan filas: una sola hora tomada, la del que llegó primero.
    const cupos = await cuposDeLaPlantilla();
    expect(cupos).toHaveLength(1);
    expect(cupos[0].remaining_capacity).toBe(0);

    const ganador = deAna.status === 201 ? deAna : deBeto;
    const quien = deAna.status === 201 ? ana : beto;

    const reserva = await http()
      .post(`/scheduling/holds/${ganador.body.holdToken}/confirm`)
      .set(comoPaciente(quien))
      .send({
        tenantId: medico.tenantId,
        patientProfileId: quien.pid,
        channel: 'PORTAL',
        reasonText: 'Control',
      });
    expect([201, 200]).toContain(reserva.status);

    const cita = await ctx.orm.em.getConnection().execute<{ n: string }[]>(
      `select count(*)::text as n
           from scheduling.appointment_bookings b
          where b.bookable_slot_id = ?`,
      [ganador.body.bookableSlotId],
    );
    expect(Number(cita[0].n)).toBe(1);

    // La hora tomada ya no se ofrece: lo que la pisa desaparece de la lista.
    const libres = await http()
      .get(`/scheduling/resources/${resourceId}/flexible-availability`)
      .query({ from: lunes.toISOString(), to: a(24).toISOString() })
      .set(comoPaciente(beto))
      .expect(200);
    const inicio = new Date(ganador.body.startAt).getTime();
    const fin = new Date(ganador.body.endAt).getTime();
    for (const item of libres.body.items as {
      startAt: string;
      endAt: string;
    }[]) {
      const s = new Date(item.startAt).getTime();
      const e = new Date(item.endAt).getTime();
      expect(s < fin && e > inicio).toBe(false);
    }
  });

  it('una hora pegada a la tomada —termina una, empieza la otra— sí se puede pedir', async () => {
    const [cupo] = await cuposDeLaPlantilla();
    const pegada = new Date(cupo.end_at);
    const pedido = await http()
      .post(`/scheduling/resources/${resourceId}/flexible-holds`)
      .set(comoPaciente(beto))
      .send({ startAt: pegada.toISOString(), patientProfileId: beto.pid })
      .expect(201);
    expect(pedido.body.startAt).toBe(pegada.toISOString());
    expect(await cuposDeLaPlantilla()).toHaveLength(2);
  });

  it('una hora fuera de la franja es 422 y no deja filas', async () => {
    await http()
      .post(`/scheduling/resources/${resourceId}/flexible-holds`)
      .set(comoPaciente(ana))
      .send({ startAt: a(9, 50).toISOString(), patientProfileId: ana.pid })
      .expect(422);
    expect(await cuposDeLaPlantilla()).toHaveLength(2);
  });

  describe('autorización', () => {
    it('sin sesión: 401', async () => {
      await http()
        .get(`/scheduling/resources/${resourceId}/flexible-availability`)
        .query({ from: lunes.toISOString(), to: a(24).toISOString() })
        .expect(401);
      await http()
        .post(`/scheduling/resources/${resourceId}/flexible-holds`)
        .send({ startAt: a(9, 30).toISOString() })
        .expect(401);
    });

    it('el médico no retiene horas como si fuera paciente: 403', async () => {
      await http()
        .post(`/scheduling/resources/${resourceId}/flexible-holds`)
        .set(bearer(medico.token))
        .send({ startAt: a(9, 30).toISOString() })
        .expect(403);
      expect(await cuposDeLaPlantilla()).toHaveLength(2);
    });

    it('un paciente no reserva a nombre de otro: 403 y ninguna fila', async () => {
      await http()
        .post(`/scheduling/resources/${resourceId}/flexible-holds`)
        .set(comoPaciente(beto))
        .send({ startAt: a(9, 30).toISOString(), patientProfileId: ana.pid })
        .expect(403);
      expect(await cuposDeLaPlantilla()).toHaveLength(2);
    });
  });
});
