import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PharmacyController } from './pharmacy.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const pharmaciesService = {
    createPharmacy: mockFn(),
    verifyLicense: mockFn(),
  };
  const sitesService = { createSite: mockFn() };
  const productsService = { publishProduct: mockFn(), retireProduct: mockFn() };
  const pricingService = {
    createPriceList: mockFn(),
    versionPrice: mockFn(),
    closePriceList: mockFn(),
  };
  const integrationService = {
    createConnection: mockFn(),
    mapProduct: mockFn(),
  };
  const catalogService = { projectCatalog: mockFn() };

  const controller = new PharmacyController(
    pharmaciesService as any,
    sitesService as any,
    productsService as any,
    pricingService as any,
    integrationService as any,
    catalogService as any,
  );
  return {
    controller,
    pharmaciesService,
    sitesService,
    productsService,
    pricingService,
    integrationService,
    catalogService,
  };
}

describe('PharmacyController', () => {
  it('delegates createPharmacy (UC-24-01)', async () => {
    const d = build();
    const dto = {
      tenantId: 't1',
      code: 'PH-1',
      legalName: 'X',
      license: { licenseNumber: 'L' },
    };
    d.pharmaciesService.createPharmacy.mockResolvedValue({ id: 'ph1' });
    await expect(
      d.controller.createPharmacy(dto as any, actor),
    ).resolves.toEqual({ id: 'ph1' });
    expect(d.pharmaciesService.createPharmacy).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates verifyLicense (UC-24-03)', async () => {
    const d = build();
    await d.controller.verifyLicense('ph1', 'lic1', { approve: true }, actor);
    expect(d.pharmaciesService.verifyLicense).toHaveBeenCalledWith(
      'ph1',
      'lic1',
      { approve: true },
      actor,
    );
  });

  it('delegates createSite (UC-24-02)', async () => {
    const d = build();
    const dto = { practiceSiteId: 'ps1', code: 'S', name: 'N' };
    await d.controller.createSite('ph1', dto, actor);
    expect(d.sitesService.createSite).toHaveBeenCalledWith('ph1', dto, actor);
  });

  it('delegates publishProduct (UC-24-04)', async () => {
    const d = build();
    const dto = { productCode: 'P-1' };
    await d.controller.publishProduct('ph1', dto, actor);
    expect(d.productsService.publishProduct).toHaveBeenCalledWith(
      'ph1',
      dto,
      actor,
    );
  });

  it('delegates retireProduct (UC-24-09)', async () => {
    const d = build();
    await d.controller.retireProduct('ph1', 'pr1', actor);
    expect(d.productsService.retireProduct).toHaveBeenCalledWith(
      'ph1',
      'pr1',
      actor,
    );
  });

  it('delegates createPriceList (UC-24-05)', async () => {
    const d = build();
    const dto = { code: 'PL', priceListType: 'PUBLIC' };
    await d.controller.createPriceList('ph1', dto as any, actor);
    expect(d.pricingService.createPriceList).toHaveBeenCalledWith(
      'ph1',
      dto,
      actor,
    );
  });

  it('delegates versionPrice (UC-24-06)', async () => {
    const d = build();
    const dto = { pharmacyProductId: 'pr1', unitAmount: 10 };
    await d.controller.versionPrice('ph1', 'pl1', dto, actor);
    expect(d.pricingService.versionPrice).toHaveBeenCalledWith(
      'ph1',
      'pl1',
      dto,
      actor,
    );
  });

  it('delegates closePriceList (UC-24-10)', async () => {
    const d = build();
    await d.controller.closePriceList('ph1', 'pl1', actor);
    expect(d.pricingService.closePriceList).toHaveBeenCalledWith(
      'ph1',
      'pl1',
      actor,
    );
  });

  it('delegates createConnection (UC-24-07)', async () => {
    const d = build();
    const dto = { integrationMode: 'REALTIME' };
    await d.controller.createConnection('ph1', dto as any, actor);
    expect(d.integrationService.createConnection).toHaveBeenCalledWith(
      'ph1',
      dto,
      actor,
    );
  });

  it('delegates mapProduct (UC-24-08)', async () => {
    const d = build();
    const dto = { pharmacyProductId: 'pr1', externalProductCode: 'X' };
    await d.controller.mapProduct('ph1', 'conn1', dto, actor);
    expect(d.integrationService.mapProduct).toHaveBeenCalledWith(
      'ph1',
      'conn1',
      dto,
      actor,
    );
  });

  it('delegates projectCatalog (UC-24-11)', async () => {
    const d = build();
    await d.controller.projectCatalog('ph1', actor);
    expect(d.catalogService.projectCatalog).toHaveBeenCalledWith('ph1', actor);
  });
});
