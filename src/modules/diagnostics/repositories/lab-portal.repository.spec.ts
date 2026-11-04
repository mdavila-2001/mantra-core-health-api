import { describe, expect, it, jest } from '@jest/globals';
import { LabPortalRepository } from './lab-portal.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('LabPortalRepository orders', () => {
  it('first page: no keyset condition, newest first, the given limit', async () => {
    const em = { find: mockFn(async () => []) };
    await new LabPortalRepository().findOrders(em as any, 'lab-1', {
      limit: 11,
    });
    const [, where, options] = em.find.mock.calls[0];
    expect(where.$and[0]).toMatchObject({ performerTenantId: 'lab-1' });
    expect(where.$and[1]).toEqual({});
    expect(options).toEqual({
      orderBy: { createdAt: 'DESC', id: 'DESC' },
      limit: 11,
    });
  });

  it('next page: strictly older, or the same instant with a smaller id', async () => {
    const em = { find: mockFn(async () => []) };
    const at = new Date('2026-11-01T10:00:00Z');
    await new LabPortalRepository().findOrders(em as any, 'lab-1', {
      limit: 11,
      after: { createdAt: at, id: 'sr-9' },
    });
    expect(em.find.mock.calls[0][1].$and[1].$or).toEqual([
      { createdAt: { $lt: at } },
      { createdAt: at, id: { $lt: 'sr-9' } },
    ]);
  });

  it('count uses the same tenant filter, with no page limit', async () => {
    const em = { count: mockFn(async () => 1234) };
    const n = await new LabPortalRepository().countOrders(em as any, 'lab-1');
    expect(n).toBe(1234);
    expect(em.count.mock.calls[0][1]).toMatchObject({
      performerTenantId: 'lab-1',
    });
  });
});
