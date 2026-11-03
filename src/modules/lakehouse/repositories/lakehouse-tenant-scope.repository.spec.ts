import { jest } from '@jest/globals';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { LakehouseCatalogRepository } from './lakehouse-catalog.repository';
import { LakehouseRuntimeRepository } from './lakehouse-runtime.repository';
import { ResearchRepository } from './research.repository';

const TENANT = 'tenant-a';

/**
 * Construye un EntityManager simulado que registra las consultas.
 *
 * @returns El EntityManager y sus espías.
 */
function fakeEm() {
  const findOne: any = (jest.fn as any)(async () => null);
  const find: any = (jest.fn as any)(async () => []);
  return { em: { findOne, find } as unknown as EntityManager, findOne, find };
}

describe('LakehouseCatalogRepository · alcance por tenant (LAKE-01)', () => {
  const repo = new LakehouseCatalogRepository();

  it('bloquea el producto y el dataset sólo dentro del tenant', async () => {
    const { em, findOne } = fakeEm();
    await repo.findProductForUpdate(em, TENANT, 'prod-1');
    await repo.findDatasetForUpdate(em, TENANT, 'ds-1');
    expect(findOne).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      { id: 'prod-1', tenantId: TENANT },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    expect(findOne).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      { id: 'ds-1', tenantId: TENANT },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  });

  it('el dataset y el duplicado de tabla se buscan dentro del tenant', async () => {
    const { em, findOne } = fakeEm();
    await repo.findDatasetById(em, TENANT, 'ds-1');
    await repo.findDatasetByTable(em, TENANT, 'cat-1', 'db', 'tbl');
    expect(findOne).toHaveBeenNthCalledWith(1, expect.anything(), {
      id: 'ds-1',
      tenantId: TENANT,
    });
    expect(findOne).toHaveBeenNthCalledWith(2, expect.anything(), {
      tenantId: TENANT,
      lakehouseCatalogId: 'cat-1',
      databaseName: 'db',
      tableName: 'tbl',
    });
  });

  it('la versión de producto se resuelve por su producto y es nula si el producto es de otro tenant', async () => {
    const findOne: any = (jest.fn as any)(
      async (_entity: unknown, where: any) => {
        if (where.id === 'ver-1') return { id: 'ver-1', dataProductId: 'p-b' };
        return null; // el producto de otro tenant no se encuentra con tenantId
      },
    );
    const em = { findOne } as unknown as EntityManager;

    const version = await repo.findProductVersionInTenant(em, TENANT, 'ver-1');

    expect(version).toBeNull();
    expect(findOne).toHaveBeenLastCalledWith(expect.anything(), {
      id: 'p-b',
      tenantId: TENANT,
    });
  });

  it('la versión de un producto del tenant se devuelve', async () => {
    const findOne: any = (jest.fn as any)(
      async (_entity: unknown, where: any) =>
        where.id === 'ver-1'
          ? { id: 'ver-1', dataProductId: 'p-a' }
          : { id: 'p-a', tenantId: TENANT },
    );
    const em = { findOne } as unknown as EntityManager;
    const version = await repo.findProductVersionInTenant(em, TENANT, 'ver-1');
    expect(version).toMatchObject({ id: 'ver-1' });
  });
});

describe('LakehouseRuntimeRepository · alcance por tenant (LAKE-01)', () => {
  const repo = new LakehouseRuntimeRepository();

  it('la definición y la corrida se buscan dentro del tenant', async () => {
    const { em, findOne } = fakeEm();
    await repo.findDefinitionById(em, TENANT, 'def-1');
    await repo.findRunById(em, TENANT, 'run-1');
    expect(findOne).toHaveBeenNthCalledWith(1, expect.anything(), {
      id: 'def-1',
      tenantId: TENANT,
    });
    expect(findOne).toHaveBeenNthCalledWith(2, expect.anything(), {
      id: 'run-1',
      tenantId: TENANT,
    });
  });
});

describe('ResearchRepository · alcance por tenant (LAKE-01)', () => {
  const repo = new ResearchRepository();

  it('el proyecto se busca y se bloquea dentro del tenant', async () => {
    const { em, findOne } = fakeEm();
    await repo.findProjectById(em, TENANT, 'pr-1');
    await repo.findProjectForUpdate(em, TENANT, 'pr-1');
    expect(findOne).toHaveBeenNthCalledWith(1, expect.anything(), {
      id: 'pr-1',
      tenantId: TENANT,
    });
    expect(findOne).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      { id: 'pr-1', tenantId: TENANT },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  });

  it('la solicitud se bloquea sólo dentro del tenant; sin tenant (SYSTEM) no filtra', async () => {
    const { em, findOne } = fakeEm();
    await repo.findReleaseRequestForUpdate(em, TENANT, 'rq-1');
    await repo.findReleaseRequestForUpdate(em, undefined, 'rq-1');
    expect(findOne).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      { id: 'rq-1', tenantId: TENANT },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
    expect(findOne).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      { id: 'rq-1' },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  });

  it('los manifiestos vencidos se acotan a las solicitudes del tenant', async () => {
    const { em, find } = fakeEm();
    const now = new Date();
    await repo.findExpiredManifests(em, now, 5, ['rq-1']);
    await repo.findExpiredManifests(em, now, 5);
    expect(find.mock.calls[0][1]).toEqual({
      expiresAt: { $lte: now },
      datasetReleaseRequestId: { $in: ['rq-1'] },
    });
    expect(find.mock.calls[1][1]).toEqual({ expiresAt: { $lte: now } });
  });

  it('las solicitudes abiertas se listan por tenant y estado', async () => {
    const { em, find } = fakeEm();
    find.mockResolvedValue([{ id: 'rq-1' }]);
    const ids = await repo.findOpenRequestIds(em, TENANT, ['released']);
    expect(ids).toEqual(['rq-1']);
    expect(find).toHaveBeenCalledWith(
      expect.anything(),
      { tenantId: TENANT, status: { $in: ['released'] } },
      { fields: ['id'] },
    );
  });
});
