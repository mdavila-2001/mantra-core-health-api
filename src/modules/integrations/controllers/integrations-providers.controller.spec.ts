import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationsProvidersController } from './integrations-providers.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const providersService = {
    registerProvider: mockFn(),
    publishEndpoint: mockFn(),
    createWebhookSubscription: mockFn(),
  };
  const connectionsService = { provisionConnection: mockFn() };
  const controller = new IntegrationsProvidersController(
    providersService as any,
    connectionsService as any,
  );
  return { controller, providersService, connectionsService };
}

describe('IntegrationsProvidersController', () => {
  it('delegates registerProvider (UC-12-01)', async () => {
    const d = build();
    const dto = { code: 'LAB', name: 'Lab', providerType: 'LAB' };
    d.providersService.registerProvider.mockResolvedValue({ id: 'p1' });
    await expect(
      d.controller.registerProvider(dto as any, actor),
    ).resolves.toEqual({ id: 'p1' });
    expect(d.providersService.registerProvider).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates provisionConnection (UC-12-02)', async () => {
    const d = build();
    const dto = { tenantId: 't1', secretType: 'API_KEY', secretRef: 'r' };
    await d.controller.provisionConnection('p1', dto as any, actor);
    expect(d.connectionsService.provisionConnection).toHaveBeenCalledWith(
      'p1',
      dto,
      actor,
    );
  });

  it('delegates publishEndpoint (UC-12-04)', async () => {
    const d = build();
    const dto = { code: 'c', operation: 'o', version: 'v1' };
    await d.controller.publishEndpoint('p1', dto, actor);
    expect(d.providersService.publishEndpoint).toHaveBeenCalledWith(
      'p1',
      dto,
      actor,
    );
  });

  it('delegates createWebhookSubscription (UC-12-11)', async () => {
    const d = build();
    const dto = { eventType: 'e', callbackUrl: 'https://x.io/cb' };
    await d.controller.createWebhookSubscription('p1', dto, actor);
    expect(d.providersService.createWebhookSubscription).toHaveBeenCalledWith(
      'p1',
      dto,
      actor,
    );
  });
});
