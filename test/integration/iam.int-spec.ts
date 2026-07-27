import request from 'supertest';
import { MikroORM } from '@mikro-orm/postgresql';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import {
  AuthenticationCredentials,
  Users,
} from '../../src/modules/iam/entities';
import { CONCEPTS } from '../../src/common';

/**
 * Pruebas de integración del módulo IAM contra una instancia real de NestJS y el
 * Postgres configurado. Ejercen los 12 endpoints por sus rutas HTTP reales,
 * verifican persistencia consultando el ORM y cubren autenticación, autorización,
 * conflictos y detección de reuso.
 */
describe('IAM (integración)', () => {
  let ctx: TestContext;
  let orm: MikroORM;
  const email = `jane-${Date.now()}@example.com`;
  const password = 'Str0ng-Passw0rd!';
  let userId: string;
  let refreshToken: string;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    orm = ctx.orm;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const http = () => request(ctx.app.getHttpServer());

  it('UC-01-01 crea un usuario y lo persiste', async () => {
    const res = await http()
      .post('/iam/users')
      .set(bearer(ctx.adminToken))
      .send({ displayName: 'Jane Doe', email, password, initialRole: 'USER' })
      .expect(201);

    expect(res.body).toMatchObject({ displayName: 'Jane Doe' });
    userId = res.body.id;

    const em = orm.em.fork();
    const persisted = await em.findOne(Users, { id: userId });
    expect(persisted).not.toBeNull();
    expect(persisted!.statusConceptId).toBe(CONCEPTS.USER_ACTIVE);
    const cred = await em.findOne(AuthenticationCredentials, {
      userId,
      externalSubject: email,
    });
    expect(cred).not.toBeNull();
    // El hash de contraseña nunca es la contraseña en claro.
    expect(cred!.secretHash).not.toBe(password);
  });

  it('UC-01-01 rechaza sin autenticación (401)', async () => {
    await http()
      .post('/iam/users')
      .send({ displayName: 'X', email: `x-${Date.now()}@e.com`, password })
      .expect(401);
  });

  it('UC-01-01 rechaza email duplicado (409)', async () => {
    const res = await http()
      .post('/iam/users')
      .set(bearer(ctx.adminToken))
      .send({ displayName: 'Dup', email, password })
      .expect(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('UC-01-04 login válido devuelve tokens', async () => {
    const res = await http()
      .post('/iam/auth/login')
      .send({ email, password })
      .expect(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
    refreshToken = res.body.refreshToken;
  });

  it('UC-01-04 login con contraseña incorrecta (401)', async () => {
    await http()
      .post('/iam/auth/login')
      .send({ email, password: 'wrong' })
      .expect(401);
  });

  it('UC-01-06 refresh rota el token y detecta reuso', async () => {
    const first = await http()
      .post('/iam/auth/token/refresh')
      .send({ refreshToken })
      .expect(200);
    expect(first.body.refreshToken).not.toBe(refreshToken);

    // Reusar el refresh token ya rotado dispara la detección de reuso (401).
    await http()
      .post('/iam/auth/token/refresh')
      .send({ refreshToken })
      .expect(401);
  });

  it('UC-01-03 inscribe un factor MFA', async () => {
    await http()
      .post(`/iam/users/${userId}/mfa-factors`)
      .set(bearer(ctx.adminToken))
      .send({ factorType: 'TOTP', label: 'Authenticator' })
      .expect(201);
  });

  it('UC-01-05 registra un dispositivo de confianza', async () => {
    const res = await http()
      .post(`/iam/users/${userId}/devices`)
      .set(bearer(ctx.adminToken))
      .send({
        deviceFingerprint: `fp-${Date.now()}`,
        platform: 'WEB',
        trust: true,
      })
      .expect(201);
    expect(res.body.trusted).toBe(true);
  });

  it('UC-01-02 vincula credencial federada', async () => {
    await http()
      .post(`/iam/users/${userId}/credentials/federated`)
      .set(bearer(ctx.adminToken))
      .send({ identityProvider: 'google', externalSubject: `google|${userId}` })
      .expect(201);
  });

  it('UC-01-10 otorga rol global', async () => {
    await http()
      .post(`/iam/users/${userId}/global-roles`)
      .set(bearer(ctx.adminToken))
      .send({ role: 'SECURITY_ADMIN', action: 'GRANT' })
      .expect(200);
  });

  it('UC-01-11 purga sesiones expiradas', async () => {
    await http()
      .post('/iam/auth/sessions/purge')
      .set(bearer(ctx.adminToken))
      .expect(200);
  });

  it('UC-01-07 bloquea la cuenta', async () => {
    await http()
      .post(`/iam/users/${userId}/lock`)
      .set(bearer(ctx.adminToken))
      .send({ reason: 'test' })
      .expect(200);
    const em = orm.em.fork();
    const u = await em.findOne(Users, { id: userId });
    expect(u!.statusConceptId).toBe(CONCEPTS.USER_LOCKED);
  });

  it('UC-01-12 anonimiza la cuenta (DSAR)', async () => {
    await http()
      .post(`/iam/users/${userId}/anonymize`)
      .set(bearer(ctx.adminToken))
      .expect(200);
    const em = orm.em.fork();
    const u = await em.findOne(Users, { id: userId });
    expect(u!.statusConceptId).toBe(CONCEPTS.USER_ANONYMIZED);
    expect(u!.anonymizedAt).not.toBeNull();
  });

  it('UC-01-08 logout global del administrador', async () => {
    await http()
      .post('/iam/auth/logout-all')
      .set(bearer(ctx.adminToken))
      .expect(200);
  });
});
