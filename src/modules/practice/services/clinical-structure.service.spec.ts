import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ClinicalStructureService } from './clinical-structure.service';
import { PRAC } from '../practice.concepts';
import { ForbiddenException } from '@nestjs/common';
import { UniqueConstraintViolationException } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { PracticeErrorReason } from '../practice.error-reasons';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/**
 * Devuelve el servicio de modo que cada llamada corra con `tenantId` como
 * tenant activo, igual que lo deja el `TenantContextInterceptor`.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant del contexto de la petición.
 * @returns Un proxy que ejecuta cada método dentro de `runWithTenant`.
 */
function inTenant<T extends object>(service: T, tenantId: string): T {
  return new Proxy(service, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenantId, () => value.apply(target, args));
    },
  });
}

/**
 * Mock de `PracticesRepository.findById`. Las prácticas de prueba son del tenant
 * activo (`TENANT_A`) salvo que la propia práctica declare otro `tenantId`; sin
 * configurar, resuelve una práctica del tenant activo (la dueña de los hijos).
 *
 * @returns Un `jest.fn` cuyo `mockResolvedValue` sella el tenant de la práctica.
 */
function practiceLookupMock(): any {
  const lookup = mockFn();
  const resolve = lookup.mockResolvedValue.bind(lookup);
  const stamp = (row: any) =>
    row && typeof row === 'object' && row.tenantId === undefined
      ? Object.assign(row, { tenantId: TENANT_A })
      : row;
  lookup.mockResolvedValue = (row: any) => resolve(stamp(row));
  resolve(stamp({ id: 'p1' }));
  return lookup;
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const practicesRepo = { findById: practiceLookupMock() };
  const sitesRepo = { findById: mockFn() };
  const unitsRepo = {
    findById: mockFn(),
    findBySite: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const spacesRepo = {
    findById: mockFn(),
    findBySite: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const servicesRepo = {
    create: mockFn(),
    findBySiteAndConcept: mockFn().mockResolvedValue(null),
  };
  const administration = {
    assertCanAdministerPractice: mockFn().mockResolvedValue({
      id: 'p1',
      tenantId: TENANT_A,
      statusConceptId: PRAC.PRACTICE_ACTIVE,
    }),
  };
  const catalogRepo = { findById: mockFn() };
  const procedures = { isProcedure: mockFn().mockResolvedValue(true) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ClinicalStructureService(
    em as any,
    practicesRepo as any,
    sitesRepo as any,
    unitsRepo,
    spacesRepo,
    servicesRepo as any,
    administration as any,
    catalogRepo as any,
    procedures as any,
    logger as any,
  );
  return {
    service: inTenant(service, TENANT_A),
    raw: service,
    tx,
    practicesRepo,
    sitesRepo,
    unitsRepo,
    spacesRepo,
    servicesRepo,
    administration,
    catalogRepo,
    procedures,
  };
}

const activeSite = { id: 's1', statusConceptId: PRAC.SITE_ACTIVE };

describe('ClinicalStructureService', () => {
  describe('createClinicalUnit (UC-14-04)', () => {
    it('throws when the site is missing', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.createClinicalUnit(
          's1',
          { code: 'U-1', name: 'Unit' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects a parent unit outside the site', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue(activeSite);
      d.unitsRepo.findById.mockResolvedValue({
        id: 'u0',
        practiceSiteId: 'other',
      });
      await expect(
        d.service.createClinicalUnit(
          's1',
          { code: 'U-1', name: 'Unit', parentUnitId: 'u0' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates an active unit', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue(activeSite);
      const created = {
        id: 'u1',
        practiceSiteId: 's1',
        code: 'U-1',
        statusConceptId: PRAC.UNIT_ACTIVE,
        createdAt: new Date(),
      };
      d.unitsRepo.create.mockReturnValue(created);
      const res = await d.service.createClinicalUnit(
        's1',
        { code: 'U-1', name: 'Unit' },
        actor,
      );
      expect(res.status).toBe(PRAC.UNIT_ACTIVE);
    });
  });

  describe('createCareSpace (UC-14-05)', () => {
    it('rejects when the site is not active', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue({
        id: 's1',
        statusConceptId: 'other',
      });
      await expect(
        d.service.createCareSpace(
          's1',
          { code: 'C-1', name: 'Room' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates an available space', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue(activeSite);
      const created = {
        id: 'c1',
        practiceSiteId: 's1',
        code: 'C-1',
        statusConceptId: PRAC.SPACE_ACTIVE,
        operationalStatusConceptId: PRAC.SPACE_OP_AVAILABLE,
        createdAt: new Date(),
      };
      d.spacesRepo.create.mockReturnValue(created);
      const res = await d.service.createCareSpace(
        's1',
        { code: 'C-1', name: 'Room' },
        actor,
      );
      expect(res.operationalStatus).toBe(PRAC.SPACE_OP_AVAILABLE);
    });
  });

  describe('moveCareSpace', () => {
    const spaces = () => [
      { id: 'a', practiceSiteId: 's1', code: 'A', parentSpaceId: undefined },
      { id: 'b', practiceSiteId: 's1', code: 'B', parentSpaceId: 'a' },
      { id: 'c', practiceSiteId: 's1', code: 'C', parentSpaceId: 'b' },
      { id: 'e', practiceSiteId: 's1', code: 'E', parentSpaceId: undefined },
    ];

    it('recalcula la ruta del espacio y sus descendientes y refresca el acceso del apoyo', async () => {
      const d = build();
      const refreshTenant = mockFn().mockResolvedValue(undefined);
      (d.raw as any).supportAccess = { refreshTenant };
      d.sitesRepo.findById.mockResolvedValue(activeSite);
      const rows = spaces();
      d.spacesRepo.findBySite.mockResolvedValue(rows);
      await d.service.moveCareSpace('s1', 'b', { parentSpaceId: 'e' }, actor);
      const byId = Object.fromEntries(rows.map((r: any) => [r.id, r]));
      expect(byId.b.parentSpaceId).toBe('e');
      expect(byId.b.locationPath).toBe('/s1/e/b/');
      expect(byId.c.locationPath).toBe('/s1/e/b/c/');
      expect(byId.a.locationPath).toBeUndefined();
      expect(refreshTenant).toHaveBeenCalledWith(TENANT_A, { tx: d.tx });
    });

    it('B5: si el recálculo del acceso falla, el error se propaga y el cambio no se confirma', async () => {
      const d = build();
      (d.raw as any).supportAccess = {
        refreshTenant: mockFn().mockRejectedValue(new Error('refresh falló')),
      };
      d.sitesRepo.findById.mockResolvedValue(activeSite);
      d.spacesRepo.findBySite.mockResolvedValue(spaces());
      await expect(
        d.service.moveCareSpace('s1', 'b', { parentSpaceId: 'e' }, actor),
      ).rejects.toThrow('refresh falló');
    });

    it('sin padre deja el espacio en la raíz de la sede', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue(activeSite);
      const rows = spaces();
      d.spacesRepo.findBySite.mockResolvedValue(rows);
      await d.service.moveCareSpace('s1', 'b', { parentSpaceId: null }, actor);
      expect((rows[1] as any).parentSpaceId).toBeUndefined();
      expect((rows[1] as any).locationPath).toBe('/s1/b/');
    });

    it('rechaza un ciclo y no escribe nada', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue(activeSite);
      d.spacesRepo.findBySite.mockResolvedValue(spaces());
      await expect(
        d.service.moveCareSpace('s1', 'a', { parentSpaceId: 'c' }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('rechaza un espacio de otra sede', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue(activeSite);
      d.spacesRepo.findBySite.mockResolvedValue(spaces());
      await expect(
        d.service.moveCareSpace('s1', 'zz', { parentSpaceId: null }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('publishHealthcareService (UC-14-06, A-6, A-13)', () => {
    const PROCEDURE = 'proc-endoscopia';
    const dto = (overrides: Record<string, unknown> = {}): any => ({
      practiceSiteId: 's1',
      serviceConceptId: PROCEDURE,
      serviceCatalogId: 'cat-1',
      ...overrides,
    });
    const goodItem = (overrides: Record<string, unknown> = {}): any => ({
      id: 'cat-1',
      practiceId: 'p1',
      isActive: true,
      serviceConceptId: PROCEDURE,
      ...overrides,
    });

    /**
     * Sistema bajo prueba listo para publicar: sede de la práctica y un ítem de
     * catálogo que sirve.
     * @returns Resultado de build.
     */
    function ready() {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue({ id: 's1', practiceId: 'p1' });
      d.catalogRepo.findById.mockResolvedValue(goodItem());
      d.servicesRepo.create.mockImplementation((_tx: any, data: any) => ({
        id: 'hs1',
        practiceId: data.practiceId,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
        ...data,
      }));
      return d;
    }

    it('throws when the practice is missing', async () => {
      const d = build();
      d.administration.assertCanAdministerPractice.mockRejectedValue(
        new ResourceNotFoundException('Práctica no encontrada'),
      );
      await expect(
        d.service.publishHealthcareService('p1', dto(), actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.servicesRepo.create).not.toHaveBeenCalled();
    });

    it('el administrador de otra organización recibe 403 y no se persiste nada', async () => {
      const d = ready();
      d.administration.assertCanAdministerPractice.mockRejectedValue(
        new ForbiddenException('otra organización'),
      );

      await expect(
        d.service.publishHealthcareService('p1', dto(), actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.servicesRepo.create).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('rejects when the practice is not active', async () => {
      const d = ready();
      d.administration.assertCanAdministerPractice.mockResolvedValue({
        id: 'p1',
        statusConceptId: 'otra',
      });

      await expect(
        d.service.publishHealthcareService('p1', dto(), actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('publishes an active service y guarda el ítem de catálogo que fija el precio', async () => {
      const d = ready();

      const res = await d.service.publishHealthcareService('p1', dto(), actor);

      expect(res.status).toBe(PRAC.SERVICE_ACTIVE);
      expect(d.servicesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          practiceId: 'p1',
          practiceSiteId: 's1',
          serviceConceptId: PROCEDURE,
          serviceCatalogId: 'cat-1',
          statusConceptId: PRAC.SERVICE_ACTIVE,
        }),
      );
    });

    it('una sede de otra práctica da 422', async () => {
      const d = ready();
      d.sitesRepo.findById.mockResolvedValue({ id: 's1', practiceId: 'otra' });

      await expect(
        d.service.publishHealthcareService('p1', dto(), actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.servicesRepo.create).not.toHaveBeenCalled();
    });

    it('un concepto fuera de VS_BO_MEDICAL_PROCEDURE da 422', async () => {
      const d = ready();
      d.procedures.isProcedure.mockResolvedValue(false);

      const failure = await d.service
        .publishHealthcareService('p1', dto(), actor)
        .catch((e: unknown) => e);

      expect(failure).toBeInstanceOf(PreconditionFailedException);
      expect((failure as PreconditionFailedException).reason).toBe(
        PracticeErrorReason.SERVICE_CONCEPT_NOT_A_PROCEDURE,
      );
      expect(d.servicesRepo.create).not.toHaveBeenCalled();
    });

    it.each([
      ['de otra práctica', { practiceId: 'otra' }],
      ['con otro serviceConceptId', { serviceConceptId: 'otro-proc' }],
      ['inactivo', { isActive: false }],
    ])('un ítem de catálogo %s da 422', async (_name, change) => {
      const d = ready();
      d.catalogRepo.findById.mockResolvedValue(goodItem(change));

      const failure = await d.service
        .publishHealthcareService('p1', dto(), actor)
        .catch((e: unknown) => e);

      expect(failure).toBeInstanceOf(PreconditionFailedException);
      expect((failure as PreconditionFailedException).reason).toBe(
        PracticeErrorReason.CATALOG_ITEM_NOT_ELIGIBLE,
      );
      expect(d.servicesRepo.create).not.toHaveBeenCalled();
    });

    it('un ítem de catálogo inexistente da 422', async () => {
      const d = ready();
      d.catalogRepo.findById.mockResolvedValue(null);

      await expect(
        d.service.publishHealthcareService('p1', dto(), actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('la misma sede y el mismo procedimiento por segunda vez da 409', async () => {
      const d = ready();
      d.servicesRepo.findBySiteAndConcept.mockResolvedValue({ id: 'hs0' });

      const failure = await d.service
        .publishHealthcareService('p1', dto(), actor)
        .catch((e: unknown) => e);

      expect(failure).toBeInstanceOf(ConflictException);
      expect((failure as ConflictException).reason).toBe(
        PracticeErrorReason.SERVICE_ALREADY_OFFERED_AT_SITE,
      );
      expect(d.servicesRepo.create).not.toHaveBeenCalled();
    });

    it('una violación del único ux_healthcare_services_site_service (23505) también da 409', async () => {
      const d = ready();
      d.tx.flush.mockRejectedValue(
        new UniqueConstraintViolationException(new Error('duplicate key')),
      );

      await expect(
        d.service.publishHealthcareService('p1', dto(), actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('A-13: dos sedes de la misma práctica pueden fijar su precio con ítems distintos', async () => {
      const d = ready();
      d.sitesRepo.findById.mockImplementation((_tx: any, id: string) =>
        Promise.resolve({ id, practiceId: 'p1' }),
      );
      d.catalogRepo.findById.mockImplementation((_tx: any, id: string) =>
        Promise.resolve(goodItem({ id })),
      );

      await d.service.publishHealthcareService(
        'p1',
        dto({ practiceSiteId: 's1', serviceCatalogId: 'cat-norte' }),
        actor,
      );
      await d.service.publishHealthcareService(
        'p1',
        dto({ practiceSiteId: 's2', serviceCatalogId: 'cat-sur' }),
        actor,
      );

      const created = d.servicesRepo.create.mock.calls.map((call: any[]) => [
        call[1].practiceSiteId,
        call[1].serviceCatalogId,
      ]);
      expect(created).toEqual([
        ['s1', 'cat-norte'],
        ['s2', 'cat-sur'],
      ]);
    });
  });
});

/** Aserciones del 404 uniforme de PRAC-01. */
async function expectOutOfScope(promise: Promise<unknown>, message: string) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  const exception = error as ResourceNotFoundException;
  expect(exception.getStatus()).toBe(404);
  expect(exception.message).toBe(message);
  expect(exception.reason).toBe(
    PracticeErrorReason.PRACTICE_RESOURCE_OUT_OF_SCOPE,
  );
  expect(exception.details).toBeUndefined();
  return exception;
}

describe('ClinicalStructureService · alcance de tenant (PRAC-01)', () => {
  const siteOf = (practiceId = 'p1'): any => ({
    id: 's1',
    practiceId,
    statusConceptId: PRAC.SITE_ACTIVE,
  });
  const foreignPractice = (): any => ({
    id: 'p1',
    tenantId: TENANT_B,
    statusConceptId: PRAC.PRACTICE_ACTIVE,
  });

  it('crear unidad o espacio con el siteId de otro tenant: 404 uniforme; no se persiste hijo', async () => {
    const d = build();
    d.sitesRepo.findById.mockResolvedValue(siteOf());
    d.practicesRepo.findById.mockResolvedValue(foreignPractice());

    const unit = await expectOutOfScope(
      d.service.createClinicalUnit(
        's1',
        { code: 'U-1', name: 'Unit' } as any,
        actor,
      ),
      'Sitio no encontrado',
    );
    const space = await expectOutOfScope(
      d.service.createCareSpace(
        's1',
        { code: 'E-1', name: 'Space' } as any,
        actor,
      ),
      'Sitio no encontrado',
    );

    expect(unit.getResponse()).toEqual(space.getResponse());
    expect(d.unitsRepo.create).not.toHaveBeenCalled();
    expect(d.spacesRepo.create).not.toHaveBeenCalled();
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('el sitio de otro tenant responde igual que un sitio inexistente', async () => {
    const d = build();
    d.sitesRepo.findById.mockResolvedValue(siteOf());
    d.practicesRepo.findById.mockResolvedValue(foreignPractice());
    const foreign = await expectOutOfScope(
      d.service.createClinicalUnit(
        's1',
        { code: 'U', name: 'U' } as any,
        actor,
      ),
      'Sitio no encontrado',
    );
    d.sitesRepo.findById.mockResolvedValue(null);
    const missing = await expectOutOfScope(
      d.service.createClinicalUnit(
        's1',
        { code: 'U', name: 'U' } as any,
        actor,
      ),
      'Sitio no encontrado',
    );

    expect(foreign.getResponse()).toEqual(missing.getResponse());
  });

  it('sin tenant en el contexto no se crea la unidad', async () => {
    const d = build();

    await expect(
      d.raw.createClinicalUnit('s1', { code: 'U', name: 'U' } as any, actor),
    ).rejects.toThrow();
    expect(d.sitesRepo.findById).not.toHaveBeenCalled();
  });

  it('publicar un servicio con una unidad de otra práctica se rechaza como unidad inexistente', async () => {
    const d = build();
    d.unitsRepo.findById.mockResolvedValue({ id: 'u1', practiceSiteId: 's9' });
    d.sitesRepo.findById.mockImplementation((_tx: any, id: string) =>
      Promise.resolve(id === 's9' ? siteOf('practica-de-b') : siteOf('p1')),
    );

    await expect(
      d.service.publishHealthcareService(
        'p1',
        {
          practiceSiteId: 's1',
          serviceConceptId: 'proc',
          serviceCatalogId: 'cat',
          clinicalUnitId: 'u1',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.servicesRepo.create).not.toHaveBeenCalled();
  });
});
