import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bearer,
  bootstrapTestApp,
  camposObligatoriosDePaciente,
  type TestContext,
} from '../harness';

/**
 * MCH-004 · un access token deja de servir cuando su sesión se cierra.
 *
 * Antes el `JwtStrategy` sólo verificaba firma y expiración: después de logout,
 * logout-all, bloqueo de la cuenta o retiro de un rol, el mismo token seguía
 * abriendo la API hasta expirar. Acá cada caso usa el token real que emitió el
 * login y lo presenta otra vez después del gesto que tiene que cortarlo.
 *
 * No trunca ni borra: cada caso registra su propia paciente.
 */
describe('MCH-004 · revocación inmediata del access token (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';
  let camposDePaciente: Awaited<
    ReturnType<typeof camposObligatoriosDePaciente>
  >;
  let registradas = 0;

  /** Ruta autenticada cualquiera, sin rol especial. */
  const RUTA = '/terminology/concepts?limit=1';

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  async function registrar(): Promise<{ nationalId: string; userId: string }> {
    const nationalId = `M004-${sufijo}-${registradas++}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId,
        password: PASSWORD,
        displayName: 'Paciente MCH-004',
        email: `${nationalId.toLowerCase()}@example.test`,
      })
      .expect(201);
    const token = await login(nationalId);
    return { nationalId, userId: claims(token)['sub'] as string };
  }

  async function login(nationalId: string): Promise<string> {
    const res = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password: PASSWORD })
      .expect(200);
    return res.body.accessToken as string;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    camposDePaciente = await camposObligatoriosDePaciente(ctx);
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('AC01 · el mismo token falla después de logout', async () => {
    const { nationalId } = await registrar();
    const token = await login(nationalId);
    await http().get(RUTA).set(bearer(token)).expect(200);

    await http().post('/iam/auth/logout').set(bearer(token)).expect(200);

    await http().get(RUTA).set(bearer(token)).expect(401);
  });

  it('AC01 · logout-all corta también el token de la otra sesión', async () => {
    const { nationalId } = await registrar();
    const a = await login(nationalId);
    const b = await login(nationalId);
    await http().get(RUTA).set(bearer(b)).expect(200);

    await http().post('/iam/auth/logout-all').set(bearer(a)).expect(200);

    await http().get(RUTA).set(bearer(a)).expect(401);
    await http().get(RUTA).set(bearer(b)).expect(401);
  });

  it('AC02 · bloquear la cuenta corta su token en la petición siguiente', async () => {
    const { nationalId, userId } = await registrar();
    const token = await login(nationalId);
    await http().get(RUTA).set(bearer(token)).expect(200);

    await http()
      .post(`/iam/users/${userId}/lock`)
      .set(bearer(ctx.adminToken))
      .send({ reason: 'MCH-004' })
      .expect((r) => expect([200, 201]).toContain(r.status));

    await http().get(RUTA).set(bearer(token)).expect(401);
  });

  it('AC02 · retirar un rol deja sin efecto el token que lo llevaba firmado', async () => {
    const { nationalId, userId } = await registrar();
    await http()
      .post(`/iam/users/${userId}/global-roles`)
      .set(bearer(ctx.adminToken))
      .send({ role: 'CLINICIAN', action: 'GRANT' })
      .expect((r) => expect([200, 201]).toContain(r.status));
    const token = await login(nationalId);
    expect(claims(token)['roles']).toContain('CLINICIAN');

    await http()
      .post(`/iam/users/${userId}/global-roles`)
      .set(bearer(ctx.adminToken))
      .send({ role: 'CLINICIAN', action: 'REVOKE' })
      .expect((r) => expect([200, 201]).toContain(r.status));

    await http().get(RUTA).set(bearer(token)).expect(401);
    // Un login nuevo emite los roles vigentes, sin el retirado.
    const nuevo = await login(nationalId);
    expect(claims(nuevo)['roles']).not.toContain('CLINICIAN');
    await http().get(RUTA).set(bearer(nuevo)).expect(200);
  });
});
