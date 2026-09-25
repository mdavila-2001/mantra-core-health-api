import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { PharmacyReadService } from './pharmacy-read.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TIPO = {
  id: 'concept-retail',
  code: 'PHARM_TYPE_RETAIL',
  display: 'Retail pharmacy',
};
const MEDICATION = {
  id: 'concept-amoxi',
  code: 'J01CA04',
  display: 'Amoxicilina',
};
const CURRENCY = {
  id: 'concept-usd',
  code: 'PHARM_CURRENCY_USD',
  display: 'US Dollar',
};

function pharmacy(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    tenantId: 'tenant-a',
    code: `PH-${id}`,
    legalName: `Farmacia ${id} S.R.L.`,
    tradeName: `Farmacia ${id}`,
    pharmacyTypeConceptId: TIPO.id,
    ...extra,
  } as any;
}

function build() {
  const fork = {};
  const em = { fork: mockFn(() => fork) };
  const repo = {
    findVisibleByTenant: mockFn().mockResolvedValue([]),
    findVisibleById: mockFn().mockResolvedValue(null),
    findActiveSites: mockFn().mockResolvedValue([]),
    findActiveSiteById: mockFn().mockResolvedValue(null),
    findActiveProducts: mockFn().mockResolvedValue([]),
    findActiveProductOwners: mockFn().mockResolvedValue([]),
    findActiveProductsByIds: mockFn().mockResolvedValue([]),
    findCurrentPublicPriceLists: mockFn().mockResolvedValue([]),
    findCurrentPrices: mockFn().mockResolvedValue([]),
    findPracticeSites: mockFn().mockResolvedValue([]),
    findAddresses: mockFn().mockResolvedValue([]),
    findConcepts: mockFn().mockResolvedValue([]),
  };
  const service = new PharmacyReadService(em as any, repo as any);
  return { service, repo, fork };
}

