import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityFeedController } from './community-feed.controller';

const actor = { id: 'svc-1', roles: ['SECURITY_ADMIN'] } as any;

describe('CommunityFeedController', () => {
  it('delegates rebuild (UC-19-15)', async () => {
    const service = { rebuild: mockFn() };
    const controller = new CommunityFeedController(service as any);
    const dto = { sourceRefId: 'post1', followerProfileIds: ['a', 'b'] };
    await controller.rebuild(dto, actor);
    expect(service.rebuild).toHaveBeenCalledWith(dto, actor);
  });
});
