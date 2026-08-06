import request from 'supertest';
import type { Server } from 'node:http';
import { bootstrapTestApp, bearer, type TestContext } from './harness';

/**
 * Entrega del refresh token como cookie httpOnly (`AUTH_REFRESH_COOKIE_ENABLED`).
 *
 * El modo apagado —el default, y el único que corre hoy en el equipo— ya lo
 * cubre `iam.int-spec.ts`: allí el token viaja en el cuerpo y el refresco lo lee
 * de ahí. Este archivo prueba el modo **encendido**, que es el que cambia el
 * contrato del cliente.
 *
 * Las variables se fijan antes de `bootstrapTestApp()` a propósito: el
 * controlador resuelve el modo al construirse, porque es configuración de
 * arranque y no algo que deba poder cambiar entre dos peticiones de la misma
 * sesión. El `RefreshTokenDto`, en cambio, lo consulta en cada validación, así
 * que basta con que el entorno esté puesto antes de levantar la aplicación.
 */
describe('Refresh token en cookie httpOnly (integración)', () => {
  let ctx: TestContext;
  let server: Server;
  /** Credenciales de una cuenta creada para esta corrida. */
  const email = `cookie-${Date.now()}@redesa.test`;
  const password = 'S3cret-passw0rd';

  beforeAll(async () => {
    process.env.AUTH_REFRESH_COOKIE_ENABLED = 'true';
    // `Secure` apagado explícitamente: supertest habla HTTP contra un servidor
    // efímero, y una cookie `Secure` no volvería en la petición siguiente.
    process.env.AUTH_REFRESH_COOKIE_SECURE = 'false';

    ctx = await bootstrapTestApp();
    server = ctx.app.getHttpServer();

    await request(server)
      .post('/iam/users')
      .set(bearer(ctx.adminToken))
      .send({ displayName: 'Titular de cookie', email, password })
      .expect(201);
  });

  afterAll(async () => {
    await ctx.app.close();
    delete process.env.AUTH_REFRESH_COOKIE_ENABLED;
    delete process.env.AUTH_REFRESH_COOKIE_SECURE;
  });

  /** Extrae la cookie del refresh de las cabeceras `Set-Cookie`. */
  function refreshCookie(headers: Record<string, unknown>): string | undefined {
    const raw = headers['set-cookie'];
    const list = Array.isArray(raw) ? (raw as string[]) : [];
    return list.find((cookie) => cookie.startsWith('redesa_refresh='));
  }

  it('el login entrega el token en una cookie httpOnly y lo saca del cuerpo', async () => {
    const res = await request(server)
      .post('/iam/auth/login')
      .send({ email, password })
      .expect(200);

    const cookie = refreshCookie(res.headers);
    expect(cookie).toBeDefined();
    // Los tres atributos son el ejercicio entero: sin `HttpOnly` el token sigue
    // al alcance de un XSS, y sin `Path` acotado viaja en cada petición del API.
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Path=/iam/auth/token/refresh');

    expect(res.body.accessToken).toEqual(expect.any(String));
    // Dejarlo también en el cuerpo no protegería de nada: el objetivo es que
    // deje de estar donde JavaScript pueda leerlo.
    expect(res.body.refreshToken).toBe('');
  });

  it('el refresco lee la cookie con el cuerpo vacío y rota su valor', async () => {
    const login = await request(server)
      .post('/iam/auth/login')
      .send({ email, password })
      .expect(200);
    const cookie = refreshCookie(login.headers) as string;

    const refreshed = await request(server)
      .post('/iam/auth/token/refresh')
      .set('Cookie', cookie)
      .send({})
      .expect(200);

    expect(refreshed.body.accessToken).toEqual(expect.any(String));
    expect(refreshed.body.refreshToken).toBe('');

    const rotated = refreshCookie(refreshed.headers) as string;
    expect(rotated).toBeDefined();
    // La rotación tiene que llegar también a la cookie; si no, el navegador
    // seguiría presentando el token viejo y la siguiente petición dispararía la
    // detección de reuso contra su propia sesión.
    expect(rotated).not.toBe(cookie);
  });

  it('presentar la cookie ya rotada dispara la detección de reuso', async () => {
    const login = await request(server)
      .post('/iam/auth/login')
      .send({ email, password })
      .expect(200);
    const cookie = refreshCookie(login.headers) as string;

    await request(server)
      .post('/iam/auth/token/refresh')
      .set('Cookie', cookie)
      .send({})
      .expect(200);

    await request(server)
      .post('/iam/auth/token/refresh')
      .set('Cookie', cookie)
      .send({})
      .expect(401);
  });

  it('sin cookie el refresco es 401, no un 400 de validación', async () => {
    // Con el modo encendido el DTO ya no exige el campo, así que la ausencia de
    // token deja de ser un error de forma: para el cliente es "no tengo sesión".
    await request(server).post('/iam/auth/token/refresh').send({}).expect(401);
  });

  it('el token del cuerpo se ignora: mandarlo a mano no abre sesión', async () => {
    const login = await request(server)
      .post('/iam/auth/login')
      .send({ email, password })
      .expect(200);
    const cookie = refreshCookie(login.headers) as string;
    const raw = decodeURIComponent(
      cookie.split(';')[0].slice('redesa_refresh='.length),
    );

    // El valor es correcto y aun así se rechaza, porque en este modo la única
    // fuente es la cookie. Que el cuerpo dejara de mirarse es lo que hace que
    // encender el flag sea un cambio real y no una capa decorativa.
    await request(server)
      .post('/iam/auth/token/refresh')
      .send({ refreshToken: raw })
      .expect(401);
  });

  it('el logout borra la cookie en vez de dejarla caducar sola', async () => {
    const login = await request(server)
      .post('/iam/auth/login')
      .send({ email, password })
      .expect(200);

    const res = await request(server)
      .post('/iam/auth/logout')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);

    const cleared = refreshCookie(res.headers) as string;
    expect(cleared).toBeDefined();
    // Sin el borrado, el navegador seguiría mandando una cookie cuyo token ya
    // no vale y el cliente vería un 401 donde debería ver "sin sesión".
    expect(cleared).toContain('redesa_refresh=;');
    expect(cleared).toContain('Path=/iam/auth/token/refresh');
  });
});
