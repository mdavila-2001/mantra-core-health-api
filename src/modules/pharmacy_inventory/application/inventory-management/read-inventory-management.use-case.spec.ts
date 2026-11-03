import { jest } from '@jest/globals';
import { ResourceNotFoundException, runWithTenant } from '../../../../common';
import { buildScopeWorld } from '../scope/pharmacy-inventory-scope.testing';
import { ReadInventoryManagementUseCase } from './read-inventory-management.use-case';

const T1 = 'tenant-1';
const admin = {
  id: 'admin-1',
  roles: ['SECURITY_ADMIN'],
  tenantIds: [T1],
} as any;
const tx = { tx: true };
const page = { page: 2, pageSize: 10 };

function build() {
  const { policy, repo } = buildScopeWorld();
  const locationsRepo = { listActiveForManagement: jest.fn(async () => []) };
  const positionsRepo = {
    listForManagement: jest.fn(async () => ({ rows: [], total: 0 })),
    sumOnHandByLotAndSite: jest.fn(async () => []),
  };
  const ledgerRepo = {
    listForManagement: jest.fn(async () => ({ rows: [], total: 0 })),
  };
  const lotsRepo = {
    findById: jest.fn(async (_tx: unknown, id: string) =>
      id === 'lot-1'
        ? { id, pharmacyProductId: 'prod-1' }
        : id === 'lot-2'
          ? { id, pharmacyProductId: 'prod-2' }
          : null,
    ),
    listForManagement: jest.fn(async () => ({ rows: [], total: 0 })),
  };
  const useCase = new ReadInventoryManagementUseCase(
    { fork: () => tx } as any,
    policy,
    locationsRepo as any,
    positionsRepo as any,
    ledgerRepo as any,
    lotsRepo as any,
  );
  return { useCase, repo, locationsRepo, positionsRepo, ledgerRepo, lotsRepo };
}

const inTenant = <T>(fn: () => Promise<T>): Promise<T> => runWithTenant(T1, fn);

