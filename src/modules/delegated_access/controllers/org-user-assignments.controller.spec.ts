import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrgUserAssignmentsController } from './org-user-assignments.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const service = { createAssignment: mockFn(), updateAssignment: mockFn() };
  const reads = {
    catalog: mockFn(),
    targets: mockFn(),
    listForMembership: mockFn(),
    get: mockFn(),
  };
  const controller = new OrgUserAssignmentsController(
    service as any,
    reads as any,
  );
  return { controller, service, reads };
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
    await d.controller.update('a1', dto, actor);
    expect(d.service.updateAssignment).toHaveBeenCalledWith('a1', dto, actor);
  });

  it('delegates the selectors and reads to the read service', async () => {
    const d = build();
    const query = { kind: 'site' } as any;
    await d.controller.targets(query, actor);
    expect(d.reads.targets).toHaveBeenCalledWith(query, actor);
    await d.controller.list('m1', actor);
    expect(d.reads.listForMembership).toHaveBeenCalledWith('m1', actor);
    await d.controller.get('a1', actor);
    expect(d.reads.get).toHaveBeenCalledWith('a1', actor);
    d.controller.catalog();
    expect(d.reads.catalog).toHaveBeenCalled();
  });
});
