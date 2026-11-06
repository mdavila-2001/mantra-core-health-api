import { describe, expect, it, jest } from '@jest/globals';
import { CLIN } from '../clinical.concepts';
import { ServiceRequestsService } from './service-requests.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const row = (over: Record<string, unknown> = {}) => ({
  id: 'p1',
  code: 'TM1',
  name: 'Toma 1',
  practice_site_id: 'site-1',
  tenant_id: 't1',
  available: true,
  unit_id: null,
  unit_name: null,
  ...over,
});
const resolve = (tx: unknown, ...args: unknown[]) =>
  (
    Object.create(ServiceRequestsService.prototype) as {
      resolveCollectionPoint: (...a: unknown[]) => Promise<unknown>;
    }
  ).resolveCollectionPoint(tx, ...args);

describe('punto de toma de una orden (§F5b)', () => {
  it('pedido explícito de la sede sugerida y disponible → ese punto', async () => {
    const tx = { execute: mockFn().mockResolvedValue([row()]) };
    await expect(
      resolve(tx, 'p1', 'site-1', CLIN.SERVICE_REQUEST_CATEGORY_LAB),
    ).resolves.toMatchObject({ id: 'p1' });
  });
  it('de otra sede, bloqueado, invisible (otro tenant) o sin sede sugerida → 422 COLLECTION_POINT_INVALID', async () => {
    for (const [rows, site] of [
      [[row({ practice_site_id: 'site-2' })], 'site-1'],
      [[row({ available: false })], 'site-1'],
      [[], 'site-1'],
      [[row()], null],
    ] as const) {
      const tx = { execute: mockFn().mockResolvedValue(rows) };
      const err: any = await resolve(
        tx,
        'p1',
        site,
        CLIN.SERVICE_REQUEST_CATEGORY_LAB,
      ).catch((e) => e);
      expect(err.getStatus()).toBe(422);
      expect(err.reason).toBe('COLLECTION_POINT_INVALID');
    }
  });
  it('sin pedido: en laboratorio, el primer punto disponible; en otra categoría, ninguno', async () => {
    const tx = {
      execute: mockFn().mockResolvedValue([
        row({ id: 'bloq', available: false }),
        row({ id: 'p2' }),
      ]),
    };
    await expect(
      resolve(tx, undefined, 'site-1', CLIN.SERVICE_REQUEST_CATEGORY_LAB),
    ).resolves.toMatchObject({ id: 'p2' });
    await expect(
      resolve(tx, undefined, 'site-1', CLIN.SERVICE_REQUEST_CATEGORY_PROCEDURE),
    ).resolves.toBeNull();
  });
});
