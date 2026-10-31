import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { PRAC } from '../practice.concepts';
import { HealthcareServiceOffersService } from './healthcare-service-offers.service';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const CONTRACT_KEYS = [
  'id',
  'practiceSiteId',
  'serviceConceptId',
  'serviceDisplay',
  'serviceCatalogId',
  'price',
  'currencyConceptId',
  'referencePrice',
  'referenceUnit',
  'overMargin',
  'visibleInSearch',
  'active',
].sort();

const ENDO = 'proc-endoscopia';
const COLO = 'proc-colonoscopia';
const actor = { id: 'admin-1' } as any;

/**
 * Un servicio de una sede.
 *
 * @param id - Servicio.
 * @param overrides - Campos que cambian de un caso a otro.
 * @returns El servicio de prueba.
 */
function svc(id: string, overrides: Record<string, unknown> = {}): any {
  return {
    id,
    practiceId: 'p1',
    practiceSiteId: 's1',
    serviceConceptId: ENDO,
    serviceCatalogId: `cat-${id}`,
    statusConceptId: PRAC.SERVICE_ACTIVE,
    ...overrides,
  };
}

/**
 * Un ítem del catálogo de precios.
 *
 * @param id - Ítem.
 * @param overrides - Campos que cambian de un caso a otro.
 * @returns El ítem de prueba.
 */
