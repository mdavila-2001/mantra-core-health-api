import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import {
  haversineKm,
  PharmacyInventoryReadService,
} from './pharmacy-inventory-read.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

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

const FARMACIA = {
  id: 'ph-1',
  tenantId: 'tenant-a',
  code: 'PH-1',
  legalName: 'Farmacia Andina S.R.L.',
  tradeName: 'Farmacia Andina',
} as any;

/** Un producto activo de la farmacia publicada. */
function producto(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    pharmacyId: 'ph-1',
    productCode: `COD-${id}`,
    genericName: `Genérico ${id}`,
    medicationConceptId: MEDICATION.id,
    ...extra,
  } as any;
}

function build() {
  const fork = {};
  const em = { fork: mockFn(() => fork) };
  const inventoryRepo = {
    findActiveLocationsBySites: mockFn().mockResolvedValue([]),
    findStockPositions: mockFn().mockResolvedValue([]),
  };
  const pharmacyRepo = {
    findVisibleByTenant: mockFn().mockResolvedValue([]),
    findVisibleById: mockFn().mockResolvedValue(null),
    findActiveSites: mockFn().mockResolvedValue([]),
    findActiveSiteById: mockFn().mockResolvedValue(null),
    findActiveProductsByIds: mockFn().mockResolvedValue([]),
    findCurrentPublicPriceLists: mockFn().mockResolvedValue([]),
    findCurrentPrices: mockFn().mockResolvedValue([]),
    findPracticeSites: mockFn().mockResolvedValue([]),
    findAddresses: mockFn().mockResolvedValue([]),
    findConcepts: mockFn().mockResolvedValue([]),
  };
  const service = new PharmacyInventoryReadService(
    em as any,
    inventoryRepo as any,
    pharmacyRepo as any,
  );
  return { service, inventoryRepo, pharmacyRepo, fork };
}

