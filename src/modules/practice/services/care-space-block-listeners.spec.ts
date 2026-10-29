import { jest } from '@jest/globals';
import { CareSpaceBlockListenerRegistry } from './care-space-block-listeners';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ctx = {
  tenantId: 't',
  actorUserId: 'u',
  now: new Date('2026-11-02T12:00:00Z'),
};

describe('CareSpaceBlockListenerRegistry', () => {
  it('avisa a cada oyente registrado, en orden de alta', async () => {
    const registry = new CareSpaceBlockListenerRegistry();
    const orden: string[] = [];
    registry.register('a', {
      afterCreated: mockFn(async () => orden.push('a:created')),
      afterClosed: mockFn(async () => orden.push('a:closed')),
    });
    registry.register('b', {
      afterCreated: mockFn(async () => orden.push('b:created')),
      afterClosed: mockFn(async () => orden.push('b:closed')),
    });
    await registry.created({} as any, {} as any, {} as any, ctx);
    await registry.closed({} as any, {} as any, {} as any, 'ENDED', ctx);
    expect(orden).toEqual(['a:created', 'b:created', 'a:closed', 'b:closed']);
  });

  it('registrar de nuevo con el mismo nombre reemplaza (el módulo se puede reiniciar)', async () => {
    const registry = new CareSpaceBlockListenerRegistry();
    const viejo = { afterCreated: mockFn(), afterClosed: mockFn() };
    const nuevo = { afterCreated: mockFn(), afterClosed: mockFn() };
    registry.register('scheduling', viejo);
    registry.register('scheduling', nuevo);
    await registry.created({} as any, {} as any, {} as any, ctx);
    expect(viejo.afterCreated).not.toHaveBeenCalled();
    expect(nuevo.afterCreated).toHaveBeenCalledTimes(1);
  });

  it('si un oyente falla, el error sube: el bloqueo y la agenda se confirman juntos o ninguno', async () => {
    const registry = new CareSpaceBlockListenerRegistry();
    registry.register('x', {
      afterCreated: mockFn().mockRejectedValue(new Error('agenda caída')),
      afterClosed: mockFn(),
    });
    await expect(
      registry.created({} as any, {} as any, {} as any, ctx),
    ).rejects.toThrow('agenda caída');
  });

  it('sin oyentes no hace nada', async () => {
    const registry = new CareSpaceBlockListenerRegistry();
    await expect(
      registry.closed({} as any, {} as any, {} as any, 'CANCELLED', ctx),
    ).resolves.toBeUndefined();
  });
});
