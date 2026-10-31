import { jest } from '@jest/globals';
import { PreconditionFailedException, runWithTenant } from '../../../../common';
import { ReadMedicationAvailabilityUseCase } from './read-medication-availability.use-case';
import { ReadPharmacyInventoryUseCase } from './read-pharmacy-inventory.use-case';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const IBUPROFENO = 'concept-ibuprofeno';
const AMOXICILINA = 'concept-amoxicilina';
const CURRENCY = {
  id: 'concept-bob',
  code: 'PHARM_CURRENCY_BOB',
  display: 'Boliviano',
};

const PHARMACIES = [
  {
    id: 'ph-andina',
    tenantId: 'tenant-a',
    legalName: 'Andina S.R.L.',
    tradeName: 'Andina',
  },
  {
    id: 'ph-chavez',
    tenantId: 'tenant-a',
    legalName: 'Chavez S.A.',
    tradeName: 'Chavez',
  },
  {
    id: 'ph-sur',
    tenantId: 'tenant-a',
    legalName: 'Sur S.A.',
    tradeName: 'Sur',
  },
];

function product(id: string, pharmacyId: string, conceptId: string) {
  return {
    id,
    pharmacyId,
    productCode: `COD-${id}`,
    genericName: `Genérico ${id}`,
    medicationConceptId: conceptId,
  };
}

/**
 * La red: tres farmacias, cada una con una sede.
 *
 * - Andina publica ibuprofeno (dos marcas) y la tiene en su sede.
 * - Chavez publica ibuprofeno y amoxicilina, y tiene las dos.
 * - Sur publica amoxicilina y la tiene.
 * - Una farmacia oculta publica ibuprofeno: no es de la red visible.
 */
const PRODUCTS = [
  product('ibu-andina-a', 'ph-andina', IBUPROFENO),
  product('ibu-andina-b', 'ph-andina', IBUPROFENO),
  product('ibu-chavez', 'ph-chavez', IBUPROFENO),
  product('amoxi-chavez', 'ph-chavez', AMOXICILINA),
  product('amoxi-sur', 'ph-sur', AMOXICILINA),
  product('ibu-oculta', 'ph-oculta', IBUPROFENO),
];

const SITES = [
  {
    id: 'site-andina',
    pharmacyId: 'ph-andina',
    practiceSiteId: 'ps-1',
    name: 'Andina Centro',
  },
  {
    id: 'site-chavez',
    pharmacyId: 'ph-chavez',
    practiceSiteId: 'ps-2',
    name: 'Chavez Norte',
  },
  {
    id: 'site-sur',
    pharmacyId: 'ph-sur',
    practiceSiteId: 'ps-3',
    name: 'Sur Sopocachi',
  },
];

/** Disponible hoy, por la regla única de existencias por sede. */
const AVAILABLE: {
  siteId: string;
  productId: string;
  availableQuantity: string | null;
}[] = [
  { siteId: 'site-andina', productId: 'ibu-andina-a', availableQuantity: '4' },
  { siteId: 'site-andina', productId: 'ibu-andina-b', availableQuantity: '9' },
  { siteId: 'site-chavez', productId: 'ibu-chavez', availableQuantity: '3' },
  { siteId: 'site-chavez', productId: 'amoxi-chavez', availableQuantity: '2' },
  { siteId: 'site-sur', productId: 'amoxi-sur', availableQuantity: null },
];

function build(available = AVAILABLE) {
  const fork = {};
  const em = { fork: mockFn(() => fork) };
  const inventoryRepo = {
    findActiveLocationsBySites: mockFn().mockResolvedValue([]),
    findStockPositions: mockFn().mockResolvedValue([]),
    // Como el repo real: sólo filas disponibles de las sedes y productos pedidos.
    findSiteProductAvailability: mockFn(
      async (
        _em: unknown,
        siteIds: readonly string[],
        productIds: readonly string[],
      ) =>
        available.filter(
          (row) =>
            siteIds.includes(row.siteId) && productIds.includes(row.productId),
        ),
    ),
  };
  const pharmacyRepo = {
    findVisibleByTenant: mockFn().mockResolvedValue(PHARMACIES),
    findSellableProductsByMedicationConcepts: mockFn(
      async (_em: unknown, conceptIds: readonly string[]) =>
        PRODUCTS.filter((row) => conceptIds.includes(row.medicationConceptId)),
    ),
    findActiveSites: mockFn(
      async (_em: unknown, pharmacyIds: readonly string[]) =>
        SITES.filter((site) => pharmacyIds.includes(site.pharmacyId)),
    ),
    findCurrentPublicPriceLists: mockFn().mockResolvedValue([
      {
        id: 'list-andina',
        pharmacyId: 'ph-andina',
        code: 'PUB-A',
        currencyConceptId: CURRENCY.id,
      },
      {
        id: 'list-chavez',
        pharmacyId: 'ph-chavez',
        code: 'PUB-C',
        currencyConceptId: CURRENCY.id,
      },
      {
        id: 'list-sur',
        pharmacyId: 'ph-sur',
        code: 'PUB-S',
        currencyConceptId: CURRENCY.id,
      },
    ]),
    findCurrentPrices: mockFn().mockResolvedValue([
      // La marca B de Andina es la más barata de las dos.
      {
        pharmacyProductId: 'ibu-andina-a',
        pharmacyPriceListId: 'list-andina',
        unitAmount: '20.00',
      },
      {
        pharmacyProductId: 'ibu-andina-b',
        pharmacyPriceListId: 'list-andina',
        unitAmount: '12.50',
      },
      {
        pharmacyProductId: 'ibu-chavez',
        pharmacyPriceListId: 'list-chavez',
        unitAmount: '15.00',
      },
      {
        pharmacyProductId: 'amoxi-chavez',
        pharmacyPriceListId: 'list-chavez',
        unitAmount: '30.00',
      },
      {
        pharmacyProductId: 'amoxi-sur',
        pharmacyPriceListId: 'list-sur',
        unitAmount: '28.00',
      },
    ]),
    findPracticeSites: mockFn().mockResolvedValue([]),
    findAddresses: mockFn().mockResolvedValue([]),
    findConcepts: mockFn().mockResolvedValue([CURRENCY]),
  };
  const readInventory = new ReadPharmacyInventoryUseCase(
    em as any,
    inventoryRepo as any,
    pharmacyRepo as any,
  );
  const useCase = new ReadMedicationAvailabilityUseCase(
    em as any,
    readInventory,
    pharmacyRepo as any,
  );
  return { useCase, inventoryRepo, pharmacyRepo };
}

