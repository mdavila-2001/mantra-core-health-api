import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticUnitsController } from './diagnostic-units.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const unitsService = {
    create: mockFn(),
    addSite: mockFn(),
    verifyAndPublish: mockFn(),
    setSpecialties: mockFn(),
    assignPractitioner: mockFn(),
    addAccreditation: mockFn(),
    reproject: mockFn(),
  };
  const studiesService = { createOffering: mockFn() };
  const pricingService = { createSchedule: mockFn() };
  const readService = { list: mockFn(), getById: mockFn() };
  const controller = new DiagnosticUnitsController(
    unitsService as any,
    studiesService as any,
    pricingService as any,
    readService as any,
  );
  return {
    controller,
    unitsService,
    studiesService,
    pricingService,
    readService,
  };
}

describe('DiagnosticUnitsController', () => {
  it('delegates the directory list', async () => {
    const d = build();
    d.readService.list.mockResolvedValue({ items: [], count: 0 });
    await expect(d.controller.list()).resolves.toEqual({ items: [], count: 0 });
    expect(d.readService.list).toHaveBeenCalledTimes(1);
  });

  it('delegates the tenant-scoped detail', async () => {
    const d = build();
    d.readService.getById.mockResolvedValue({ id: 'u1' });
    await expect(d.controller.getById('u1')).resolves.toEqual({ id: 'u1' });
    expect(d.readService.getById).toHaveBeenCalledWith('u1');
  });

  it('delegates create (UC-23-01)', async () => {
    const d = build();
    const dto = { tenantId: 't1', code: 'DU-1', name: 'Lab' };
    d.unitsService.create.mockResolvedValue({ id: 'u1' });
    await expect(d.controller.create(dto as any, actor)).resolves.toEqual({
      id: 'u1',
    });
    expect(d.unitsService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates addSite (UC-23-02)', async () => {
    const d = build();
    const dto = { practiceSiteId: 'ps1' };
    await d.controller.addSite('u1', dto, actor);
    expect(d.unitsService.addSite).toHaveBeenCalledWith('u1', dto, actor);
  });

  it('delegates verifyAndPublish (UC-23-03)', async () => {
    const d = build();
    await d.controller.verifyAndPublish('u1', actor);
    expect(d.unitsService.verifyAndPublish).toHaveBeenCalledWith('u1', actor);
  });

  it('delegates setSpecialties (UC-23-04)', async () => {
    const d = build();
    const dto = { specialties: [{ specialtyConceptId: 's1' }] };
    await d.controller.setSpecialties('u1', dto, actor);
    expect(d.unitsService.setSpecialties).toHaveBeenCalledWith(
      'u1',
      dto,
      actor,
    );
  });

  it('delegates createOffering (UC-23-05)', async () => {
    const d = build();
    const dto = { studyCode: 'S', studyConceptId: 'c', displayName: 'x' };
    await d.controller.createOffering('u1', dto, actor);
    expect(d.studiesService.createOffering).toHaveBeenCalledWith(
      'u1',
      dto,
      actor,
    );
  });

  it('delegates createSchedule (UC-23-06)', async () => {
    const d = build();
    const dto = { code: 'PS-1' };
    await d.controller.createSchedule('u1', dto, actor);
    expect(d.pricingService.createSchedule).toHaveBeenCalledWith(
      'u1',
      dto,
      actor,
    );
  });

  it('delegates assignPractitioner (UC-23-10)', async () => {
    const d = build();
    const dto = { practitionerRoleAssignmentId: 'pra1' };
    await d.controller.assignPractitioner('u1', dto, actor);
    expect(d.unitsService.assignPractitioner).toHaveBeenCalledWith(
      'u1',
      dto,
      actor,
    );
  });

  it('delegates addAccreditation (UC-23-11)', async () => {
    const d = build();
    const dto = { accreditationConceptId: 'acc1' };
    await d.controller.addAccreditation('u1', dto, actor);
    expect(d.unitsService.addAccreditation).toHaveBeenCalledWith(
      'u1',
      dto,
      actor,
    );
  });

  it('delegates reproject (UC-23-12)', async () => {
    const d = build();
    await d.controller.reproject('u1', actor);
    expect(d.unitsService.reproject).toHaveBeenCalledWith('u1', actor);
  });
});
