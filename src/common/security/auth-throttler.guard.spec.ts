import { describe, it, expect } from '@jest/globals';
import { AuthThrottlerGuard } from './auth-throttler.guard';

/** Guard sin dependencias: `getTracker` no toca ninguna. */
function tracker(): (req: Record<string, unknown>) => Promise<string> {
  const guard = Object.create(AuthThrottlerGuard.prototype) as {
    cookieName: string;
    getTracker: (req: Record<string, unknown>) => Promise<string>;
  };
  guard.cookieName = 'redesa_refresh';
  return (req) => guard.getTracker(req);
}

/** TX-19: el cubo del límite de tasa deja de ser sólo la IP en las rutas de sesión. */
describe('AuthThrottlerGuard.getTracker', () => {
  const track = tracker();

  it('login: doce cuentas desde la misma IP caen en doce cubos distintos', async () => {
    const keys = new Set<string>();
    for (let i = 0; i < 12; i++) {
      keys.add(
        await track({
          ip: '10.0.0.1',
          method: 'POST',
          path: '/iam/auth/login',
          body: { email: `persona${i}@clinica.bo`, password: 'x' },
        }),
      );
    }
    expect(keys.size).toBe(12);
  });

  it('login: la misma cuenta cae en el mismo cubo aunque cambie mayúsculas o espacios', async () => {
    const base = { ip: '10.0.0.1', method: 'POST', path: '/iam/auth/login' };
    const a = await track({ ...base, body: { email: 'Ana@Clinica.bo' } });
    const b = await track({ ...base, body: { email: '  ana@clinica.bo ' } });
    expect(a).toBe(b);
  });

  it('login: el identificador no queda en claro en la clave', async () => {
    const key = await track({
      ip: '10.0.0.1',
      method: 'POST',
      path: '/iam/auth/login',
      body: { nationalId: '1234567' },
    });
    expect(key).not.toContain('1234567');
    expect(key.startsWith('10.0.0.1|')).toBe(true);
  });

  it('forgot-password usa el mismo criterio con su campo `identifier`', async () => {
    const key = await track({
      ip: '10.0.0.2',
      method: 'POST',
      path: '/iam/auth/forgot-password',
      body: { identifier: 'a@b.co' },
    });
    expect(key.startsWith('10.0.0.2|')).toBe(true);
  });

  it('refresh: el cubo es el refresh token (cuerpo), no la IP', async () => {
    const a = await track({
      ip: '10.0.0.1',
      method: 'POST',
      path: '/iam/auth/token/refresh',
      body: { refreshToken: 'tok-a' },
    });
    const b = await track({
      ip: '10.0.0.1',
      method: 'POST',
      path: '/iam/auth/token/refresh',
      body: { refreshToken: 'tok-b' },
    });
    expect(a).not.toBe(b);
    expect(a.startsWith('rt|')).toBe(true);
  });

  it('refresh en modo cookie: el cubo sale de la cookie', async () => {
    const key = await track({
      ip: '10.0.0.1',
      method: 'POST',
      path: '/iam/auth/token/refresh',
      body: {},
      headers: { cookie: 'redesa_refresh=tok-c' },
    });
    expect(key.startsWith('rt|')).toBe(true);
  });

  it('sin identificador ni token cae a la IP; el resto de rutas también', async () => {
    expect(
      await track({
        ip: '10.0.0.9',
        method: 'POST',
        path: '/iam/auth/login',
        body: {},
      }),
    ).toBe('10.0.0.9');
    expect(
      await track({ ip: '10.0.0.9', method: 'GET', path: '/scheduling/x' }),
    ).toBe('10.0.0.9');
  });
});
