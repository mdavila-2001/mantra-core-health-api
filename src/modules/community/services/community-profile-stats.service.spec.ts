import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CommunityProfileStatsService } from './community-profile-stats.service';

const TENANT = 'tenant-1';
const PERFIL = 'perfil-1';
const HOY = new Date('2026-08-18T10:00:00Z');

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param contadores - Valores que devuelve Redis por clave.
 * @returns Resultado de build.
 */
function build(contadores?: Map<string, number>) {
  const redis = {
    incrWithWindow: mockFn().mockResolvedValue({ count: 1, ttlSec: 100 }),
    getCounters: mockFn().mockResolvedValue(contadores ?? new Map()),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityProfileStatsService(redis as any, logger as any);
  return { service, redis, logger };
}

describe('CommunityProfileStatsService', () => {
  describe('no se guarda nada del visitante', () => {
    it('la clave lleva perfil, señal y día — y nada más', () => {
      const d = build();

      d.service.recordView(TENANT, PERFIL);

      const [[tenant, key]] = d.redis.incrWithWindow.mock.calls;
      expect(tenant).toBe(TENANT);
      expect(key).toMatch(/^profile-stats:perfil-1:view:\d{4}-\d{2}-\d{2}$/);
    });

    it('las apariciones se cuentan aparte de las visitas', () => {
      const d = build();

      d.service.recordImpressions(TENANT, [PERFIL]);

      const [[, key]] = d.redis.incrWithWindow.mock.calls;
      // Aparecer y ser abierto son dos cosas, y separarlas es lo que permite
      // decir «apareciste 200 veces y te abrieron 3».
      expect(key).toContain(':impression:');
    });
  });

  describe('nunca rompe la página', () => {
    it('un Redis caído no propaga el fallo al registrar', async () => {
      const d = build();
      d.redis.incrWithWindow.mockRejectedValue(new Error('redis caído'));

      expect(() => d.service.recordView(TENANT, PERFIL)).not.toThrow();
      // La promesa colgada se resuelve sola; lo que importa es que nadie la
      // espere y que el fallo quede registrado en vez de tirar la ficha.
      await new Promise((r) => setImmediate(r));
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('sin perfil o sin tenant no se toca Redis', () => {
      const d = build();

      d.service.recordView('', PERFIL);
      d.service.recordView(TENANT, '');

      expect(d.redis.incrWithWindow).not.toHaveBeenCalled();
    });

    it('leer con Redis caído devuelve ceros, no un 500', async () => {
      const d = build();
      d.redis.getCounters.mockRejectedValue(new Error('redis caído'));

      const res = await d.service.read(TENANT, PERFIL, HOY);

      expect(res.views).toBe(0);
      expect(res.daily).toHaveLength(7);
      expect(d.logger.warn).toHaveBeenCalled();
    });
  });

  describe('«tu perfil esta semana»', () => {
    it('suma la ventana y la desglosa por día, del más viejo al más nuevo', async () => {
      const d = build(
        new Map([
          [`profile-stats:${PERFIL}:view:2026-08-17`, 4],
          [`profile-stats:${PERFIL}:view:2026-08-18`, 6],
          [`profile-stats:${PERFIL}:impression:2026-08-18`, 30],
        ]),
      );

      const res = await d.service.read(TENANT, PERFIL, HOY);

      expect(res.windowDays).toBe(7);
      expect(res.views).toBe(10);
      expect(res.searchAppearances).toBe(30);
      expect(res.daily).toHaveLength(7);
      expect(res.daily[0].date).toBe('2026-08-12');
      expect(res.daily.at(-1)).toEqual({
        date: '2026-08-18',
        views: 6,
        searchAppearances: 30,
      });
    });

    it('un día sin datos vale 0 y aparece igual: el hueco es información', async () => {
      const d = build();

      const res = await d.service.read(TENANT, PERFIL, HOY);

      expect(res.daily.every((dia: any) => dia.views === 0)).toBe(true);
      expect(res.daily).toHaveLength(7);
    });
  });
});
