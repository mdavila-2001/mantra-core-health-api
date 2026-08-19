import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { SEED } from '../../src/common';

/**
 * TJ-2 · la ventana de cancelación y la privacidad del motivo de consulta.
 *
 * ## Por qué contra la base
 *
 * Las dos reglas dependen de datos que sólo existen ahí: la ventana sale del
 * **snapshot congelado al reservar**, y la privacidad depende de quién es el
 * actor frente a quién es el titular de la cita. Un doble devuelve lo que uno
 * le pida; lo que hay que comprobar es a quién le llega qué.
 *
 * ## Lo que fija
 *
 * 1. Dentro de plazo, el paciente cancela.
 * 2. Fuera de plazo, **no** — y el médico sí.
 * 3. El motivo de consulta lo ve el titular; un tercero de la organización, no.
 */
describe('TJ-2 · reglas finas de la cita (integración)', () => {
  let ctx: TestContext;
  const u = Date.now();

  let tokenPaciente: string;
  let patientProfileId: string;
  let resourceId: string;

  const http = () => request(ctx.app.getHttpServer());
  const admin = () => bearer(ctx.adminToken);

  function claims(bruto: string): Record<string, unknown> {
    const [, cuerpo] = bruto.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  /**
   * Publica una agenda con cupos en una ventana que empieza dentro de N horas.
   *
   * El desplazamiento es lo que decide si la reserva cae dentro o fuera de la
   * ventana de cancelación, así que cada prueba pide el suyo.
   */
  async function agendaDesde(horas: number): Promise<{ slotId: string }> {
    const recurso = await http()
      .post('/scheduling/resources')
      .set(admin())
      .send({
        tenantId: SEED.tenantId,
        resourceType: 'ROOM',
        resourceRefType: 'practice_sites',
        resourceRefId: randomUUID(),
        name: `Consultorio TJ2 ${horas}h ${u}`,
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);
    resourceId = recurso.body.id;

    const plantilla = await http()
      .post(`/scheduling/resources/${resourceId}/templates`)
      .set(admin())
      .send({
        name: 'Todo el día',
        slotMinutes: 30,
        rules: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          dayOfWeek,
          startTime: '00:00:00',
          endTime: '23:30:00',
        })),
      })
      .expect(201);

    const desde = new Date(Date.now() + horas * 60 * 60 * 1000);
    const hasta = new Date(desde.getTime() + 2 * 60 * 60 * 1000);
    await http()
      .post(`/scheduling/templates/${plantilla.body.id}/generate-slots`)
      .set(admin())
      .send({ from: desde.toISOString(), to: hasta.toISOString() })
      .expect(201);

    const cupos = await http()
      .get(`/scheduling/resources/${resourceId}/slots`)
      .query({ from: desde.toISOString(), to: hasta.toISOString(), limit: 1 })
      .set(admin())
      .expect(200);

    expect(cupos.body.count).toBeGreaterThan(0);
    return { slotId: cupos.body.items[0].id };
  }

  /** Reserva ese cupo para el paciente de la prueba. */
  async function reservar(slotId: string, motivo: string): Promise<string> {
    const hold = await http()
      .post(`/scheduling/slots/${slotId}/holds`)
      .set(admin())
      .send({ patientProfileId })
      .expect(201);

    const reserva = await http()
      .post(`/scheduling/holds/${hold.body.holdToken}/confirm`)
      .set(admin())
      .send({
        tenantId: SEED.tenantId,
        patientProfileId,
        channel: 'PORTAL',
        reasonText: motivo,
      })
      .expect(201);

    return reserva.body.id as string;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const nationalId = `TJ2-${randomUUID().slice(0, 8)}`;
    const password = 'S3cret-passw0rd';
    await http()
      .post('/iam/auth/register-patient')
      .send({
        nationalId,
        password,
        displayName: 'Paciente TJ2',
        email: `tj2-${randomUUID().slice(0, 8)}@example.test`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password })
      .expect(200);
    tokenPaciente = login.body.accessToken;
    patientProfileId = claims(tokenPaciente)['pid'] as string;
    expect(patientProfileId).toBeDefined();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('dentro de plazo, el paciente cancela su turno', async () => {
    // Muy lejos en el tiempo: la ventana por defecto no alcanza.
    const { slotId } = await agendaDesde(72);
    const bookingId = await reservar(slotId, 'Control anual');

    await http()
      .post(`/scheduling/bookings/${bookingId}/cancel`)
      .set(bearer(tokenPaciente))
      .send({ cancelledBy: 'PATIENT', reasonText: 'Me surgió un viaje' })
      .expect(200);
  });

  it('fuera de plazo NO puede: se le dice hasta cuándo podía', async () => {
    // Dentro de la hora: cae seguro dentro de cualquier ventana razonable.
    const { slotId } = await agendaDesde(0.5);
    const bookingId = await reservar(slotId, 'Dolor de garganta');

    const res = await http()
      .post(`/scheduling/bookings/${bookingId}/cancel`)
      .set(bearer(tokenPaciente))
      .send({ cancelledBy: 'PATIENT', reasonText: 'No llego' })
      .expect(422);

    expect(JSON.stringify(res.body)).toContain('Podés cancelar hasta');
  });

  it('pero quien atiende cancela igual: una urgencia no espera a la ventana', async () => {
    const { slotId } = await agendaDesde(0.5);
    const bookingId = await reservar(slotId, 'Control');

    await http()
      .post(`/scheduling/bookings/${bookingId}/cancel`)
      .set(admin())
      .send({
        cancelledBy: 'PROVIDER',
        reasonText: 'El profesional se enfermó',
      })
      .expect(200);
  });

  it('el paciente titular SÍ ve el motivo de su consulta', async () => {
    const { slotId } = await agendaDesde(96);
    const bookingId = await reservar(slotId, 'Chequeo de lunares');

    const res = await http()
      .get(`/scheduling/bookings/${bookingId}`)
      .set(bearer(tokenPaciente))
      .expect(200);

    expect(res.body.reasonText).toBe('Chequeo de lunares');
  });

  it('un actor de la organización NO ve el motivo de consulta', async () => {
    const { slotId } = await agendaDesde(97);
    const bookingId = await reservar(slotId, 'Consulta por ansiedad');

    // El admin puede leer la cita —la necesita para operar— pero el porqué de
    // la consulta es un dato clínico y no le corresponde.
    const res = await http()
      .get(`/scheduling/bookings/${bookingId}`)
      .set(admin())
      .expect(200);

    expect(res.body.id).toBe(bookingId);
    expect(res.body.reasonText).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('ansiedad');
  });

  it('tampoco en el listado, que es la superficie que más expone', async () => {
    const res = await http()
      .get('/scheduling/bookings')
      .query({ patientProfileId })
      .set(admin())
      .expect(200);

    expect(res.body.count).toBeGreaterThan(0);
    expect(JSON.stringify(res.body)).not.toContain('ansiedad');
    expect(JSON.stringify(res.body)).not.toContain('lunares');
  });

  it('el motivo de CANCELACIÓN sí es visible: es lo que explica el cambio', async () => {
    const { slotId } = await agendaDesde(98);
    const bookingId = await reservar(slotId, 'Motivo privado');

    await http()
      .post(`/scheduling/bookings/${bookingId}/cancel`)
      .set(admin())
      .send({ cancelledBy: 'PROVIDER', reasonText: 'Agenda reprogramada' })
      .expect(200);

    const res = await http()
      .get(`/scheduling/bookings/${bookingId}`)
      .set(bearer(tokenPaciente))
      .expect(200);

    // Son dos cosas distintas: por qué pidió el turno (privado) y por qué se
    // cayó (lo tiene que saber).
    expect(JSON.stringify(res.body.statusReason)).toContain(
      'Agenda reprogramada',
    );
  });
});
