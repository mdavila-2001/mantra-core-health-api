import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticPricingService } from './diagnostic-pricing.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { DUNIT } from '../diagnostic_units.concepts';
import { DiagnosticUnitsErrorReason } from '../diagnostic_units.error-reasons';
import { DiagnosticUnitScopeService } from './diagnostic-unit-scope.service';

const T1 = '11111111-1111-4111-8111-111111111111';
const T2 = '22222222-2222-4222-8222-222222222222';

/**
 * Devuelve el servicio con cada método ejecutándose dentro del contexto de
 * `tenantId`, como lo deja el interceptor de tenant en una petición real.
 */
function inTenant<T extends object>(service: T, tenantId: string = T1): T {
  return new Proxy(service, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenantId, () => value.apply(target, args));
    },
  });
}

/** Exige el 404 uniforme: mismo `reason`, sin `details`. */
async function expectOutOfScope(promise: Promise<unknown>) {
  const error: any = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  expect(error.getStatus()).toBe(404);
  expect(error.reason).toBe(
    DiagnosticUnitsErrorReason.DIAGNOSTIC_UNIT_RESOURCE_OUT_OF_SCOPE,
  );
  expect(error.details).toBeUndefined();
  return error;
}

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const unitsRepo = { findById: mockFn() };
  const schedulesRepo = {
    findById: mockFn(),
    findByCode: mockFn(),
    create: mockFn(),
  };
  const offeringsRepo = { findById: mockFn() };
  const pricesRepo = {
    findById: mockFn(),
    findActive: mockFn().mockResolvedValue(null),
    maxVersion: mockFn().mockResolvedValue(0),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const sitesRepo = { findById: mockFn() };
  const scope = new DiagnosticUnitScopeService(
    unitsRepo as any,
    sitesRepo as any,
    {} as any,
    {} as any,
    offeringsRepo as any,
    schedulesRepo as any,
    pricesRepo as any,
  );
  const service = inTenant(
    new DiagnosticPricingService(
      em as any,
      scope,
      schedulesRepo,
      pricesRepo,
      logger as any,
    ),
  );
  return {
    service,
    tx,
    unitsRepo,
    sitesRepo,
    schedulesRepo,
    offeringsRepo,
    pricesRepo,
  };
}

const activeUnit = {
  id: 'u1',
  tenantId: T1,
  statusConceptId: DUNIT.UNIT_ACTIVE,
};
const foreignUnit = { ...activeUnit, tenantId: T2 };

