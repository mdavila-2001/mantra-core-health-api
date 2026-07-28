import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityFeedService } from './community-feed.service';

const actor = { id: 'svc-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const feedRepo = { findByOwnerSource: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CommunityFeedService(em as any, feedRepo, logger as any);
  return { service, tx, feedRepo };
}

describe('CommunityFeedService (UC-19-15)', () => {
  it('fans out to followers that do not yet have the item', async () => {
    const d = build();
    d.feedRepo.findByOwnerSource.mockResolvedValue(null);
    const res = await d.service.rebuild(
      { sourceRefId: 'post1', followerProfileIds: ['a', 'b', 'c'] },
      actor,
    );
    expect(res).toEqual({ itemsCreated: 3 });
    expect(d.feedRepo.create).toHaveBeenCalledTimes(3);
  });

  it('is idempotent: skips followers that already have the item', async () => {
    const d = build();
    d.feedRepo.findByOwnerSource
      .mockResolvedValueOnce({ id: 'existing' })
      .mockResolvedValueOnce(null);
    const res = await d.service.rebuild(
      { sourceRefId: 'post1', followerProfileIds: ['a', 'b'] },
      actor,
    );
    expect(res).toEqual({ itemsCreated: 1 });
    expect(d.feedRepo.create).toHaveBeenCalledTimes(1);
  });
});
