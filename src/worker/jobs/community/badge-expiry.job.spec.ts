import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { BadgeExpiryJob } from './badge-expiry.job';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param sweep - Lo que devuelve el barrido.
 * @returns Resultado de build.
 */
function build(sweep: { expired: number; profiles: number }) {
  const api = { post: mockFn().mockResolvedValue(sweep) };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const job = new BadgeExpiryJob(api as any, logger as any);
  return { job, api, logger };
}

describe('BadgeExpiryJob', () => {
  it('llama al barrido de sellos vencidos', async () => {
    const d = build({ expired: 3, profiles: 2 });

    await d.job.tick();

    const [[ruta]] = d.api.post.mock.calls;
    expect(ruta).toBe('/internal/community/verification/badges/expire-sweep');
  });

  it('informa cuando cayeron sellos', async () => {
    const d = build({ expired: 3, profiles: 2 });

    await d.job.tick();

    expect(d.logger.info).toHaveBeenCalled();
  });

  it('calla cuando no hay nada vencido', async () => {
    const d = build({ expired: 0, profiles: 0 });

    await d.job.tick();

    // Un log por hora diciendo que no pasó nada entierra el que sí importa.
    expect(d.logger.info).not.toHaveBeenCalled();
  });

  it('un fallo del barrido no tumba el worker', async () => {
    const d = build({ expired: 0, profiles: 0 });
    d.api.post.mockRejectedValue(new Error('API caída'));

    await expect(d.job.tick()).resolves.toBeUndefined();
  });
});
