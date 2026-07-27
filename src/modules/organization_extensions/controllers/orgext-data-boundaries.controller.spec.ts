import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrgextDataBoundariesController } from './orgext-data-boundaries.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const boundariesService = { define: mockFn() };
  const controller = new OrgextDataBoundariesController(
    boundariesService as any,
  );
  return { controller, boundariesService };
}

describe('OrgextDataBoundariesController', () => {
  it('delegates define (UC-22-08)', async () => {
    const d = build();
    const dto = { tenantId: 't1', dataControllerTenantId: 't1' };
    d.boundariesService.define.mockResolvedValue({ id: 'b1' });
    await expect(d.controller.define(dto as any, actor)).resolves.toEqual({
      id: 'b1',
    });
    expect(d.boundariesService.define).toHaveBeenCalledWith(dto, actor);
  });
});
