import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { FrontendViewsController } from './frontend-views.controller';

const user = { id: 'user-1', roles: ['USER'] } as any;

function build() {
  const service = {
    publishViewContract: mockFn(),
    serveData: mockFn(),
    deriveAvailableActions: mockFn(),
    upsertPreferences: mockFn(),
  };
  const controller = new FrontendViewsController(service as any);
  return { controller, service };
}

describe('FrontendViewsController', () => {
  it('delegates publishViewContract (UC-30-02)', async () => {
    const d = build();
    const dto = { viewCode: 'v' };
    await d.controller.publishViewContract('portal', 'route', dto as any, user);
    expect(d.service.publishViewContract).toHaveBeenCalledWith(
      'portal',
      'route',
      dto,
      user,
    );
  });

  it('delegates serveData (UC-30-05)', async () => {
    const d = build();
    d.service.serveData.mockResolvedValue({ data: [] });
    await d.controller.serveData('portal', 'route', 'v', user);
    expect(d.service.serveData).toHaveBeenCalledWith(
      'portal',
      'route',
      'v',
      user,
    );
  });

  it('delegates deriveActions (UC-30-11)', async () => {
    const d = build();
    await d.controller.deriveActions('portal', 'route', 'v', 'OPEN', user);
    expect(d.service.deriveAvailableActions).toHaveBeenCalledWith(
      'portal',
      'route',
      'v',
      'OPEN',
      user,
    );
  });

  it('delegates upsertPreferences (UC-30-09)', async () => {
    const d = build();
    const dto = { visibleFields: ['name'] };
    await d.controller.upsertPreferences('view-1', dto, user);
    expect(d.service.upsertPreferences).toHaveBeenCalledWith(
      'view-1',
      dto,
      user,
    );
  });
});
