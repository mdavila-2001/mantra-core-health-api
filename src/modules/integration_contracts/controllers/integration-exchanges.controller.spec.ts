import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationExchangesController } from './integration-exchanges.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const exchangesService = { retry: mockFn() };
  const webhooksService = { deliver: mockFn() };
  const controller = new IntegrationExchangesController(
    exchangesService as any,
    webhooksService as any,
  );
  return { controller, exchangesService, webhooksService };
}

describe('IntegrationExchangesController', () => {
  it('delegates retry (UC-31-07)', async () => {
    const d = build();
    const dto = { outcome: 'SUCCESS' };
    d.exchangesService.retry.mockResolvedValue({ id: 'a1' });
    await expect(d.controller.retry('r1', dto as any, actor)).resolves.toEqual({
      id: 'a1',
    });
    expect(d.exchangesService.retry).toHaveBeenCalledWith('r1', dto, actor);
  });

  it('delegates deliver (UC-31-09)', async () => {
    const d = build();
    const dto = { outcome: 'DELIVERED' };
    await d.controller.deliver('s1', dto as any, actor);
    expect(d.webhooksService.deliver).toHaveBeenCalledWith('s1', dto, actor);
  });
});
