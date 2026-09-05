import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { SEED } from '../../src/common';
import { DiagnosticUnitSites } from '../../src/modules/diagnostic_units/entities';

/**
 * Carril J2 · el relevamiento, ejecutado en vez de razonado.
 *
 * ## Qué contesta
 *
 * El carril lo plantea como pregunta: «publicá por API un recurso tipo
 * ROOM/EQUIPMENT apuntando a un `diagnostic_unit_site` → política → plantilla →
 * cupos → hold → confirm **con un paciente**. Si el flujo entero pasa sin tocar
 * la API, J2 es 80 % front. Si algo lo rechaza, anotalo: es tu tarea 1.»
 *
 * Esto lo ejecuta. Cada `it` es un eslabón, así que cuando algo se rompa el
 * fallo dice **en cuál** — que es justamente lo que el relevamiento necesita
 * saber para dimensionar la tarea 1.
 *
 * ## Por qué queda como prueba y no como nota
 *
 * Porque la respuesta caduca. «El motor acepta una sede» es cierto hoy y deja
 * de serlo el día que alguien agregue un guard que asuma profesional — y ese
 * día J2 se rompe en producción, no en el relevamiento. Como prueba, avisa.
 */
describe('J2 · relevamiento: reservar en un laboratorio con el motor existente', () => {
  let ctx: TestContext;
  const u = Date.now();

  /** La sede de diagnóstico a la que se le publica agenda. */
  let siteId: string;
  /** El recurso de scheduling que representa esa sede. */
  let resourceId: string;
  let desde: string;
  let hasta: string;
  /** El paciente que reserva. */
  let patientProfileId: string;

  const http = () => request(ctx.app.getHttpServer());
  const auth = () => bearer(ctx.adminToken);

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    // `findOne` rechaza un `where` vacío, así que se pide una y se toma la
    // primera. Sin sedes sembradas no hay relevamiento que hacer, y el fallo lo
    // dice en vez de pasar en verde por vacío.
    const [sede] = await ctx.orm.em
      .fork()
      .find(DiagnosticUnitSites, {}, { limit: 1 });
    expect(sede).toBeDefined();
    siteId = sede.id;

    const paciente = await http()
      .post('/profiles/patients')
      .set(auth())
      .send({
        patientCode: `PAC-J2-${u}`,
        displayName: 'Paciente J2',
        birthDate: '1990-05-14',
      })
      .expect(201);
    patientProfileId = paciente.body.profileId as string;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('1 · el motor acepta un recurso que NO es un profesional', async () => {
    // La pregunta de fondo del carril: `resourceType` admite ROOM y
    // `resourceRefType` es libre, así que una sede de diagnóstico debería
    // poder publicar agenda igual que un consultorio.
    const res = await http()
      .post('/scheduling/resources')
      .set(auth())
      .send({
        tenantId: SEED.tenantId,
        resourceType: 'ROOM',
        resourceRefType: 'diagnostic_unit_sites',
        resourceRefId: siteId,
        name: `Laboratorio Alovida ${u}`,
        timeZone: 'America/La_Paz',
        capacity: 2,
      })
      .expect(201);

    resourceId = res.body.id as string;
    expect(resourceId).toBeDefined();
  });

  it('2 · se le puede publicar una plantilla horaria', async () => {
    const res = await http()
      .post(`/scheduling/resources/${resourceId}/templates`)
      .set(auth())
      .send({
        name: 'Toma de muestras',
        slotMinutes: 20,
        // Los siete días: la suite corre cualquier día de la semana.
        rules: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          dayOfWeek,
          startTime: '07:00:00',
          endTime: '09:00:00',
        })),
      })
      .expect(201);

    const from = new Date(Date.now() + 24 * 60 * 60 * 1000);
    from.setUTCHours(0, 0, 0, 0);
    const to = new Date(from.getTime() + 8 * 24 * 60 * 60 * 1000);
    desde = from.toISOString();
    hasta = to.toISOString();

    const generados = await http()
      .post(`/scheduling/templates/${res.body.id}/generate-slots`)
      .set(auth())
      .send({ from: desde, to: hasta })
      .expect(201);

    // Sin cupos materializados, los eslabones de abajo pasarían por vacío.
    expect(generados.body.created).toBeGreaterThan(0);
  });

  it('3 · los cupos del laboratorio se listan como los de un consultorio', async () => {
    const res = await http()
      .get(`/scheduling/resources/${resourceId}/slots`)
      .query({ from: desde, to: hasta, limit: 5 })
      .set(auth())
      .expect(200);

    expect(res.body.count).toBeGreaterThan(0);
    expect(res.body.items[0].available).toBe(true);
  });

  it('4 · un paciente toma el cupo y confirma la reserva', async () => {
    const agenda = await http()
      .get(`/scheduling/resources/${resourceId}/slots`)
      .query({ from: desde, to: hasta, limit: 1 })
      .set(auth())
      .expect(200);

    const hold = await http()
      .post(`/scheduling/slots/${agenda.body.items[0].id}/holds`)
      .set(auth())
      .send({ patientProfileId })
      .expect(201);

    const reserva = await http()
      .post(`/scheduling/holds/${hold.body.holdToken}/confirm`)
      .set(auth())
      .send({ tenantId: SEED.tenantId, patientProfileId, channel: 'PORTAL' })
      .expect(201);

    expect(reserva.body.id).toBeDefined();
  });

  it('5 · la reserva del laboratorio aparece en los turnos del paciente', async () => {
    // Es el punto 5 de las tareas del carril: «Mis turnos» tiene que listar los
    // de laboratorio junto con los médicos. Si el listado los excluyera, la
    // persona reservaría algo que después no puede ver.
    const res = await http()
      .get('/scheduling/bookings')
      .query({ patientProfileId })
      .set(auth())
      .expect(200);

    expect(res.body.count).toBe(1);
    expect(res.body.items[0].startAt).toBeDefined();
  });

  it('6 · el recurso del laboratorio sale en el catálogo, sin nombre de profesional', async () => {
    // El servicio de agenda enriquece con el nombre del profesional sólo cuando
    // el `resourceRefType` es una tabla de perfiles. Un laboratorio no lo es:
    // lo que importa es que **no se lo excluya** por eso.
    const res = await http()
      .get('/scheduling/resources')
      .query({ tenantId: SEED.tenantId })
      .set(auth())
      .expect(200);

    const laboratorio = res.body.items.find(
      (item: { id: string }) => item.id === resourceId,
    );
    expect(laboratorio).toBeDefined();
    expect(laboratorio.practitionerName ?? null).toBeNull();
  });

  it('7 · el catálogo se puede filtrar por tipo: el selector médico no ve laboratorios', async () => {
    // La tarea 1 del carril preveía tener que exponer el tipo para que el
    // selector de turnos médicos no listara laboratorios. Ya se puede: el
    // filtro existe en la query, así que es una línea en el front y no un
    // cambio de API.
    const soloProfesionales = await http()
      .get('/scheduling/resources')
      .query({ tenantId: SEED.tenantId, resourceType: 'PRACTITIONER' })
      .set(auth())
      .expect(200);

    expect(
      soloProfesionales.body.items.some(
        (item: { id: string }) => item.id === resourceId,
      ),
    ).toBe(false);

    const soloSalas = await http()
      .get('/scheduling/resources')
      .query({ tenantId: SEED.tenantId, resourceType: 'ROOM' })
      .set(auth())
      .expect(200);

    expect(
      soloSalas.body.items.some(
        (item: { id: string }) => item.id === resourceId,
      ),
    ).toBe(true);
  });
});