describe('PharmacyInventoryReadService', () => {
  describe('getSiteStock', () => {
    it('hides the site of a non-published pharmacy behind the same 404', async () => {
      const d = build();
      d.pharmacyRepo.findActiveSiteById.mockResolvedValue({
        id: 'site-1',
        pharmacyId: 'ph-oculta',
      });
      d.pharmacyRepo.findVisibleById.mockResolvedValue(null);
      await expect(
        runWithTenant('tenant-a', () => d.service.getSiteStock('site-1')),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('aggregates positions per product across locations, counting distinct locations', async () => {
      const d = build();
      d.pharmacyRepo.findActiveSiteById.mockResolvedValue({
        id: 'site-1',
        pharmacyId: 'ph-1',
        name: 'Sede Centro',
      });
      d.pharmacyRepo.findVisibleById.mockResolvedValue(FARMACIA);
      d.inventoryRepo.findActiveLocationsBySites.mockResolvedValue([
        { id: 'loc-1', pharmacySiteId: 'site-1' },
        { id: 'loc-2', pharmacySiteId: 'site-1' },
      ]);
      d.inventoryRepo.findStockPositions.mockResolvedValue([
        // Dos lotes en la MISMA ubicación: una sola ubicación distinta.
        {
          inventoryLocationId: 'loc-1',
          pharmacyProductId: 'prod-1',
          onHandQuantity: '10',
          reservedQuantity: '2',
          quarantineQuantity: '0',
          availableQuantity: '8',
        },
        {
          inventoryLocationId: 'loc-1',
          pharmacyProductId: 'prod-1',
          onHandQuantity: '5',
          reservedQuantity: '0',
          quarantineQuantity: '1',
          availableQuantity: '4',
        },
        {
          inventoryLocationId: 'loc-2',
          pharmacyProductId: 'prod-1',
          onHandQuantity: '3',
          reservedQuantity: '0',
          quarantineQuantity: '0',
          availableQuantity: '3',
        },
      ]);
      d.pharmacyRepo.findActiveProductsByIds.mockResolvedValue([
        producto('prod-1'),
      ]);
      d.pharmacyRepo.findConcepts.mockResolvedValue([MEDICATION]);

      const result = await runWithTenant('tenant-a', () =>
        d.service.getSiteStock('site-1'),
      );

      expect(result.count).toBe(1);
      const item = result.items[0];
      expect(item.onHandQuantity).toBe(18);
      expect(item.reservedQuantity).toBe(2);
      // La cuarentena es estado interno del ledger: no sale al directorio.
      expect(item).not.toHaveProperty('quarantineQuantity');
      // Lo vendible es la columna `available` del ledger, agregada.
      expect(item.availableQuantity).toBe(15);
      expect(item.locationCount).toBe(2);
      expect(item.medication).toEqual({
        code: MEDICATION.code,
        display: MEDICATION.display,
      });
    });
  });

  describe('availability', () => {
    it('requires the active tenant instead of accepting one from the client', async () => {
      const d = build();
      await expect(
        d.service.availability(['prod-1'], undefined),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    /** Dos sedes con stock y direcciones; la más lejana tiene TODO. */
    function conDosSedes(d: ReturnType<typeof build>) {
      d.pharmacyRepo.findVisibleByTenant.mockResolvedValue([FARMACIA]);
      // Como el repo real: sólo devuelve los ids pedidos que existen activos.
      d.pharmacyRepo.findActiveProductsByIds.mockImplementation(
        async (_em: unknown, ids: readonly string[]) =>
          [producto('prod-1'), producto('prod-2')].filter((row) =>
            ids.includes(row.id),
          ),
      );
      d.pharmacyRepo.findActiveSites.mockResolvedValue([
        {
          id: 'site-cerca',
          pharmacyId: 'ph-1',
          practiceSiteId: 'ps-1',
          name: 'Sede Cerca',
        },
        {
          id: 'site-lejos',
          pharmacyId: 'ph-1',
          practiceSiteId: 'ps-2',
          name: 'Sede Lejos',
        },
      ]);
      d.inventoryRepo.findActiveLocationsBySites.mockResolvedValue([
        { id: 'loc-cerca', pharmacySiteId: 'site-cerca' },
        { id: 'loc-lejos', pharmacySiteId: 'site-lejos' },
      ]);
      d.inventoryRepo.findStockPositions.mockResolvedValue([
        // La cercana sólo tiene un producto…
        {
          inventoryLocationId: 'loc-cerca',
          pharmacyProductId: 'prod-1',
          onHandQuantity: '5',
          reservedQuantity: '0',
          quarantineQuantity: '0',
          availableQuantity: '5',
        },
        // …la lejana tiene los dos.
        {
          inventoryLocationId: 'loc-lejos',
          pharmacyProductId: 'prod-1',
          onHandQuantity: '5',
          reservedQuantity: '0',
          quarantineQuantity: '0',
          availableQuantity: '5',
        },
        {
          inventoryLocationId: 'loc-lejos',
          pharmacyProductId: 'prod-2',
          onHandQuantity: '2',
          reservedQuantity: '0',
          quarantineQuantity: '0',
          availableQuantity: '2',
        },
      ]);
      d.pharmacyRepo.findPracticeSites.mockResolvedValue([
        { id: 'ps-1', addressId: 'addr-cerca' },
        { id: 'ps-2', addressId: 'addr-lejos' },
      ]);
      d.pharmacyRepo.findAddresses.mockResolvedValue([
        {
          id: 'addr-cerca',
          lines: 'Calle 1',
          city: 'La Paz',
          latitude: '-16.5000',
          longitude: '-68.1500',
        },
        {
          id: 'addr-lejos',
          lines: 'Calle 2',
          city: 'El Alto',
          latitude: '-16.5100',
          longitude: '-68.1600',
        },
      ]);
      d.pharmacyRepo.findConcepts.mockResolvedValue([MEDICATION, CURRENCY]);
    }

    it('puts the complete site first even when it is farther away', async () => {
      const d = build();
      conDosSedes(d);

      const result = await runWithTenant('tenant-a', () =>
        d.service.availability(['prod-1', 'prod-2'], {
          lat: -16.5,
          lng: -68.15,
        }),
      );

      expect(result.count).toBe(2);
      // La completa manda aunque quede más lejos: dos farmacias son dos viajes.
      expect(result.items[0].siteId).toBe('site-lejos');
      expect(result.items[0].complete).toBe(true);
      expect(result.items[0].missingProductIds).toEqual([]);
      expect(result.items[1].siteId).toBe('site-cerca');
      expect(result.items[1].complete).toBe(false);
      expect(result.items[1].missingProductIds).toEqual(['prod-2']);
      // La distancia sale del Haversine sobre las coordenadas de la dirección.
      expect(result.items[1].distanceKm).toBe(0);
      expect(result.items[0].distanceKm).toBeGreaterThan(0);
    });

    it('a site with none of the requested products is not a candidate', async () => {
      const d = build();
      conDosSedes(d);

      const result = await runWithTenant('tenant-a', () =>
        d.service.availability(['prod-2'], undefined),
      );

      // Sólo la lejana tiene prod-2; la cercana ni aparece.
      expect(result.count).toBe(1);
      expect(result.items[0].siteId).toBe('site-lejos');
      // Sin lat/lng en la consulta no se inventa distancia.
      expect(result.items[0].distanceKm).toBeNull();
    });

    it('an unknown or retired product id counts as missing everywhere', async () => {
      const d = build();
      conDosSedes(d);

      const result = await runWithTenant('tenant-a', () =>
        d.service.availability(['prod-1', 'prod-fantasma'], undefined),
      );

      // Nadie está completo: el fantasma no existe en ningún catálogo activo.
      expect(result.items.every((item) => !item.complete)).toBe(true);
      expect(
        result.items.every((item) =>
          item.missingProductIds.includes('prod-fantasma'),
        ),
      ).toBe(true);
    });

    it('prefers the site-specific list, excludes insurer lists and totals only fully priced sites', async () => {
      const d = build();
      conDosSedes(d);
      d.pharmacyRepo.findCurrentPublicPriceLists.mockResolvedValue([
        {
          id: 'list-pharm',
          pharmacyId: 'ph-1',
          code: 'PUBLICA',
          currencyConceptId: CURRENCY.id,
        },
        {
          id: 'list-sede',
          pharmacyId: 'ph-1',
          pharmacySiteId: 'site-lejos',
          code: 'SEDE-LEJOS',
          currencyConceptId: CURRENCY.id,
        },
        // Ligada a aseguradora y más barata: aun así no puede ganar, porque
        // ni siquiera entra al directorio.
        {
          id: 'list-aseg',
          pharmacyId: 'ph-1',
          code: 'ASEGURADORA',
          insurerTenantId: 'tenant-aseguradora',
          currencyConceptId: CURRENCY.id,
        },
      ]);
      d.pharmacyRepo.findCurrentPrices.mockResolvedValue([
        {
          pharmacyPriceListId: 'list-pharm',
          pharmacyProductId: 'prod-1',
          unitAmount: '20.00',
        },
        {
          pharmacyPriceListId: 'list-sede',
          pharmacyProductId: 'prod-1',
          unitAmount: '18.00',
          patientAmount: '17.00',
        },
        {
          pharmacyPriceListId: 'list-aseg',
          pharmacyProductId: 'prod-1',
          unitAmount: '1.00',
        },
        // prod-2 sin precio publicado.
      ]);

      const result = await runWithTenant('tenant-a', () =>
        d.service.availability(['prod-1', 'prod-2'], undefined),
      );

      // La lista de aseguradora ni se consulta.
      const listIds = d.pharmacyRepo.findCurrentPrices.mock.calls[0][1];
      expect(listIds).toEqual(['list-pharm', 'list-sede']);

      const lejos = result.items.find((item) => item.siteId === 'site-lejos')!;
      const cerca = result.items.find((item) => item.siteId === 'site-cerca')!;

      // En la sede con lista propia gana esa lista.
      const prod1EnLejos = lejos.products.find(
        (product) => product.productId === 'prod-1',
      )!;
      expect(prod1EnLejos.price?.priceListCode).toBe('SEDE-LEJOS');
      expect(prod1EnLejos.price?.patientAmount).toBe('17.00');
      // prod-2 no tiene precio → el total de la sede no se inventa.
      expect(lejos.totalAmount).toBeNull();
      // La cercana sólo tiene prod-1, con precio: su total sí existe.
      expect(cerca.totalAmount).toBe('20.00');
      expect(cerca.currency).toEqual({
        code: CURRENCY.code,
        display: CURRENCY.display,
      });
    });

    it('sums money exactly instead of drifting in floating point', async () => {
      const d = build();
      conDosSedes(d);
      d.pharmacyRepo.findCurrentPublicPriceLists.mockResolvedValue([
        {
          id: 'list-pharm',
          pharmacyId: 'ph-1',
          code: 'PUBLICA',
          currencyConceptId: CURRENCY.id,
        },
      ]);
      // Importes con tres decimales: en binario 1.005 + 2.010 "suma"
      // 3.0149999…, que un toFixed(2) serviría como 3.01.
      d.pharmacyRepo.findCurrentPrices.mockResolvedValue([
        {
          pharmacyPriceListId: 'list-pharm',
          pharmacyProductId: 'prod-1',
          unitAmount: '1.005',
        },
        {
          pharmacyPriceListId: 'list-pharm',
          pharmacyProductId: 'prod-2',
          unitAmount: '2.010',
        },
      ]);

      const result = await runWithTenant('tenant-a', () =>
        d.service.availability(['prod-1', 'prod-2'], undefined),
      );

      const lejos = result.items.find((item) => item.siteId === 'site-lejos')!;
      const cerca = result.items.find((item) => item.siteId === 'site-cerca')!;
      // Suma exacta en decimal, redondeada half-up a los 2 decimales del
      // contrato: 3.015 → 3.02, no el 3.01 del punto flotante.
      expect(lejos.totalAmount).toBe('3.02');
      expect(cerca.totalAmount).toBe('1.01');
    });
  });

  describe('haversineKm', () => {
    it('measures a known distance: one degree of longitude at the equator', () => {
      // ~111.3 km según el radio medio terrestre; con un decimal.
      expect(haversineKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(
        111.2,
        0,
      );
    });

    it('is zero between a point and itself', () => {
      expect(
        haversineKm({ lat: -16.5, lng: -68.15 }, { lat: -16.5, lng: -68.15 }),
      ).toBe(0);
    });
  });
});
