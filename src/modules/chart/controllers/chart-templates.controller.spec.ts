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

  it('delegates createTemplate', async () => {
    const templatesService = { createTemplate: mockFn() };
    const controller = new ChartTemplatesController(templatesService as any);
    const dto = {
      specialtyConceptId: 'sp1',
      code: 'C1',
      name: 'N1',
      fields: [],
    };
    await controller.createTemplate(dto as any, actor);
    expect(templatesService.createTemplate).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates listTemplates with the optional specialtyId filter', async () => {
    const templatesService = { listTemplates: mockFn() };
    const controller = new ChartTemplatesController(templatesService as any);
    await controller.listTemplates('sp1');
    expect(templatesService.listTemplates).toHaveBeenCalledWith('sp1');
  });

  it('delegates getTemplate', async () => {
    const templatesService = { getTemplate: mockFn() };
    const controller = new ChartTemplatesController(templatesService as any);
    await controller.getTemplate('t1');
    expect(templatesService.getTemplate).toHaveBeenCalledWith('t1');
  });
});
