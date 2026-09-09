import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import {
  CommunityPresenceService,
  PRESENCE_TTL_SEC,
} from './community-presence.service';

/**
 * Construye el sistema bajo prueba con un Redis doblado.
 * @returns Resultado de build.
 */
function build() {
  const redis = {
    set: mockFn().mockResolvedValue('OK'),
    del: mockFn().mockResolvedValue(1),
    mget: mockFn().mockResolvedValue([]),
  };
  const logger = { setContext: mockFn(), warn: mockFn() };
  const service = new CommunityPresenceService(redis as any, logger as any);
  return { service, redis, logger };
}

describe('CommunityPresenceService (F4.2)', () => {
  it('marcar en línea escribe la clave con TTL y devuelve si es novedad', async () => {
    const d = build();
    // `SET … GET` devuelve el valor anterior: `null` la primera vez.
    d.redis.set.mockResolvedValueOnce(null);

    const novedad = await d.service.marcarEnLinea('p-1');

    expect(novedad).toBe(true);
    expect(d.redis.set).toHaveBeenCalledWith(
      'community:presence:p-1',
      expect.any(String),
      'EX',
      PRESENCE_TTL_SEC,
      'GET',
    );
  });

  it('renovar una presencia que ya existía no es novedad', async () => {
    const d = build();
    d.redis.set.mockResolvedValueOnce('2026-09-09T10:00:00.000Z');
    expect(await d.service.marcarEnLinea('p-1')).toBe(false);
  });

  it('desconectar borra la presencia y deja la última vez', async () => {
    const d = build();
    const cuando = await d.service.marcarDesconectado('p-1');
    expect(cuando).toBeInstanceOf(Date);
    expect(d.redis.del).toHaveBeenCalledWith('community:presence:p-1');
    expect(d.redis.set).toHaveBeenCalledWith(
      'community:lastseen:p-1',
      cuando!.toISOString(),
      'EX',
      expect.any(Number),
    );
  });

  it('lee la presencia de varios en dos MGET, en el mismo orden', async () => {
    const d = build();
    d.redis.mget
      .mockResolvedValueOnce(['2026-09-09T10:00:00.000Z', null])
      .mockResolvedValueOnce([null, '2026-09-08T18:30:00.000Z']);

    const res = await d.service.presenciaDe(['p-1', 'p-2']);

    expect(res).toEqual([
      { profileId: 'p-1', online: true, lastSeenAt: null },
      {
        profileId: 'p-2',
        online: false,
        lastSeenAt: new Date('2026-09-08T18:30:00.000Z'),
      },
    ]);
    expect(d.redis.mget).toHaveBeenCalledTimes(2);
  });

  it('sin Redis responde «no se sabe» y avisa, nunca lanza', async () => {
    const d = build();
    d.redis.mget.mockRejectedValue(new Error('ECONNREFUSED'));
    d.redis.set.mockRejectedValue(new Error('ECONNREFUSED'));

    expect(await d.service.presenciaDe(['p-1'])).toEqual([
      { profileId: 'p-1', online: false, lastSeenAt: null },
    ]);
    expect(await d.service.marcarEnLinea('p-1')).toBe(false);
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('sin perfiles no toca Redis', async () => {
    const d = build();
    expect(await d.service.presenciaDe([])).toEqual([]);
    expect(d.redis.mget).not.toHaveBeenCalled();
  });
});
