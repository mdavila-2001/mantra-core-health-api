import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrgUserAssignmentsController } from './org-user-assignments.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const service = { createAssignment: mockFn(), updateAssignment: mockFn() };
  const controller = new OrgUserAssignmentsController(service as any);
  return { controller, service };
}

describe('OrgUserAssignmentsController', () => {
  it('delegates create (UC-29-01)', async () => {
    const d = build();
    const dto = { role: 'SECRETARY' };
    await d.controller.create('m1', dto as any, actor);
    expect(d.service.createAssignment).toHaveBeenCalledWith('m1', dto, actor);
  });

  it('delegates update (UC-29-10)', async () => {
    const d = build();
    const dto = { suspend: true };
    await d.controller.update('a1', dto as any, actor);
    expect(d.service.updateAssignment).toHaveBeenCalledWith('a1', dto, actor);
  });
});
