import { jest } from '@jest/globals';
import { ResourceNotFoundException } from '../../../common';
import type { SiteOfferRow } from '../ports/medical-center.ports';
import { MedicalCentersForMyOrdersService } from './medical-centers-for-my-orders.service';
import { MedicalCentersSearchService } from './medical-centers-search.service';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const PATIENT = 'patient-1';
const DOCTOR = 'doc-1';
const ENDO = 'proc-endoscopia';
const COLO = 'proc-colonoscopia';
const actor = { id: 'user-1' } as any;

/**
 * Una oferta de una sede.
 *
 * @param site - Sede.
 * @param procedure - Procedimiento.
 * @param price - Precio.
 * @param km - Latitud para ordenar (más al norte, más lejos del origen).
 * @returns La fila.
 */
function offer(
  site: string,
  procedure: string,
  price: number,
  km = 0,
): SiteOfferRow {
  return {
    practiceId: `practice-${site}`,
    practiceSiteId: site,
    siteName: `Centro ${site}`,
    addressText: null,
    city: 'La Paz',
    latitude: -16.5 + km / 111,
    longitude: -68.15,
    procedureConceptId: procedure,
    procedureDisplay: procedure,
    procedureSpecialty: null,
    price,
    currencyConceptId: 'bob',
  };
}

const OFFERS: SiteOfferRow[] = [
  offer('norte', ENDO, 100, 1),
  offer('norte', COLO, 100, 1),
  offer('sur', ENDO, 90, 5),
  offer('sur', COLO, 90, 5),
  offer('este', ENDO, 80, 9),
];

/**
 * Construye el sistema bajo prueba con órdenes y afiliaciones controladas.
 *
 * @param owned - Órdenes del titular que devuelve el puerto.
 * @param affiliated - Pares (médico, sede) con afiliación activa.
 * @returns El servicio y sus dobles.
 */
function build(
  owned: any[],
  affiliated: { practitionerProfileId: string; practiceSiteId: string }[] = [],
) {
  const offers = { findSiteOffers: mockFn().mockResolvedValue(OFFERS) };
  const references = {
    referencesFor: mockFn().mockResolvedValue(new Map()),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const em = { fork: mockFn(() => ({})) };
  const search = new MedicalCentersSearchService(
    em as any,
    offers as any,
    references as any,
    logger as any,
  );
  const ports = {
    resolveOwnPatientProfileId: mockFn().mockResolvedValue(PATIENT),
    findOwned: mockFn().mockResolvedValue(owned),
  };
  const affiliations = {
    findActiveSites: mockFn().mockResolvedValue(affiliated),
  };
  const service = new MedicalCentersForMyOrdersService(
    em as any,
    ports as any,
    affiliations as any,
    search,
    logger as any,
  );
  return { service, ports, affiliations, offers };
}

/**
 * Una orden del titular.
 *
 * @param id - Orden.
 * @param code - Procedimiento.
 * @param overrides - Campos que cambian de un caso a otro.
 * @returns La fila.
 */
function order(
  id: string,
  code: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    codeConceptId: code,
    requesterProfileId: DOCTOR,
    suggestedPracticeSiteId: null,
    ...overrides,
  };
}

const query = (ids: string[], extra: Record<string, unknown> = {}) =>
  ({ serviceRequestIds: ids, ...extra }) as any;

