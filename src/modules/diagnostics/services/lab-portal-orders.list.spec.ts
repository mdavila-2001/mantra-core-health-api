import { describe, expect, it, jest } from '@jest/globals';
import { LabPortalOrdersService } from './lab-portal-orders.service';
import { LabPortalSnapshotService } from './lab-portal-snapshot.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const LAB = 'lab-1';

/** Orders `n`, `n-1`, ... 1, newest first, one minute apart. */
const orders = (n: number): any[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `sr-${n - i}`,
    createdAt: new Date(Date.UTC(2026, 10, 1, 10, n - i)),
  }));

function build(rows: (page: any) => any[], total: number) {
  const repo = {
    findOrders: mockFn(async (_em: any, _t: string, page: any) => rows(page)),
    countOrders: mockFn(async () => total),
  };
  const snapshot = {
    load: mockFn(async (_em: any, _t: string, list: any[]) => ({
      orders: list.map((order) => ({
        order,
        status: 'RECEIVED',
        studyName: 'Hemograma',
        patientName: 'Ana',
        requesterName: 'Dra. Rojas',
        reason: null,
        files: [],
      })),
      files: [],
    })),
  };
  const service = new LabPortalOrdersService(
    { fork: () => ({}) } as any,
    repo as any,
    {} as any,
    {} as any,
    snapshot as any,
    { setContext: mockFn(), info: mockFn() } as any,
  );
  return { service, repo, snapshot };
}

describe('LabPortalOrdersService.list', () => {
  it('defaults to 100 per page, asks for one extra row and reports the lab total', async () => {
    const t = build((page) => orders(page.limit), 250);
    const page = await t.service.list(LAB);
    expect(t.repo.findOrders).toHaveBeenCalledWith(expect.anything(), LAB, {
      limit: 101,
      after: undefined,
    });
    expect(page.items).toHaveLength(100);
    expect(page.count).toBe(250);
    expect(page.nextCursor).toEqual(expect.any(String));
  });

  it('the cursor of a page is the keyset of its last order', async () => {
    const all = orders(5);
    const t = build((page) => all.slice(0, page.limit), 5);
    const first = await t.service.list(LAB, { limit: 2 });
    expect(first.items.map((i) => i.orderId)).toEqual(['sr-5', 'sr-4']);
    t.repo.findOrders.mockClear();
    await t.service.list(LAB, { limit: 2, cursor: first.nextCursor });
    expect(t.repo.findOrders.mock.calls[0][2].after).toEqual({
      createdAt: all[1].createdAt,
      id: 'sr-4',
    });
  });

  it('the last page has no nextCursor and count stays the total', async () => {
    const t = build(() => orders(2), 102);
    const page = await t.service.list(LAB, { limit: 2 });
    expect(page.items).toHaveLength(2);
    expect(page).not.toHaveProperty('nextCursor');
    expect(page.count).toBe(102);
  });

  it.each(['not-a-cursor', Buffer.from('{"id":"x"}').toString('base64url')])(
    'a malformed cursor (%s) is 400 and reads nothing',
    async (cursor) => {
      const t = build(() => [], 0);
      await expect(t.service.list(LAB, { cursor })).rejects.toMatchObject({
        status: 400,
      });
      expect(t.repo.findOrders).not.toHaveBeenCalled();
    },
  );
});

describe('LabPortalSnapshotService.loadAll', () => {
  it('walks every batch of orders by keyset, past the old 500 cap', async () => {
    const all = orders(1200);
    const repo = {
      findOrders: mockFn(async (_em: any, _t: string, page: any) => {
        const start = page.after
          ? all.findIndex((o) => o.id === page.after.id) + 1
          : 0;
        return all.slice(start, start + page.limit);
      }),
    };
    const service = new LabPortalSnapshotService(
      repo as any,
      {} as any,
      {} as any,
    );
    jest.spyOn(service, 'load').mockImplementation((async (
      _em: any,
      _t: string,
      list: any[],
    ) => ({
      orders: list,
      files: [],
    })) as any);
    const em = { clear: mockFn() };
    const seen: string[] = [];
    for await (const snap of service.loadAll(em as any, LAB)) {
      seen.push(...snap.orders.map((o: any) => o.id));
    }
    expect(seen).toHaveLength(1200);
    expect(new Set(seen).size).toBe(1200);
    expect(repo.findOrders).toHaveBeenCalledTimes(3);
    expect(em.clear).toHaveBeenCalledTimes(2);
  });

  it('a lab with no orders yields nothing', async () => {
    const service = new LabPortalSnapshotService(
      { findOrders: mockFn(async () => []) } as any,
      {} as any,
      {} as any,
    );
    const batches: unknown[] = [];
    for await (const snap of service.loadAll({} as any, LAB))
      batches.push(snap);
    expect(batches).toEqual([]);
  });
});
