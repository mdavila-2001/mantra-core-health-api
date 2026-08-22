import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';

/**
 * TJ-1 · el avance del alta del profesional, y el solape entre sus agendas.
 *
 * ## Por qué contra la base y no con dobles
 *
 * Porque las dos reglas que agrega este carril son **consultas**: «¿qué le
 * falta?» se responde mirando cuatro tablas, y «¿esta franja choca?» mirando
 * las de sus otros recursos. Un doble devuelve lo que uno le diga; lo que hay
 * que comprobar es que la consulta encuentre lo que existe.
 *
 * ## Lo que fija
 *
 * 1. Un médico recién registrado NO está completo, y el primer paso que le
 *    falta es el que corresponde.
 * 2. Cada dato que carga **mueve** el paso, sin que nadie escriba un progreso.
 * 3. Publicar una franja que se superpone con otra agenda suya se rechaza con
 *    422 diciendo cuál choca.
 */
describe('TJ-1 · alta del profesional (integración)', () => {
  let ctx: TestContext;

  let token: string;
  let hpid: string;
  let tenantId: string;

  const http = () => request(ctx.app.getHttpServer());

  /** Los claims del token; acá interesa el contenido, no la firma. */
  function claims(bruto: string): Record<string, unknown> {
    const [, cuerpo] = bruto.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  async function onboarding(): Promise<{
    steps: { key: string; complete: boolean; missing: string[] }[];
    firstIncomplete: string;
  }> {
    const res = await http()
      .get('/profiles/practitioners/me/onboarding')
      .set(bearer(token))
      .expect(200);
    return res.body;
  }

  /** Publica un recurso propio y le cuelga una plantilla con esas franjas. */
  async function publicarAgenda(
    nombre: string,
    rules: { dayOfWeek: number; startTime: string; endTime: string }[],
    esperado = 201,
  ): Promise<request.Response> {
    const recurso = await http()
      .post('/scheduling/resources')
      .set(bearer(token))
      .send({
        tenantId,
        resourceType: 'PRACTITIONER',
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: hpid,
        name: nombre,
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);

    return http()
      .post(`/scheduling/resources/${recurso.body.id}/templates`)
      .set(bearer(token))
      .send({ name: `Plantilla ${nombre}`, slotMinutes: 30, rules })
      .expect(esperado);
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const sufijo = randomUUID().slice(0, 8);
    const email = `tj1-${sufijo}@example.test`;
    const password = 'S3cret-passw0rd';

    await http()
      .post('/iam/auth/register-practitioner')
      .send({
        email,
        password,
        name: 'Elena',
        lastName: 'Salas',
        licenseNumber: `LIC-TJ1-${sufijo}`,
        credentialNumber: `CRED-TJ1-${sufijo}`,
      })
      .expect(201);

    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password })
      .expect(200);
    token = login.body.accessToken;
    hpid = claims(token)['hpid'] as string;
    tenantId = (claims(token)['tenants'] as string[])[0];
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('devuelve siempre las cinco etapas, en orden', async () => {
    const estado = await onboarding();

    expect(estado.steps.map((paso) => paso.key)).toEqual([
      'professional-data',
      'photo',
      'organizations',
      'schedule',
      'review',
    ]);
  });

  it('un médico recién registrado no está completo', async () => {
    const estado = await onboarding();

    expect(estado.firstIncomplete).not.toBe('done');
    expect(estado.steps.every((paso) => paso.complete)).toBe(false);
  });

  it('dice QUÉ falta, no sólo que falta', async () => {
    const estado = await onboarding();
    const pendientes = estado.steps.filter((paso) => !paso.complete);

    // Sin claves de faltante, la pantalla no puede decirle a la persona qué
    // cargar: sólo podría repetir «incompleto».
    expect(pendientes.length).toBeGreaterThan(0);
    expect(pendientes.every((paso) => paso.missing.length > 0)).toBe(true);
  });

  it('publicar una agenda mueve el paso, sin que nadie escriba un progreso', async () => {
    const antes = await onboarding();
    const agendaAntes = antes.steps.find((paso) => paso.key === 'schedule');
    expect(agendaAntes?.complete).toBe(false);

    await publicarAgenda('Consultorio Norte', [
      { dayOfWeek: 1, startTime: '09:00:00', endTime: '12:00:00' },
    ]);

    const despues = await onboarding();
    expect(
      despues.steps.find((paso) => paso.key === 'schedule')?.complete,
    ).toBe(true);
    // La afiliación también: un profesional en su propio consultorio no está
    // afiliado a nadie, y su agenda propia cuenta como lugar donde atiende.
    expect(
      despues.steps.find((paso) => paso.key === 'organizations')?.complete,
    ).toBe(true);
  });

  it('rechaza con 422 una franja que se superpone con otra agenda suya', async () => {
    // Ya publicó lunes 9–12 en «Consultorio Norte». El mismo lunes 10–13 en
    // otra sede lo pondría en dos lugares a la vez.
    const res = await publicarAgenda(
      'Consultorio Sur',
      [{ dayOfWeek: 1, startTime: '10:00:00', endTime: '13:00:00' }],
      422,
    );

    expect(JSON.stringify(res.body)).toContain('superpone');
  });

  it('acepta una franja pegada pero no superpuesta: 12–14 después de 9–12', async () => {
    // Los extremos no chocan: terminar 12:00 y empezar 12:00 es legítimo, y
    // rechazarlo obligaría a dejar huecos artificiales entre consultorios.
    await publicarAgenda('Consultorio Tarde', [
      { dayOfWeek: 1, startTime: '12:00:00', endTime: '14:00:00' },
    ]);
  });

  it('acepta el mismo horario en OTRO día de la semana', async () => {
    await publicarAgenda('Consultorio Martes', [
      { dayOfWeek: 2, startTime: '09:00:00', endTime: '12:00:00' },
    ]);
  });

  it('sin foto cargada, el paso de la foto NO se da por cumplido', async () => {
    // `photo_file_id` es nullable y MikroORM lo hidrata como `null`. Con
    // `!== undefined` el paso salía «completado» para un profesional que nunca
    // subió una foto — se vio en pantalla antes que en ninguna prueba.
    const estado = await onboarding();
    const foto = estado.steps.find((paso) => paso.key === 'photo');

    expect(foto?.complete).toBe(false);
    expect(foto?.missing).toContain('photo');
  });

  it('una cuenta sin perfil profesional recibe 422, no un 500', async () => {
    const sufijo = randomUUID().slice(0, 8);
    const nationalId = `TJ1-PAC-${sufijo}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        nationalId,
        password: 'S3cret-passw0rd',
        displayName: 'Paciente TJ1',
        email: `tj1-pac-${sufijo}@example.test`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password: 'S3cret-passw0rd' })
      .expect(200);

    await http()
      .get('/profiles/practitioners/me/onboarding')
      .set(bearer(login.body.accessToken))
      .expect(422);
  });
});
