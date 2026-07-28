import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrgextHospitalsController } from './orgext-hospitals.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const hospitalsService = {
    specialize: mockFn(),
    activate: mockFn(),
    addServiceLine: mockFn(),
    retireServiceLine: mockFn(),
  };
  const controller = new OrgextHospitalsController(hospitalsService as any);
  return { controller, hospitalsService };
}

describe('OrgextHospitalsController', () => {
  it('delegates specialize (UC-22-01)', async () => {
    const d = build();
    const dto = { tenantId: 't1', practiceId: 'p1' };
    d.hospitalsService.specialize.mockResolvedValue({ id: 'h1' });
    await expect(d.controller.specialize(dto as any, actor)).resolves.toEqual({
      id: 'h1',
    });
    expect(d.hospitalsService.specialize).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates activate (UC-22-02)', async () => {
    const d = build();
    const dto = { publicProfileId: 'pp1' };
    await d.controller.activate('h1', dto, actor);
    expect(d.hospitalsService.activate).toHaveBeenCalledWith('h1', dto, actor);
  });

  it('delegates addServiceLine (UC-22-03)', async () => {
    const d = build();
    const dto = {};
    await d.controller.addServiceLine('h1', dto, actor);
    expect(d.hospitalsService.addServiceLine).toHaveBeenCalledWith(
      'h1',
      dto,
      actor,
    );
  });

  it('delegates retireServiceLine (UC-22-04)', async () => {
    const d = build();
    await d.controller.retireServiceLine('h1', 'l1', actor);
    expect(d.hospitalsService.retireServiceLine).toHaveBeenCalledWith(
      'h1',
      'l1',
      actor,
    );
  });
});
