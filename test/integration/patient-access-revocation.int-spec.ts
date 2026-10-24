import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  camposObligatoriosDePaciente,
  TEST_ADMIN_ID,
} from './harness';
import { SEED } from '../../src/common';

/**
 * BR-20 · «Mi privacidad» y «Quién ve mi historia», contra la base.
 *
 * Fija lo que un doble no puede: que retirar cierra la vigencia **sin borrar la
 * fila**, que las lecturas `me` no mezclan pacientes, que revocar un acceso lo
 * deja `REVOKED` en la fila y que el acceso de emergencia sin justificación es
 * 400 y no crea nada.
 *
 * El «la médica recibe 403 al abrir /medical-records/:profileId» depende del
 * turno del día y de la relación asistencial de un profesional sembrado; se
 * prueba a mano contra la API viva (ver el REPORT del carril) y no acá.
 */
describe('BR-20 · accesos y consentimientos del paciente (integración)', () => {
  let ctx: TestContext;
  let campos: Awaited<ReturnType<typeof camposObligatoriosDePaciente>>;
  const password = 'S3cret-passw0rd';
  const marca = randomUUID().slice(0, 8);
  const http = () => request(ctx.app.getHttpServer());
  const admin = () => bearer(ctx.adminToken);

  function claims(bruto: string): Record<string, unknown> {
    const [, cuerpo] = bruto.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  async function registrarPaciente(etiqueta: string) {
    const nationalId = `B20-${etiqueta}-${marca}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...campos,
        nationalId,
        password,
        displayName: `Paciente ${etiqueta}`,
        email: `b20-${etiqueta}-${marca}@example.test`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password })
      .expect(200);
    const token = login.body.accessToken as string;
    return { token, patientProfileId: claims(token)['pid'] as string };
  }

  let a: { token: string; patientProfileId: string };
  let b: { token: string; patientProfileId: string };

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    campos = await camposObligatoriosDePaciente(ctx);
    a = await registrarPaciente('a');
    b = await registrarPaciente('b');
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('retirar un consentimiento cierra la vigencia y no borra la fila', async () => {
    const creado = await http()
      .post('/consent/consents')
      .set(admin())
      .send({
        patientProfileId: a.patientProfileId,
        processingPurposeId: SEED.processingPurposeId,
        tenantId: SEED.tenantId,
      })
      .expect(201);

    const antes = await http()
      .get('/consent/me/consents')
      .set(bearer(a.token))
      .expect(200);
    expect(
      antes.body.items.find((c: any) => c.id === creado.body.id),
    ).toMatchObject({ state: 'ACTIVE' });

    await http()
      .post(`/consent/me/consents/${creado.body.id}/withdraw`)
      .set(bearer(a.token))
      .send({})
      .expect(200);

    const despues = await http()
      .get('/consent/me/consents')
      .set(bearer(a.token))
      .expect(200);
    const fila = despues.body.items.find((c: any) => c.id === creado.body.id);
    expect(fila).toMatchObject({ state: 'WITHDRAWN' });
    expect(fila.withdrawnAt).toBeTruthy();
    expect(fila.validTo).toBeTruthy();
  });

  it('el paciente B no ve ni retira los consentimientos del A', async () => {
    const delA = await http()
      .get('/consent/me/consents')
      .set(bearer(a.token))
      .expect(200);
    const idDeA = delA.body.items[0].id as string;

    const delB = await http()
      .get('/consent/me/consents')
      .set(bearer(b.token))
      .expect(200);
    expect(delB.body.items.map((c: any) => c.id)).not.toContain(idDeA);

    await http()
      .post(`/consent/me/consents/${idDeA}/withdraw`)
      .set(bearer(b.token))
      .send({})
      .expect(404);
  });

  it('un acceso concedido se lista, se revoca por el titular y queda REVOKED', async () => {
    const grant = await http()
      .post(`/authz/patients/${a.patientProfileId}/clinical-access-grants`)
      .set(admin())
      .send({
        grantedUserId: TEST_ADMIN_ID,
        tenantId: SEED.tenantId,
        purposeOfUse: 'TREATMENT',
        accessLevel: 'READ',
        validTo: new Date(Date.now() + 3600_000).toISOString(),
      })
      .expect(201);

    const lista = await http()
      .get('/authz/me/access')
      .set(bearer(a.token))
      .expect(200);
    expect(
      lista.body.grants.find((g: any) => g.id === grant.body.id),
    ).toMatchObject({ state: 'ACTIVE', isEmergency: false });

    await http()
      .post(`/authz/me/clinical-access-grants/${grant.body.id}/revoke`)
      .set(bearer(b.token))
      .expect(404);
    await http()
      .post(`/authz/me/clinical-access-grants/${grant.body.id}/revoke`)
      .set(bearer(a.token))
      .expect(200);

    const despues = await http()
      .get('/authz/me/access')
      .set(bearer(a.token))
      .expect(200);
    expect(
      despues.body.grants.find((g: any) => g.id === grant.body.id),
    ).toMatchObject({ state: 'REVOKED' });
  });

  it('emergencia: sin justificación es 400 y no crea nada; con ella, 201 y el titular la ve', async () => {
    const antes = await http()
      .get('/authz/me/access')
      .set(bearer(a.token))
      .expect(200);

    await http()
      .post(`/authz/patients/${a.patientProfileId}/break-the-glass`)
      .set(admin())
      .send({ tenantId: SEED.tenantId, justification: '' })
      .expect(400);
    const trasFallo = await http()
      .get('/authz/me/access')
      .set(bearer(a.token))
      .expect(200);
    expect(trasFallo.body.grants.length).toBe(antes.body.grants.length);

    const emergencia = await http()
      .post(`/authz/patients/${a.patientProfileId}/break-the-glass`)
      .set(admin())
      .send({
        tenantId: SEED.tenantId,
        justification: 'Paciente inconsciente en urgencias, sin acompañante',
        windowMinutes: 15,
      })
      .expect(201);

    const lista = await http()
      .get('/authz/me/access')
      .set(bearer(a.token))
      .expect(200);
    expect(
      lista.body.grants.find((g: any) => g.id === emergencia.body.id),
    ).toMatchObject({ isEmergency: true, state: 'ACTIVE' });
  });
});
