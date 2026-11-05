import { jest } from '@jest/globals';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { LedgerManagementRepository } from './ledger-management.repository';
import { LocationsRepository } from './locations.repository';
import { LotsRepository } from './lots.repository';
import { buildSqlFilters } from './sql-filters';
import { StockManagementRepository } from './stock-management.repository';

type Call = [string, unknown[]];

/** An `execute` that answers the count query first, then the page query. */
function pagedEm(total: number, rows: unknown[] = []) {
  const execute = jest
    .fn<() => Promise<unknown>>()
    .mockResolvedValueOnce([{ total: String(total) }])
    .mockResolvedValueOnce(rows);
  return {
    em: { execute } as any,
    calls: () => execute.mock.calls as unknown as Call[],
  };
}

describe('buildSqlFilters', () => {
  it('binds fixed and defined optional values in clause order and skips undefined ones', () => {
    const { where, params } = buildSqlFilters(
      [['a = ?', 1]],
      [
        [undefined, 'b = ?'],
        ['x', 'c = ?'],
      ],
      [
        [true, 'd > 0'],
        [false, 'e > 0'],
      ],
    );
    expect(where).toBe('where a = ? and c = ? and d > 0');
    expect(params).toEqual([1, 'x']);
  });
});

describe('LedgerManagementRepository.listForManagement', () => {
  it('scopes to the pharmacy, orders by sequence, newest first and pages with the same filters as the count', async () => {
    const { em, calls } = pagedEm(41, [{ id: 'e1' }]);
    const from = new Date('2026-11-01T00:00:00Z');
    const result = await new LedgerManagementRepository().listForManagement(
      em,
      {
        pharmacyId: 'ph-1',
        siteId: 'site-1',
        movementTypeCode: 'pharmacy_inventory:MV_RECEIPT',
        from,
        limit: 20,
        offset: 40,
      },
    );
    expect(result).toEqual({ rows: [{ id: 'e1' }], total: 41 });
    const [[countSql, countParams], [pageSql, pageParams]] = calls();
    expect(countSql).toContain('e.pharmacy_id = ?');
    expect(countSql).toContain('e.pharmacy_site_id = ?');
    expect(countSql).toContain('mt.code = ?');
    expect(countSql).toContain('e.occurred_at >= ?');
    expect(countSql).not.toContain('e.inventory_lot_id = ?');
    expect(countParams).toEqual([
      'ph-1',
      'site-1',
      'pharmacy_inventory:MV_RECEIPT',
      from,
    ]);
    expect(pageSql).toContain('order by e.ledger_sequence desc');
    expect(pageSql).toContain('limit ? offset ?');
    expect(pageParams).toEqual([...countParams, 20, 40]);
  });
});

describe('StockManagementRepository.listForManagement', () => {
  it('filters by the ids given and by stock only when asked', async () => {
    const { em, calls } = pagedEm(3);
    await new StockManagementRepository().listForManagement(em, {
      pharmacyId: 'ph-1',
      locationId: 'loc-1',
      lotId: 'lot-1',
      onlyWithStock: true,
      limit: 10,
      offset: 0,
    });
    const [[countSql, countParams], [pageSql, pageParams]] = calls();
    expect(countSql).toContain('s.pharmacy_id = ?');
    expect(countSql).toContain('st.inventory_location_id = ?');
    expect(countSql).toContain('st.inventory_lot_id = ?');
    expect(countSql).toContain('st.on_hand_quantity > 0');
    expect(countParams).toEqual(['ph-1', 'loc-1', 'lot-1']);
    expect(pageSql).toContain('lot.expires_at nulls last');
    expect(pageParams).toEqual(['ph-1', 'loc-1', 'lot-1', 10, 0]);
  });

  it('does not filter by stock when not asked', async () => {
    const { em, calls } = pagedEm(0);
    await new StockManagementRepository().listForManagement(em, {
      pharmacyId: 'ph-1',
      limit: 20,
      offset: 0,
    });
    expect(calls()[0][0]).not.toContain('on_hand_quantity > 0');
  });
});

