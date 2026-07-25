import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuthzPdpController } from './authz-pdp.controller';

const actor = { id: 'sys-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const pdpService = { invalidateCache: mockFn(), evaluate: mockFn() };
  const controller = new AuthzPdpController(pdpService as any);
  return { controller, pdpService };
}

describe('AuthzPdpController', () => {
  it('delegates invalidateCache (UC-06-11)', () => {
    const d = build();
    const dto = { tenantId: 't1', userId: 'u1' };
    d.pdpService.invalidateCache.mockReturnValue({ ok: true });
    expect(d.controller.invalidateCache(dto as any, actor)).toEqual({ ok: true });
    expect(d.pdpService.invalidateCache).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates evaluate (UC-06-12)', async () => {
    const d = build();
    const dto = { userId: 'u1', tenantId: 't1', resource: 'patient', action: 'READ' };
    await d.controller.evaluate(dto as any, actor);
    expect(d.pdpService.evaluate).toHaveBeenCalledWith(dto, actor);
  });
});
