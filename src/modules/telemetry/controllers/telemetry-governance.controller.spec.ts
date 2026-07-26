import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { TelemetryGovernanceController } from './telemetry-governance.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const governance = {
    definePurpose: mockFn(),
    registerEventSchema: mockFn(),
    publishDisclosure: mockFn(),
    defineFunnel: mockFn(),
  };
  const controller = new TelemetryGovernanceController(governance as any);
  return { controller, governance };
}

describe('TelemetryGovernanceController', () => {
  it('delegates definePurpose (UC-28-01)', async () => {
    const d = build();
    const dto = { purposeCode: 'ANALYTICS', name: 'x' };
    d.governance.definePurpose.mockResolvedValue({ id: 'p1' });
    await expect(d.controller.definePurpose(dto as any, actor)).resolves.toEqual({ id: 'p1' });
    expect(d.governance.definePurpose).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates registerEventSchema (UC-28-02)', async () => {
    const d = build();
    const dto = { eventName: 'x', purposeDefinitionId: 'p1' };
    await d.controller.registerEventSchema(dto as any, actor);
    expect(d.governance.registerEventSchema).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates publishDisclosure (UC-28-03)', async () => {
    const d = build();
    const dto = { documentCode: 'PRIV' };
    await d.controller.publishDisclosure(dto as any, actor);
    expect(d.governance.publishDisclosure).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates defineFunnel (UC-28-10)', async () => {
    const d = build();
    const dto = { funnelCode: 'signup', name: 'x', purposeDefinitionId: 'p1', steps: [] };
    await d.controller.defineFunnel(dto as any, actor);
    expect(d.governance.defineFunnel).toHaveBeenCalledWith(dto, actor);
  });
});
