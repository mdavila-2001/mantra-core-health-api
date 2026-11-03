import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProcedureCentersService } from './procedure-centers.service';
import { CLIN } from '../clinical.concepts';

/** El titular: cuenta `user-1` → persona `per-1` → perfil de paciente `per-1`. */
const titular = { id: 'user-1', roles: ['PATIENT'] } as any;

const ENDOSCOPY = 'c-endoscopia';
const SPIROMETRY = 'c-espirometria';

/** Una orden vigente del titular. */
function order(id: string, conceptId: string, createdAt = new Date(0)) {
  return {
    id,
    codeConceptId: conceptId,
    categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_PROCEDURE,
    createdAt,
  };
}

/** Datos de la base simulada; cada prueba pisa lo que necesita. */
interface World {
  orders: any[];
  offerings: any[];
  practices: any[];
  sites: any[];
  addresses: any[];
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param world - Lo que devuelve cada lectura.
 * @returns El servicio y sus dobles.
 */
function build(world: Partial<World> = {}) {
  const data: World = {
    orders: [],
    offerings: [],
    practices: [],
    sites: [],
    addresses: [],
    ...world,
  };
  const em = { fork: mockFn(() => ({})) };
  const readRepo = {
    findPendingOrders: mockFn(() => Promise.resolve(data.orders)),
    findActiveOfferings: mockFn(() => Promise.resolve(data.offerings)),
    findActivePractices: mockFn(() => Promise.resolve(data.practices)),
    findOpenSites: mockFn(() => Promise.resolve(data.sites)),
    findAddresses: mockFn(() => Promise.resolve(data.addresses)),
  };
  const accountLinksRepo = {
    findActiveByUser: mockFn((_em: unknown, userId: string) =>
      Promise.resolve(userId === 'user-1' ? { personId: 'per-1' } : null),
    ),
  };
  const patientProfilesRepo = {
    findById: mockFn((_em: unknown, id: string) =>
      Promise.resolve(id === 'per-1' ? { profileId: 'per-1' } : null),
    ),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ProcedureCentersService(
    em as any,
    readRepo as any,
    accountLinksRepo as any,
    patientProfilesRepo as any,
    logger as any,
  );
  return { service, readRepo, logger };
}

/** Dos establecimientos con una sede cada uno, ubicadas en La Paz. */
const TWO_CLINICS: Partial<World> = {
  practices: [
    { id: 'pr-sur', name: 'Clínica Sur' },
    { id: 'pr-norte', name: 'Clínica Norte' },
  ],
  sites: [
    {
      id: 's-sur',
      practiceId: 'pr-sur',
      name: 'Sede Calacoto',
      addressId: 'a-sur',
    },
    {
      id: 's-norte',
      practiceId: 'pr-norte',
      name: 'Sede Miraflores',
      addressId: 'a-norte',
    },
  ],
  addresses: [
    {
      id: 'a-sur',
      lines: 'Calle 21',
      city: 'La Paz',
      latitude: '-16.5400',
      longitude: '-68.0800',
    },
    {
      id: 'a-norte',
      lines: 'Av. Busch',
      city: 'La Paz',
      latitude: '-16.4950',
      longitude: '-68.1200',
    },
  ],
};

describe('ProcedureCentersService.findForOwnOrders', () => {
  it('sin perfil de paciente responde 403 y no lee órdenes', async () => {
    const { service, readRepo } = build();
    await expect(
      service.findForOwnOrders({ id: 'otra-cuenta' } as any, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(readRepo.findPendingOrders).not.toHaveBeenCalled();
  });

  it('lee las órdenes del titular resuelto por la cuenta, nunca por parámetro', async () => {
    const { service, readRepo } = build();
    await service.findForOwnOrders(titular, {});
    expect(readRepo.findPendingOrders).toHaveBeenCalledWith(
      expect.anything(),
      'per-1',
    );
  });

  it('sin procedimientos pendientes no busca oferta y devuelve listas vacías', async () => {
    const { service, readRepo } = build();
    const result = await service.findForOwnOrders(titular, {});
    expect(result).toEqual({
      procedures: [],
      centers: [],
      total: 0,
      limit: 20,
    });
    expect(readRepo.findActiveOfferings).not.toHaveBeenCalled();
  });

  it('con procedimientos pero sin ninguna sede que los declare, no inventa centros', async () => {
    const { service } = build({ orders: [order('sr-1', ENDOSCOPY)] });
    const result = await service.findForOwnOrders(titular, {});
    expect(result.procedures).toHaveLength(1);
    expect(result.centers).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('un procedimiento pedido dos veces se busca una sola vez', async () => {
    const { service, readRepo } = build({
      orders: [order('sr-2', ENDOSCOPY), order('sr-1', ENDOSCOPY)],
    });
    const result = await service.findForOwnOrders(titular, {});
    expect(result.procedures.map((p) => p.serviceRequestId)).toEqual(['sr-2']);
    expect(readRepo.findActiveOfferings).toHaveBeenCalledWith(
      expect.anything(),
      [ENDOSCOPY],
    );
  });

  it('completas primero aunque estén más lejos, y cada sede dice qué le falta', async () => {
    const { service } = build({
      ...TWO_CLINICS,
      orders: [order('sr-1', ENDOSCOPY), order('sr-2', SPIROMETRY)],
      offerings: [
        {
          practiceId: 'pr-sur',
          practiceSiteId: 's-sur',
          serviceConceptId: ENDOSCOPY,
        },
        {
          practiceId: 'pr-sur',
          practiceSiteId: 's-sur',
          serviceConceptId: SPIROMETRY,
        },
        {
          practiceId: 'pr-norte',
          practiceSiteId: 's-norte',
          serviceConceptId: ENDOSCOPY,
        },
      ],
    });
    // El origen está pegado a la sede norte: igual gana la sur, que tiene todo.
    const result = await service.findForOwnOrders(titular, {
      lat: -16.495,
      lng: -68.12,
    });
    expect(result.centers.map((c) => c.siteId)).toEqual(['s-sur', 's-norte']);
    expect(result.centers[0]).toMatchObject({
      complete: true,
      missingProcedureConceptIds: [],
      practiceName: 'Clínica Sur',
      siteName: 'Sede Calacoto',
      addressText: 'Calle 21, La Paz',
      latitude: -16.54,
      longitude: -68.08,
    });
    expect(result.centers[1]).toMatchObject({
      complete: false,
      missingProcedureConceptIds: [SPIROMETRY],
      distanceKm: 0,
    });
  });

  it('entre iguales ordena por distancia y, sin origen, no inventa distancias', async () => {
    const world: Partial<World> = {
      ...TWO_CLINICS,
      orders: [order('sr-1', ENDOSCOPY)],
      offerings: [
        {
          practiceId: 'pr-sur',
          practiceSiteId: 's-sur',
          serviceConceptId: ENDOSCOPY,
        },
        {
          practiceId: 'pr-norte',
          practiceSiteId: 's-norte',
          serviceConceptId: ENDOSCOPY,
        },
      ],
    };
    const near = await build(world).service.findForOwnOrders(titular, {
      lat: -16.54,
      lng: -68.08,
    });
    expect(near.centers.map((c) => c.siteId)).toEqual(['s-sur', 's-norte']);

    const withoutOrigin = await build(world).service.findForOwnOrders(
      titular,
      {},
    );
    expect(withoutOrigin.centers.every((c) => c.distanceKm === null)).toBe(
      true,
    );
    // Sin distancia, por nombre del establecimiento.
    expect(withoutOrigin.centers.map((c) => c.practiceName)).toEqual([
      'Clínica Norte',
      'Clínica Sur',
    ]);
  });

  it('un servicio sin sede vale para todas las sedes abiertas de su establecimiento', async () => {
    const { service } = build({
      orders: [order('sr-1', ENDOSCOPY)],
      practices: [{ id: 'pr-1', name: 'Hospital Central' }],
      sites: [
        { id: 's-a', practiceId: 'pr-1', name: 'Sede A' },
        { id: 's-b', practiceId: 'pr-1', name: 'Sede B' },
      ],
      offerings: [
        {
          practiceId: 'pr-1',
          practiceSiteId: null,
          serviceConceptId: ENDOSCOPY,
        },
      ],
    });
    const result = await service.findForOwnOrders(titular, {});
    expect(result.centers.map((c) => c.siteId)).toEqual(['s-a', 's-b']);
    expect(result.centers.every((c) => c.complete)).toBe(true);
    // Sin dirección cargada, lo dice con nulls en vez de inventar una.
    expect(result.centers[0]).toMatchObject({
      addressText: null,
      latitude: null,
      longitude: null,
    });
  });

  it('un servicio de una sede cerrada o ajena no hace aparecer ninguna sede', async () => {
    const { service } = build({
      orders: [order('sr-1', ENDOSCOPY)],
      practices: [{ id: 'pr-1', name: 'Hospital Central' }],
      // `findOpenSites` ya dejó afuera la sede `s-cerrada`.
      sites: [{ id: 's-abierta', practiceId: 'pr-1', name: 'Sede abierta' }],
      offerings: [
        {
          practiceId: 'pr-1',
          practiceSiteId: 's-cerrada',
          serviceConceptId: ENDOSCOPY,
        },
      ],
    });
    const result = await service.findForOwnOrders(titular, {});
    expect(result.centers).toEqual([]);
  });

  it('si el establecimiento no está activo, su oferta no cuenta', async () => {
    const { service, readRepo } = build({
      orders: [order('sr-1', ENDOSCOPY)],
      practices: [],
      offerings: [
        {
          practiceId: 'pr-baja',
          practiceSiteId: null,
          serviceConceptId: ENDOSCOPY,
        },
      ],
    });
    const result = await service.findForOwnOrders(titular, {});
    expect(result.centers).toEqual([]);
    expect(readRepo.findOpenSites).not.toHaveBeenCalled();
  });

  it('respeta el tope pero informa el total', async () => {
    const { service } = build({
      ...TWO_CLINICS,
      orders: [order('sr-1', ENDOSCOPY)],
      offerings: [
        {
          practiceId: 'pr-sur',
          practiceSiteId: null,
          serviceConceptId: ENDOSCOPY,
        },
        {
          practiceId: 'pr-norte',
          practiceSiteId: null,
          serviceConceptId: ENDOSCOPY,
        },
      ],
    });
    const result = await service.findForOwnOrders(titular, { limit: 1 });
    expect(result.centers).toHaveLength(1);
    expect(result.total).toBe(2);
    expect(result.limit).toBe(1);
  });

  it('lat sin lng se rechaza con 400', async () => {
    const { service } = build();
    await expect(
      service.findForOwnOrders(titular, { lat: -16.5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('el log no lleva qué procedimientos son, sólo cuántos', async () => {
    const { service, logger } = build({ orders: [order('sr-1', ENDOSCOPY)] });
    await service.findForOwnOrders(titular, {});
    const logged = JSON.stringify(logger.info.mock.calls);
    expect(logged).not.toContain(ENDOSCOPY);
    expect(logged).toContain('"procedimientos":1');
  });
});
