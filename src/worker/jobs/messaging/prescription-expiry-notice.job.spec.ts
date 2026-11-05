import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PrescriptionExpiryNoticeJob } from './prescription-expiry-notice.job';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param sweep - Lo que devuelve el barrido.
 * @returns El job, el cliente y el logger dobles.
 */
function build(sweep: {
  scanned: number;
  notified: number;
  suppressed: number;
  failed: number;
  skipped: boolean;
}) {
  const api = { post: mockFn().mockResolvedValue(sweep) };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const job = new PrescriptionExpiryNoticeJob(api as any, logger as any);
  return { job, api, logger };
}

const SWEEP = {
  scanned: 3,
  notified: 2,
  suppressed: 1,
  failed: 0,
  skipped: false,
};

describe('PrescriptionExpiryNoticeJob', () => {
  it('dispara el barrido de avisos y lo declara idempotente', async () => {
    const d = build(SWEEP);

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledWith(
      '/clinical/internal/prescription-expiry-notices',
      {},
      { idempotent: true },
    );
  });

  it('informa los conteos, sin ningún dato de la receta', async () => {
    const d = build(SWEEP);

    await d.job.tick();

    expect(d.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ scanned: 3, notified: 2, suppressed: 1 }),
      expect.any(String),
    );
  });

  it('calla cuando no había recetas por avisar', async () => {
    const d = build({ ...SWEEP, scanned: 0, notified: 0, suppressed: 0 });

    await d.job.tick();

    expect(d.logger.info).not.toHaveBeenCalled();
  });

  it('un fallo de la API no tumba el worker', async () => {
    const d = build(SWEEP);
    d.api.post.mockRejectedValue(new Error('API caída'));

    await expect(d.job.tick()).resolves.toBeUndefined();
  });
});
