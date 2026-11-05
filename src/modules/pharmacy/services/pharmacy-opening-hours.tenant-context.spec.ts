import { describe, expect, it, jest } from '@jest/globals';
import { EntitySchema, TransactionContext } from '@mikro-orm/core';
import { EntityManager, MikroORM } from '@mikro-orm/postgresql';
import { runWithTenant, type AuthenticatedUser } from '../../../common';
import { PharmacyErrorReason } from '../pharmacy.error-reasons';
import { PharmacyOpeningHoursService } from './pharmacy-opening-hours.service';

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const PHARMACY_A = 'pharmacy-a';
const NOW = new Date('2026-11-01T12:00:00.000Z');
const ACTOR_A = {
  id: 'synthetic-staff-a',
  roles: ['PHARMACY_STAFF'],
  tenantIds: [TENANT_A],
} as AuthenticatedUser;

function fixture(rowTenant = TENANT_A) {
  const orm = new MikroORM({
    entities: [
      new EntitySchema({
        name: 'OfflinePharmacyOpeningHoursContext',
        properties: { id: { type: 'number', primary: true } },
      }),
    ],
    dbName: 'offline',
    allowGlobalContext: true,
    metadataCache: { enabled: false },
    logger: () => undefined,
  });
  const request = orm.em.fork();
  const transaction = { syntheticTransaction: 'opening-hours-tenant-a' };
  request.setTransactionContext(transaction as never);
  const observed: Array<{ operation: string; transaction: unknown }> = [];
  const observe = (operation: string, em: EntityManager) => {
    observed.push({ operation, transaction: em.getTransactionContext() });
  };
  const pharmaciesRepo = {
    findByIdInTenant: jest.fn(
      async (em: EntityManager, id: string, tenant: string) => {
        observe('scope', em);
        expect(id).toBe(PHARMACY_A);
        expect(tenant).toBe(TENANT_A);
        return { id: PHARMACY_A, tenantId: rowTenant };
      },
    ),
  };
  const emptyRows = (operation: string) =>
    jest.fn(async (em: EntityManager) => {
      observe(operation, em);
      return [];
    });
  const readRepo = {
    findActiveSites: emptyRows('sites'),
    findPracticeSites: emptyRows('zones'),
  };
  const shiftsRepo = { findUpcomingBySites: emptyRows('shifts') };
  const service = new PharmacyOpeningHoursService(
    orm.em,
    pharmaciesRepo as never,
    {} as never,
    shiftsRepo as never,
    readRepo as never,
    { setContext: () => undefined } as never,
  );
  const read = (actor = ACTOR_A) =>
    runWithTenant(TENANT_A, () =>
      TransactionContext.create(request, () =>
        service.getOpeningHours(PHARMACY_A, actor, NOW),
      ),
    );
  return { read, transaction, observed, pharmaciesRepo, readRepo, shiftsRepo };
}

/** Actual MikroORM context propagation offline; no SQL, RLS policy or network simulation. */
describe('opening hours retain request context without changing authorization', () => {
  it('keeps the actual request transaction for own-pharmacy scope and all opening-hours reads', async () => {
    const f = fixture();

    const result = await f.read();

    expect(result).toEqual({
      pharmacyId: PHARMACY_A,
      asOf: NOW.toISOString(),
      sites: [],
    });
    expect(f.observed).toHaveLength(4);
    expect(f.observed.map((read) => read.operation)).toEqual(
      expect.arrayContaining(['scope', 'sites', 'zones', 'shifts']),
    );
    for (const read of f.observed) expect(read.transaction).toBe(f.transaction);
  });

  it('rejects staff without affiliation in the active tenant before repository reads', async () => {
    const f = fixture();
    const unaffiliated = { ...ACTOR_A, tenantIds: [TENANT_B] };

    await expect(f.read(unaffiliated)).rejects.toMatchObject({
      response: expect.objectContaining({
        reason: PharmacyErrorReason.PHARMACY_NOT_AVAILABLE,
      }),
    });

    expect(f.pharmaciesRepo.findByIdInTenant).not.toHaveBeenCalled();
    expect(f.readRepo.findActiveSites).not.toHaveBeenCalled();
    expect(f.shiftsRepo.findUpcomingBySites).not.toHaveBeenCalled();
  });

  it('rejects a pharmacy belonging to another tenant without reading its hours', async () => {
    const f = fixture(TENANT_B);

    await expect(f.read()).rejects.toMatchObject({
      response: expect.objectContaining({
        reason: PharmacyErrorReason.PHARMACY_NOT_AVAILABLE,
      }),
    });

    expect(f.pharmaciesRepo.findByIdInTenant).toHaveBeenCalledTimes(1);
    expect(f.readRepo.findActiveSites).not.toHaveBeenCalled();
    expect(f.shiftsRepo.findUpcomingBySites).not.toHaveBeenCalled();
  });
});
