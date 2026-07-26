import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import {
  PracticesController,
  SitesController,
  AccreditationsController,
  RoleAssignmentsController,
  InventoryItemsController,
} from './index';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

describe('PracticesController', () => {
  function build() {
    const sitesService = { createPractice: mockFn(), createSite: mockFn(), decommissionSite: mockFn() };
    const accreditationsService = { create: mockFn() };
    const structureService = { publishHealthcareService: mockFn() };
    const settingsService = { upsert: mockFn() };
    const workforceService = { assignRole: mockFn() };
    const inventoryService = { createItem: mockFn() };
    const controller = new PracticesController(
      sitesService as any,
      accreditationsService as any,
      structureService as any,
      settingsService as any,
      workforceService as any,
      inventoryService as any,
    );
    return { controller, sitesService, accreditationsService, structureService, settingsService, workforceService, inventoryService };
  }

  it('delegates createPractice (bootstrap)', async () => {
    const d = build();
    const dto = { tenantId: 't1', code: 'P', name: 'N' };
    await d.controller.createPractice(dto as any, actor);
    expect(d.sitesService.createPractice).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates createSite (UC-14-01)', async () => {
    const d = build();
    const dto = { code: 'S', name: 'N' };
    await d.controller.createSite('p1', dto as any, actor);
    expect(d.sitesService.createSite).toHaveBeenCalledWith('p1', dto, actor);
  });

  it('delegates decommissionSite (UC-14-12)', async () => {
    const d = build();
    await d.controller.decommissionSite('p1', 's1', actor);
    expect(d.sitesService.decommissionSite).toHaveBeenCalledWith('p1', 's1', actor);
  });

  it('delegates createAccreditation (UC-14-02)', async () => {
    const d = build();
    const dto = { accreditationNumber: 'A' };
    await d.controller.createAccreditation('p1', dto as any, actor);
    expect(d.accreditationsService.create).toHaveBeenCalledWith('p1', dto, actor);
  });

  it('delegates publishHealthcareService (UC-14-06)', async () => {
    const d = build();
    const dto = {};
    await d.controller.publishHealthcareService('p1', dto as any, actor);
    expect(d.structureService.publishHealthcareService).toHaveBeenCalledWith('p1', dto, actor);
  });

  it('delegates upsertSetting (UC-14-07)', async () => {
    const d = build();
    const dto = { valueJson: { a: 1 } };
    await d.controller.upsertSetting('p1', 'k', dto as any, actor);
    expect(d.settingsService.upsert).toHaveBeenCalledWith('p1', 'k', dto, actor);
  });

  it('delegates assignRole (UC-14-08)', async () => {
    const d = build();
    const dto = { practitionerProfileId: 'hp1' };
    await d.controller.assignRole('p1', dto as any, actor);
    expect(d.workforceService.assignRole).toHaveBeenCalledWith('p1', dto, actor);
  });

  it('delegates createInventoryItem (UC-14-10)', async () => {
    const d = build();
    const dto = { name: 'Gauze' };
    await d.controller.createInventoryItem('p1', dto as any, actor);
    expect(d.inventoryService.createItem).toHaveBeenCalledWith('p1', dto, actor);
  });
});

describe('SitesController', () => {
  it('delegates clinical unit and care space (UC-14-04/05)', async () => {
    const structureService = { createClinicalUnit: mockFn(), createCareSpace: mockFn() };
    const controller = new SitesController(structureService as any);
    await controller.createClinicalUnit('s1', { code: 'U', name: 'N' } as any, actor);
    expect(structureService.createClinicalUnit).toHaveBeenCalledWith('s1', { code: 'U', name: 'N' }, actor);
    await controller.createCareSpace('s1', { code: 'C', name: 'N' } as any, actor);
    expect(structureService.createCareSpace).toHaveBeenCalledWith('s1', { code: 'C', name: 'N' }, actor);
  });
});

describe('AccreditationsController', () => {
  it('delegates verify (UC-14-03)', async () => {
    const accreditationsService = { verify: mockFn() };
    const controller = new AccreditationsController(accreditationsService as any);
    await controller.verify('a1', { decision: 'VERIFIED' } as any, actor);
    expect(accreditationsService.verify).toHaveBeenCalledWith('a1', { decision: 'VERIFIED' }, actor);
  });
});

describe('RoleAssignmentsController', () => {
  it('delegates attachSupport (UC-14-09)', async () => {
    const workforceService = { attachSupport: mockFn() };
    const controller = new RoleAssignmentsController(workforceService as any);
    await controller.attachSupport('r1', { supportProfileId: 'sp1' } as any, actor);
    expect(workforceService.attachSupport).toHaveBeenCalledWith('r1', { supportProfileId: 'sp1' }, actor);
  });
});

describe('InventoryItemsController', () => {
  it('delegates recordMovement (UC-14-11)', async () => {
    const inventoryService = { recordMovement: mockFn() };
    const controller = new InventoryItemsController(inventoryService as any);
    await controller.recordMovement('it1', { direction: 'IN', quantity: 1 } as any, actor);
    expect(inventoryService.recordMovement).toHaveBeenCalledWith('it1', { direction: 'IN', quantity: 1 }, actor);
  });
});
