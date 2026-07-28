import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CommunityGroupsController } from './community-groups.controller';

const actor = { id: 'u1', roles: [] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const service = { createGroup: mockFn(), joinGroup: mockFn() };
  return { controller: new CommunityGroupsController(service as any), service };
}

describe('CommunityGroupsController', () => {
  it('delegates createGroup', async () => {
    const d = build();
    const dto = { slug: 's', name: 'N' };
    await d.controller.createGroup(dto, actor);
    expect(d.service.createGroup).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates joinGroup (UC-19-13)', async () => {
    const d = build();
    const dto = { memberProfileId: 'p1' };
    await d.controller.joinGroup('g1', dto, actor);
    expect(d.service.joinGroup).toHaveBeenCalledWith('g1', dto, actor);
  });
});
