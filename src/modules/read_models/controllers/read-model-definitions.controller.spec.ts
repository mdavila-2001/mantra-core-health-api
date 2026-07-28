import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ReadModelDefinitionsController } from './read-model-definitions.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const service = {
    createDefinition: mockFn(),
    createVersion: mockFn(),
    health: mockFn(),
    refresh: mockFn(),
    backfill: mockFn(),
    invalidate: mockFn(),
    reconcile: mockFn(),
    deprecate: mockFn(),
    retire: mockFn(),
  };
  const controller = new ReadModelDefinitionsController(service as any);
  return { controller, service };
}

describe('ReadModelDefinitionsController', () => {
  it('delegates createDefinition (UC-30-01)', async () => {
    const d = build();
    const dto = { schemaName: 's', objectName: 'o' };
    d.service.createDefinition.mockResolvedValue({ id: 'def-1' });
    await expect(
      d.controller.createDefinition(dto as any, actor),
    ).resolves.toEqual({ id: 'def-1' });
    expect(d.service.createDefinition).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates createVersion (UC-30-08)', async () => {
    const d = build();
    const dto = { objectType: 'VIEW' };
    await d.controller.createVersion('read_models', 'crm_v', dto as any, actor);
    expect(d.service.createVersion).toHaveBeenCalledWith(
      'read_models',
      'crm_v',
      dto,
      actor,
    );
  });

  it('delegates refresh/backfill/invalidate/reconcile (UC-30-03/04/06/07)', async () => {
    const d = build();
    await d.controller.refresh('def-1', actor);
    await d.controller.backfill('def-1', actor);
    await d.controller.invalidate('def-1', actor);
    await d.controller.reconcile('def-1', actor);
    expect(d.service.refresh).toHaveBeenCalledWith('def-1', actor);
    expect(d.service.backfill).toHaveBeenCalledWith('def-1', actor);
    expect(d.service.invalidate).toHaveBeenCalledWith('def-1', actor);
    expect(d.service.reconcile).toHaveBeenCalledWith('def-1', actor);
  });

  it('delegates deprecate and retire (UC-30-13)', async () => {
    const d = build();
    await d.controller.deprecate('def-1', actor);
    await d.controller.retire('def-1', actor);
    expect(d.service.deprecate).toHaveBeenCalledWith('def-1', actor);
    expect(d.service.retire).toHaveBeenCalledWith('def-1', actor);
  });

  it('delegates health (UC-30-12)', async () => {
    const d = build();
    d.service.health.mockResolvedValue({ items: [] });
    await expect(d.controller.health()).resolves.toEqual({ items: [] });
    expect(d.service.health).toHaveBeenCalled();
  });
});