describe('ReadInventoryManagementUseCase', () => {
  it('lists the locations of an own pharmacy, unpublished sites included', async () => {
    const { useCase, locationsRepo } = build();
    locationsRepo.listActiveForManagement.mockResolvedValueOnce([
      {
        id: 'loc-1',
        siteId: 'site-1',
        siteName: 'Central',
        code: 'A1',
        name: 'Estante A',
      },
    ] as never);

    const result = await inTenant(() =>
      useCase.locations('ph-1', { siteId: 'site-1' }, admin),
    );

    expect(result.items).toEqual([
      {
        id: 'loc-1',
        siteId: 'site-1',
        siteName: 'Central',
        code: 'A1',
        name: 'Estante A',
      },
    ]);
    expect(locationsRepo.listActiveForManagement).toHaveBeenCalledWith(
      tx,
      'ph-1',
      'site-1',
    );
  });

  it('answers 404 for a pharmacy of another tenant, with no repository read', async () => {
    const { useCase, locationsRepo, positionsRepo, ledgerRepo, lotsRepo } =
      build();

    const reads: Array<() => Promise<unknown>> = [
      () => useCase.locations('ph-2', {}, admin),
      () => useCase.positions('ph-2', { ...page }, admin),
      () => useCase.ledger('ph-2', { ...page }, admin),
      () => useCase.lots('ph-2', { ...page }, admin),
    ];
    for (const read of reads) {
      await expect(inTenant(read)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    }
    expect(locationsRepo.listActiveForManagement).not.toHaveBeenCalled();
    expect(positionsRepo.listForManagement).not.toHaveBeenCalled();
    expect(ledgerRepo.listForManagement).not.toHaveBeenCalled();
    expect(lotsRepo.listForManagement).not.toHaveBeenCalled();
  });

  it('answers 404 for a site, location, product or lot of another pharmacy', async () => {
    const { useCase, positionsRepo } = build();
    const foreign = [
      { siteId: 'site-2' },
      { locationId: 'loc-2' },
      { siteId: 'site-1', locationId: 'loc-1b' },
      { productId: 'prod-2' },
      { lotId: 'lot-2' },
      { lotId: 'lot-9' },
      { productId: 'prod-1', lotId: 'lot-2' },
    ];
    for (const ids of foreign) {
      await expect(
        inTenant(() => useCase.positions('ph-1', { ...page, ...ids }, admin)),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    }
    expect(positionsRepo.listForManagement).not.toHaveBeenCalled();
  });

  it('passes the filters to the repository and maps the positions with their page', async () => {
    const { useCase, positionsRepo } = build();
    positionsRepo.listForManagement.mockResolvedValueOnce({
      total: 23,
      rows: [
        {
          id: 'pos-1',
          productId: 'prod-1',
          productName: 'Paracetamol',
          siteId: 'site-1',
          siteName: 'Central',
          locationId: 'loc-1',
          locationCode: 'A1',
          locationName: 'Estante A',
          lotId: 'lot-1',
          lotNumber: 'L-7',
          expiresAt: '2027-03-01',
          onHand: '10',
          reserved: '2',
          quarantine: '1',
          available: '7',
        },
      ],
    } as never);

    const result = await inTenant(() =>
      useCase.positions(
        'ph-1',
        {
          ...page,
          siteId: 'site-1',
          locationId: 'loc-1',
          productId: 'prod-1',
          lotId: 'lot-1',
          onlyWithStock: 'true',
        },
        admin,
      ),
    );

    expect(positionsRepo.listForManagement).toHaveBeenCalledWith(tx, {
      pharmacyId: 'ph-1',
      siteId: 'site-1',
      locationId: 'loc-1',
      productId: 'prod-1',
      lotId: 'lot-1',
      onlyWithStock: true,
      limit: 10,
      offset: 10,
    });
    expect(result.meta).toEqual({
      page: 2,
      pageSize: 10,
      total: 23,
      totalPages: 3,
    });
    expect(result.data).toEqual([
      {
        id: 'pos-1',
        product: { id: 'prod-1', name: 'Paracetamol' },
        site: { id: 'site-1', name: 'Central' },
        location: { id: 'loc-1', code: 'A1', name: 'Estante A' },
        lot: { id: 'lot-1', number: 'L-7', expiresAt: '2027-03-01' },
        onHand: 10,
        reserved: 2,
        quarantine: 1,
        available: 7,
      },
    ]);
  });

  it('accepts a lot alone when it belongs to a product of the pharmacy', async () => {
    const { useCase, ledgerRepo } = build();

    await inTenant(() =>
      useCase.ledger('ph-1', { ...page, lotId: 'lot-1' }, admin),
    );

    expect(ledgerRepo.listForManagement).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ pharmacyId: 'ph-1', lotId: 'lot-1' }),
    );
  });

  it('maps the ledger with a signed delta, the movement type code and the date range', async () => {
    const { useCase, ledgerRepo } = build();
    ledgerRepo.listForManagement.mockResolvedValueOnce({
      total: 1,
      rows: [
        {
          id: 'e1',
          sequence: '15',
          occurredAt: new Date('2026-11-02T10:00:00Z'),
          movementTypeId: 'mt-1',
          movementTypeCode: 'pharmacy_inventory:MV_DISPENSE',
          movementTypeDisplay: 'Movement dispense',
          productId: 'prod-1',
          productName: 'Paracetamol',
          siteId: 'site-1',
          siteName: 'Central',
          locationId: 'loc-1',
          locationCode: 'A1',
          locationName: 'Estante A',
          lotId: null,
          lotNumber: null,
          lotExpiresAt: null,
          quantityDelta: '-3',
          reservationDelta: '2',
          quarantineDelta: '0',
          sourceTypeCode: null,
          sourceTypeDisplay: null,
          sourceId: 'src-1',
          unitCostAmount: '1.50',
          currencyCode: 'PINV_CURRENCY_USD',
        },
      ],
    } as never);

    const result = await inTenant(() =>
      useCase.ledger(
        'ph-1',
        {
          ...page,
          movementType: 'pharmacy_inventory:MV_DISPENSE',
          from: '2026-11-01T00:00:00Z',
          to: '2026-11-03T00:00:00Z',
        },
        admin,
      ),
    );

    expect(ledgerRepo.listForManagement).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        movementTypeCode: 'pharmacy_inventory:MV_DISPENSE',
        from: new Date('2026-11-01T00:00:00Z'),
        to: new Date('2026-11-03T00:00:00Z'),
        limit: 10,
        offset: 10,
      }),
    );
    expect(result.data[0]).toMatchObject({
      sequence: '15',
      occurredAt: '2026-11-02T10:00:00.000Z',
      movementType: {
        id: 'mt-1',
        code: 'pharmacy_inventory:MV_DISPENSE',
        display: 'Movement dispense',
      },
      lot: null,
      quantityDelta: -3,
      reservationDelta: 2,
      quarantineDelta: 0,
      sourceType: null,
      sourceId: 'src-1',
      unitCostAmount: '1.50',
      currencyCode: 'PINV_CURRENCY_USD',
    });
  });

  it('joins each lot with its on-hand stock per site', async () => {
    const { useCase, lotsRepo, positionsRepo } = build();
    lotsRepo.listForManagement.mockResolvedValueOnce({
      total: 1,
      rows: [
        {
          id: 'lot-1',
          productId: 'prod-1',
          productName: 'Paracetamol',
          lotNumber: 'L-7',
          expiresAt: '2027-03-01',
          quarantineCode: 'PINV_LOT_QUARANTINED',
          quarantineDisplay: 'Lot quarantined',
          recallCode: null,
          recallDisplay: null,
        },
      ],
    } as never);
    positionsRepo.sumOnHandByLotAndSite.mockResolvedValueOnce([
      { lotId: 'lot-1', siteId: 'site-1', siteName: 'Central', onHand: '4' },
      { lotId: 'lot-1', siteId: 'site-1b', siteName: 'Norte', onHand: '6' },
    ] as never);

    const result = await inTenant(() =>
      useCase.lots(
        'ph-1',
        {
          ...page,
          siteId: 'site-1',
          includeExpired: 'true',
          expiringBefore: '2028-01-01',
        },
        admin,
      ),
    );

    expect(lotsRepo.listForManagement).toHaveBeenCalledWith(tx, {
      pharmacyId: 'ph-1',
      siteId: 'site-1',
      productId: undefined,
      expiringBefore: '2028-01-01',
      includeExpired: true,
      limit: 10,
      offset: 10,
    });
    expect(positionsRepo.sumOnHandByLotAndSite).toHaveBeenCalledWith(
      tx,
      'ph-1',
      ['lot-1'],
      'site-1',
    );
    expect(result.data[0]).toMatchObject({
      lotNumber: 'L-7',
      quarantineStatus: {
        code: 'PINV_LOT_QUARANTINED',
        display: 'Lot quarantined',
      },
      recallStatus: null,
      onHandTotal: 10,
      bySite: [
        { siteId: 'site-1', siteName: 'Central', onHand: 4 },
        { siteId: 'site-1b', siteName: 'Norte', onHand: 6 },
      ],
    });
  });

  it('excludes expired lots unless includeExpired is true', async () => {
    const { useCase, lotsRepo } = build();

    await inTenant(() => useCase.lots('ph-1', { ...page }, admin));

    expect(lotsRepo.listForManagement).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ includeExpired: false }),
    );
  });
});
