import { OperationResolver } from './operation-resolver';

describe('OperationResolver', () => {
  it('sin fuentes: UNKNOWN y sin operation_key', () => {
    expect(new OperationResolver().resolve('GET', '/a')).toEqual({
      operationKey: null,
      moduleCode: 'UNKNOWN',
    });
  });

  it('ruta viva sin catálogo: operation_key sí, módulo UNKNOWN (no se inventa)', () => {
    const r = new OperationResolver();
    r.setRouteLookup(() => ({ operationId: 'AController_get' }));
    expect(r.resolve('GET', '/a')).toEqual({
      operationKey: 'AController_get',
      moduleCode: 'UNKNOWN',
    });
  });

  it('catálogo por operation_key y, si no, por método+plantilla ({id} ≡ :id)', () => {
    const r = new OperationResolver();
    r.setRouteLookup((m, t) =>
      t === '/p/:id' ? { operationId: 'P_get' } : null,
    );
    r.setCatalog([
      {
        operationKey: 'P_get',
        httpMethod: 'get',
        routeTemplate: '/p/{id}',
        moduleCode: 'profiles',
      },
      {
        operationKey: 'Z_x',
        httpMethod: 'POST',
        routeTemplate: '/z/{id}/',
        moduleCode: 'zeta',
      },
    ]);
    expect(r.resolve('GET', '/p/:id').moduleCode).toBe('profiles');
    // Sin ruta viva, entra por método + plantilla normalizada.
    expect(r.resolve('POST', '/z/:id').moduleCode).toBe('zeta');
    expect(r.catalogSize).toBe(2);
  });

  it('UNMATCHED y __overflow__ no se resuelven; el cambio de catálogo invalida el caché', () => {
    const r = new OperationResolver();
    expect(r.resolve('GET', 'UNMATCHED').moduleCode).toBe('UNKNOWN');
    expect(r.resolve('GET', '__overflow__').operationKey).toBeNull();
    r.setRouteLookup(() => ({ operationId: 'A_a' }));
    expect(r.resolve('GET', '/a').moduleCode).toBe('UNKNOWN');
    r.setCatalog([
      {
        operationKey: 'A_a',
        httpMethod: 'GET',
        routeTemplate: '/a',
        moduleCode: 'alfa',
      },
    ]);
    expect(r.resolve('GET', '/a').moduleCode).toBe('alfa');
  });

  it('un lookup que lanza degrada a UNKNOWN', () => {
    const r = new OperationResolver();
    r.setRouteLookup(() => {
      throw new Error('boom');
    });
    expect(r.resolve('GET', '/a').moduleCode).toBe('UNKNOWN');
  });
});
