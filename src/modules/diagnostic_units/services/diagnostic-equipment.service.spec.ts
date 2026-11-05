import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DiagnosticEquipmentService } from './diagnostic-equipment.service';
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
  const unitsRepo = {
    findById: mockFn().mockResolvedValue({ id: 'u1', tenantId: T1 }),
  };
  const sitesRepo = { findById: mockFn() };
  const equipmentRepo = {
    findById: mockFn(),
    findBySerial: mockFn().mockResolvedValue(null),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const scope = new DiagnosticUnitScopeService(
    unitsRepo as any,
    sitesRepo as any,
    {} as any,
    equipmentRepo as any,
    {} as any,
    {} as any,
    {} as any,
  );
  const service = inTenant(
    new DiagnosticEquipmentService(
      em as any,
      scope,
      equipmentRepo,
      logger as any,
      {
        authorize: mockFn(async (t: any, id: string) => ({
          equipment: await scope.equipment(t, id),
        })),
        announceChanges: mockFn().mockResolvedValue(undefined),
        authorizeDestination: mockFn().mockResolvedValue(undefined),
      } as any,
    ),
  );
  return { service, tx, unitsRepo, sitesRepo, equipmentRepo };
}

/**
 * Ejecuta la operación active site.
 * @returns Resultado de active site.
 */
const activeSite = () => ({
  id: 's1',
  diagnosticUnitId: 'u1',
  statusConceptId: DUNIT.SITE_ACTIVE,
  imagingAvailable: false,
  updatedAt: new Date(),
});

describe('DiagnosticEquipmentService', () => {
  describe('addEquipment (UC-23-09)', () => {
    it('rejects when the site is not active (precondition)', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue({
        id: 's1',
        diagnosticUnitId: 'u1',
        statusConceptId: 'other',
      });
      await expect(
        d.service.addEquipment(
          's1',
          { equipmentTypeConceptId: 'et1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicate serial number (conflict)', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue(activeSite());
      d.equipmentRepo.findBySerial.mockResolvedValue({ id: 'e1' });
      await expect(
        d.service.addEquipment(
          's1',
          { equipmentTypeConceptId: 'et1', serialNumber: 'SN1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('registers equipment and flips imaging_available on first imaging device', async () => {
      const d = build();
      const site = activeSite();
      d.sitesRepo.findById.mockResolvedValue(site);
      d.equipmentRepo.create.mockReturnValue({
        id: 'e1',
        operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
      });
      const res = await d.service.addEquipment(
        's1',
        { equipmentTypeConceptId: 'et1', modalityConceptId: 'mod1' },
        actor,
      );
      expect(res.id).toBe('e1');
      expect(site.imagingAvailable).toBe(true);
    });
  });

  describe('updateEquipment (UC-23-09)', () => {
    it('throws when the equipment does not exist', async () => {
      const d = build();
      d.equipmentRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.updateEquipment('missing', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('updates the operational status', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue(activeSite());
      const equipment = {
        id: 'e1',
        diagnosticUnitSiteId: 's1',
        operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
        updatedAt: new Date(),
      };
      d.equipmentRepo.findById.mockResolvedValue(equipment);
      const res = await d.service.updateEquipment(
        'e1',
        { operationalStatusConceptId: DUNIT.EQUIPMENT_MAINTENANCE },
        actor,
      );
      expect(res.operationalStatus).toBe(DUNIT.EQUIPMENT_MAINTENANCE);
    });
  });

  describe('alcance de tenant (DUNIT-01)', () => {
    const foreignUnit = { id: 'uB', tenantId: T2 };

    it('agregar equipo a un sitio de otro tenant responde 404 uniforme y no escribe', async () => {
      const d = build();
      const site = activeSite();
      d.sitesRepo.findById.mockResolvedValue(site);
      d.unitsRepo.findById.mockResolvedValue(foreignUnit);
      await expectOutOfScope(
        d.service.addEquipment(
          's1',
          { equipmentTypeConceptId: 'et1', modalityConceptId: 'm1' } as any,
          actor,
        ),
      );
      expect(d.equipmentRepo.create).not.toHaveBeenCalled();
      expect(site.imagingAvailable).toBe(false);
    });

    it('un sitio ajeno responde igual que uno inexistente', async () => {
      const ajeno = build();
      ajeno.sitesRepo.findById.mockResolvedValue(activeSite());
      ajeno.unitsRepo.findById.mockResolvedValue(foreignUnit);
      const inexistente = build();
      inexistente.sitesRepo.findById.mockResolvedValue(null);
      const dto = { equipmentTypeConceptId: 'et1' } as any;
      const a = await expectOutOfScope(
        ajeno.service.addEquipment('s1', dto, actor),
      );
      const b = await expectOutOfScope(
        inexistente.service.addEquipment('s1', dto, actor),
      );
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('actualizar un equipo de otro tenant no cambia su estado', async () => {
      const d = build();
      const equipment: any = {
        id: 'eB',
        diagnosticUnitSiteId: 's1',
        operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
        updatedAt: new Date(),
      };
      d.equipmentRepo.findById.mockResolvedValue(equipment);
      d.sitesRepo.findById.mockResolvedValue(activeSite());
      d.unitsRepo.findById.mockResolvedValue(foreignUnit);
      await expectOutOfScope(
        d.service.updateEquipment(
          'eB',
          { operationalStatusConceptId: DUNIT.EQUIPMENT_MAINTENANCE },
          actor,
        ),
      );
      expect(equipment.operationalStatusConceptId).toBe(
        DUNIT.EQUIPMENT_OPERATIONAL,
      );
    });

    it('un equipo cuyo sitio no existe responde 404 uniforme', async () => {
      const d = build();
      d.equipmentRepo.findById.mockResolvedValue({
        id: 'e1',
        diagnosticUnitSiteId: 'sX',
      });
      d.sitesRepo.findById.mockResolvedValue(null);
      await expectOutOfScope(d.service.updateEquipment('e1', {}, actor));
    });
  });
});
