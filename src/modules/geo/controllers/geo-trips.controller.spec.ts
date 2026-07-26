import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { GeoTripsController } from './geo-trips.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const service = { start: mockFn(), close: mockFn() };
  const controller = new GeoTripsController(service as any);
  return { controller, service };
}

describe('GeoTripsController', () => {
  it('delegates start (UC-13-06)', async () => {
    const d = build();
    const dto = { trackingSessionId: 'sess-1' };
    d.service.start.mockResolvedValue({ id: 't1' });
    await expect(d.controller.start(dto as any, actor)).resolves.toEqual({ id: 't1' });
    expect(d.service.start).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates close (UC-13-07)', async () => {
    const d = build();
    const dto = { distanceM: 100 };
    await d.controller.close('t1', dto as any, actor);
    expect(d.service.close).toHaveBeenCalledWith('t1', dto, actor);
  });
});
