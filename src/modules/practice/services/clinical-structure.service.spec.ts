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
import {
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
  const servicesRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ClinicalStructureService(
    em as any,
    practicesRepo as any,
    sitesRepo as any,
    unitsRepo,
    spacesRepo,
    servicesRepo as any,
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

  describe('publishHealthcareService (UC-14-06)', () => {
    it('throws when the practice is missing', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.publishHealthcareService('p1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('publishes an active service', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
      });
      const created = {
        id: 'hs1',
        practiceId: 'p1',
        statusConceptId: PRAC.SERVICE_ACTIVE,
        createdAt: new Date(),
      };
      d.servicesRepo.create.mockReturnValue(created);
      const res = await d.service.publishHealthcareService('p1', {}, actor);
      expect(res.status).toBe(PRAC.SERVICE_ACTIVE);
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

  it('publicar un servicio en la práctica de otro tenant: 404 uniforme y no persiste', async () => {
    const d = build();
    d.practicesRepo.findById.mockResolvedValue(foreignPractice());

    await expectOutOfScope(
      d.service.publishHealthcareService('p1', {} as any, actor),
      'Práctica no encontrada',
    );

    expect(d.servicesRepo.create).not.toHaveBeenCalled();
  });

  it('publicar un servicio con una unidad de otra práctica se rechaza como unidad inexistente', async () => {
    const d = build();
    d.practicesRepo.findById.mockResolvedValue({
      id: 'p1',
      tenantId: TENANT_A,
      statusConceptId: PRAC.PRACTICE_ACTIVE,
    });
    d.unitsRepo.findById.mockResolvedValue({ id: 'u1', practiceSiteId: 's9' });
    d.sitesRepo.findById.mockResolvedValue(siteOf('practica-de-b'));

    await expect(
      d.service.publishHealthcareService(
        'p1',
        { clinicalUnitId: 'u1' } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.servicesRepo.create).not.toHaveBeenCalled();
  });
});
