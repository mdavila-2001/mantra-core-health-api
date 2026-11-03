import { jest } from '@jest/globals';
import { ServiceCatalog } from '../../billing/entities';
import { Addresses } from '../../common/entities';
import {
  HealthcareServices,
  PracticeSites,
  Practices,
} from '../../practice/entities';
import { PRAC } from '../../practice/practice.concepts';
import { CatalogConcepts } from '../../terminology/entities';
import { MedicalCenterOffersRepository } from './medical-center-offers.repository';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ENDO = 'proc-endoscopia';

interface World {
  services?: any[];
  items?: any[];
  sites?: any[];
  practices?: any[];
  addresses?: any[];
  concepts?: any[];
  specialties?: any[];
}

/**
 * `EntityManager` que responde `find` según la entidad pedida.
 *
 * @param world - Filas por entidad.
 * @returns El doble y su `find`.
 */
function em(world: World) {
  const byEntity = new Map<unknown, any[]>([
    [HealthcareServices, world.services ?? []],
    [ServiceCatalog, world.items ?? []],
    [PracticeSites, world.sites ?? []],
    [Practices, world.practices ?? []],
    [Addresses, world.addresses ?? []],
    [CatalogConcepts, world.concepts ?? []],
  ]);
  const find = mockFn((entity: unknown) =>
    Promise.resolve(byEntity.get(entity) ?? []),
  );
  const execute = mockFn().mockResolvedValue(world.specialties ?? []);
  return {
    double: { find, getConnection: () => ({ execute }) } as any,
    find,
    execute,
  };
}

const complete = (): World => ({
  services: [
    {
      id: 'hs1',
      serviceConceptId: ENDO,
      serviceCatalogId: 'cat1',
      practiceSiteId: 's1',
    },
  ],
  items: [
    {
      id: 'cat1',
      isActive: true,
      defaultPrice: '120.50',
      currencyConceptId: 'bob',
    },
  ],
  sites: [
    { id: 's1', practiceId: 'p1', name: 'Centro Norte', addressId: 'a1' },
  ],
  practices: [{ id: 'p1' }],
  addresses: [
    {
      id: 'a1',
      lines: 'Av. Arce 123',
      city: 'La Paz',
      postalCode: '0000',
      latitude: '-16.5',
      longitude: '-68.15',
    },
  ],
  concepts: [{ id: ENDO, display: 'Endoscopía alta' }],
  specialties: [{ concept_id: ENDO, valor: 'Gastroenterología' }],
});

describe('MedicalCenterOffersRepository', () => {
  const repo = new MedicalCenterOffersRepository();

  it('una lista vacía no consulta', async () => {
    const { double, find } = em({});

    await expect(repo.findSiteOffers(double, [])).resolves.toEqual([]);
    expect(find).not.toHaveBeenCalled();
  });

  it('arma la oferta con precio, sede, dirección, coordenadas y especialidad', async () => {
    const { double } = em(complete());

    const [row] = await repo.findSiteOffers(double, [ENDO]);

    expect(row).toEqual({
      practiceId: 'p1',
      practiceSiteId: 's1',
      siteName: 'Centro Norte',
      addressText: 'Av. Arce 123, La Paz, 0000',
      city: 'La Paz',
      latitude: -16.5,
      longitude: -68.15,
      procedureConceptId: ENDO,
      procedureDisplay: 'Endoscopía alta',
      procedureSpecialty: 'Gastroenterología',
      price: 120.5,
      currencyConceptId: 'bob',
    });
  });

  it('pide solo servicios activos, con ítem de catálogo y con sede (CI-6)', async () => {
    const { double, find } = em(complete());

    await repo.findSiteOffers(double, [ENDO]);

    expect(find).toHaveBeenCalledWith(
      HealthcareServices,
      expect.objectContaining({
        statusConceptId: PRAC.SERVICE_ACTIVE,
        serviceCatalogId: { $ne: null },
        practiceSiteId: { $ne: null },
      }),
    );
    expect(find).toHaveBeenCalledWith(
      ServiceCatalog,
      expect.objectContaining({ isActive: true }),
    );
    expect(find).toHaveBeenCalledWith(
      PracticeSites,
      expect.objectContaining({ statusConceptId: PRAC.SITE_ACTIVE }),
    );
  });

  it('sin servicios devuelve vacío y no sigue consultando', async () => {
    const { double, find } = em({});

    await expect(repo.findSiteOffers(double, [ENDO])).resolves.toEqual([]);
    expect(find).toHaveBeenCalledTimes(1);
  });

  it('un ítem de catálogo inactivo (la consulta no lo trae) deja el servicio fuera', async () => {
    const world = complete();
    world.items = [];
    const { double } = em(world);

    await expect(repo.findSiteOffers(double, [ENDO])).resolves.toEqual([]);
  });

  it('una sede de una práctica inactiva queda fuera', async () => {
    const world = complete();
    world.practices = [];
    const { double } = em(world);

    await expect(repo.findSiteOffers(double, [ENDO])).resolves.toEqual([]);
  });

  it('un precio sin moneda no es una oferta', async () => {
    const world = complete();
    world.items![0].currencyConceptId = undefined;
    const { double } = em(world);

    await expect(repo.findSiteOffers(double, [ENDO])).resolves.toEqual([]);
  });

  it('una sede sin dirección sale sin texto ni coordenadas', async () => {
    const world = complete();
    world.sites![0].addressId = undefined;
    const { double } = em(world);

    const [row] = await repo.findSiteOffers(double, [ENDO]);

    expect(row).toMatchObject({
      addressText: null,
      city: null,
      latitude: null,
      longitude: null,
    });
  });

  it('lee las especialidades en una sola consulta', async () => {
    const { double, execute } = em(complete());

    await repo.findSiteOffers(double, [ENDO]);

    expect(execute).toHaveBeenCalledTimes(1);
  });
});
