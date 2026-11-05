import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import type { SiteOfferRow } from '../ports/medical-center.ports';
import { MedicalCentersSearchService } from './medical-centers-search.service';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ENDO = 'proc-endoscopia';
const COLO = 'proc-colonoscopia';
const BOB = 'moneda-bob';
const USD = 'moneda-usd';

const CONTRACT_ITEM_KEYS = [
  'practiceId',
  'practiceSiteId',
  'name',
  'addressText',
  'latitude',
  'longitude',
  'distanceKm',
  'complete',
  'missingProcedureConceptIds',
  'offers',
  'totalPrice',
].sort();

const CONTRACT_OFFER_KEYS = [
  'procedureConceptId',
  'procedureDisplay',
  'price',
  'currencyConceptId',
  'referencePrice',
  'referenceUnit',
  'overMargin',
].sort();

/**
 * Una oferta de una sede.
 *
 * @param site - Sede que la ofrece.
 * @param procedure - Procedimiento.
 * @param price - Precio publicado.
 * @param overrides - Campos que cambian de un caso a otro.
 * @returns La fila.
 */
function offer(
  site: string,
  procedure: string,
  price: number,
  overrides: Partial<SiteOfferRow> = {},
): SiteOfferRow {
  return {
    practiceId: `practice-${site}`,
    practiceSiteId: site,
    siteName: `Centro ${site}`,
    addressText: `Calle ${site}`,
    city: 'La Paz',
    latitude: null,
    longitude: null,
    procedureConceptId: procedure,
    procedureDisplay: `Display ${procedure}`,
    procedureSpecialty: 'Gastroenterología',
    price,
    currencyConceptId: BOB,
    ...overrides,
  };
}

/**
 * Construye el servicio con ofertas y referencias controladas.
 *
 * @param rows - Ofertas que devuelve el puerto.
 * @returns El servicio y sus dobles.
 */
