import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { QaLabInternalController } from './qa-lab-internal.controller';

const actor = { id: 'system-1', roles: ['SYSTEM'] };

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const catalogService = { runDueSchedules: mockFn() };
  return {
    controller: new QaLabInternalController(catalogService as any),
    catalogService,
  };
}

describe('QaLabInternalController', () => {
  it('delegates the schedule tick', async () => {
    const d = build();
    const dto = { limit: 10 } as any;
    d.catalogService.runDueSchedules.mockResolvedValue({
      claimed: 0,
      queued: 0,
      skipped: 0,
      results: [],
    });

    await d.controller.runDueSchedules(dto, actor);

    expect(d.catalogService.runDueSchedules).toHaveBeenCalledWith(dto, actor);
  });

  it('propagates service errors instead of swallowing them', async () => {
    const d = build();
    d.catalogService.runDueSchedules.mockRejectedValue(new Error('boom'));

    await expect(
      d.controller.runDueSchedules({} as any, actor as any),
    ).rejects.toThrow('boom');
  });
});
