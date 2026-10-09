import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ChartTemplatesController } from './chart-templates.controller';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';

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

  it('delegates listTemplates with the optional specialtyId filter and the current tenant', async () => {
    const templatesService = { listTemplates: mockFn() };
    const controller = new ChartTemplatesController(templatesService as any);
    await controller.listTemplates('sp1');
    // Sin `runWithTenant` alrededor, `getCurrentTenantId()` resuelve `undefined` —
    // es el mismo caso que un actor sin tenant activo.
    expect(templatesService.listTemplates).toHaveBeenCalledWith(
      'sp1',
      undefined,
    );
  });

  it('delegates getTemplate with the current tenant for the isolation check', async () => {
    const templatesService = { getTemplate: mockFn() };
    const controller = new ChartTemplatesController(templatesService as any);
    await controller.getTemplate('t1');
    // Sin `runWithTenant` alrededor, `getCurrentTenantId()` resuelve `undefined`.
    expect(templatesService.getTemplate).toHaveBeenCalledWith('t1', undefined);
  });

  it('opens the reads to clinical roles and keeps the writes admin-only', () => {
    // Fase 3 del carril de consulta: quien atiende puede leer el esquema; las
    // altas y asignaciones siguen siendo del administrador.
    const roles = (handler: string): unknown =>
      Reflect.getMetadata(
        ROLES_KEY,
        Object.getOwnPropertyDescriptor(
          ChartTemplatesController.prototype,
          handler,
        )!.value,
      );
    const reading = ['CLINICIAN', 'PRACTITIONER', 'SECURITY_ADMIN'];
    expect(roles('listTemplates')).toEqual(reading);
    expect(roles('getTemplate')).toEqual(reading);
    expect(roles('createTemplate')).toEqual(['SECURITY_ADMIN']);
    expect(roles('assignTemplate')).toEqual(['SECURITY_ADMIN']);
  });
});