describe('StockManagementRepository.sumOnHandByLotAndSite', () => {
  it('asks nothing for no lots', async () => {
    const em = { execute: jest.fn() };
    await expect(
      new StockManagementRepository().sumOnHandByLotAndSite(
        em as any,
        'ph-1',
        [],
      ),
    ).resolves.toEqual([]);
    expect(em.execute).not.toHaveBeenCalled();
  });

  it('groups by lot and site, one marker per lot, narrowed to a site when given', async () => {
    const execute = jest.fn<() => Promise<unknown>>().mockResolvedValue([]);
    const repo = new StockManagementRepository();
    await repo.sumOnHandByLotAndSite(
      { execute } as any,
      'ph-1',
      ['l1', 'l2'],
      'site-1',
    );
    const [sql, params] = execute.mock.calls[0] as unknown as Call;
    expect(sql).toContain('in (?, ?)');
    expect(sql).toContain('and s.pharmacy_id = ?');
    expect(sql).toContain('and s.id = ?');
    expect(sql).toContain('group by st.inventory_lot_id, s.id, s.name');
    expect(params).toEqual(['l1', 'l2', 'ph-1', 'site-1']);
    await repo.sumOnHandByLotAndSite({ execute } as any, 'ph-1', ['l1']);
    const [wideSql, wideParams] = execute.mock.calls[1] as unknown as Call;
    expect(wideSql).not.toContain('and s.id = ?');
    expect(wideParams).toEqual(['l1', 'ph-1']);
  });
});

describe('LotsRepository.listForManagement', () => {
  it('leaves expired lots out by default and orders by expiry, no expiry last', async () => {
    const { em, calls } = pagedEm(2);
    await new LotsRepository().listForManagement(em, {
      pharmacyId: 'ph-1',
      productId: 'prod-1',
      expiringBefore: '2027-01-31',
      siteId: 'site-1',
      limit: 20,
      offset: 0,
    });
    const [[countSql, countParams], [pageSql, pageParams]] = calls();
    expect(countSql).toContain('p.pharmacy_id = ?');
    expect(countSql).toContain('lot.pharmacy_product_id = ?');
    expect(countSql).toContain('lot.expires_at < ?');
    expect(countSql).toContain('loc.pharmacy_site_id = ?');
    expect(countSql).toContain('lot.expires_at >= current_date');
    expect(countParams).toEqual(['ph-1', 'prod-1', '2027-01-31', 'site-1']);
    expect(pageSql).toContain('order by lot.expires_at nulls last');
    expect(pageParams).toEqual([...countParams, 20, 0]);
  });

  it('includes expired lots when asked', async () => {
    const { em, calls } = pagedEm(0);
    await new LotsRepository().listForManagement(em, {
      pharmacyId: 'ph-1',
      includeExpired: true,
      limit: 20,
      offset: 0,
    });
    expect(calls()[0][0]).not.toContain('current_date');
  });
});

describe('LocationsRepository.listActiveForManagement', () => {
  it('lists the active locations of the pharmacy, narrowed to a site when given', async () => {
    const execute = jest.fn<() => Promise<unknown>>().mockResolvedValue([]);
    const repo = new LocationsRepository();
    await repo.listActiveForManagement({ execute } as any, 'ph-1', 'site-1');
    const [sql, params] = execute.mock.calls[0] as unknown as Call;
    expect(sql).toContain('s.pharmacy_id = ?');
    expect(sql).toContain('order by s.name, loc.code');
    expect(params).toEqual(['ph-1', PINV.LOCATION_ACTIVE, 'site-1']);
    await repo.listActiveForManagement({ execute } as any, 'ph-1');
    const [, widerParams] = execute.mock.calls[1] as unknown as Call;
    expect(widerParams).toEqual(['ph-1', PINV.LOCATION_ACTIVE]);
  });
});
