import { jest } from '@jest/globals';
import { ServiceUnavailableException } from '@nestjs/common';
import type { CatalogInventoryRepository } from '../repositories/catalog-inventory.repository';
import type { InventoryRepository } from '../inventory/inventory.repository';
import { InventoryImportService } from './inventory-import.service';

const ACTOR = '00000000-0000-4000-8000-000000000001';

// Fábrica de mocks con tipos sueltos: el contrato que se prueba es el del servicio, no el de jest.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const operacion = {
  id: 'A_x',
  origen: 'CONTRATO',
  metodo: 'GET',
  ruta: '/a',
  modulo: 'iam',
  codigo: { controlador: 'C', handler: 'h', fuente: 'src/c.ts:1' },
  autenticacion: {
    publica: false,
    roles: ['ADMIN'],
    identidadVerificada: true,
  },
  riesgo: { nivel: 'BAJO', razones: [] },
  tablas: [
    {
      schema: 'iam',
      tabla: 'users',
      catalogada: true,
      operacion: 'LEE',
      detalle: 'lee',
      confianza: 'DIRECTA',
      via: [],
      fuente: 'src/a.ts:1',
    },
  ],
};

function armar() {
  const llamadas: string[] = [];
  const registra = (nombre: string) =>
    mockFn(async () => {
      llamadas.push(nombre);
    });
  const repo: Record<string, any> = {
    lock: registra('lock'),
    known: mockFn(async () => {
      llamadas.push('known');
      return {
        operations: new Map(),
        objects: new Map([['iam.users', 'obj-1']]),
        processes: new Map(),
      };
    }),
    insertOperations: registra('insertOperations'),
    updateOperations: registra('updateOperations'),
    retireOperations: registra('retireOperations'),
    deleteImpactsOf: registra('deleteImpactsOf'),
    insertImpacts: registra('insertImpacts'),
    insertProcesses: registra('insertProcesses'),
    updateProcesses: registra('updateProcesses'),
    deleteStepsOf: registra('deleteStepsOf'),
    insertSteps: registra('insertSteps'),
    insertStepOperations: registra('insertStepOperations'),
  };
  const inventory = {
    operaciones: mockFn(() => [operacion]),
    procesos: mockFn(() => []),
    version: mockFn(() => ({
      hash: 'abc123',
      operaciones: 1,
      procesos: 0,
      tablas: 0,
      columnas: 0,
    })),
  };
  const tx = { id: 'tx' };
  const em: Record<string, any> = { fork: () => em };
  em.transactional = mockFn(async (cb: (t: unknown) => unknown) => {
    llamadas.push('begin');
    const r = await cb(tx);
    llamadas.push('commit');
    return r;
  });
  const service = new InventoryImportService(
    em as never,
    repo as unknown as CatalogInventoryRepository,
    inventory as unknown as InventoryRepository,
  );
  return { service, repo, inventory, em, tx, llamadas };
}

describe('InventoryImportService', () => {
  it('toma el candado, lee lo conocido y escribe todo dentro de una sola transacción', async () => {
    const { service, em, llamadas } = armar();
    await service.importInventory(ACTOR);
    expect(em.transactional).toHaveBeenCalledTimes(1);
    expect(llamadas[0]).toBe('begin');
    expect(llamadas[1]).toBe('lock');
    expect(llamadas[2]).toBe('known');
    expect(llamadas.at(-1)).toBe('commit');
  });

  it('respeta el orden de las FK: operaciones antes que impactos, puentes viejos fuera antes de las etapas', async () => {
    const { service, llamadas } = armar();
    await service.importInventory(ACTOR);
    const orden = (nombre: string): number => llamadas.indexOf(nombre);
    expect(orden('insertOperations')).toBeLessThan(orden('insertImpacts'));
    expect(orden('updateOperations')).toBeLessThan(orden('deleteImpactsOf'));
    expect(orden('deleteImpactsOf')).toBeLessThan(orden('insertImpacts'));
    expect(orden('insertProcesses')).toBeLessThan(orden('insertSteps'));
    expect(orden('deleteStepsOf')).toBeLessThan(orden('insertSteps'));
    expect(orden('insertSteps')).toBeLessThan(orden('insertStepOperations'));
  });

  it('escribe con la identidad que llama y en la misma transacción', async () => {
    const { service, repo, tx } = armar();
    await service.importInventory(ACTOR);
    const [em, filas, usuario] = repo.insertOperations.mock.calls[0];
    expect(em).toBe(tx);
    expect(usuario).toBe(ACTOR);
    expect(filas).toEqual([
      expect.objectContaining({ operationKey: 'A_x', riskLevel: 'BAJO' }),
    ]);
    expect(repo.insertImpacts.mock.calls[0][1]).toEqual([
      expect.objectContaining({ objectId: 'obj-1', accessKind: 'LEE' }),
    ]);
  });

  it('devuelve la huella del inventario y los contadores', async () => {
    const { service } = armar();
    const r = await service.importInventory(ACTOR);
    expect(r.inventory).toEqual({
      hash: 'abc123',
      operaciones: 1,
      procesos: 0,
    });
    expect(r.operations.added).toBe(1);
    expect(r.impacts.written).toBe(1);
  });

  it('sin inventario responde 503 y no abre transacción ni toma el candado', async () => {
    const { service, inventory, em, repo } = armar();
    inventory.operaciones.mockImplementation(() => {
      throw new ServiceUnavailableException('falta endpoints/indice.json');
    });
    await expect(service.importInventory(ACTOR)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(em.transactional).not.toHaveBeenCalled();
    expect(repo.lock).not.toHaveBeenCalled();
  });

  it('un fallo al escribir sale de la transacción para que se revierta', async () => {
    const { service, repo } = armar();
    repo.insertImpacts.mockRejectedValue(new Error('violación de FK'));
    await expect(service.importInventory(ACTOR)).rejects.toThrow(
      'violación de FK',
    );
  });
});