describe('ReadMedicationAvailabilityUseCase', () => {
  it('requires the active tenant instead of accepting one from the client', async () => {
    const d = build();
    await expect(
      d.useCase.execute([IBUPROFENO], undefined),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('serves every pharmacy of the network that has the drug, not only one owner', async () => {
    const d = build();

    const result = await runWithTenant('tenant-a', () =>
      d.useCase.execute([IBUPROFENO], undefined),
    );

    expect(result.items.map((item) => item.pharmacyId).sort()).toEqual([
      'ph-andina',
      'ph-chavez',
    ]);
    expect(result.items.every((item) => item.complete)).toBe(true);
    // Una sola consulta de existencias para toda la red, no una por producto.
    expect(d.inventoryRepo.findSiteProductAvailability).toHaveBeenCalledTimes(
      1,
    );
    // La farmacia oculta no entra al cruce.
    const [, , askedProducts] =
      d.inventoryRepo.findSiteProductAvailability.mock.calls[0];
    expect(askedProducts).not.toContain('ibu-oculta');
  });

  it('offers each site its own product for the drug: the cheapest when it has several', async () => {
    const d = build();

    const result = await runWithTenant('tenant-a', () =>
      d.useCase.execute([IBUPROFENO], undefined),
    );

    const andina = result.items.find((item) => item.siteId === 'site-andina')!;
    expect(andina.products).toHaveLength(1);
    expect(andina.products[0]).toMatchObject({
      productId: 'ibu-andina-b',
      medicationConceptId: IBUPROFENO,
      availableQuantity: 9,
    });
    expect(andina.totalAmount).toBe('12.50');
    const chavez = result.items.find((item) => item.siteId === 'site-chavez')!;
    expect(chavez.products.map((p) => p.productId)).toEqual(['ibu-chavez']);
    // El orden por total se mantiene entre completas: la más barata primero.
    expect(result.items.map((item) => item.siteId)).toEqual([
      'site-andina',
      'site-chavez',
    ]);
  });

  it('puts the site with the whole prescription first and names what partial sites miss', async () => {
    const d = build();

    const result = await runWithTenant('tenant-a', () =>
      d.useCase.execute([IBUPROFENO, AMOXICILINA], undefined),
    );

    expect(result.items[0]).toMatchObject({
      siteId: 'site-chavez',
      complete: true,
      availableCount: 2,
      missingMedicationConceptIds: [],
      totalAmount: '45.00',
    });
    expect(result.items[0].products.map((p) => p.medicationConceptId)).toEqual([
      IBUPROFENO,
      AMOXICILINA,
    ]);
    const andina = result.items.find((item) => item.siteId === 'site-andina')!;
    expect(andina).toMatchObject({
      complete: false,
      availableCount: 1,
      missingMedicationConceptIds: [AMOXICILINA],
    });
    const sur = result.items.find((item) => item.siteId === 'site-sur')!;
    expect(sur).toMatchObject({
      complete: false,
      missingMedicationConceptIds: [IBUPROFENO],
    });
    expect(sur.products[0].productId).toBe('amoxi-sur');
    // Ninguna sede ofrece un producto de otra farmacia.
    for (const item of result.items) {
      for (const offered of item.products) {
        expect(
          PRODUCTS.find((p) => p.id === offered.productId)!.pharmacyId,
        ).toBe(item.pharmacyId);
      }
    }
    // La forma por producto no se filtra en la respuesta por medicamento.
    expect(result.items[0]).not.toHaveProperty('missingProductIds');
  });

  it('a site whose pharmacy marked «No lo tengo» there drops out of that drug', async () => {
    const d = build(
      AVAILABLE.filter(
        (row) => row.siteId !== 'site-chavez' || row.productId !== 'ibu-chavez',
      ),
    );

    const result = await runWithTenant('tenant-a', () =>
      d.useCase.execute([IBUPROFENO], undefined),
    );

    expect(result.items.map((item) => item.siteId)).toEqual(['site-andina']);
  });

  it('says which drugs nobody in the network publishes, and serves nothing for them', async () => {
    const d = build();

    const result = await runWithTenant('tenant-a', () =>
      d.useCase.execute(['concept-sin-producto'], undefined),
    );

    expect(result).toEqual({
      requestedMedicationConceptIds: ['concept-sin-producto'],
      unpublishedMedicationConceptIds: ['concept-sin-producto'],
      items: [],
      count: 0,
    });
    expect(d.inventoryRepo.findSiteProductAvailability).not.toHaveBeenCalled();
  });

  it('respects the limit after ordering', async () => {
    const d = build();

    const result = await runWithTenant('tenant-a', () =>
      d.useCase.execute([IBUPROFENO, AMOXICILINA], undefined, 1),
    );

    expect(result.count).toBe(1);
    expect(result.items[0].siteId).toBe('site-chavez');
    expect(result.unpublishedMedicationConceptIds).toEqual([]);
  });
});
