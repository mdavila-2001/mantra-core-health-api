import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticUnitSitesController } from './diagnostic-unit-sites.controller';
import { DiagnosticPricingController } from './diagnostic-pricing.controller';
import { DiagnosticEquipmentController } from './diagnostic-equipment.controller';
import { DiagnosticUnitAccreditationsController } from './diagnostic-unit-accreditations.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

describe('DiagnosticUnitSitesController', () => {
  it('delegates updateSite (UC-23-02) and addEquipment (UC-23-09)', async () => {
    const unitsService = { updateSite: mockFn() };
    const equipmentService = { addEquipment: mockFn() };
    const controller = new DiagnosticUnitSitesController(
      unitsService as any,
      equipmentService as any,
    );

    await controller.updateSite('s1', { accessionPrefix: 'AX' }, actor);
    expect(unitsService.updateSite).toHaveBeenCalledWith(
      's1',
      { accessionPrefix: 'AX' },
      actor,
    );

    const eqDto = { equipmentTypeConceptId: 'et1' };
    await controller.addEquipment('s1', eqDto, actor);
    expect(equipmentService.addEquipment).toHaveBeenCalledWith(
      's1',
      eqDto,
      actor,
    );
  });
});

describe('DiagnosticPricingController', () => {
  it('delegates addStudyPrice (UC-23-07), closePrice and retireOffering (UC-23-08)', async () => {
    const pricingService = { addStudyPrice: mockFn(), closePrice: mockFn() };
    const studiesService = { retireOffering: mockFn() };
    const controller = new DiagnosticPricingController(
      pricingService as any,
      studiesService as any,
    );

    const priceDto = { diagnosticStudyOfferingId: 'o1', baseAmount: '10' };
    await controller.addStudyPrice('ps1', priceDto, actor);
    expect(pricingService.addStudyPrice).toHaveBeenCalledWith(
      'ps1',
      priceDto,
      actor,
    );

    await controller.closePrice('pr1', actor);
    expect(pricingService.closePrice).toHaveBeenCalledWith('pr1', actor);

    await controller.retireOffering('o1', actor);
    expect(studiesService.retireOffering).toHaveBeenCalledWith('o1', actor);
  });
});

describe('DiagnosticEquipmentController', () => {
  it('delegates updateEquipment (UC-23-09)', async () => {
    const equipmentService = { updateEquipment: mockFn() };
    const controller = new DiagnosticEquipmentController(
      equipmentService as any,
    );
    const dto = { operationalStatusConceptId: 'os1' };
    await controller.updateEquipment('e1', dto, actor);
    expect(equipmentService.updateEquipment).toHaveBeenCalledWith(
      'e1',
      dto,
      actor,
    );
  });
});

describe('DiagnosticUnitAccreditationsController', () => {
  it('delegates renew (UC-23-11)', async () => {
    const unitsService = { renewAccreditation: mockFn() };
    const controller = new DiagnosticUnitAccreditationsController(
      unitsService as any,
    );
    const dto = { accreditationNumber: 'A-2' };
    await controller.renew('acc1', dto, actor);
    expect(unitsService.renewAccreditation).toHaveBeenCalledWith(
      'acc1',
      dto,
      actor,
    );
  });
});
