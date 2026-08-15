import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' pero sin los tipos estrictos Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { RedisThrottlerStorage } from './redis-throttler.storage';

/**
 * Redis falso con un solo cubo, suficiente para observar INCR/PTTL/PEXPIRE.
 *
 * @returns El doble y los comandos que se le pidieron.
 */
function redisFalso(inicial: { count: number; pttl: number }) {
  const estado = { ...inicial };
  const pexpire = mockFn((_clave: string, ms: number) => {
    estado.pttl = ms;
    return Promise.resolve(1);
  });
  const redis = {
    estado,
    pexpire,
    multi: () => ({
      incr: function () {
        return this;
      },
      pttl: function () {
        return this;
      },
      exec: () => {
        estado.count += 1;
        return Promise.resolve([
          [null, estado.count],
          [null, estado.pttl],
        ]);
      },
    }),
  };
  return redis;
}

describe('RedisThrottlerStorage', () => {
  it('la primera petición abre la ventana', async () => {
    const redis = redisFalso({ count: 0, pttl: -2 });
    const storage = new RedisThrottlerStorage(redis as any);

    const res = await storage.increment('ip-1', 60_000, 60, 0);

    expect(res.totalHits).toBe(1);
    expect(res.isBlocked).toBe(false);
    expect(redis.pexpire).toHaveBeenCalledWith('throttle:ip-1', 60_000);
  });

  // El punto de la ventana fija: si se repusiera el vencimiento en cada
  // petición, un cliente constante nunca se toparía con el límite porque la
  // ventana se correría con él.
  it('la segunda petición no repone el vencimiento', async () => {
    const redis = redisFalso({ count: 1, pttl: 30_000 });
    const storage = new RedisThrottlerStorage(redis as any);

    const res = await storage.increment('ip-1', 60_000, 60, 0);

    expect(res.totalHits).toBe(2);
    expect(redis.pexpire).not.toHaveBeenCalled();
    expect(res.timeToExpire).toBe(30);
  });

  it('marca bloqueado al pasar el tope', async () => {
    const redis = redisFalso({ count: 60, pttl: 10_000 });
    const storage = new RedisThrottlerStorage(redis as any);

    const res = await storage.increment('ip-1', 60_000, 60, 0);

    expect(res.totalHits).toBe(61);
    expect(res.isBlocked).toBe(true);
  });

  // `pttl` devuelve -1 si el INCR corrió y el PEXPIRE no llegó a aplicarse. Sin
  // reponer la ventana, esa clave no vence nunca y la IP queda bloqueada para
  // siempre — un defecto que sólo aparece bajo fallo parcial.
  it('repone la ventana de una clave sin vencimiento', async () => {
    const redis = redisFalso({ count: 40, pttl: -1 });
    const storage = new RedisThrottlerStorage(redis as any);

    const res = await storage.increment('ip-1', 60_000, 60, 0);

    expect(redis.pexpire).toHaveBeenCalledWith('throttle:ip-1', 60_000);
    expect(res.timeToExpire).toBe(60);
  });

  describe('degradación', () => {
    it('sin cliente Redis cuenta en memoria en vez de fallar', async () => {
      const storage = new RedisThrottlerStorage(undefined);

      const primera = await storage.increment('ip-2', 60_000, 2, 0);
      const segunda = await storage.increment('ip-2', 60_000, 2, 0);
      const tercera = await storage.increment('ip-2', 60_000, 2, 0);

      expect(primera.totalHits).toBe(1);
      expect(segunda.isBlocked).toBe(false);
      expect(tercera.isBlocked).toBe(true);
    });

    // Fallar cerrado convertiría una caída de Redis en una caída del sitio
    // público entero. Se sigue contando, sólo que por réplica.
    it('si Redis falla sigue contando y no rechaza la petición', async () => {
      const redis = {
        multi: () => ({
          incr: function () {
            return this;
          },
          pttl: function () {
            return this;
          },
          exec: () => Promise.reject(new Error('conexión perdida')),
        }),
      };
      const storage = new RedisThrottlerStorage(redis as any);

      const res = await storage.increment('ip-3', 60_000, 60, 0);

      expect(res.totalHits).toBe(1);
      expect(res.isBlocked).toBe(false);
    });
  });
});
