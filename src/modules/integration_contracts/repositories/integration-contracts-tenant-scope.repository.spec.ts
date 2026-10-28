import { jest } from '@jest/globals';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ContractsRepository } from './contracts.repository';
import { ExchangeRecordsRepository } from './exchange-records.repository';

const TENANT = 'tenant-a';

/**
 * Construye un EntityManager simulado que registra las consultas.
 *
 * @returns El EntityManager y su espía.
 */
function fakeEm() {
  const findOne: any = (jest.fn as any)(async () => null);
  return { em: { findOne } as unknown as EntityManager, findOne };
}

describe('ContractsRepository · alcance por tenant (ICON-01)', () => {
  const repo = new ContractsRepository();

  it('busca el contrato por id y tenant', async () => {
    const { em, findOne } = fakeEm();
    await repo.findByIdInTenant(em, TENANT, 'c1');
    expect(findOne).toHaveBeenCalledWith(expect.anything(), {
      id: 'c1',
      tenantId: TENANT,
    });
  });

  it('bloquea el contrato sólo dentro del tenant', async () => {
    const { em, findOne } = fakeEm();
    await repo.findByIdInTenantForUpdate(em, TENANT, 'c1');
    expect(findOne).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'c1', tenantId: TENANT },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  });

  it('el duplicado de código se busca dentro del tenant', async () => {
    const { em, findOne } = fakeEm();
    await repo.findByCodeAndProvider(em, TENANT, 'C1', 'p1');
    expect(findOne).toHaveBeenCalledWith(expect.anything(), {
      tenantId: TENANT,
      contractCode: 'C1',
      externalProviderId: 'p1',
    });
  });

  it('el contrato se crea con el tenant que recibe', () => {
    const create: any = (jest.fn as any)(
      (_entity: unknown, data: object) => data,
    );
    const em = { create } as unknown as EntityManager;
    repo.create(em, {
      tenantId: TENANT,
      externalProviderId: 'p1',
      contractCode: 'C1',
      capabilityConceptId: 'cap',
      statusConceptId: 'draft',
    });
    expect(create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tenantId: TENANT }),
      { partial: true },
    );
  });
});

describe('ExchangeRecordsRepository · reintento concurrente (ICON-01)', () => {
  it('bloquea el registro de intercambio para serializar los reintentos', async () => {
    const { em, findOne } = fakeEm();
    await new ExchangeRecordsRepository().findByIdForUpdate(em, 'r1');
    expect(findOne).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'r1' },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  });
});