function item(id: string, overrides: Record<string, unknown> = {}): any {
  return {
    id,
    practiceId: 'p1',
    isActive: true,
    serviceConceptId: ENDO,
    defaultPrice: '120.50',
    currencyConceptId: 'bob',
    ...overrides,
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns El servicio y sus dobles.
 */
function build() {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    find: mockFn().mockResolvedValue([
      { id: ENDO, display: 'Endoscopía alta' },
      { id: COLO, display: 'Colonoscopía' },
    ]),
  };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const administration = {
    assertCanAdministerPractice: mockFn().mockResolvedValue({ id: 'p1' }),
  };
  const servicesRepo = {
    listByPractice: mockFn().mockResolvedValue([]),
    findById: mockFn(),
  };
  const catalogRepo = {
    findByIds: mockFn().mockResolvedValue([]),
    findById: mockFn(),
  };
  const references = {
    referencesFor: mockFn().mockResolvedValue(
      new Map([
        [ENDO, { referencePrice: 150, referenceUnit: 'UMA' }],
        [COLO, { referencePrice: 45.5, referenceUnit: 'USD' }],
      ]),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new HealthcareServiceOffersService(
    em as any,
    administration as any,
    servicesRepo as any,
    catalogRepo as any,
    references as any,
    logger as any,
  );
  return { service, tx, administration, servicesRepo, catalogRepo, references };
}

describe('HealthcareServiceOffersService', () => {
  describe('listOffers', () => {
    it('devuelve { items } con exactamente las 12 claves de HealthcareServiceOffer', async () => {
      const d = build();
      d.servicesRepo.listByPractice.mockResolvedValue([svc('a')]);
      d.catalogRepo.findByIds.mockResolvedValue([item('cat-a')]);

      const res = await d.service.listOffers('p1', undefined, actor);

      expect(Object.keys(res)).toEqual(['items']);
      expect(Object.keys(res.items[0]).sort()).toEqual(CONTRACT_KEYS);
    });

    it('precio, moneda y referencia salen del ítem de catálogo y del nomenclador (UMA y USD)', async () => {
      const d = build();
      d.servicesRepo.listByPractice.mockResolvedValue([
        svc('a'),
        svc('b', { serviceConceptId: COLO }),
      ]);
      d.catalogRepo.findByIds.mockResolvedValue([
        item('cat-a'),
        item('cat-b', { serviceConceptId: COLO, defaultPrice: '300' }),
      ]);

      const { items } = await d.service.listOffers('p1', undefined, actor);

      expect(items[0]).toMatchObject({
        serviceDisplay: 'Endoscopía alta',
        price: 120.5,
        currencyConceptId: 'bob',
        referencePrice: 150,
        referenceUnit: 'UMA',
        visibleInSearch: true,
        active: true,
      });
      expect(items[1]).toMatchObject({
        serviceDisplay: 'Colonoscopía',
        price: 300,
        referencePrice: 45.5,
        referenceUnit: 'USD',
      });
    });

    it('sin ítem de catálogo: price null, sin moneda y fuera de la búsqueda', async () => {
      const d = build();
      d.servicesRepo.listByPractice.mockResolvedValue([
        svc('a', { serviceCatalogId: undefined }),
      ]);

      const [offer] = (await d.service.listOffers('p1', undefined, actor))
        .items;

      expect(offer).toMatchObject({
        serviceCatalogId: null,
        price: null,
        currencyConceptId: null,
        visibleInSearch: false,
      });
    });

    it('un ítem inactivo cuenta como sin precio', async () => {
      const d = build();
      d.servicesRepo.listByPractice.mockResolvedValue([svc('a')]);
      d.catalogRepo.findByIds.mockResolvedValue([
        item('cat-a', { isActive: false }),
      ]);

      const [offer] = (await d.service.listOffers('p1', undefined, actor))
        .items;

      expect(offer.price).toBeNull();
      expect(offer.visibleInSearch).toBe(false);
    });

    it('visibleInSearch = active && price !== null en las cuatro combinaciones', async () => {
      const d = build();
      d.servicesRepo.listByPractice.mockResolvedValue([
        svc('a'),
        svc('b', { statusConceptId: PRAC.SERVICE_SUSPENDED }),
        svc('c', { serviceCatalogId: undefined }),
        svc('d', {
          serviceCatalogId: undefined,
          statusConceptId: PRAC.SERVICE_SUSPENDED,
        }),
      ]);
      d.catalogRepo.findByIds.mockResolvedValue([item('cat-a'), item('cat-b')]);

      const { items } = await d.service.listOffers('p1', undefined, actor);

      expect(
        items.map((i) => [i.active, i.price !== null, i.visibleInSearch]),
      ).toEqual([
        [true, true, true],
        [false, true, false],
        [true, false, false],
        [false, false, false],
      ]);
    });

    it('CI-7: overMargin es null para toda oferta, sea cual sea el precio frente a la referencia', async () => {
      const d = build();
      d.servicesRepo.listByPractice.mockResolvedValue([svc('a'), svc('b')]);
      d.catalogRepo.findByIds.mockResolvedValue([
        item('cat-a', { defaultPrice: '1' }),
        item('cat-b', { defaultPrice: '999999' }),
      ]);

      const { items } = await d.service.listOffers('p1', undefined, actor);

      expect(items.map((i) => i.overMargin)).toEqual([null, null]);
    });

    it('filtra por sede y pide ítems y referencias por lote', async () => {
      const d = build();
      d.servicesRepo.listByPractice.mockResolvedValue([svc('a')]);

      await d.service.listOffers('p1', 's1', actor);

      expect(d.servicesRepo.listByPractice).toHaveBeenCalledWith(
        expect.anything(),
        'p1',
        's1',
      );
      expect(d.catalogRepo.findByIds).toHaveBeenCalledTimes(1);
      expect(d.references.referencesFor).toHaveBeenCalledTimes(1);
    });

    it('dos sedes con dos ítems distintos tienen precios distintos (A-13)', async () => {
      const d = build();
      d.servicesRepo.listByPractice.mockResolvedValue([
        svc('a', { practiceSiteId: 's1', serviceCatalogId: 'cat-norte' }),
        svc('b', { practiceSiteId: 's2', serviceCatalogId: 'cat-sur' }),
      ]);
      d.catalogRepo.findByIds.mockResolvedValue([
        item('cat-norte', { defaultPrice: '100' }),
        item('cat-sur', { defaultPrice: '180' }),
      ]);

      const { items } = await d.service.listOffers('p1', undefined, actor);

      expect(items.map((i) => [i.practiceSiteId, i.price])).toEqual([
        ['s1', 100],
        ['s2', 180],
      ]);
    });

    it('el administrador de otra organización recibe 403 y no se lee nada', async () => {
      const d = build();
      d.administration.assertCanAdministerPractice.mockRejectedValue(
        new ForbiddenException('otra organización'),
      );

      await expect(
        d.service.listOffers('p1', undefined, actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.servicesRepo.listByPractice).not.toHaveBeenCalled();
    });

    it('sin servicios no consulta ítems ni referencias', async () => {
      const d = build();

      const res = await d.service.listOffers('p1', undefined, actor);

      expect(res.items).toEqual([]);
      expect(d.catalogRepo.findByIds).not.toHaveBeenCalled();
    });
  });

  describe('updateOffer', () => {
    it('active=false desactiva: la fila devuelve active=false y visibleInSearch=false', async () => {
      const d = build();
      const service = svc('a');
      d.servicesRepo.findById.mockResolvedValue(service);
      d.catalogRepo.findByIds.mockResolvedValue([item('cat-a')]);

      const offer = await d.service.updateOffer(
        'p1',
        'a',
        { active: false },
        actor,
      );

      expect(service.statusConceptId).toBe(PRAC.SERVICE_SUSPENDED);
      expect(offer).toMatchObject({ active: false, visibleInSearch: false });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });

    it('active=true reactiva', async () => {
      const d = build();
      const service = svc('a', { statusConceptId: PRAC.SERVICE_SUSPENDED });
      d.servicesRepo.findById.mockResolvedValue(service);
      d.catalogRepo.findByIds.mockResolvedValue([item('cat-a')]);

      const offer = await d.service.updateOffer(
        'p1',
        'a',
        { active: true },
        actor,
      );

      expect(service.statusConceptId).toBe(PRAC.SERVICE_ACTIVE);
      expect(offer.visibleInSearch).toBe(true);
    });

    it('un servicio de otra práctica responde 404 y no cambia', async () => {
      const d = build();
      const service = svc('a', { practiceId: 'otra' });
      d.servicesRepo.findById.mockResolvedValue(service);

      await expect(
        d.service.updateOffer('p1', 'a', { active: false }, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(service.statusConceptId).toBe(PRAC.SERVICE_ACTIVE);
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('un servicio inexistente responde 404', async () => {
      const d = build();
      d.servicesRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.updateOffer('p1', 'a', { active: false }, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('un serviceCatalogId de otra práctica da 422 y no cambia el precio', async () => {
      const d = build();
      const service = svc('a');
      d.servicesRepo.findById.mockResolvedValue(service);
      d.catalogRepo.findById.mockResolvedValue(
        item('cat-x', { practiceId: 'otra' }),
      );

      await expect(
        d.service.updateOffer('p1', 'a', { serviceCatalogId: 'cat-x' }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(service.serviceCatalogId).toBe('cat-a');
    });

    it('un serviceCatalogId válido cambia el precio de esa sede', async () => {
      const d = build();
      const service = svc('a');
      d.servicesRepo.findById.mockResolvedValue(service);
      d.catalogRepo.findById.mockResolvedValue(item('cat-nuevo'));
      d.catalogRepo.findByIds.mockResolvedValue([
        item('cat-nuevo', { defaultPrice: '99' }),
      ]);

      const offer = await d.service.updateOffer(
        'p1',
        'a',
        { serviceCatalogId: 'cat-nuevo' },
        actor,
      );

      expect(service.serviceCatalogId).toBe('cat-nuevo');
      expect(offer.price).toBe(99);
    });

    it('el administrador de otra organización recibe 403', async () => {
      const d = build();
      d.administration.assertCanAdministerPractice.mockRejectedValue(
        new ForbiddenException('otra organización'),
      );

      await expect(
        d.service.updateOffer('p1', 'a', { active: false }, actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.servicesRepo.findById).not.toHaveBeenCalled();
    });
  });
});
