import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DiagnosticUnitsSearchService } from './diagnostic-units-search.service';
import { DUNIT } from '../diagnostic_units.concepts';

/** Una unidad publicada mínima, con lo que la proyección lee. */
function unidad(overrides: Record<string, unknown> = {}) {
  return {
    id: 'unit-1',
    tenantId: 'tenant-1',
    code: 'LAB01',
    name: 'Laboratorio Central',
    diagnosticUnitTypeConceptId: DUNIT.UNIT_TYPE_LABORATORY,
    publicProfileId: 'profile-1',
    acceptsExternalOrders: true,
    walkInAvailable: false,
    homeCollectionAvailable: true,
    ...overrides,
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns Resultado de build.
 */
function build() {
  const em = { fork: mockFn(() => ({})) };
  const readRepo = {
    searchVisible: mockFn().mockResolvedValue([]),
    countVisible: mockFn().mockResolvedValue(0),
    findUnitIdsOfferingStudy: mockFn().mockResolvedValue([]),
    findUnitIdsWithInsurerAgreement: mockFn().mockResolvedValue([]),
    findActiveSites: mockFn().mockResolvedValue([]),
    findActiveOfferings: mockFn().mockResolvedValue([]),
    findConcepts: mockFn().mockResolvedValue([]),
    findEquipment: mockFn().mockResolvedValue([]),
    findCurrentPublicSchedulesFor: mockFn().mockResolvedValue([]),
    findCurrentPricesForSchedules: mockFn().mockResolvedValue([]),
  };
  const ratings = {
    ratingsByProfiles: mockFn().mockResolvedValue(new Map()),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new DiagnosticUnitsSearchService(
    em as any,
    readRepo as any,
    ratings as any,
    logger as any,
  );
  return { service, readRepo, ratings };
}

describe('DiagnosticUnitsSearchService', () => {
  it('only ever asks for published units, whatever the filters say', async () => {
    const d = build();
    d.readRepo.searchVisible.mockResolvedValue([unidad()]);
    d.readRepo.countVisible.mockResolvedValue(1);

    await d.service.search({});

    // El estado y la verificación los impone el repositorio, no la query: el
    // servicio no puede pedir «también los no verificados» ni por descuido.
    const [, criteria] = d.readRepo.searchVisible.mock.calls[0];
    expect(criteria).not.toHaveProperty('statusConceptId');
    expect(criteria.restrictToUnitIds).toBeUndefined();
  });

  it('maps the kind to its concept', async () => {
    const d = build();
    await d.service.search({ kind: 'IMAGING' });

    const [, criteria] = d.readRepo.searchVisible.mock.calls[0];
    expect(criteria.diagnosticUnitTypeConceptId).toBe(DUNIT.UNIT_TYPE_IMAGING);
  });

  it('intersects the study and insurer filters', async () => {
    const d = build();
    d.readRepo.findUnitIdsOfferingStudy.mockResolvedValue(['a', 'b', 'c']);
    d.readRepo.findUnitIdsWithInsurerAgreement.mockResolvedValue([
      'b',
      'c',
      'd',
    ]);

    await d.service.search({ studyCode: 'HEM', insurerTenantId: 'ins-1' });

    const [, criteria] = d.readRepo.searchVisible.mock.calls[0];
    expect(criteria.restrictToUnitIds).toEqual(['b', 'c']);
  });

  it('short-circuits to empty when a pre-filter matches nothing', async () => {
    const d = build();
    d.readRepo.findUnitIdsOfferingStudy.mockResolvedValue([]);

    const res = await d.service.search({ studyCode: 'NO-EXISTE' });

    expect(res).toEqual({ items: [], total: 0, limit: 20, offset: 0 });
    // Y no se llega a consultar unidades: no hay ninguna que pueda casar.
    expect(d.readRepo.searchVisible).not.toHaveBeenCalled();
  });

  it('projects the rating and the cheapest published price', async () => {
    const d = build();
    d.readRepo.searchVisible.mockResolvedValue([unidad()]);
    d.readRepo.countVisible.mockResolvedValue(1);
    d.readRepo.findActiveSites.mockResolvedValue([
      { id: 'site-1', diagnosticUnitId: 'unit-1' },
    ]);
    d.readRepo.findActiveOfferings.mockResolvedValue([
      { id: 'off-1', diagnosticUnitId: 'unit-1' },
      { id: 'off-2', diagnosticUnitId: 'unit-1' },
    ]);
    d.readRepo.findCurrentPublicSchedulesFor.mockResolvedValue([
      { id: 'sch-1', diagnosticUnitId: 'unit-1' },
    ]);
    d.readRepo.findCurrentPricesForSchedules.mockResolvedValue([
      { priceScheduleId: 'sch-1', baseAmount: '250.00' },
      { priceScheduleId: 'sch-1', baseAmount: '90.50' },
    ]);
    d.ratings.ratingsByProfiles.mockResolvedValue(
      new Map([['profile-1', { average: 4.5, count: 12 }]]),
    );

    const res = await d.service.search({});

    expect(res.items).toHaveLength(1);
    expect(res.items[0].minAmount).toBe(90.5);
    expect(res.items[0].rating).toBe(4.5);
    expect(res.items[0].ratingCount).toBe(12);
    expect(res.items[0].studyCount).toBe(2);
    expect(res.items[0].siteCount).toBe(1);
  });

  it('never shows a concept id where a label belongs', async () => {
    const d = build();
    d.readRepo.searchVisible.mockResolvedValue([unidad()]);
    d.readRepo.countVisible.mockResolvedValue(1);
    // El catálogo no resolvió el concepto: se muestra vacío, nunca el uuid.
    d.readRepo.findConcepts.mockResolvedValue([]);

    const res = await d.service.search({});

    expect(res.items[0].type).toEqual({ code: '', display: '' });
  });

  it('drops units below the minimum rating and corrects the total', async () => {
    const d = build();
    d.readRepo.searchVisible.mockResolvedValue([
      unidad(),
      unidad({ id: 'unit-2', publicProfileId: 'profile-2' }),
    ]);
    d.readRepo.countVisible.mockResolvedValue(2);
    d.ratings.ratingsByProfiles.mockResolvedValue(
      new Map([
        ['profile-1', { average: 4.8, count: 3 }],
        ['profile-2', { average: 2.1, count: 5 }],
      ]),
    );

    const res = await d.service.search({ minRating: 4 });

    expect(res.items.map((item: { id: string }) => item.id)).toEqual([
      'unit-1',
    ]);
    // El total se corrige: decir «hay 2» y devolver 1 haría paginar al vacío.
    expect(res.total).toBe(1);
  });

  it('drops units with no published price when a price ceiling is given', async () => {
    const d = build();
    d.readRepo.searchVisible.mockResolvedValue([unidad()]);
    d.readRepo.countVisible.mockResolvedValue(1);

    const res = await d.service.search({ maxAmount: 500 });

    // Sin tarifa pública no se puede afirmar que cumpla el tope; se deja fuera
    // en vez de mostrarla como si costara menos.
    expect(res.items).toHaveLength(0);
  });

  it('caps the page size at the documented maximum', async () => {
    const d = build();
    await d.service.search({ limit: 5000 });

    const [, , limit] = d.readRepo.searchVisible.mock.calls[0];
    expect(limit).toBe(100);
  });
});
