import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  camposObligatoriosDePaciente,
  identidadProfesional,
} from './harness';

/**
 * TX-27 · las lecturas en lote que reemplazan a las pantallas con N+1, contra
 * la API real. Cada una devuelve lo mismo que la lectura individual, en una
 * sola petición:
 *
 * | pantalla                  | antes                        | ahora                              |
 * |---------------------------|------------------------------|------------------------------------|
 * | solicitudes de acceso     | 1 + N fichas de profesional  | 1 (`practitionerName` en la lista) |
 * | mi historia (formularios) | 1 + N `forms/me/instances/:id` | 1 (`?include=values`)            |
 * | artículos médicos         | 1 + N `community/posts/:id`  | 1 (`community/posts?ids=`)         |
 * | plan de pagos             | 1 + N cotizaciones           | 1 (la lista ya trae las cuotas)    |
 * | consultas del mes         | R agendas (`resourceId`)     | 1 (`resourceIds=`)                 |
 */
describe('TX-27 · lecturas en lote (integración)', () => {
  let ctx: TestContext;
  let camposDePaciente: Awaited<
    ReturnType<typeof camposObligatoriosDePaciente>
  >;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const medico = { token: '', hpid: '', tenantId: '' };
  const titular = { token: '', pid: '' };

  const claims = (token: string): Record<string, unknown> =>
    JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    camposDePaciente = await camposObligatoriosDePaciente(ctx);

    const email = `tx27-med-${sufijo}@example.test`;
    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(email),
        email,
        password: PASSWORD,
        name: 'Renata',
        lastName: 'Salazar',
        licenseNumber: `LIC-TX27-${sufijo}`,
        credentialNumber: `CRED-TX27-${sufijo}`,
      })
      .expect(201);
    medico.hpid = alta.body.practitionerProfileId;
    const loginMedico = await http()
      .post('/iam/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    medico.token = loginMedico.body.accessToken;
    medico.tenantId = (claims(medico.token)['tenants'] as string[])[0];

    const nationalId = `TX27-titular-${sufijo}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId,
        password: PASSWORD,
        displayName: 'Paciente TX-27',
        email: `tx27-titular-${sufijo}@example.test`,
      })
      .expect(201);
    const loginPaciente = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password: PASSWORD })
      .expect(200);
    titular.token = loginPaciente.body.accessToken;
    titular.pid = claims(titular.token)['pid'] as string;
  }, 300_000);

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('la bandeja de solicitudes trae el nombre del profesional en la misma lista', async () => {
    await http()
      .post('/authz/care-relationships/request')
      .set(bearer(medico.token))
      .send({
        tenantId: medico.tenantId,
        patientProfileId: titular.pid,
        relationshipType: 'TREATING',
        reasonText: 'TX-27 (integración)',
      })
      .expect(201);

    const res = await http()
      .get('/authz/care-relationships/requests/mine')
      .set(bearer(titular.token))
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].practitionerProfileId).toBe(medico.hpid);
    expect(typeof res.body[0].practitionerName).toBe('string');
    expect(res.body[0].practitionerName.length).toBeGreaterThan(0);
  });

  describe('forms/me/instances?include=values', () => {
    it('responde 200 con o sin include', async () => {
      const sin = await http()
        .get('/forms/me/instances')
        .set(bearer(titular.token))
        .set('X-Tenant-Id', medico.tenantId)
        .expect(200);
      const con = await http()
        .get('/forms/me/instances')
        .query({ include: 'values' })
        .set(bearer(titular.token))
        .set('X-Tenant-Id', medico.tenantId)
        .expect(200);
      expect(con.body.items).toHaveLength(sin.body.items.length);
    });

    it('un valor de include que no existe es 400', async () => {
      await http()
        .get('/forms/me/instances')
        .query({ include: 'todo' })
        .set(bearer(titular.token))
        .set('X-Tenant-Id', medico.tenantId)
        .expect(400);
    });
  });

  describe('community/posts?ids=', () => {
    it('ids desconocidos: 200 con una lista vacía, sin confirmar que existan', async () => {
      const res = await http()
        .get('/community/posts')
        .query({ ids: `${randomUUID()},${randomUUID()}` })
        .set(bearer(titular.token))
        .expect(200);
      expect(res.body).toEqual([]);
    });

    it.each([
      ['sin ids', undefined],
      ['uno que no es uuid', `${randomUUID()},no-es-uuid`],
    ])('%s: 400', async (_label, ids) => {
      await http()
        .get('/community/posts')
        .query(ids === undefined ? {} : { ids })
        .set(bearer(titular.token))
        .expect(400);
    });
  });

  describe('scheduling/bookings?resourceIds=', () => {
    it('varias agendas en una sola lectura', async () => {
      const res = await http()
        .get('/scheduling/bookings')
        .query({ resourceIds: `${randomUUID()},${randomUUID()}` })
        .set(bearer(ctx.adminToken))
        .set('X-Tenant-Id', medico.tenantId)
        .expect(200);
      expect(res.body.items).toEqual([]);
    });

    it.each([['no-es-uuid'], [' , ']])('%s: 400', async (resourceIds) => {
      await http()
        .get('/scheduling/bookings')
        .query({ resourceIds })
        .set(bearer(ctx.adminToken))
        .set('X-Tenant-Id', medico.tenantId)
        .expect(400);
    });

    it('sin paciente ni recurso sigue sin poder listar todo', async () => {
      await http()
        .get('/scheduling/bookings')
        .set(bearer(ctx.adminToken))
        .set('X-Tenant-Id', medico.tenantId)
        .expect(422);
    });
  });
});
