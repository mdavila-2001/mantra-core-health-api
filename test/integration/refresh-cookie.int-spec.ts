import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { bootstrapTestApp, bearer, type TestContext } from './harness';

/**
 * Los dos modos de entrega del refresh token, contra la API real.
 *
 * El flag se lee al construir el controlador y el middleware, así que cada modo
 * necesita su propia instancia de la aplicación: cambiar `process.env` a mitad
 * de una corrida no reconfigura lo ya construido.
 */
describe('Refresh token — cuerpo y cookie httpOnly (integración)', () => {
  const email = `cookie-${randomUUID().slice(0, 8)}@redesa.test`;
  const password = 'S3cret-passw0rd';

  /** Crea una cuenta propia para no depender del estado de otras pruebas. */
  async function seedUser(ctx: TestContext): Promise<void> {
    await request(ctx.app.getHttpServer())
      .post('/iam/users')
      .set(bearer(ctx.adminToken))
      .send({ email, password, displayName: 'Prueba de cookie' })
      .expect(201);
  }

  describe('flag apagado (por defecto) — el contrato actual no cambia', () => {
    let ctx: TestContext;

    beforeAll(async () => {
      delete process.env.AUTH_REFRESH_COOKIE_ENABLED;
      ctx = await bootstrapTestApp();
      await seedUser(ctx);
    });

    afterAll(async () => {
      await ctx.app.close();
    });

    const http = () => request(ctx.app.getHttpServer());

    it('login devuelve el refresh token en el cuerpo y no emite cookie', async () => {
      const res = await http()
        .post('/iam/auth/login')
        .send({ email, password })
        .expect(200);

      expect(typeof res.body.refreshToken).toBe('string');
      expect(res.body.refreshToken.length).toBeGreaterThan(0);
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('el refresco sigue leyendo del cuerpo', async () => {
      const login = await http()
        .post('/iam/auth/login')
        .send({ email, password })
        .expect(200);

      const refreshed = await http()
        .post('/iam/auth/token/refresh')
        .send({ refreshToken: login.body.refreshToken })
        .expect(200);

      expect(typeof refreshed.body.accessToken).toBe('string');
      expect(typeof refreshed.body.refreshToken).toBe('string');
      // Rotación: el token entregado no es el mismo que se consumió.
      expect(refreshed.body.refreshToken).not.toBe(login.body.refreshToken);
      expect(refreshed.headers['set-cookie']).toBeUndefined();
    });

    it('una cookie presente se ignora: con el flag apagado no participa', async () => {
      await http()
        .post('/iam/auth/token/refresh')
        .set('Cookie', 'mch_refresh=lo-que-sea')
        .send({})
        .expect(400);
    });
  });

  describe('flag encendido — el token viaja en una cookie httpOnly', () => {
    let ctx: TestContext;

    beforeAll(async () => {
      process.env.AUTH_REFRESH_COOKIE_ENABLED = 'true';
      // Sin HTTPS en la prueba: una cookie `Secure` no sobreviviría al cliente.
      process.env.AUTH_REFRESH_COOKIE_SECURE = 'false';
      ctx = await bootstrapTestApp();
    });

    afterAll(async () => {
      await ctx.app.close();
      delete process.env.AUTH_REFRESH_COOKIE_ENABLED;
      delete process.env.AUTH_REFRESH_COOKIE_SECURE;
    });

    const http = () => request(ctx.app.getHttpServer());

    /** Extrae el `Set-Cookie` de la cookie de refresco. */
    function refreshCookieOf(res: request.Response): string {
      const raw = res.headers['set-cookie'] as unknown as string[] | undefined;
      const found = (raw ?? []).find((c) => c.startsWith('mch_refresh='));
      expect(found).toBeDefined();
      return found as string;
    }

    it('login emite la cookie httpOnly y quita el token del cuerpo', async () => {
      const res = await http()
        .post('/iam/auth/login')
        .send({ email, password })
        .expect(200);

      const cookie = refreshCookieOf(res);
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Strict');
      expect(cookie).toContain('Path=/iam/auth/token/refresh');

      // Éste es el punto del cambio: dejarlo también en el cuerpo conservaría la
      // superficie XSS que la cookie viene a cerrar.
      expect(res.body.refreshToken).toBeUndefined();
      expect(typeof res.body.accessToken).toBe('string');
    });

    it('el refresco lee el token de la cookie, sin cuerpo', async () => {
      const login = await http()
        .post('/iam/auth/login')
        .send({ email, password })
        .expect(200);
      const cookie = refreshCookieOf(login).split(';')[0];

      const refreshed = await http()
        .post('/iam/auth/token/refresh')
        .set('Cookie', cookie)
        .send({})
        .expect(200);

      expect(typeof refreshed.body.accessToken).toBe('string');
      expect(refreshed.body.refreshToken).toBeUndefined();
      // Y rota: la respuesta trae una cookie nueva, distinta de la consumida.
      expect(refreshCookieOf(refreshed).split(';')[0]).not.toBe(cookie);
    });

    it('el cuerpo sigue funcionando durante la migración', async () => {
      const login = await http()
        .post('/iam/auth/login')
        .send({ email, password })
        .expect(200);
      const cookieValue = refreshCookieOf(login)
        .split(';')[0]
        .split('=')
        .slice(1)
        .join('=');

      await http()
        .post('/iam/auth/token/refresh')
        .send({ refreshToken: decodeURIComponent(cookieValue) })
        .expect(200);
    });

    it('cerrar sesión borra la cookie', async () => {
      // Se cierra con el token del administrador: la cuenta de prueba no tiene
      // membresía de tenant y el interceptor de contexto la rechazaría con 403,
      // que no es lo que esta prueba mide.
      const logout = await http()
        .post('/iam/auth/logout')
        .set(bearer(ctx.adminToken))
        .expect(200);

      const cleared = refreshCookieOf(logout);
      // Expira en el pasado o con valor vacío: las dos formas de borrar.
      expect(cleared).toMatch(/mch_refresh=;|Expires=Thu, 01 Jan 1970/);
      expect(cleared).toContain('Path=/iam/auth/token/refresh');
    });

    it('sin cookie ni cuerpo, la validación rechaza igual que siempre', async () => {
      await http().post('/iam/auth/token/refresh').send({}).expect(400);
    });
  });
});