describe('PharmacyReadService', () => {
  it('requires the active tenant instead of accepting one from the client', async () => {
    const d = build();
    await expect(d.service.listPharmacies()).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
  });

  it('lists published pharmacies with readable names and counts', async () => {
    const d = build();
    d.repo.findVisibleByTenant.mockResolvedValue([
      pharmacy('1'),
      pharmacy('2', { tradeName: undefined }),
    ]);
    d.repo.findActiveSites.mockResolvedValue([
      { id: 'site-1', pharmacyId: '1', homeDeliveryAvailable: true },
      { id: 'site-2', pharmacyId: '1', pickupAvailable: true },
    ]);
    d.repo.findActiveProductOwners.mockResolvedValue([
      { id: 'prod-1', pharmacyId: '1' },
      { id: 'prod-2', pharmacyId: '1' },
      { id: 'prod-3', pharmacyId: '2' },
    ]);
    d.repo.findConcepts.mockResolvedValue([TIPO]);

    const result = await runWithTenant('tenant-a', () =>
      d.service.listPharmacies(),
    );

    expect(d.repo.findVisibleByTenant).toHaveBeenCalledWith(d.fork, 'tenant-a');
    expect(result.count).toBe(2);
    // El nombre comercial manda; sin él, la razón social.
    expect(result.items[0].name).toBe('Farmacia 1');
    expect(result.items[1].name).toBe('Farmacia 2 S.R.L.');
    expect(result.items[0].type).toEqual({
      code: TIPO.code,
      display: TIPO.display,
    });
    expect(result.items.map((item) => item.siteCount)).toEqual([2, 0]);
    expect(result.items.map((item) => item.productCount)).toEqual([2, 1]);
    expect(result.items[0].homeDeliveryAvailable).toBe(true);
    expect(result.items[0].pickupAvailable).toBe(true);
  });

  it('returns an empty directory without relation queries', async () => {
    const d = build();
    const result = await runWithTenant('tenant-a', () =>
      d.service.listPharmacies(),
    );
    expect(result).toEqual({ items: [], count: 0 });
    expect(d.repo.findActiveSites).not.toHaveBeenCalled();
  });

  it('hides a pharmacy of another tenant behind the same 404', async () => {
    const d = build();
    // El repo ya acota por tenant: para el ajeno devuelve null, igual que para
    // el inexistente.
    await expect(
      runWithTenant('tenant-a', () => d.service.getPharmacy('ajena')),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('serves the pharmacy profile with sites, address text and coordinates', async () => {
    const d = build();
    d.repo.findVisibleById.mockResolvedValue(pharmacy('1'));
    d.repo.findActiveSites.mockResolvedValue([
      {
        id: 'site-1',
        pharmacyId: '1',
        practiceSiteId: 'ps-1',
        code: 'S1',
        name: 'Sede Centro',
        homeDeliveryAvailable: true,
      },
      {
        id: 'site-2',
        pharmacyId: '1',
        practiceSiteId: 'ps-2',
        code: 'S2',
        name: 'Sede Sur',
      },
    ]);
    d.repo.findPracticeSites.mockResolvedValue([
      { id: 'ps-1', addressId: 'addr-1' },
      { id: 'ps-2' },
    ]);
    d.repo.findAddresses.mockResolvedValue([
      {
        id: 'addr-1',
        lines: 'Av. 6 de Agosto 123',
        city: 'La Paz',
        latitude: '-16.5000',
        longitude: '-68.1500',
      },
    ]);
    d.repo.findConcepts.mockResolvedValue([TIPO]);

    const result = await runWithTenant('tenant-a', () =>
      d.service.getPharmacy('1'),
    );

    expect(result.sites).toHaveLength(2);
    expect(result.sites[0].addressText).toBe('Av. 6 de Agosto 123, La Paz');
    expect(result.sites[0].latitude).toBeCloseTo(-16.5);
    expect(result.sites[0].longitude).toBeCloseTo(-68.15);
    // La sede sin dirección lo dice con null, no con un hueco inventado.
    expect(result.sites[1].addressText).toBeNull();
    expect(result.sites[1].latitude).toBeNull();
  });

  it('searches products declaring the cut and resolving the vademecum', async () => {
    const d = build();
    d.repo.findVisibleByTenant.mockResolvedValue([pharmacy('1')]);
    d.repo.findActiveProducts.mockResolvedValue([
      {
        id: 'prod-1',
        pharmacyId: '1',
        productCode: 'AMOX-500',
        brandName: 'Amoxil',
        genericName: 'Amoxicilina',
        strengthText: '500 mg',
        packageSizeText: 'Caja x 21',
        medicationConceptId: MEDICATION.id,
        requiresPrescription: true,
      },
      {
        id: 'prod-2',
        pharmacyId: '1',
        productCode: 'IBU-400',
        genericName: 'Ibuprofeno',
      },
    ]);
    d.repo.findConcepts.mockResolvedValue([MEDICATION]);

    const result = await runWithTenant('tenant-a', () =>
      d.service.searchProducts({ search: 'amox' }, 1),
    );

    // Se pide una fila de más para declarar el recorte.
    expect(d.repo.findActiveProducts).toHaveBeenCalledWith(
      d.fork,
      ['1'],
      { search: 'amox' },
      2,
    );
    expect(result.items).toHaveLength(1);
    expect(result.truncated).toBe(true);
    expect(result.items[0].pharmacyName).toBe('Farmacia 1');
    expect(result.items[0].medication).toEqual({
      code: 'J01CA04',
      display: 'Amoxicilina',
    });
  });

  it('search over a tenant without published pharmacies returns empty', async () => {
    const d = build();
    const result = await runWithTenant('tenant-a', () =>
      d.service.searchProducts({}, 50),
    );
    expect(result).toEqual({ items: [], limit: 50, truncated: false });
    expect(d.repo.findActiveProducts).not.toHaveBeenCalled();
  });

  it('hides prices of a site whose pharmacy is not published, with the same 404', async () => {
    const d = build();
    d.repo.findActiveSiteById.mockResolvedValue({
      id: 'site-1',
      pharmacyId: 'ph-oculta',
    });
    d.repo.findVisibleById.mockResolvedValue(null);
    await expect(
      runWithTenant('tenant-a', () => d.service.getSitePrices('site-1')),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('serves current public prices of the site, skipping other-site lists and retired products', async () => {
    const d = build();
    d.repo.findActiveSiteById.mockResolvedValue({
      id: 'site-1',
      pharmacyId: '1',
      name: 'Sede Centro',
    });
    d.repo.findVisibleById.mockResolvedValue(pharmacy('1'));
    d.repo.findCurrentPublicPriceLists.mockResolvedValue([
      {
        id: 'list-pharm',
        pharmacyId: '1',
        code: 'PUBLICA',
        currencyConceptId: CURRENCY.id,
      },
      {
        id: 'list-site',
        pharmacyId: '1',
        pharmacySiteId: 'site-1',
        code: 'SEDE',
      },
      // Lista de OTRA sede: no aplica acá.
      {
        id: 'list-otra',
        pharmacyId: '1',
        pharmacySiteId: 'site-9',
        code: 'OTRA',
      },
      // Lista ligada a aseguradora: no es precio de mostrador, aunque el
      // repo mockeado la deje pasar marcada como pública.
      {
        id: 'list-aseg',
        pharmacyId: '1',
        code: 'ASEGURADORA',
        insurerTenantId: 'tenant-aseguradora',
      },
    ]);
    d.repo.findCurrentPrices.mockResolvedValue([
      {
        pharmacyPriceListId: 'list-pharm',
        pharmacyProductId: 'prod-1',
        unitAmount: '17.50',
        patientAmount: '15.00',
        effectiveFrom: new Date('2026-08-01T00:00:00.000Z'),
      },
      {
        pharmacyPriceListId: 'list-pharm',
        // Producto retirado: su definición ya no vuelve del repo de activos.
        pharmacyProductId: 'prod-retirado',
        unitAmount: '9.99',
        effectiveFrom: new Date('2026-08-01T00:00:00.000Z'),
      },
    ]);
    d.repo.findActiveProductsByIds.mockResolvedValue([
      {
        id: 'prod-1',
        productCode: 'AMOX-500',
        genericName: 'Amoxicilina',
        medicationConceptId: MEDICATION.id,
      },
    ]);
    d.repo.findConcepts.mockResolvedValue([MEDICATION, CURRENCY]);

    const result = await runWithTenant('tenant-a', () =>
      d.service.getSitePrices('site-1'),
    );

    // Las listas que se consultan son sólo las que aplican a la sede — y
    // nunca una ligada a aseguradora.
    const listIds = d.repo.findCurrentPrices.mock.calls[0][1];
    expect(listIds).toEqual(['list-pharm', 'list-site']);
    expect(result.count).toBe(1);
    expect(result.items[0].productId).toBe('prod-1');
    expect(result.items[0].unitAmount).toBe('17.50');
    expect(result.items[0].patientAmount).toBe('15.00');
    expect(result.items[0].currency).toEqual({
      code: CURRENCY.code,
      display: CURRENCY.display,
    });
    expect(result.pharmacyName).toBe('Farmacia 1');
  });

  it('keeps a normal public list visible and excludes an insurer-linked one marked public', async () => {
    const d = build();
    d.repo.findActiveSiteById.mockResolvedValue({
      id: 'site-1',
      pharmacyId: '1',
      name: 'Sede Centro',
    });
    d.repo.findVisibleById.mockResolvedValue(pharmacy('1'));
    d.repo.findCurrentPublicPriceLists.mockResolvedValue([
      {
        id: 'list-publica',
        pharmacyId: '1',
        code: 'PUBLICA',
        currencyConceptId: CURRENCY.id,
      },
      // Marcada pública Y ligada a aseguradora: un acuerdo entre partes no
      // se vuelve precio de mostrador por un flag mal puesto.
      {
        id: 'list-aseg',
        pharmacyId: '1',
        code: 'ASEGURADORA',
        insurerTenantId: 'tenant-aseguradora',
        currencyConceptId: CURRENCY.id,
      },
    ]);
    d.repo.findCurrentPrices.mockResolvedValue([
      {
        pharmacyPriceListId: 'list-publica',
        pharmacyProductId: 'prod-1',
        unitAmount: '10.00',
        effectiveFrom: new Date('2026-08-01T00:00:00.000Z'),
      },
    ]);
    d.repo.findActiveProductsByIds.mockResolvedValue([
      { id: 'prod-1', productCode: 'AMOX-500', genericName: 'Amoxicilina' },
    ]);
    d.repo.findConcepts.mockResolvedValue([CURRENCY]);

    const result = await runWithTenant('tenant-a', () =>
      d.service.getSitePrices('site-1'),
    );

    // A la consulta de precios sólo entra la pública normal.
    expect(d.repo.findCurrentPrices.mock.calls[0][1]).toEqual(['list-publica']);
    expect(result.count).toBe(1);
    expect(result.items[0].priceListCode).toBe('PUBLICA');
  });

  describe('listSites (carril A, H4)', () => {
    it('computes distanceKm and sorts sites by proximity when an origin is given', async () => {
      const d = build();
      d.repo.findVisibleByTenant.mockResolvedValue([
        pharmacy('1', { tradeName: 'Farmacia Cerca' }),
        pharmacy('2', { tradeName: 'Farmacia Lejos' }),
      ]);
      d.repo.findActiveSites.mockResolvedValue([
        { id: 'site-1', pharmacyId: '1', practiceSiteId: 'ps-1', name: 'Sede Cerca' },
        { id: 'site-2', pharmacyId: '2', practiceSiteId: 'ps-2', name: 'Sede Lejos' },
      ]);
      d.repo.findActiveProductOwners.mockResolvedValue([]);
      d.repo.findPracticeSites.mockResolvedValue([
        { id: 'ps-1', addressId: 'addr-1' },
        { id: 'ps-2', addressId: 'addr-2' },
      ]);
      d.repo.findAddresses.mockResolvedValue([
        { id: 'addr-1', latitude: '-17.7833', longitude: '-63.1821' },
        { id: 'addr-2', latitude: '-18.5000', longitude: '-64.0000' },
      ]);

      const result = await runWithTenant('tenant-a', () =>
        d.service.listSites({ origin: { lat: -17.78, lng: -63.18 }, limit: 50 }),
      );

      expect(result.items.map((item) => item.siteId)).toEqual(['site-1', 'site-2']);
      expect(result.items[0].distanceKm).toBeLessThan(result.items[1].distanceKm!);
      expect(result.items[0].distanceKm).not.toBeNull();
    });

    it('serves distanceKm null and sorts by pharmacy name when there is no origin', async () => {
      const d = build();
      d.repo.findVisibleByTenant.mockResolvedValue([
        pharmacy('1', { tradeName: 'Zeta Farmacia' }),
        pharmacy('2', { tradeName: 'Alfa Farmacia' }),
      ]);
      d.repo.findActiveSites.mockResolvedValue([
        { id: 'site-1', pharmacyId: '1', practiceSiteId: 'ps-1', name: 'Sede Z' },
        { id: 'site-2', pharmacyId: '2', practiceSiteId: 'ps-2', name: 'Sede A' },
      ]);
      d.repo.findActiveProductOwners.mockResolvedValue([]);

      const result = await runWithTenant('tenant-a', () =>
        d.service.listSites({ limit: 50 }),
      );

      expect(result.items.every((item) => item.distanceKm === null)).toBe(true);
      expect(result.items.map((item) => item.pharmacyName)).toEqual([
        'Alfa Farmacia',
        'Zeta Farmacia',
      ]);
    });

    it('serves distanceKm null for a site without a resolved address', async () => {
      const d = build();
      d.repo.findVisibleByTenant.mockResolvedValue([pharmacy('1')]);
      d.repo.findActiveSites.mockResolvedValue([
        { id: 'site-1', pharmacyId: '1', practiceSiteId: 'ps-sin-direccion', name: 'Sede sin dirección' },
      ]);
      d.repo.findActiveProductOwners.mockResolvedValue([]);
      // El repo no encuentra un practice_site para 'ps-sin-direccion': la
      // sede queda sin dirección resuelta.
      d.repo.findPracticeSites.mockResolvedValue([]);

      const result = await runWithTenant('tenant-a', () =>
        d.service.listSites({ origin: { lat: -17.78, lng: -63.18 }, limit: 50 }),
      );

      expect(result.items[0].distanceKm).toBeNull();
      expect(result.items[0].latitude).toBeNull();
    });

    it('filters by pharmacy name or site name', async () => {
      const d = build();
      d.repo.findVisibleByTenant.mockResolvedValue([
        pharmacy('1', { tradeName: 'Farmacia Andina' }),
        pharmacy('2', { tradeName: 'Farmacia del Sur' }),
      ]);
      d.repo.findActiveSites.mockResolvedValue([
        { id: 'site-1', pharmacyId: '1', practiceSiteId: 'ps-1', name: 'Sucursal Centro' },
        { id: 'site-2', pharmacyId: '2', practiceSiteId: 'ps-2', name: 'Sucursal Plan Tres Mil' },
      ]);
      d.repo.findActiveProductOwners.mockResolvedValue([]);

      const result = await runWithTenant('tenant-a', () =>
        d.service.listSites({ search: 'andina', limit: 50 }),
      );

      expect(result.items.map((item) => item.siteId)).toEqual(['site-1']);
    });

    it('counts products by pharmacy, not by site', async () => {
      const d = build();
      d.repo.findVisibleByTenant.mockResolvedValue([pharmacy('1')]);
      d.repo.findActiveSites.mockResolvedValue([
        { id: 'site-1', pharmacyId: '1', practiceSiteId: 'ps-1', name: 'Sede Centro' },
      ]);
      d.repo.findActiveProductOwners.mockResolvedValue([
        { id: 'prod-1', pharmacyId: '1' },
        { id: 'prod-2', pharmacyId: '1' },
      ]);

      const result = await runWithTenant('tenant-a', () =>
        d.service.listSites({ limit: 50 }),
      );

      expect(result.items[0].productCount).toBe(2);
    });
  });

  describe('searchProducts con pharmacyId (carril A, H5)', () => {
    it('acota a esa sola farmacia cuando pharmacyId es visible', async () => {
      const d = build();
      d.repo.findVisibleByTenant.mockResolvedValue([pharmacy('1'), pharmacy('2')]);

      await runWithTenant('tenant-a', () =>
        d.service.searchProducts({ pharmacyId: '2' }, 50),
      );

      expect(d.repo.findActiveProducts.mock.calls[0][1]).toEqual(['2']);
    });

    it('devuelve vacío sin consultar productos cuando pharmacyId no es visible', async () => {
      const d = build();
      d.repo.findVisibleByTenant.mockResolvedValue([pharmacy('1')]);

      const result = await runWithTenant('tenant-a', () =>
        d.service.searchProducts({ pharmacyId: 'ajena' }, 50),
      );

      expect(result).toEqual({ items: [], limit: 50, truncated: false });
      expect(d.repo.findActiveProducts).not.toHaveBeenCalled();
    });

    it('sin pharmacyId sigue consultando todas las farmacias visibles, como antes', async () => {
      const d = build();
      d.repo.findVisibleByTenant.mockResolvedValue([pharmacy('1'), pharmacy('2')]);

      await runWithTenant('tenant-a', () => d.service.searchProducts({}, 50));

      expect(d.repo.findActiveProducts.mock.calls[0][1]).toEqual(['1', '2']);
    });
  });

  describe('getSitePrices sirve requiresPrescription (carril A, H4)', () => {
    it('mapea requiresPrescription desde el producto, null si no está declarado', async () => {
      const d = build();
      d.repo.findActiveSiteById.mockResolvedValue({
        id: 'site-1',
        pharmacyId: '1',
        name: 'Sede Centro',
      });
      d.repo.findVisibleById.mockResolvedValue(pharmacy('1'));
      d.repo.findCurrentPublicPriceLists.mockResolvedValue([
        { id: 'list-1', pharmacyId: '1', code: 'PUBLICA' },
      ]);
      d.repo.findCurrentPrices.mockResolvedValue([
        {
          pharmacyPriceListId: 'list-1',
          pharmacyProductId: 'prod-con-receta',
          unitAmount: '17.50',
          effectiveFrom: new Date('2026-08-01T00:00:00.000Z'),
        },
        {
          pharmacyPriceListId: 'list-1',
          pharmacyProductId: 'prod-sin-declarar',
          unitAmount: '9.00',
          effectiveFrom: new Date('2026-08-01T00:00:00.000Z'),
        },
      ]);
      d.repo.findActiveProductsByIds.mockResolvedValue([
        { id: 'prod-con-receta', productCode: 'AMX-500', requiresPrescription: true },
        { id: 'prod-sin-declarar', productCode: 'IBU-400' },
      ]);

      const result = await runWithTenant('tenant-a', () =>
        d.service.getSitePrices('site-1'),
      );

      expect(
        result.items.find((item) => item.productId === 'prod-con-receta')
          ?.requiresPrescription,
      ).toBe(true);
      expect(
        result.items.find((item) => item.productId === 'prod-sin-declarar')
          ?.requiresPrescription,
      ).toBeNull();
    });
  });
});
