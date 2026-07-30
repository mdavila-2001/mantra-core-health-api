import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ChartTemplatesController } from './chart-templates.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

describe('ChartTemplatesController', () => {
  it('delegates assignTemplate (UC-15-12)', async () => {
    const templatesService = { assignTemplate: mockFn() };
    const controller = new ChartTemplatesController(templatesService as any);
    const dto = { practiceId: 'pr1', isDefault: true };
    await controller.assignTemplate('t1', dto, actor);
    expect(templatesService.assignTemplate).toHaveBeenCalledWith(
      't1',
      dto,
      actor,
    );
  });
});
