import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { SEED } from '../../src/common';

/**
 * El recorrido de agenda tal como lo hace el frontend, contra la API real.
 *
 * Cubre dos cosas que las pruebas unitarias con mocks no podían ver:
 *
 * 1. **Orden de inserción con FK planas.** Las FK del proyecto son columnas
 *    sueltas (`@Property`, no `@ManyToOne`), así que la unidad de trabajo de
 *    MikroORM no conoce la dependencia padre→hijo y puede insertar el hijo
 *    primero. `scheduling` era el único módulo sin un solo `flush()`
 *    intermedio: publicar una plantilla devolvía 500 y confirmar una cita con
 *    recordatorios habría hecho lo mismo. Un mock del repositorio nunca lo
 *    delata, porque el que ordena es el ORM.
 *
 * 2. **Que la agenda se pueda leer.** El módulo se había construido entero de
 *    escritura: `POST /scheduling/slots/{id}/holds` exige un `slotId` que
 *    ningún endpoint devolvía. Reservar desde el portal era imposible.
 */
describe('Agenda — recorrido del frontend contra la API real (integración)', () => {
  let ctx: TestContext;

  const tenantId = SEED.tenantId;
  let resourceId: string;
  let policyId: string;
  let templateId: string;
  let patientProfileId: string;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    // Un paciente propio: el alta devuelve `profileId`, que es también el id de
    // la persona (`patient_profiles.profile_id` referencia `persons.id`).
    const patient = await http()
      .post('/profiles/patients')
      .set(bearer(ctx.adminToken))
      .send({
        patientCode: `INT-AGENDA-${randomUUID().slice(0, 8)}`,
        displayName: 'Paciente de agenda',
        birthDate: '1988-03-02',
      })
      .expect(201);
    patientProfileId = patient.body.profileId;

    const resource = await http()
      .post('/scheduling/resources')
      .set(bearer(ctx.adminToken))
      .send({
        tenantId,
        resourceType: 'PRACTITIONER',
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: randomUUID(),
        name: `Consultorio de integración ${randomUUID().slice(0, 6)}`,
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);
    resourceId = resource.body.id;

    const policy = await http()
      .post('/scheduling/booking-policies')
      .set(bearer(ctx.adminToken))
      .send({
        tenantId,
        code: `INT-POL-${randomUUID().slice(0, 8)}`,
        name: 'Política de integración',
        cancellationWindowMinutes: 60,
        holdTtlSeconds: 300,
      })
      .expect(201);
    policyId = policy.body.id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const http = () => request(ctx.app.getHttpServer());

  /** Lunes de la semana que viene, a medianoche UTC: ventana estable y futura. */
  function nextMondayUtc(): Date {
    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);
    const daysUntilMonday = ((1 - day.getUTCDay() + 7) % 7) + 7;
    day.setUTCDate(day.getUTCDate() + daysUntilMonday);
    return day;
  }

  it('publica una plantilla con sus franjas en la misma transacción (regresión de la FK plana)', async () => {
    // Antes del arreglo esto era un 500: `schedule_rules` se insertaba antes que
    // `schedule_templates` y Postgres rechazaba la FK.
    const res = await http()
      .post(`/scheduling/resources/${resourceId}/templates`)
      .set(bearer(ctx.adminToken))
      .send({
        name: 'Mañanas de integración',
        slotMinutes: 30,
        bookingPolicyId: policyId,
        rules: [
          { dayOfWeek: 1, startTime: '08:00:00', endTime: '10:00:00' },
          { dayOfWeek: 4, startTime: '08:00:00', endTime: '09:00:00' },
        ],
      })
      .expect(201);

    expect(res.body.ruleCount).toBe(2);
    templateId = res.body.id;

    // Y las franjas quedaron realmente escritas, no sólo contadas en la respuesta.
    const em = ctx.orm.em.fork();
    const rules = await em.execute(
      'select id from scheduling.schedule_rules where schedule_template_id = ?',
      [templateId],
    );
    expect(rules).toHaveLength(2);
  });

  it('materializa los cupos y los devuelve por GET /scheduling/slots', async () => {
    const from = nextMondayUtc();
    const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);

    const generated = await http()
      .post(`/scheduling/templates/${templateId}/generate-slots`)
      .set(bearer(ctx.adminToken))
      .send({ from: from.toISOString(), to: to.toISOString() })
      .expect(201);
    // Lunes 08:00–10:00 en franjas de 30' = 4; el jueves cae fuera de la ventana
    // de siete días que arranca el lunes sólo si `to` lo excluye, así que se
    // compara contra lo que la respuesta declara en vez de fijar un número.
    expect(generated.body.created).toBeGreaterThan(0);

    const listed = await http()
      .get('/scheduling/slots')
      .query({
        resourceId,
        from: from.toISOString(),
        to: to.toISOString(),
        onlyAvailable: 'true',
      })
      .set(bearer(ctx.adminToken))
      .expect(200);

    expect(listed.body.count).toBe(generated.body.created);
    expect(listed.body.truncated).toBe(false);
    // Ordenados del más próximo al más lejano: es lo que pinta un calendario.
    const starts = listed.body.items.map((slot: { startAt: string }) =>
      Date.parse(slot.startAt),
    );
    expect([...starts].sort((a, b) => a - b)).toEqual(starts);
  });

  it('regenerar la misma ventana es idempotente', async () => {
    const from = nextMondayUtc();
    const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);

    const again = await http()
      .post(`/scheduling/templates/${templateId}/generate-slots`)
      .set(bearer(ctx.adminToken))
      .send({ from: from.toISOString(), to: to.toISOString() })
      .expect(201);

    expect(again.body.created).toBe(0);
    expect(again.body.skipped).toBeGreaterThan(0);
  });

  it('onlyAvailable=false no filtra: `Boolean("false")` es `true` y aquí no puede serlo', async () => {
    const from = nextMondayUtc();
    const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Se ocupa un cupo para que las dos listas difieran de verdad.
    const available = await http()
      .get('/scheduling/slots')
      .query({
        resourceId,
        from: from.toISOString(),
        to: to.toISOString(),
        onlyAvailable: 'true',
      })
      .set(bearer(ctx.adminToken))
      .expect(200);
    const slotId = available.body.items[0].id;
    await http()
      .post(`/scheduling/slots/${slotId}/holds`)
      .set(bearer(ctx.adminToken))
      .send({ patientProfileId })
      .expect(201);

    const filtered = await http()
      .get('/scheduling/slots')
      .query({
        resourceId,
        from: from.toISOString(),
        to: to.toISOString(),
        onlyAvailable: 'true',
      })
      .set(bearer(ctx.adminToken))
      .expect(200);
    const unfiltered = await http()
      .get('/scheduling/slots')
      .query({
        resourceId,
        from: from.toISOString(),
        to: to.toISOString(),
        onlyAvailable: 'false',
      })
      .set(bearer(ctx.adminToken))
      .expect(200);

    expect(unfiltered.body.count).toBeGreaterThan(filtered.body.count);
    expect(unfiltered.body.items.map((s: { id: string }) => s.id)).toContain(
      slotId,
    );
    expect(filtered.body.items.map((s: { id: string }) => s.id)).not.toContain(
      slotId,
    );
  });

  it('rechaza una ventana invertida y una que supera el tope', async () => {
    const from = nextMondayUtc();
    const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);

    await http()
      .get('/scheduling/slots')
      .query({ from: to.toISOString(), to: from.toISOString() })
      .set(bearer(ctx.adminToken))
      .expect(422);

    const farAway = new Date(from.getTime() + 365 * 24 * 60 * 60 * 1000);
    await http()
      .get('/scheduling/slots')
      .query({ from: from.toISOString(), to: farAway.toISOString() })
      .set(bearer(ctx.adminToken))
      .expect(422);
  });

  it('lista los recursos agendables del tenant', async () => {
    const res = await http()
      .get('/scheduling/resources')
      .query({ tenantId, resourceType: 'PRACTITIONER' })
      .set(bearer(ctx.adminToken))
      .expect(200);

    expect(res.body.items.map((r: { id: string }) => r.id)).toContain(
      resourceId,
    );
  });
});
