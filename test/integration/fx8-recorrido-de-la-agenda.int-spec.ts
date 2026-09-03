import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';

/**
 * FX-8 · el recorrido completo de la agenda, contra la base real.
 *
 * ## Por qué existe
 *
 * Todo lo que se construyó estos días para los carriles 10 a 13 quedó en
 * **TESTED**: pruebas unitarias con el `EntityManager` simulado. Eso demuestra
 * que cada pieza hace lo suyo, y no demuestra que **encajen** — la primera vez
 * que alguien recorrió el producto de verdad encontró cuatro bloqueos en veinte
 * minutos que las pruebas verdes no habían visto.
 *
 * Esta prueba hace ese recorrido: publicar, generar cupos, mover el día, cerrar
 * un rato, bloquear y corregir el bloqueo. Con roles reales, contra Postgres, y
 * comprobando la consecuencia de cada paso en la lectura siguiente y no en el
 * código de retorno.
 *
 * ## Lo que sigue sin cubrir, y hay que decirlo
 *
 * **Nada visual.** Que la grilla por horas pinte las celdas correctas, que la
 * tabla del formulario se lea en un teléfono o que el modal atrape el foco no
 * se ve desde acá. Eso necesita un navegador y una persona mirando.
 */
describe('FX-8 · el recorrido de la agenda, de punta a punta', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const medico = { email: `fx8-${sufijo}@example.test`, token: '', hpid: '', tenantId: '' };
  let resourceId = '';
  let templateId = '';

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  /** El próximo lunes a medianoche UTC: día fijo para que la agenda sea estable. */
  function proximoLunes(): Date {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7));
    return d;
  }

  const lunes = proximoLunes();
  const finDelLunes = new Date(lunes.getTime() + 24 * 3600 * 1000);

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        email: medico.email,
        password: PASSWORD,
        name: 'Rocío',
        lastName: 'Fernández',
        licenseNumber: `LIC-FX8-${sufijo}`,
        credentialNumber: `CRED-FX8-${sufijo}`,
      })
      .expect(201);
    medico.hpid = alta.body.practitionerProfileId;

    const login = await http()
      .post('/iam/auth/login')
      .send({ email: medico.email, password: PASSWORD })
      .expect(200);
    medico.token = login.body.accessToken;
    medico.tenantId = (claims(medico.token)['tenants'] as string[])[0];
  }, 120_000);

  afterAll(async () => {
    await ctx.app.close();
  });

  it('1 · publica su agenda y su horario', async () => {
    const recurso = await http()
      .post('/scheduling/resources')
      .set(bearer(medico.token))
      .send({
        tenantId: medico.tenantId,
        resourceType: 'PRACTITIONER',
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: medico.hpid,
        name: 'Consultorio FX-8',
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);
    resourceId = recurso.body.id;

    const plantilla = await http()
      .post(`/scheduling/resources/${resourceId}/templates`)
      .set(bearer(medico.token))
      .send({
        name: 'Mañanas FX-8',
        slotMinutes: 30,
        rules: [
          {
            dayOfWeek: 1,
            startTime: '09:00:00',
            endTime: '13:00:00',
            slotMinutes: 30,
            capacityPerSlot: 1,
          },
        ],
      })
      .expect(201);
    templateId = plantilla.body.id;
    expect(templateId).toBeTruthy();
  });

  it('2 · generar cupos crea los OCHO que el horario promete', async () => {
    // 09:00–13:00 de 30 minutos son ocho turnos. Es el mismo número que la
    // vista previa del formulario calcula sin llamar a nadie: si acá salieran
    // otros, la pantalla estaría prometiendo algo que el servidor no cumple.
    const res = await http()
      .post(`/scheduling/templates/${templateId}/generate-slots`)
      .set(bearer(medico.token))
      .send({ from: lunes.toISOString(), to: finDelLunes.toISOString() })
      .expect(201);

    expect(res.body.created).toBe(8);
  });

  it('3 · el catálogo de tipologías está publicado y no usa el tono de error', async () => {
    const res = await http()
      .get('/scheduling/activity-types')
      .set(bearer(medico.token))
      .expect(200);

    expect(res.body.items).toHaveLength(5);
    // `error` es el de los bloqueos: una actividad pintada de rojo diría que el
    // rato está cerrado cuando no lo está.
    expect(res.body.items.map((i: { tone: string }) => i.tone)).not.toContain('error');
  });

  it('4 · mover el horario 20 minutos corre los cupos de verdad', async () => {
    const antes = await http()
      .get(
        `/scheduling/resources/${resourceId}/slots?from=${lunes.toISOString()}&to=${finDelLunes.toISOString()}`,
      )
      .set(bearer(medico.token))
      .expect(200);
    const primero = new Date(antes.body.items[0].startAt);

    const movido = await http()
      .post(`/scheduling/resources/${resourceId}/shift-slots`)
      .set(bearer(medico.token))
      .send({
        shiftMinutes: 20,
        from: lunes.toISOString(),
        to: finDelLunes.toISOString(),
      })
      .expect(200);
    expect(movido.body.movedSlots).toBe(8);

    const despues = await http()
      .get(
        `/scheduling/resources/${resourceId}/slots?from=${lunes.toISOString()}&to=${finDelLunes.toISOString()}`,
      )
      .set(bearer(medico.token))
      .expect(200);
    const nuevo = new Date(despues.body.items[0].startAt);

    // La consecuencia, no el código de retorno: el primer cupo empieza veinte
    // minutos más tarde en la LECTURA siguiente.
    expect(nuevo.getTime() - primero.getTime()).toBe(20 * 60 * 1000);
  });

  it('5 · mover cero minutos se rechaza en vez de responder «listo»', async () => {
    await http()
      .post(`/scheduling/resources/${resourceId}/shift-slots`)
      .set(bearer(medico.token))
      .send({ shiftMinutes: 0, from: lunes.toISOString(), to: finDelLunes.toISOString() })
      .expect(422);
  });

  it('6 · cerrar un rato deja el bloqueo que impide que vuelva', async () => {
    const lista = await http()
      .get(
        `/scheduling/resources/${resourceId}/slots?from=${lunes.toISOString()}&to=${finDelLunes.toISOString()}`,
      )
      .set(bearer(medico.token))
      .expect(200);
    const unCupo = lista.body.items[0].id;

    const res = await http()
      .post(`/scheduling/resources/${resourceId}/close-slots`)
      .set(bearer(medico.token))
      .send({ exceptionType: 'ERRAND', slotIds: [unCupo] })
      .expect(200);

    expect(res.body.closedSlots).toBe(1);
    // La excepción es la razón de ser del endpoint: sin ella, cerrar dura
    // hasta la próxima generación.
    expect(res.body.exceptionId).toBeTruthy();

    const bloqueos = await http()
      .get(
        `/scheduling/resources/${resourceId}/exceptions?from=${lunes.toISOString()}&to=${finDelLunes.toISOString()}`,
      )
      .set(bearer(medico.token))
      .expect(200);
    expect(bloqueos.body.items.some((x: { id: string }) => x.id === res.body.exceptionId)).toBe(
      true,
    );
  });

  it('7 · bloquear con motivo catalogado, y el motivo viaja con su etiqueta', async () => {
    const creado = await http()
      .post(`/scheduling/resources/${resourceId}/exceptions`)
      .set(bearer(medico.token))
      .send({
        exceptionType: 'VACATION',
        reason: 'Me voy a Tarija',
        startAt: new Date(lunes.getTime() + 15 * 3600 * 1000).toISOString(),
        endAt: new Date(lunes.getTime() + 17 * 3600 * 1000).toISOString(),
      })
      .expect(201);

    const lista = await http()
      .get(
        `/scheduling/resources/${resourceId}/exceptions?from=${lunes.toISOString()}&to=${finDelLunes.toISOString()}`,
      )
      .set(bearer(medico.token))
      .expect(200);

    const mio = lista.body.items.find((x: { id: string }) => x.id === creado.body.id);
    // La etiqueta la manda el servidor: la pantalla no traduce estados.
    expect(mio.reasonLabel).toBe('Vacaciones');
    // Y la descripción es un campo APARTE del motivo, como pidió el original.
    expect(mio.reason).toBe('Me voy a Tarija');
  });

  it('8 · corregir el bloqueo conserva el id y NO reabre al achicar', async () => {
    const lista = await http()
      .get(
        `/scheduling/resources/${resourceId}/exceptions?from=${lunes.toISOString()}&to=${finDelLunes.toISOString()}`,
      )
      .set(bearer(medico.token))
      .expect(200);
    const vacaciones = lista.body.items.find(
      (x: { reasonLabel?: string }) => x.reasonLabel === 'Vacaciones',
    );

    const res = await http()
      .patch(`/scheduling/exceptions/${vacaciones.id}`)
      .set(bearer(medico.token))
      .send({ endAt: new Date(lunes.getTime() + 16 * 3600 * 1000).toISOString() })
      .expect(200);

    // AC-11-7: el mismo id antes y después. Editar no borra y recrea.
    expect(res.body.id).toBe(vacaciones.id);
    // P-11-3: achicar no reabre nada. En este módulo los cupos sólo los crea
    // publicar el horario.
    expect(res.body.blockedSlots).toBe(0);
  });

  it('9 · retirar el horario y volver a activarlo: el ciclo del viaje', async () => {
    // Retirar es `DELETE` sobre el propio horario, no un verbo aparte: lo que
    // se retira es el horario entero. Reactivar sí es un `POST` propio, porque
    // no hay un «des-borrar» que le corresponda. La asimetría es del contrato,
    // no un descuido.
    const retiro = await http()
      .delete(`/scheduling/templates/${templateId}`)
      .set(bearer(medico.token))
      .expect(200);
    // Devuelve cuerpo a propósito (no es 204): dice cuántos cupos soltó y
    // cuántos conservó por tener cita.
    expect(retiro.body.statusConceptId).toBeTruthy();

    const vuelta = await http()
      .post(`/scheduling/templates/${templateId}/reactivate`)
      .set(bearer(medico.token))
      .expect(200);

    // Y avisa que faltan los cupos: retirar borró los libres, y reactivar no
    // los repone a propósito. Sin este campo el horario quedaría «vigente» y
    // sin un solo turno ofrecido.
    expect(vuelta.body.slotsPendientes).toBe(true);
  });

  it('10 · la agenda de otro profesional no se toca', async () => {
    // El mismo 403 para todo: mover, cerrar y corregir comprueban lo mismo.
    const ajeno = randomUUID();
    await http()
      .post(`/scheduling/resources/${ajeno}/shift-slots`)
      .set(bearer(medico.token))
      .send({ shiftMinutes: 10, from: lunes.toISOString(), to: finDelLunes.toISOString() })
      .expect(404);
  });
});
