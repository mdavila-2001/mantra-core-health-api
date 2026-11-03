import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticStudiesService } from './diagnostic-studies.service';
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
  const offeringsRepo = {
    findById: mockFn(),
    findByStudyCode: mockFn(),
    create: mockFn(),
  };
  const componentsRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const sitesRepo = { findById: mockFn() };
  const scope = new DiagnosticUnitScopeService(
    unitsRepo as any,
    sitesRepo as any,
    {} as any,
    {} as any,
    offeringsRepo as any,
    {} as any,
    {} as any,
  );
  const raw = new DiagnosticStudiesService(
    em as any,
    scope,
    offeringsRepo,
    componentsRepo,
    logger as any,
  );
  return {
    raw,
    service: inTenant(raw),
    tx,
    unitsRepo,
    sitesRepo,
    offeringsRepo,
    componentsRepo,
  };
}

const activeUnit = {
  id: 'u1',
  tenantId: T1,
  statusConceptId: DUNIT.UNIT_ACTIVE,
};
const foreignUnit = { ...activeUnit, tenantId: T2 };

describe('DiagnosticStudiesService', () => {
  describe('createOffering (UC-23-05)', () => {
    it('rejects when the unit does not exist', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.createOffering(
          'missing',
          { studyCode: 'S', studyConceptId: 'c', displayName: 'x' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects a duplicate study code (conflict)', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.offeringsRepo.findByStudyCode.mockResolvedValue({ id: 'e1' });
      await expect(
        d.service.createOffering(
          'u1',
          { studyCode: 'S', studyConceptId: 'c', displayName: 'x' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates the offering, flushes before components and returns count', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.offeringsRepo.findByStudyCode.mockResolvedValue(null);
      d.offeringsRepo.create.mockReturnValue({
        id: 'o1',
        studyCode: 'S',
        statusConceptId: DUNIT.OFFERING_ACTIVE,
      });
      d.offeringsRepo.findById.mockResolvedValue({
        id: 'o2',
        diagnosticUnitId: 'u1',
      });
      const res = await d.service.createOffering(
        'u1',
        {
          studyCode: 'S',
          studyConceptId: 'c',
          displayName: 'x',
          components: [{ componentOfferingId: 'o2' }],
        },
        actor,
      );
      expect(res.componentCount).toBe(1);
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.componentsRepo.create).toHaveBeenCalledTimes(1);
    });

    it('rejects a self-referencing panel component (precondition)', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.offeringsRepo.findById.mockResolvedValue({
        id: 'o1',
        diagnosticUnitId: 'u1',
      });
      d.offeringsRepo.findByStudyCode.mockResolvedValue(null);
      d.offeringsRepo.create.mockReturnValue({
        id: 'o1',
        studyCode: 'S',
        statusConceptId: DUNIT.OFFERING_ACTIVE,
      });
      await expect(
        d.service.createOffering(
          'u1',
          {
            studyCode: 'S',
            studyConceptId: 'c',
            displayName: 'x',
            components: [{ componentOfferingId: 'o1' }],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('retireOffering (UC-23-08)', () => {
    it('throws when the offering does not exist', async () => {
      const d = build();
      d.offeringsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.retireOffering('missing', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('soft-retires an active offering', async () => {
      const d = build();
      const offering = {
        id: 'o1',
        diagnosticUnitId: 'u1',
        statusConceptId: DUNIT.OFFERING_ACTIVE,
        updatedAt: new Date(),
      };
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.offeringsRepo.findById.mockResolvedValue(offering);
      const res = await d.service.retireOffering('o1', actor);
      expect(res).toEqual({ ok: true });
      expect(offering.statusConceptId).toBe(DUNIT.OFFERING_RETIRED);
    });

    it('rejects retiring an already-retired offering (conflict)', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.offeringsRepo.findById.mockResolvedValue({
        id: 'o1',
        diagnosticUnitId: 'u1',
        statusConceptId: DUNIT.OFFERING_RETIRED,
      });
      await expect(
        d.service.retireOffering('o1', actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('alcance de tenant (DUNIT-01)', () => {
    const dto = { studyCode: 'S', studyConceptId: 'c', displayName: 'x' };

    it('publicar en una unidad de otro tenant responde 404 uniforme y no escribe', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(foreignUnit);
      await expectOutOfScope(d.service.createOffering('u1', dto as any, actor));
      expect(d.offeringsRepo.create).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('una unidad ajena responde igual que una inexistente', async () => {
      const ajena = build();
      ajena.unitsRepo.findById.mockResolvedValue(foreignUnit);
      const inexistente = build();
      inexistente.unitsRepo.findById.mockResolvedValue(null);
      const a = await expectOutOfScope(
        ajena.service.createOffering('u1', dto as any, actor),
      );
      const b = await expectOutOfScope(
        inexistente.service.createOffering('u1', dto as any, actor),
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('rechaza una oferta de otro tenant como componente y no crea nada', async () => {
      const d = build();
      d.unitsRepo.findById.mockImplementation((_tx: any, id: string) =>
        Promise.resolve(id === 'u1' ? activeUnit : foreignUnit),
      );
      d.offeringsRepo.findByStudyCode.mockResolvedValue(null);
      d.offeringsRepo.findById.mockResolvedValue({
        id: 'oB',
        diagnosticUnitId: 'uB',
      });
      await expectOutOfScope(
        d.service.createOffering(
          'u1',
          { ...dto, components: [{ componentOfferingId: 'oB' }] } as any,
          actor,
        ),
      );
      expect(d.offeringsRepo.create).not.toHaveBeenCalled();
      expect(d.componentsRepo.create).not.toHaveBeenCalled();
    });

    it('rechaza un sitio del cuerpo que no es de la unidad', async () => {
      const d = build();
      d.unitsRepo.findById.mockResolvedValue(activeUnit);
      d.sitesRepo.findById.mockResolvedValue({
        id: 's9',
        diagnosticUnitId: 'u-otra',
      });
      await expectOutOfScope(
        d.service.createOffering(
          'u1',
          { ...dto, diagnosticUnitSiteId: 's9' } as any,
          actor,
        ),
      );
      expect(d.offeringsRepo.create).not.toHaveBeenCalled();
    });

    it('retirar una oferta de otro tenant conserva su estado', async () => {
      const d = build();
      const offering = {
        id: 'oB',
        diagnosticUnitId: 'uB',
        statusConceptId: DUNIT.OFFERING_ACTIVE,
      };
      d.offeringsRepo.findById.mockResolvedValue(offering);
      d.unitsRepo.findById.mockResolvedValue(foreignUnit);
      await expectOutOfScope(d.service.retireOffering('oB', actor));
      expect(offering.statusConceptId).toBe(DUNIT.OFFERING_ACTIVE);
    });

    it('el administrador de B retira su propia oferta', async () => {
      const d = build();
      const offering = {
        id: 'oB',
        diagnosticUnitId: 'uB',
        statusConceptId: DUNIT.OFFERING_ACTIVE,
        updatedAt: new Date(),
      };
      d.offeringsRepo.findById.mockResolvedValue(offering);
      d.unitsRepo.findById.mockResolvedValue(foreignUnit);
      const service = inTenant(d.raw, T2);
      await expect(service.retireOffering('oB', actor)).resolves.toEqual({
        ok: true,
      });
      expect(offering.statusConceptId).toBe(DUNIT.OFFERING_RETIRED);
    });
  });
});