describe('MedicalCentersForMyOrdersService', () => {
  it('una orden de otro paciente da 404', async () => {
    const { service } = build([]);

    await expect(
      service.searchForOrders(query(['o1']), actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('si una de dos órdenes es ajena, da 404 y no devuelve nada de la otra', async () => {
    const { service, offers } = build([order('o1', ENDO)]);

    await expect(
      service.searchForOrders(query(['o1', 'o2']), actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(offers.findSiteOffers).not.toHaveBeenCalled();
  });

  it('busca por el titular de la sesión', async () => {
    const { service, ports } = build([order('o1', ENDO)]);

    await service.searchForOrders(query(['o1']), actor);

    expect(ports.findOwned).toHaveBeenCalledWith(expect.anything(), PATIENT, [
      'o1',
    ]);
  });

  it('los procedimientos salen de las órdenes, sin repetidos', async () => {
    const { service, offers } = build([
      order('o1', ENDO),
      order('o2', COLO),
      order('o3', ENDO),
    ]);

    await service.searchForOrders(query(['o1', 'o2', 'o3']), actor);

    expect(offers.findSiteOffers).toHaveBeenCalledWith(expect.anything(), [
      ENDO,
      COLO,
    ]);
  });

  it('practitionerWorksHere solo con afiliación activa para el procedimiento; suggestedByPractitioner solo en la sede sugerida', async () => {
    const { service, affiliations } = build(
      [order('o1', ENDO, { suggestedPracticeSiteId: 'sur' })],
      [{ practitionerProfileId: DOCTOR, practiceSiteId: 'norte' }],
    );

    const page = await service.searchForOrders(query(['o1']), actor);

    const bySite = Object.fromEntries(
      page.items.map((i) => [
        i.practiceSiteId,
        [i.practitionerWorksHere, i.suggestedByPractitioner],
      ]),
    );
    expect(bySite).toEqual({
      norte: [true, false],
      sur: [false, true],
      este: [false, false],
    });
    expect(affiliations.findActiveSites).toHaveBeenCalledWith(
      expect.anything(),
      [DOCTOR],
      expect.arrayContaining(['norte', 'sur', 'este']),
      [ENDO],
    );
  });

  it('INVITED o PENDING no cuentan: el puerto solo devuelve las ACTIVE y sin ellas todo es false', async () => {
    const { service } = build([order('o1', ENDO)], []);

    const page = await service.searchForOrders(query(['o1']), actor);

    expect(page.items.every((i) => i.practitionerWorksHere === false)).toBe(
      true,
    );
  });

  it('CI-1: con y sin recomendación, las mismas sedes en el mismo orden', async () => {
    const without = build([order('o1', ENDO)]);
    const withRecommendation = build(
      [order('o1', ENDO, { suggestedPracticeSiteId: 'este' })],
      [{ practitionerProfileId: DOCTOR, practiceSiteId: 'este' }],
    );
    const origin = { lat: -16.5, lng: -68.15 };

    const a = await without.service.searchForOrders(
      query(['o1'], { ...origin, includePartial: 'true' }),
      actor,
    );
    const b = await withRecommendation.service.searchForOrders(
      query(['o1'], { ...origin, includePartial: 'true' }),
      actor,
    );

    expect(b.items.map((i) => i.practiceSiteId)).toEqual(
      a.items.map((i) => i.practiceSiteId),
    );
    expect(a.items.map((i) => i.practiceSiteId)).toEqual([
      'norte',
      'sur',
      'este',
    ]);
  });

  it('CI-3: el conjunto con recomendación incluye el conjunto sin ella', async () => {
    const without = build([order('o1', ENDO)]);
    const withRecommendation = build([
      order('o1', ENDO, { suggestedPracticeSiteId: 'sur' }),
    ]);

    const a = await without.service.searchForOrders(query(['o1']), actor);
    const b = await withRecommendation.service.searchForOrders(
      query(['o1']),
      actor,
    );

    const withSet = new Set(b.items.map((i) => i.practiceSiteId));
    for (const item of a.items)
      expect(withSet.has(item.practiceSiteId)).toBe(true);
  });

  it('CA-P3.4: con «lo hago yo», todas las sedes del médico que ofrecen el procedimiento marcan practitionerWorksHere', async () => {
    const { service } = build(
      [order('o1', ENDO, { suggestedPracticeSiteId: 'norte' })],
      [
        { practitionerProfileId: DOCTOR, practiceSiteId: 'norte' },
        { practitionerProfileId: DOCTOR, practiceSiteId: 'sur' },
      ],
    );

    const page = await service.searchForOrders(query(['o1']), actor);

    const works = page.items
      .filter((i) => i.practitionerWorksHere)
      .map((i) => i.practiceSiteId)
      .sort();
    expect(works).toEqual(['norte', 'sur']);
  });

  it('la respuesta no se pagina: limit es la cantidad devuelta y offset 0', async () => {
    const { service } = build([order('o1', ENDO)]);

    const page = await service.searchForOrders(query(['o1']), actor);

    expect(page).toMatchObject({ total: 3, limit: 3, offset: 0 });
  });

  it('una orden sin médico solicitante no marca practitionerWorksHere y no consulta afiliaciones de nadie', async () => {
    const { service, affiliations } = build([
      order('o1', ENDO, { requesterProfileId: null }),
    ]);

    const page = await service.searchForOrders(query(['o1']), actor);

    expect(affiliations.findActiveSites).toHaveBeenCalledWith(
      expect.anything(),
      [],
      expect.anything(),
      [ENDO],
    );
    expect(page.items.every((i) => i.practitionerWorksHere === false)).toBe(
      true,
    );
  });
});