function build(rows: SiteOfferRow[] = []) {
  const offers = { findSiteOffers: mockFn().mockResolvedValue(rows) };
  const references = {
    referencesFor: mockFn().mockResolvedValue(
      new Map([
        [ENDO, { referencePrice: 150, referenceUnit: 'UMA' }],
        [COLO, { referencePrice: 45.5, referenceUnit: 'USD' }],
      ]),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const em = { fork: mockFn(() => ({})) };
  const service = new MedicalCentersSearchService(
    em as any,
    offers as any,
    references as any,
    logger as any,
  );
  return { service, offers, references };
}

describe('MedicalCentersSearchService', () => {
  it('cobertura: complete y missingProcedureConceptIds en el orden pedido', async () => {
    const { service } = build([
      offer('a', ENDO, 100),
      offer('a', COLO, 200),
      offer('b', COLO, 50),
    ]);

    const page = await service.search({
      procedureConceptIds: [ENDO, COLO],
      includePartial: 'true',
    } as any);

    const a = page.items.find((i) => i.practiceSiteId === 'a')!;
    const b = page.items.find((i) => i.practiceSiteId === 'b')!;
    expect(a.complete).toBe(true);
    expect(a.missingProcedureConceptIds).toEqual([]);
    expect(b.complete).toBe(false);
    expect(b.missingProcedureConceptIds).toEqual([ENDO]);
  });

  it('includePartial ausente o false → solo completos; true → completos y parciales', async () => {
    const rows = [
      offer('a', ENDO, 1),
      offer('a', COLO, 1),
      offer('b', COLO, 1),
    ];
    const query = { procedureConceptIds: [ENDO, COLO] };

    const strict = await build(rows).service.search(query as any);
    const explicitFalse = await build(rows).service.search({
      ...query,
      includePartial: 'false',
    } as any);
    const lenient = await build(rows).service.search({
      ...query,
      includePartial: 'true',
    } as any);

    expect(strict.items.map((i) => i.practiceSiteId)).toEqual(['a']);
    expect(explicitFalse.items.map((i) => i.practiceSiteId)).toEqual(['a']);
    expect(lenient.items.map((i) => i.practiceSiteId)).toEqual(['a', 'b']);
  });

  it('totalPrice es la suma de lo que ofrece de lo pedido', async () => {
    const { service } = build([
      offer('a', ENDO, 100.5),
      offer('a', COLO, 200.25),
    ]);

    const [item] = (
      await service.search({ procedureConceptIds: [ENDO, COLO] } as any)
    ).items;

    expect(item.totalPrice).toBe(300.75);
  });

  it('con monedas distintas no hay suma: totalPrice es null', async () => {
    const { service } = build([
      offer('a', ENDO, 100),
      offer('a', COLO, 50, { currencyConceptId: USD }),
    ]);

    const [item] = (
      await service.search({ procedureConceptIds: [ENDO, COLO] } as any)
    ).items;

    expect(item.totalPrice).toBeNull();
  });

  it('trae la referencia con su unidad (UMA y USD) y overMargin null en todas las ofertas', async () => {
    const { service } = build([offer('a', ENDO, 100), offer('a', COLO, 100)]);

    const [item] = (
      await service.search({ procedureConceptIds: [ENDO, COLO] } as any)
    ).items;

    expect(item.offers.map((o) => [o.referencePrice, o.referenceUnit])).toEqual(
      [
        [150, 'UMA'],
        [45.5, 'USD'],
      ],
    );
    expect(item.offers.every((o) => o.overMargin === null)).toBe(true);
  });

  it('CI-7: dos ofertas con igual precio y referencia dan lo mismo, sea cual sea la sede', async () => {
    const { service } = build([offer('a', ENDO, 999), offer('b', ENDO, 999)]);

    const page = await service.search({ procedureConceptIds: [ENDO] } as any);

    expect(page.items[0].offers[0]).toEqual(page.items[1].offers[0]);
  });

  it('claves exactas de MedicalCenterItem y de MedicalCenterOffer, sin los flags del vínculo', async () => {
    const { service } = build([offer('a', ENDO, 100)]);

    const [item] = (
      await service.search({ procedureConceptIds: [ENDO] } as any)
    ).items;

    expect(Object.keys(item).sort()).toEqual(CONTRACT_ITEM_KEYS);
    expect(Object.keys(item.offers[0]).sort()).toEqual(CONTRACT_OFFER_KEYS);
    expect(item).not.toHaveProperty('practitionerWorksHere');
    expect(item).not.toHaveProperty('suggestedByPractitioner');
  });

  it('sin lat/lng la distancia es null', async () => {
    const { service } = build([
      offer('a', ENDO, 1, { latitude: -16.5, longitude: -68.15 }),
    ]);

    const [item] = (
      await service.search({ procedureConceptIds: [ENDO] } as any)
    ).items;

    expect(item.distanceKm).toBeNull();
  });

  it('con origen calcula la distancia y ordena al más cercano primero', async () => {
    const { service } = build([
      offer('lejos', ENDO, 1, { latitude: -17.4, longitude: -66.15 }),
      offer('cerca', ENDO, 9, { latitude: -16.51, longitude: -68.14 }),
      offer('sin-coordenadas', ENDO, 1),
    ]);

    const page = await service.search({
      procedureConceptIds: [ENDO],
      lat: -16.5,
      lng: -68.15,
    } as any);

    expect(page.items.map((i) => i.practiceSiteId)).toEqual([
      'cerca',
      'lejos',
      'sin-coordenadas',
    ]);
    expect(page.items[0].distanceKm).toBeGreaterThan(0);
    expect(page.items[2].distanceKm).toBeNull();
  });

  it('un completo lejos va antes que un incompleto cerca', async () => {
    const { service } = build([
      offer('cerca-parcial', ENDO, 1, { latitude: -16.5, longitude: -68.15 }),
      offer('lejos-completo', ENDO, 1, { latitude: -17.4, longitude: -66.15 }),
      offer('lejos-completo', COLO, 1, { latitude: -17.4, longitude: -66.15 }),
    ]);

    const page = await service.search({
      procedureConceptIds: [ENDO, COLO],
      includePartial: 'true',
      lat: -16.5,
      lng: -68.15,
    } as any);

    expect(page.items.map((i) => i.practiceSiteId)).toEqual([
      'lejos-completo',
      'cerca-parcial',
    ]);
  });

  it('el total se cuenta antes de paginar y la página 2 sigue el orden global', async () => {
    const rows = ['d', 'a', 'c', 'b'].map((site) => offer(site, ENDO, 10));
    const { service } = build(rows);
    const base = { procedureConceptIds: [ENDO] };

    const first = await service.search({ ...base, limit: 2, offset: 0 } as any);
    const second = await service.search({
      ...base,
      limit: 2,
      offset: 2,
    } as any);

    expect(first.total).toBe(4);
    expect(second.total).toBe(4);
    expect(first.items.map((i) => i.practiceSiteId)).toEqual(['a', 'b']);
    expect(second.items.map((i) => i.practiceSiteId)).toEqual(['c', 'd']);
    expect(second).toMatchObject({ limit: 2, offset: 2 });
  });

  it('filtra por ciudad sin distinguir tildes ni mayúsculas', async () => {
    const { service } = build([
      offer('a', ENDO, 1, { city: 'Cochabamba' }),
      offer('b', ENDO, 1, { city: 'La Paz' }),
    ]);

    const page = await service.search({
      procedureConceptIds: [ENDO],
      city: 'cochabamba ',
    } as any);

    expect(page.items.map((i) => i.practiceSiteId)).toEqual(['a']);
  });

  it('filtra por especialidad sin recortar la cobertura de la sede', async () => {
    const { service } = build([
      offer('a', ENDO, 1, { procedureSpecialty: 'Gastroenterología' }),
      offer('a', COLO, 1, { procedureSpecialty: 'Coloproctología' }),
      offer('b', COLO, 1, { procedureSpecialty: 'Coloproctología' }),
    ]);

    const page = await service.search({
      procedureConceptIds: [ENDO, COLO],
      specialty: 'gastroenterologia',
      includePartial: 'true',
    } as any);

    expect(page.items).toHaveLength(1);
    expect(page.items[0].practiceSiteId).toBe('a');
    expect(page.items[0].complete).toBe(true);
  });

  it('sin ofertas devuelve una página vacía y no pide referencias', async () => {
    const { service, references } = build([]);

    const page = await service.search({ procedureConceptIds: [ENDO] } as any);

    expect(page).toMatchObject({ items: [], total: 0, offset: 0 });
    expect(references.referencesFor).not.toHaveBeenCalled();
  });

  it('lat sin lng (o al revés) da 400', async () => {
    const { service, offers } = build([offer('a', ENDO, 1)]);

    await expect(
      service.search({ procedureConceptIds: [ENDO], lat: -16.5 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.search({ procedureConceptIds: [ENDO], lng: -68.1 } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(offers.findSiteOffers).not.toHaveBeenCalled();
  });

  it('un procedimiento repetido en una sede vale por su precio más bajo', async () => {
    const { service } = build([offer('a', ENDO, 300), offer('a', ENDO, 120)]);

    const [item] = (
      await service.search({ procedureConceptIds: [ENDO] } as any)
    ).items;

    expect(item.offers).toHaveLength(1);
    expect(item.offers[0].price).toBe(120);
  });
});
