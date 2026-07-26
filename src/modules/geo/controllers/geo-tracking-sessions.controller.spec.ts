import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { GeoTrackingSessionsController } from './geo-tracking-sessions.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const service = { start: mockFn(), close: mockFn() };
  const controller = new GeoTrackingSessionsController(service as any);
  return { controller, service };
}

describe('GeoTrackingSessionsController', () => {
  it('delegates start (UC-13-02)', async () => {
    const d = build();
    const dto = { trackedSubjectId: 's1' };
    d.service.start.mockResolvedValue({ id: 'sess-1' });
    await expect(d.controller.start(dto as any, actor)).resolves.toEqual({ id: 'sess-1' });
    expect(d.service.start).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates close (UC-13-08)', async () => {
    const d = build();
    await d.controller.close('sess-1', actor);
    expect(d.service.close).toHaveBeenCalledWith('sess-1', actor);
  });
});