describe('DiagnosticPricingService', () => {
  describe('createSchedule (UC-23-06)', () => {
    it('rejects a duplicate schedule code (conflict)', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.schedulesRepo.findByCode.mockResolvedValue({ id: 'e1' });
      await expect(
        d.service.createSchedule('u1', { code: 'PS-1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a schedule for an active unit', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.schedulesRepo.findByCode.mockResolvedValue(null);
      d.schedulesRepo.create.mockReturnValue({
        id: 'ps1',
        code: 'PS-1',
        statusConceptId: DUNIT.SCHEDULE_ACTIVE,
      });
      const res = await d.service.createSchedule('u1', { code: 'PS-1' }, actor);
      expect(res).toEqual({
        id: 'ps1',
        code: 'PS-1',
        status: DUNIT.SCHEDULE_ACTIVE,
      });
    });
  });

  describe('addStudyPrice (UC-23-07)', () => {
    it('rejects when the offering belongs to another unit (precondition)', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.schedulesRepo.findById.mockResolvedValue({
        id: 'ps1',
        diagnosticUnitId: 'u1',
        statusConceptId: DUNIT.SCHEDULE_ACTIVE,
      });
      d.offeringsRepo.findById.mockResolvedValue({
        id: 'o1',
        diagnosticUnitId: 'other',
      });
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      await expect(
        d.service.addStudyPrice(
          'ps1',
          { diagnosticStudyOfferingId: 'o1', baseAmount: '10' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('versions append-only: closes current active and creates next version', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.schedulesRepo.findById.mockResolvedValue({
        id: 'ps1',
        diagnosticUnitId: 'u1',
        statusConceptId: DUNIT.SCHEDULE_ACTIVE,
      });
      d.offeringsRepo.findById.mockResolvedValue({
        id: 'o1',
        diagnosticUnitId: 'u1',
      });
      const current = {
        effectiveTo: undefined,
        statusConceptId: DUNIT.PRICE_ACTIVE,
      };
      d.pricesRepo.findActive.mockResolvedValue(current);
      d.pricesRepo.maxVersion.mockResolvedValue(2);
      d.pricesRepo.create.mockReturnValue({
        id: 'pr3',
        versionNumber: 3,
        statusConceptId: DUNIT.PRICE_ACTIVE,
        effectiveFrom: new Date(),
      });

      const res = await d.service.addStudyPrice(
        'ps1',
        { diagnosticStudyOfferingId: 'o1', baseAmount: '120.00' },
        actor,
      );
      expect(res.versionNumber).toBe(3);
      expect(current.statusConceptId).toBe(DUNIT.PRICE_SUPERSEDED);
      expect(current.effectiveTo).toBeDefined();
      expect(d.pricesRepo.create).toHaveBeenCalled();
    });

    it('throws when the schedule does not exist', async () => {
      const d = build();
      d.schedulesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.addStudyPrice(
          'missing',
          { diagnosticStudyOfferingId: 'o1', baseAmount: '10' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('closePrice (UC-23-08)', () => {
    it('rejects closing a price that is not active/open (precondition)', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.schedulesRepo.findById.mockResolvedValue({
        id: 'ps1',
        diagnosticUnitId: 'u1',
      });
      d.pricesRepo.findById.mockResolvedValue({
        id: 'pr1',
        priceScheduleId: 'ps1',
        statusConceptId: DUNIT.PRICE_ACTIVE,
        effectiveTo: new Date(),
      });
      await expect(d.service.closePrice('pr1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('closes an active open price (retires it, append-only)', async () => {
      const d = build();
      const price = {
        id: 'pr1',
        priceScheduleId: 'ps1',
        statusConceptId: DUNIT.PRICE_ACTIVE,
        effectiveTo: undefined,
      };
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.schedulesRepo.findById.mockResolvedValue({
        id: 'ps1',
        diagnosticUnitId: 'u1',
      });
      d.pricesRepo.findById.mockResolvedValue(price);
      const res = await d.service.closePrice('pr1', actor);
      expect(res).toEqual({ ok: true });
      expect(price.statusConceptId).toBe(DUNIT.PRICE_RETIRED);
      expect(price.effectiveTo).toBeDefined();
    });
  });

  describe('alcance de tenant (DUNIT-01)', () => {
    it('A crea cronograma para una unidad activa de A', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.schedulesRepo.findByCode.mockResolvedValue(null);
      d.schedulesRepo.create.mockReturnValue({
        id: 'ps1',
        code: 'PS-1',
        statusConceptId: DUNIT.SCHEDULE_ACTIVE,
      });
      await d.service.createSchedule('u1', { code: 'PS-1' } as any, actor);
      expect(d.schedulesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ diagnosticUnitId: 'u1' }),
      );
    });

    it('crear cronograma en una unidad de otro tenant responde 404 uniforme', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(foreignUnit);
      await expectOutOfScope(
        d.service.createSchedule('u1', { code: 'PS-1' } as any, actor),
      );
      expect(d.schedulesRepo.create).not.toHaveBeenCalled();
    });

    it('un sitio del cuerpo de otra unidad no se acepta', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.sitesRepo.findById.mockResolvedValue({
        id: 's9',
        diagnosticUnitId: 'u-otra',
      });
      await expectOutOfScope(
        d.service.createSchedule(
          'u1',
          { code: 'PS-1', diagnosticUnitSiteId: 's9' } as any,
          actor,
        ),
      );
      expect(d.schedulesRepo.create).not.toHaveBeenCalled();
    });

    it('versionar precio sobre un cronograma de otro tenant no escribe', async () => {
      const d = build();
      d.schedulesRepo.findById.mockResolvedValue({
        id: 'psB',
        diagnosticUnitId: 'uB',
        statusConceptId: DUNIT.SCHEDULE_ACTIVE,
      });
      d.unitsRepo.findById.mockResolvedValue(foreignUnit);
      await expectOutOfScope(
        d.service.addStudyPrice(
          'psB',
          { diagnosticStudyOfferingId: 'oB', baseAmount: '10' } as any,
          actor,
        ),
      );
      expect(d.pricesRepo.create).not.toHaveBeenCalled();
    });

    it('una oferta ajena en el cuerpo se rechaza aunque el cronograma sea propio', async () => {
      const d = build();
      d.schedulesRepo.findById.mockResolvedValue({
        id: 'ps1',
        diagnosticUnitId: 'u1',
        statusConceptId: DUNIT.SCHEDULE_ACTIVE,
      });
      d.offeringsRepo.findById.mockResolvedValue({
        id: 'oB',
        diagnosticUnitId: 'uB',
      });
      d.unitsRepo.findById.mockImplementation((_tx: any, id: string) =>
        Promise.resolve(id === 'u1' ? activeUnit : foreignUnit),
      );
      await expectOutOfScope(
        d.service.addStudyPrice(
          'ps1',
          { diagnosticStudyOfferingId: 'oB', baseAmount: '10' } as any,
          actor,
        ),
      );
      expect(d.pricesRepo.findActive).not.toHaveBeenCalled();
      expect(d.pricesRepo.create).not.toHaveBeenCalled();
    });

    it('cerrar un precio de otro tenant conserva su estado y vigencia', async () => {
      const d = build();
      const price: any = {
        id: 'prB',
        priceScheduleId: 'psB',
        statusConceptId: DUNIT.PRICE_ACTIVE,
        effectiveTo: undefined,
      };
      d.pricesRepo.findById.mockResolvedValue(price);
      d.schedulesRepo.findById.mockResolvedValue({
        id: 'psB',
        diagnosticUnitId: 'uB',
      });
      d.unitsRepo.findById.mockResolvedValue(foreignUnit);
      await expectOutOfScope(d.service.closePrice('prB', actor));
      expect(price.statusConceptId).toBe(DUNIT.PRICE_ACTIVE);
      expect(price.effectiveTo).toBeUndefined();
    });

    it('un precio ajeno responde igual que uno inexistente', async () => {
      const ajeno = build();
      ajeno.pricesRepo.findById.mockResolvedValue({
        id: 'prB',
        priceScheduleId: 'psB',
      });
      ajeno.schedulesRepo.findById.mockResolvedValue({
        id: 'psB',
        diagnosticUnitId: 'uB',
      });
      ajeno.unitsRepo.findById.mockResolvedValue(foreignUnit);
      const inexistente = build();
      inexistente.pricesRepo.findById.mockResolvedValue(null);
      const a = await expectOutOfScope(ajeno.service.closePrice('prB', actor));
      const b = await expectOutOfScope(
        inexistente.service.closePrice('prB', actor),
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });
  });
});
