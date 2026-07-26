import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DelegatedAccessAuthzController } from './delegated-access-authz.controller';

const actor = { id: 'authz-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const service = { expirySweep: mockFn(), evaluate: mockFn() };
  const controller = new DelegatedAccessAuthzController(service as any);
  return { controller, service };
}

describe('DelegatedAccessAuthzController', () => {
  it('delegates expirySweep (UC-29-08)', async () => {
    const d = build();
    await d.controller.expirySweep(actor);
    expect(d.service.expirySweep).toHaveBeenCalledWith(actor);
  });

  it('delegates evaluate (UC-29-09)', async () => {
    const d = build();
    const dto = { practitionerDelegateAssignmentId: 'del1', purpose: 'TREATMENT' };
    await d.controller.evaluate(dto as any, actor);
    expect(d.service.evaluate).toHaveBeenCalledWith(dto, actor);
  });
});
