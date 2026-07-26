import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationsConnectionsController } from './integrations-connections.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const connectionsService = { rotateCredential: mockFn(), pauseConnection: mockFn() };
  const controller = new IntegrationsConnectionsController(connectionsService as any);
  return { controller, connectionsService };
}

describe('IntegrationsConnectionsController', () => {
  it('delegates rotateCredential (UC-12-03)', async () => {
    const d = build();
    const dto = { secretRef: 'new' };
    await d.controller.rotateCredential('c1', dto as any, actor);
    expect(d.connectionsService.rotateCredential).toHaveBeenCalledWith('c1', dto, actor);
  });

  it('delegates pauseConnection (UC-12-12)', async () => {
    const d = build();
    await d.controller.pauseConnection('c1', actor);
    expect(d.connectionsService.pauseConnection).toHaveBeenCalledWith('c1', actor);
  });
});
