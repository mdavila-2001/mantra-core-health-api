import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DiagnosticUnitsSearchService } from './diagnostic-units-search.service';
import { BadRequestException } from '@nestjs/common';
import { DUNIT } from '../diagnostic_units.concepts';

/** Una unidad publicada mínima, con lo que la proyección lee. */
function unit(overrides: Record<string, unknown> = {}) {
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
    findOfferedConcepts: mockFn().mockResolvedValue(new Map()),
    findActiveSites: mockFn().mockResolvedValue([]),
    findActiveOfferings: mockFn().mockResolvedValue([]),
    findConcepts: mockFn().mockResolvedValue([]),
    findEquipment: mockFn().mockResolvedValue([]),
    findCurrentPublicSchedulesFor: mockFn().mockResolvedValue([]),
    findCurrentPricesForSchedules: mockFn().mockResolvedValue([]),
    findPracticeSites: mockFn().mockResolvedValue([]),
    findAddresses: mockFn().mockResolvedValue([]),
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
    d.readRepo.searchVisible.mockResolvedValue([unit()]);
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
    d.readRepo.searchVisible.mockResolvedValue([unit()]);
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

  describe('cities y minAmountCurrency (CL-45, CL-51)', () => {
    it('aceptado: junta ciudades de sedes distintas y la moneda del precio mínimo', async () => {
      const d = build();
      d.readRepo.searchVisible.mockResolvedValue([unit()]);
      d.readRepo.countVisible.mockResolvedValue(1);
      d.readRepo.findActiveSites.mockResolvedValue([
        { id: 'site-1', diagnosticUnitId: 'unit-1', practiceSiteId: 'ps-1' },
        { id: 'site-2', diagnosticUnitId: 'unit-1', practiceSiteId: 'ps-2' },
      ]);
      d.readRepo.findPracticeSites.mockResolvedValue([
        { id: 'ps-1', addressId: 'addr-1' },
        { id: 'ps-2', addressId: 'addr-2' },
      ]);
      d.readRepo.findAddresses.mockResolvedValue([
        { id: 'addr-1', city: 'La Paz' },
        { id: 'addr-2', city: 'El Alto' },
      ]);
      d.readRepo.findCurrentPublicSchedulesFor.mockResolvedValue([
        {
          id: 'sch-1',
          diagnosticUnitId: 'unit-1',
          currencyConceptId: 'cur-usd',
        },
      ]);
      d.readRepo.findCurrentPricesForSchedules.mockResolvedValue([
        { priceScheduleId: 'sch-1', baseAmount: '120.00' },
      ]);
      d.readRepo.findConcepts.mockImplementation(
        async (_em: unknown, ids: string[]) =>
          ids.includes('cur-usd')
            ? [{ id: 'cur-usd', code: 'USD', display: 'Dólar' }]
            : [],
      );

      const res = await d.service.search({});

      expect(res.items[0].cities).toEqual(['El Alto', 'La Paz']);
      expect(res.items[0].minAmountCurrency).toBe('USD');
    });

    it('límite: una sede sin dirección cargada no aporta ciudad ni rompe la lista', async () => {
      const d = build();
      d.readRepo.searchVisible.mockResolvedValue([unit()]);
      d.readRepo.countVisible.mockResolvedValue(1);
      d.readRepo.findActiveSites.mockResolvedValue([
        { id: 'site-1', diagnosticUnitId: 'unit-1', practiceSiteId: 'ps-1' },
      ]);
      d.readRepo.findPracticeSites.mockResolvedValue([
        { id: 'ps-1', addressId: undefined },
      ]);

      const res = await d.service.search({});

      expect(res.items[0].cities).toEqual([]);
      expect(res.items[0].minAmountCurrency).toBeNull();
    });

    it('inválido: un centro sin tarifa publica no tiene minAmountCurrency', async () => {
      const d = build();
      d.readRepo.searchVisible.mockResolvedValue([unit()]);
      d.readRepo.countVisible.mockResolvedValue(1);
      d.readRepo.findCurrentPublicSchedulesFor.mockResolvedValue([]);
      d.readRepo.findCurrentPricesForSchedules.mockResolvedValue([]);

      const res = await d.service.search({});

      expect(res.items[0].minAmount).toBeNull();
      expect(res.items[0].minAmountCurrency).toBeNull();
    });
  });

  it('never shows a concept id where a label belongs', async () => {
    const d = build();
    d.readRepo.searchVisible.mockResolvedValue([unit()]);
    d.readRepo.countVisible.mockResolvedValue(1);
    // El catálogo no resolvió el concepto: se muestra vacío, nunca el uuid.
    d.readRepo.findConcepts.mockResolvedValue([]);

    const res = await d.service.search({});

    expect(res.items[0].type).toEqual({ code: '', display: '' });
  });

  it('drops units below the minimum rating and corrects the total', async () => {
    const d = build();
    d.readRepo.searchVisible.mockResolvedValue([
      unit(),
      unit({ id: 'unit-2', publicProfileId: 'profile-2' }),
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
    d.readRepo.searchVisible.mockResolvedValue([unit()]);
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

describe('DiagnosticUnitsSearchService.searchCoverage', () => {
  /** Origen del paciente: plaza 24 de Septiembre, Santa Cruz. */
  const ORIGIN = { lat: -17.7834, lng: -63.1821 };

  /**
   * Arma tres centros de imagen con sede, dirección y coordenadas.
   *
   * - `cerca`: a ~1 km, ofrece solo RX.
   * - `lejos`: a ~6 km, ofrece RX y ECO.
   * - `sin-coordenadas`: ofrece RX y ECO, sin coordenadas cargadas.
   *
   * @returns El sistema bajo prueba con esos centros.
   */
  function threeCenters() {
    const d = build();
    const units = [
      unit({ id: 'cerca', name: 'Imagen Cerca' }),
      unit({ id: 'lejos', name: 'Imagen Lejos' }),
      unit({ id: 'sin-coordenadas', name: 'Imagen Sin Mapa' }),
    ];
    d.readRepo.findOfferedConcepts.mockResolvedValue(
      new Map([
        ['cerca', new Set(['rx'])],
        ['lejos', new Set(['rx', 'eco'])],
        ['sin-coordenadas', new Set(['rx', 'eco'])],
      ]),
    );
    d.readRepo.countVisible.mockResolvedValue(units.length);
    d.readRepo.searchVisible.mockResolvedValue(units);
    d.readRepo.findActiveSites.mockResolvedValue([
      { id: 's-cerca', diagnosticUnitId: 'cerca', practiceSiteId: 'ps-cerca' },
      { id: 's-lejos', diagnosticUnitId: 'lejos', practiceSiteId: 'ps-lejos' },
      {
        id: 's-sin',
        diagnosticUnitId: 'sin-coordenadas',
        practiceSiteId: 'ps-sin',
      },
    ]);
    d.readRepo.findPracticeSites.mockResolvedValue([
      { id: 'ps-cerca', addressId: 'a-cerca' },
      { id: 'ps-lejos', addressId: 'a-lejos' },
      { id: 'ps-sin', addressId: 'a-sin' },
    ]);
    d.readRepo.findAddresses.mockResolvedValue([
      {
        id: 'a-cerca',
        lines: 'Calle Junín 120',
        city: 'Santa Cruz',
        latitude: '-17.7900',
        longitude: '-63.1800',
      },
      {
        id: 'a-lejos',
        lines: 'Av. Banzer km 5',
        city: 'Santa Cruz',
        latitude: '-17.7300',
        longitude: '-63.1700',
      },
      { id: 'a-sin', lines: 'Calle Sucre 45', city: 'Santa Cruz' },
    ]);
    return d;
  }

  it('completos primero, por distancia, y los que no tienen distancia al final', async () => {
    const d = threeCenters();

    const res = await d.service.searchCoverage({
      studyConceptIds: ['rx', 'eco'],
      lat: ORIGIN.lat,
      lng: ORIGIN.lng,
    });

    // El completo lejano va antes que el incompleto cercano: lo que se busca
    // es dónde hacerse todo, no el lugar más cerca para hacerse la mitad.
    expect(res.items.map((item) => item.id)).toEqual([
      'lejos',
      'sin-coordenadas',
      'cerca',
    ]);
    expect(res.total).toBe(3);
  });

  it('cada centro dice qué le falta, contado contra lo pedido', async () => {
    const d = threeCenters();

    const res = await d.service.searchCoverage({
      studyConceptIds: ['rx', 'eco'],
      lat: ORIGIN.lat,
      lng: ORIGIN.lng,
    });
    const byId = new Map(res.items.map((item) => [item.id, item]));

    expect(byId.get('lejos')).toMatchObject({
      complete: true,
      missingStudyConceptIds: [],
      addressText: 'Av. Banzer km 5, Santa Cruz',
      latitude: -17.73,
      longitude: -63.17,
    });
    expect(byId.get('cerca')).toMatchObject({
      complete: false,
      missingStudyConceptIds: ['eco'],
    });
    expect(byId.get('cerca')?.distanceKm).toBeLessThan(
      byId.get('lejos')?.distanceKm as number,
    );
    expect(byId.get('sin-coordenadas')).toMatchObject({
      distanceKm: null,
      latitude: null,
      longitude: null,
      addressText: 'Calle Sucre 45, Santa Cruz',
    });
  });

  it('sin origen no hay distancia y, entre completos, ordena por nombre', async () => {
    const d = threeCenters();

    const res = await d.service.searchCoverage({
      studyConceptIds: ['rx', 'eco'],
    });

    expect(res.items.every((item) => item.distanceKm === null)).toBe(true);
    expect(res.items.map((item) => item.id)).toEqual([
      'lejos',
      'sin-coordenadas',
      'cerca',
    ]);
  });

  it('la página se corta después de ordenar, y el total cuenta todos', async () => {
    const d = threeCenters();

    const res = await d.service.searchCoverage({
      studyConceptIds: ['rx', 'eco'],
      lat: ORIGIN.lat,
      lng: ORIGIN.lng,
      limit: 1,
      offset: 1,
    });

    expect(res.items.map((item) => item.id)).toEqual(['sin-coordenadas']);
    expect(res).toMatchObject({ total: 3, limit: 1, offset: 1 });
    // Para ordenar hay que traerlos todos: el repositorio no recibe la página.
    const [, , limit, offset] = d.readRepo.searchVisible.mock.calls[0];
    expect([limit, offset]).toEqual([3, 0]);
  });

  it('la sede con rol principal gana sobre la primera sede activa', async () => {
    const d = threeCenters();
    d.readRepo.searchVisible.mockResolvedValue([unit({ id: 'lejos' })]);
    d.readRepo.countVisible.mockResolvedValue(1);
    d.readRepo.findActiveSites.mockResolvedValue([
      {
        id: 's-toma',
        diagnosticUnitId: 'lejos',
        practiceSiteId: 'ps-cerca',
        siteRoleConceptId: DUNIT.SITE_ROLE_COLLECTION,
      },
      {
        id: 's-principal',
        diagnosticUnitId: 'lejos',
        practiceSiteId: 'ps-lejos',
        siteRoleConceptId: DUNIT.SITE_ROLE_PRIMARY,
      },
    ]);

    const res = await d.service.searchCoverage({ studyConceptIds: ['rx'] });

    expect(res.items[0].addressText).toBe('Av. Banzer km 5, Santa Cruz');
  });

  it('solo entran los centros que ofrecen alguno de los estudios pedidos', async () => {
    const d = threeCenters();

    await d.service.searchCoverage({ studyConceptIds: ['rx', 'eco'] });

    const [, criteria] = d.readRepo.searchVisible.mock.calls[0];
    expect([...criteria.restrictToUnitIds].sort()).toEqual([
      'cerca',
      'lejos',
      'sin-coordenadas',
    ]);
  });

  it('se combina con los demás filtros del buscador', async () => {
    const d = threeCenters();
    d.readRepo.findUnitIdsWithInsurerAgreement.mockResolvedValue([
      'lejos',
      'otro',
    ]);

    await d.service.searchCoverage({
      studyConceptIds: ['rx', 'eco'],
      insurerTenantId: 'ins-1',
      kind: 'IMAGING',
    });

    const [, criteria] = d.readRepo.searchVisible.mock.calls[0];
    expect(criteria.restrictToUnitIds).toEqual(['lejos']);
    expect(criteria.diagnosticUnitTypeConceptId).toBe(DUNIT.UNIT_TYPE_IMAGING);
  });

  it('si ningún centro ofrece ninguno, responde vacío sin buscar unidades', async () => {
    const d = build();

    const res = await d.service.searchCoverage({ studyConceptIds: ['rx'] });

    expect(res).toEqual({ items: [], total: 0, limit: 20, offset: 0 });
    expect(d.readRepo.searchVisible).not.toHaveBeenCalled();
  });

  it('lat sin lng es un pedido a medias y se rechaza', async () => {
    const d = build();

    await expect(
      d.service.searchCoverage({ studyConceptIds: ['rx'], lat: ORIGIN.lat }),
    ).rejects.toThrow(BadRequestException);
    expect(d.readRepo.findOfferedConcepts).not.toHaveBeenCalled();
  });
});
