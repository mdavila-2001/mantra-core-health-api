import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  identidadProfesional,
} from './harness';

/**
 * FX-5 · los motivos de bloqueo, catalogados y usables (TAREA-11, punto 4).
 *
 * ## Qué demuestra, y por qué contra la base
 *
 * El pedido era «un MOTIVO (CATALOGABLE)» para bloquear la agenda. La columna
 * `availability_exceptions.exception_type_concept_id` existía —obligatoria, con
 * su FK a `terminology.catalog_concepts`— y **nadie publicaba las opciones**:
 * el formulario no tenía de dónde sacarlas, así que en la práctica todo bloqueo
 * nacía con el mismo valor.
 *
 * Se agregaron cuatro motivos y un `GET` que los publica. Pero un concepto
 * nuevo en TypeScript **no es un concepto en la base**: si el sembrador no lo
 * escribe, crear un bloqueo con él revienta contra la FK. Esa es la parte que
 * sólo se puede comprobar acá, arrancando la aplicación de verdad y guardando
 * una fila.
 *
 * Las pruebas unitarias del servicio cubren la lógica —qué motivos hay, cuál
 * exige texto, cuál no bloquea—. Esta suite cubre lo otro: que existan.
 */
describe('FX-5 · los motivos de bloqueo se publican y se pueden usar', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';
  const medico = {
    email: `fx5-${sufijo}@example.test`,
    token: '',
    hpid: '',
    tenantId: '',
  };
  let resourceId = '';

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(medico.email),
        email: medico.email,
        password: PASSWORD,
        name: 'Silvia',
        lastName: 'Cortez',
        licenseNumber: `LIC-FX5-${sufijo}`,
        credentialNumber: `CRED-FX5-${sufijo}`,
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
        name: 'Consultorio FX-5',
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);
    resourceId = recurso.body.id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('el catálogo se publica con los siete motivos', async () => {
    const res = await http()
      .get('/scheduling/exception-types')
      .set(bearer(medico.token))
      .expect(200);

    const claves = res.body.items.map((i: { type: string }) => i.type);
    expect(claves).toEqual([
      'ABSENCE',
      'HOLIDAY',
      'VACATION',
      'CONFERENCE',
      'ERRAND',
      'EXTRA',
      'OTHER',
    ]);
  });

  it('los conceptos que publica EXISTEN en terminología', async () => {
    // Ésta es la prueba que no se puede hacer con mocks. Un concepto declarado
    // en TypeScript y no sembrado se ve idéntico desde el servicio, y revienta
    // recién al escribir la fila contra la FK.
    const res = await http()
      .get('/scheduling/exception-types')
      .set(bearer(medico.token))
      .expect(200);

    const ids = res.body.items.map((i: { conceptId: string }) => i.conceptId);
    const encontrados = await ctx.orm.em
      .getConnection()
      .execute<{ id: string }[]>(
        'select id from terminology.catalog_concepts where id in (?)',
        [ids],
      );

    expect(encontrados).toHaveLength(ids.length);
  });

  it('un motivo nuevo se puede usar de verdad: el bloqueo se guarda', async () => {
    const bloqueo = await http()
      .post(`/scheduling/resources/${resourceId}/exceptions`)
      .set(bearer(medico.token))
      .send({
        exceptionType: 'CONFERENCE',
        startAt: '2030-04-01T13:00:00Z',
        endAt: '2030-04-01T17:00:00Z',
      })
      .expect(201);

    const fila = await ctx.orm.em.getConnection().execute<{ code: string }[]>(
      `select c.code
         from scheduling.availability_exceptions e
         join terminology.catalog_concepts c on c.id = e.exception_type_concept_id
        where e.id = ?`,
      [bloqueo.body.id],
    );

    // El motivo llega a la columna como CONCEPTO, no como texto: es lo que
    // pedía «catalogable», y lo que permite contarlos y traducirlos después.
    expect(fila).toHaveLength(1);
    expect(fila[0].code).toBe('EXC_CONFERENCE');
  });

  it('«Otro» sin explicación se rechaza, aunque el formulario lo deje pasar', async () => {
    await http()
      .post(`/scheduling/resources/${resourceId}/exceptions`)
      .set(bearer(medico.token))
      .send({
        exceptionType: 'OTHER',
        startAt: '2030-04-02T13:00:00Z',
        endAt: '2030-04-02T17:00:00Z',
      })
      .expect(422);
  });

  it('«Otro» con explicación se guarda, y el texto queda con el bloqueo', async () => {
    const bloqueo = await http()
      .post(`/scheduling/resources/${resourceId}/exceptions`)
      .set(bearer(medico.token))
      .send({
        exceptionType: 'OTHER',
        reason: 'Junta médica del hospital',
        startAt: '2030-04-03T13:00:00Z',
        endAt: '2030-04-03T17:00:00Z',
      })
      .expect(201);

    const fila = await ctx.orm.em
      .getConnection()
      .execute<{ reason: string | null; code: string }[]>(
        `select e.reason, c.code
         from scheduling.availability_exceptions e
         join terminology.catalog_concepts c on c.id = e.exception_type_concept_id
        where e.id = ?`,
        [bloqueo.body.id],
      );

    expect(fila[0].code).toBe('EXC_OTHER');
    // El texto libre es la mejor fuente para ampliar la lista después: a los
    // tres meses se lee qué escribió la gente y esos son los motivos que
    // faltaban.
    expect(fila[0].reason).toBe('Junta médica del hospital');
  });

  it('un motivo que no está en el catálogo se rechaza', async () => {
    await http()
      .post(`/scheduling/resources/${resourceId}/exceptions`)
      .set(bearer(medico.token))
      .send({
        exceptionType: 'CUMPLEAÑOS',
        startAt: '2030-04-04T13:00:00Z',
        endAt: '2030-04-04T17:00:00Z',
      })
      .expect(400);
  });
});
