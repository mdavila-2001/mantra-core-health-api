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
import { OpsErrorReason } from '../../practice/practice-ops.error-reasons';
import { FUNCTIONS } from '../../practice/infrastructure-catalog';
import { PRAC } from '../../practice/practice.concepts';
import { DiagnosticUnitScopeService } from './diagnostic-unit-scope.service';
import { EquipmentAgendaRegistry } from './equipment-agenda.port';

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
const orgAdmin = { id: 'org-1', roles: ['TENANT_ADMIN'] } as any;
const SPACE_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SPACE_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const PRACTICE_SITE = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const fnId = (code: string) => FUNCTIONS.byInput(code)!.id;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    refresh: mockFn().mockResolvedValue(undefined),
    execute: mockFn().mockResolvedValue([]),
  };
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
  const infra = { assertCan: mockFn().mockResolvedValue(undefined) };
  const state = { loadSpace: mockFn() };
  const outbox = {
    publishDomainEvent: mockFn().mockResolvedValue({ duplicate: false }),
  };
  const registry = new EquipmentAgendaRegistry();
  const agenda = {
    linkResource: mockFn().mockResolvedValue({
      id: 'r1',
      name: 'TC',
      stateConceptId: 'RES_ACTIVE',
    }),
    futureCommitments: mockFn().mockResolvedValue([]),
    syncStatus: mockFn().mockResolvedValue(undefined),
    relocateBookings: mockFn().mockResolvedValue(undefined),
  };
  registry.set(agenda as any);
  const service = inTenant(
    new DiagnosticEquipmentService(
      em as any,
      scope,
      equipmentRepo,
      logger as any,
      infra as any,
      state as any,
      outbox as any,
      registry,
    ),
  );
  return {
    service,
    tx,
    unitsRepo,
    sitesRepo,
    equipmentRepo,
    infra,
    state,
    outbox,
    registry,
    agenda,
  };
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

  // ---------------------------------------------------------------- F5a
  describe('F5a · ubicar el equipo en una sala', () => {
    /** Un equipo del sitio `s1` (sede de práctica `PRACTICE_SITE`) listo para editar. */
    function located(over: Record<string, unknown> = {}) {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue({
        ...activeSite(),
        practiceSiteId: PRACTICE_SITE,
      });
      const equipment: any = {
        id: 'e1',
        diagnosticUnitSiteId: 's1',
        operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
        modalityConceptId: 'mod-ct',
        updatedAt: new Date(),
        ...over,
      };
      d.equipmentRepo.findById.mockResolvedValue(equipment);
      return { d, equipment };
    }
    const space = (over: Record<string, unknown> = {}) => ({
      id: SPACE_A,
      code: 'TC-1',
      practiceSiteId: PRACTICE_SITE,
      spaceTypeConceptId: fnId('SPACE_FN_IMAGING_ROOM'),
      statusConceptId: PRAC.SPACE_ACTIVE,
      ...over,
    });

    it('ubica el equipo, mueve sus pasos y su agenda y publica el hecho en la misma transacción', async () => {
      const { d, equipment } = located();
      d.state.loadSpace.mockResolvedValue(space());
      const res = await d.service.updateEquipment(
        'e1',
        { careSpaceId: SPACE_A, aeTitle: '  CT_SALA1 ', stationName: 'CT-1' },
        actor,
      );
      expect(equipment.careSpaceId).toBe(SPACE_A);
      expect(equipment.aeTitle).toBe('CT_SALA1');
      expect(res).toMatchObject({
        careSpaceId: SPACE_A,
        aeTitle: 'CT_SALA1',
        stationName: 'CT-1',
      });
      const sqls = d.tx.execute.mock.calls.map((c: any[]) => String(c[0]));
      expect(sqls.some((q: string) => /for share/.test(q))).toBe(true);
      expect(
        sqls.some((q: string) =>
          /update diagnostics\.imaging_procedure_steps/.test(q),
        ),
      ).toBe(true);
      expect(d.agenda.relocateBookings).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          equipmentId: 'e1',
          tenantId: T1,
          careSpaceId: SPACE_A,
        }),
      );
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantId: T1,
          eventType: 'diagnostic_units.equipment.located',
          payloadJson: expect.objectContaining({
            careSpaceId: SPACE_A,
            previousCareSpaceId: null,
          }),
        }),
      );
    });

    it('una sala de otra sede es 422 EQUIPMENT_SPACE_SITE_MISMATCH y no escribe nada', async () => {
      const { d, equipment } = located();
      d.state.loadSpace.mockResolvedValue(
        space({ practiceSiteId: 'otra-sede' }),
      );
      await expect(
        d.service.updateEquipment('e1', { careSpaceId: SPACE_A }, actor),
      ).rejects.toMatchObject({
        reason: DiagnosticUnitsErrorReason.EQUIPMENT_SPACE_SITE_MISMATCH,
      });
      expect(equipment.careSpaceId).toBeUndefined();
      expect(d.tx.flush).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('una sala de otra organización es 404 (loadSpace es por tenant)', async () => {
      const { d } = located();
      d.state.loadSpace.mockRejectedValue(new ResourceNotFoundException('x'));
      await expect(
        d.service.updateEquipment('e1', { careSpaceId: SPACE_A }, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.state.loadSpace).toHaveBeenCalledWith(d.tx, T1, SPACE_A);
    });

    it('una sala que no aloja equipos (sala de espera) es 422 SPACE_CANNOT_HOST_EQUIPMENT', async () => {
      const { d } = located({ modalityConceptId: undefined });
      d.state.loadSpace.mockResolvedValue(
        space({ spaceTypeConceptId: fnId('SPACE_FN_WAITING') }),
      );
      await expect(
        d.service.updateEquipment('e1', { careSpaceId: SPACE_A }, actor),
      ).rejects.toMatchObject({
        reason: DiagnosticUnitsErrorReason.SPACE_CANNOT_HOST_EQUIPMENT,
      });
    });

    it('un equipo con modalidad de imagen sólo va en una sala de imagen', async () => {
      const { d } = located();
      d.state.loadSpace.mockResolvedValue(
        space({ spaceTypeConceptId: fnId('SPACE_FN_STERILIZATION') }),
      );
      await expect(
        d.service.updateEquipment('e1', { careSpaceId: SPACE_A }, actor),
      ).rejects.toMatchObject({
        reason: DiagnosticUnitsErrorReason.SPACE_CANNOT_HOST_EQUIPMENT,
      });
    });

    it('un equipo sin modalidad sí va en una sala que aloja equipos aunque no sea de imagen', async () => {
      const { d, equipment } = located({ modalityConceptId: undefined });
      d.state.loadSpace.mockResolvedValue(
        space({ spaceTypeConceptId: fnId('SPACE_FN_STERILIZATION') }),
      );
      await d.service.updateEquipment('e1', { careSpaceId: SPACE_A }, actor);
      expect(equipment.careSpaceId).toBe(SPACE_A);
    });

    it('una sala que no está activa es 422 EQUIPMENT_SPACE_NOT_ACTIVE', async () => {
      const { d } = located();
      d.state.loadSpace.mockResolvedValue(
        space({ statusConceptId: PRAC.SPACE_SUSPENDED }),
      );
      await expect(
        d.service.updateEquipment('e1', { careSpaceId: SPACE_A }, actor),
      ).rejects.toMatchObject({
        reason: DiagnosticUnitsErrorReason.EQUIPMENT_SPACE_NOT_ACTIVE,
      });
    });

    it('volver a mandar la misma sala no la vuelve a validar ni publica nada', async () => {
      const { d } = located({ careSpaceId: SPACE_A });
      await d.service.updateEquipment('e1', { careSpaceId: SPACE_A }, actor);
      expect(d.state.loadSpace).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
      expect(d.agenda.relocateBookings).not.toHaveBeenCalled();
    });

    it('desubicar con reservas futuras es 409 aunque se pida reconocerlas', async () => {
      const { d, equipment } = located({ careSpaceId: SPACE_A });
      d.agenda.futureCommitments.mockResolvedValue([
        {
          kind: 'BOOKING',
          id: 'b1',
          startsAt: '2030-01-01T10:00:00Z',
          nextAction: 'REPROGRAMAR',
        },
      ]);
      await expect(
        d.service.updateEquipment(
          'e1',
          { careSpaceId: null, acknowledgeConflicts: true },
          actor,
        ),
      ).rejects.toMatchObject({
        reason: OpsErrorReason.FUTURE_COMMITMENTS_CONFLICT,
      });
      expect(equipment.careSpaceId).toBe(SPACE_A);
    });

    it('desubicar sin reservas escribe NULL, desancla los pasos y lo publica', async () => {
      const { d, equipment } = located({ careSpaceId: SPACE_A });
      await d.service.updateEquipment('e1', { careSpaceId: null }, actor);
      expect(equipment.careSpaceId).toBeNull();
      expect(d.agenda.relocateBookings).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ careSpaceId: null }),
      );
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          payloadJson: expect.objectContaining({
            careSpaceId: null,
            previousCareSpaceId: SPACE_A,
          }),
        }),
      );
    });
  });

  describe('F5a · AE Title y estación', () => {
    const located = () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue({
        ...activeSite(),
        practiceSiteId: PRACTICE_SITE,
      });
      d.equipmentRepo.findById.mockResolvedValue({
        id: 'e1',
        diagnosticUnitSiteId: 's1',
        operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
        updatedAt: new Date(),
      });
      return d;
    };

    it.each([
      ['vacío', ''],
      ['sólo espacios', '    '],
      ['más de 16 caracteres', 'A'.repeat(17)],
      ['con barra invertida', 'CT\\1'],
      ['con caracteres no ASCII', 'TÓMÓGRAFO'],
    ])(
      'un AE Title %s es 422 AE_TITLE_INVALID antes de abrir la transacción',
      async (_n, aeTitle) => {
        const d = located();
        await expect(
          d.service.updateEquipment('e1', { aeTitle }, actor),
        ).rejects.toMatchObject({
          reason: DiagnosticUnitsErrorReason.AE_TITLE_INVALID,
        });
        expect(d.tx.execute).not.toHaveBeenCalled();
      },
    );

    it('un nombre de estación inválido es 422 STATION_NAME_INVALID', async () => {
      const d = located();
      await expect(
        d.service.updateEquipment('e1', { stationName: 'X'.repeat(20) }, actor),
      ).rejects.toMatchObject({
        reason: DiagnosticUnitsErrorReason.STATION_NAME_INVALID,
      });
    });

    it('un AE Title que otro equipo del sitio ya usa es 409 AE_TITLE_TAKEN, sin decir de quién', async () => {
      const d = located();
      d.tx.execute.mockImplementation(async (sql: string) =>
        /ae_title = \?/.test(sql) ? [{ id: 'otro-equipo' }] : [],
      );
      const error: any = await d.service
        .updateEquipment('e1', { aeTitle: 'CT1' }, actor)
        .then(
          () => null,
          (e: unknown) => e,
        );
      expect(error).toBeInstanceOf(ConflictException);
      expect(error.reason).toBe(DiagnosticUnitsErrorReason.AE_TITLE_TAKEN);
      expect(JSON.stringify(error.getResponse())).not.toContain('otro-equipo');
    });

    it('null quita el AE Title y la estación (escribe NULL)', async () => {
      const d = located();
      const equipment: any = {
        id: 'e1',
        diagnosticUnitSiteId: 's1',
        operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
        aeTitle: 'CT1',
        stationName: 'EST',
        updatedAt: new Date(),
      };
      d.equipmentRepo.findById.mockResolvedValue(equipment);
      await d.service.updateEquipment(
        'e1',
        { aeTitle: null, stationName: null },
        actor,
      );
      expect(equipment.aeTitle).toBeNull();
      expect(equipment.stationName).toBeNull();
    });
  });

  describe('F5a · estado operativo y reservas futuras', () => {
    const futureBooking = {
      kind: 'BOOKING',
      id: 'b1',
      startsAt: '2030-01-01T10:00:00Z',
      nextAction: 'REPROGRAMAR_O_CANCELAR',
    };
    const equipmentOf = () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue({
        ...activeSite(),
        practiceSiteId: PRACTICE_SITE,
      });
      const equipment: any = {
        id: 'e1',
        diagnosticUnitSiteId: 's1',
        operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
        careSpaceId: SPACE_A,
        updatedAt: new Date(),
      };
      d.equipmentRepo.findById.mockResolvedValue(equipment);
      return { d, equipment };
    };

    it('un concepto que no es un estado del equipo es 422 EQUIPMENT_STATUS_INVALID', async () => {
      const { d } = equipmentOf();
      await expect(
        d.service.updateEquipment(
          'e1',
          { operationalStatusConceptId: 'concepto-cualquiera' },
          actor,
        ),
      ).rejects.toMatchObject({
        reason: DiagnosticUnitsErrorReason.EQUIPMENT_STATUS_INVALID,
      });
    });

    it('sacarlo de servicio con reservas futuras es 409 con la lista y no cambia el estado', async () => {
      const { d, equipment } = equipmentOf();
      d.agenda.futureCommitments.mockResolvedValue([futureBooking]);
      const error: any = await d.service
        .updateEquipment(
          'e1',
          { operationalStatusConceptId: DUNIT.EQUIPMENT_MAINTENANCE },
          actor,
        )
        .then(
          () => null,
          (e: unknown) => e,
        );
      expect(error).toBeInstanceOf(ConflictException);
      expect(error.reason).toBe(OpsErrorReason.FUTURE_COMMITMENTS_CONFLICT);
      expect(error.getResponse().details.conflicts).toEqual([futureBooking]);
      expect(equipment.operationalStatusConceptId).toBe(
        DUNIT.EQUIPMENT_OPERATIONAL,
      );
      expect(d.agenda.syncStatus).not.toHaveBeenCalled();
    });

    it('reconociendo el conflicto lo saca de servicio, cierra la agenda y devuelve las reservas', async () => {
      const { d, equipment } = equipmentOf();
      d.agenda.futureCommitments.mockResolvedValue([futureBooking]);
      const res = await d.service.updateEquipment(
        'e1',
        {
          operationalStatusConceptId: DUNIT.EQUIPMENT_OUT_OF_SERVICE,
          acknowledgeConflicts: true,
        },
        actor,
      );
      expect(equipment.operationalStatusConceptId).toBe(
        DUNIT.EQUIPMENT_OUT_OF_SERVICE,
      );
      expect(res.conflicts).toEqual([futureBooking]);
      expect(d.agenda.syncStatus).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          equipmentId: 'e1',
          tenantId: T1,
          outOfService: true,
        }),
      );
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'diagnostic_units.equipment.status_changed',
          payloadJson: expect.objectContaining({
            outOfService: true,
            futureCommitments: 1,
          }),
        }),
      );
    });

    it('volver a operativo reabre la agenda y no consulta reservas', async () => {
      const { d, equipment } = equipmentOf();
      equipment.operationalStatusConceptId = DUNIT.EQUIPMENT_MAINTENANCE;
      await d.service.updateEquipment(
        'e1',
        { operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL },
        actor,
      );
      expect(d.agenda.futureCommitments).not.toHaveBeenCalled();
      expect(d.agenda.syncStatus).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ outOfService: false }),
      );
    });

    it('repetir el estado actual no toca la agenda ni publica', async () => {
      const { d } = equipmentOf();
      await d.service.updateEquipment(
        'e1',
        { operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL },
        actor,
      );
      expect(d.agenda.syncStatus).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });
  });

  describe('F5a · quién puede (ABAC contra el espacio del equipo)', () => {
    const equipmentOf = () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue({
        ...activeSite(),
        practiceSiteId: PRACTICE_SITE,
      });
      d.equipmentRepo.findById.mockResolvedValue({
        id: 'e1',
        diagnosticUnitSiteId: 's1',
        operationalStatusConceptId: DUNIT.EQUIPMENT_OPERATIONAL,
        careSpaceId: SPACE_A,
        updatedAt: new Date(),
      });
      return d;
    };

    it('la plataforma (SECURITY_ADMIN) no pasa por la política', async () => {
      const d = equipmentOf();
      await d.service.updateEquipment('e1', { aeTitle: 'CT1' }, actor);
      expect(d.infra.assertCan).not.toHaveBeenCalled();
    });

    it('lo estructural exige infra.equipment.edit sobre el espacio del equipo', async () => {
      const d = equipmentOf();
      await d.service.updateEquipment('e1', { aeTitle: 'CT1' }, orgAdmin);
      expect(d.infra.assertCan).toHaveBeenCalledWith(
        orgAdmin,
        'infra.equipment.edit',
        { careSpaceId: SPACE_A },
        d.tx,
      );
    });

    it('sólo el estado exige infra.equipment.status (Mantenimiento) y no edit', async () => {
      const d = equipmentOf();
      await d.service.updateEquipment(
        'e1',
        { operationalStatusConceptId: DUNIT.EQUIPMENT_MAINTENANCE },
        orgAdmin,
      );
      const actions = d.infra.assertCan.mock.calls.map((c: any[]) => c[1]);
      expect(actions).toEqual(['infra.equipment.status']);
    });

    it('ubicarlo en otra sala exige también edit sobre la sala de destino', async () => {
      const d = equipmentOf();
      d.state.loadSpace.mockResolvedValue({
        id: SPACE_B,
        code: 'TC-2',
        practiceSiteId: PRACTICE_SITE,
        spaceTypeConceptId: fnId('SPACE_FN_IMAGING_ROOM'),
        statusConceptId: PRAC.SPACE_ACTIVE,
      });
      await d.service.updateEquipment('e1', { careSpaceId: SPACE_B }, orgAdmin);
      expect(d.infra.assertCan).toHaveBeenCalledWith(
        orgAdmin,
        'infra.equipment.edit',
        { careSpaceId: SPACE_B },
        d.tx,
      );
    });

    it('si la política rechaza, no se escribe nada', async () => {
      const d = equipmentOf();
      d.infra.assertCan.mockRejectedValue(new ResourceNotFoundException('x'));
      await expect(
        d.service.updateEquipment('e1', { aeTitle: 'CT1' }, orgAdmin),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.tx.flush).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('un cuerpo vacío sólo lo ve quien ve el equipo (view)', async () => {
      const d = equipmentOf();
      await d.service.updateEquipment('e1', {}, orgAdmin);
      expect(d.infra.assertCan).toHaveBeenCalledWith(
        orgAdmin,
        'infra.equipment.view',
        { careSpaceId: SPACE_A },
        d.tx,
      );
    });
  });

  describe('F5a · linkResource', () => {
    it('sin agenda registrada es 422 EQUIPMENT_AGENDA_UNAVAILABLE', async () => {
      const d = build();
      d.registry.set(null as any);
      await expect(
        d.service.linkResource('e1', {}, actor),
      ).rejects.toMatchObject({
        reason: DiagnosticUnitsErrorReason.EQUIPMENT_AGENDA_UNAVAILABLE,
      });
    });

    it('un equipo de otra organización es 404 uniforme y la agenda no se toca', async () => {
      const d = build();
      d.equipmentRepo.findById.mockResolvedValue({
        id: 'eB',
        diagnosticUnitSiteId: 's1',
      });
      d.sitesRepo.findById.mockResolvedValue(activeSite());
      d.unitsRepo.findById.mockResolvedValue({ id: 'uB', tenantId: T2 });
      await expectOutOfScope(d.service.linkResource('eB', {}, actor));
      expect(d.agenda.linkResource).not.toHaveBeenCalled();
    });

    it('delega en la agenda con el mismo actor, dentro de la transacción', async () => {
      const d = build();
      d.equipmentRepo.findById.mockResolvedValue({
        id: 'e1',
        diagnosticUnitSiteId: 's1',
      });
      d.sitesRepo.findById.mockResolvedValue(activeSite());
      const res = await d.service.linkResource('e1', { name: 'TC 1' }, actor);
      expect(res.id).toBe('r1');
      expect(d.agenda.linkResource).toHaveBeenCalledWith(
        d.tx,
        'e1',
        { name: 'TC 1' },
        actor,
      );
    });
  });

  describe('F5a · mwlStation', () => {
    const equipmentOf = (over: Record<string, unknown> = {}) => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue({
        ...activeSite(),
        practiceSiteId: PRACTICE_SITE,
      });
      d.equipmentRepo.findById.mockResolvedValue({
        id: 'e1',
        diagnosticUnitSiteId: 's1',
        careSpaceId: SPACE_A,
        aeTitle: 'CT1',
        stationName: 'EST-CT',
        ...over,
      });
      d.state.loadSpace.mockResolvedValue({ id: SPACE_A, code: 'TC-1' });
      return d;
    };

    it('devuelve AE Title, estación y el código de la sala como SPS Location, sin datos de paciente', async () => {
      const d = equipmentOf();
      const res = await d.service.mwlStation('e1', {
        id: 'c',
        roles: ['CLINICIAN'],
      } as any);
      expect(res).toEqual({
        equipmentId: 'e1',
        scheduledStationAETitle: 'CT1',
        scheduledStationName: 'EST-CT',
        spsLocation: 'TC-1',
        careSpaceId: SPACE_A,
      });
      expect(d.infra.assertCan).not.toHaveBeenCalled();
    });

    it('un equipo sin sala devuelve SPS Location nulo', async () => {
      const d = equipmentOf({ careSpaceId: undefined });
      const res = await d.service.mwlStation('e1', actor);
      expect(res.spsLocation).toBeNull();
      expect(d.state.loadSpace).not.toHaveBeenCalled();
    });

    it('quien no atiende la clínica ni la agenda pasa por infra.equipment.view', async () => {
      const d = equipmentOf();
      await d.service.mwlStation('e1', orgAdmin);
      expect(d.infra.assertCan).toHaveBeenCalledWith(
        orgAdmin,
        'infra.equipment.view',
        { careSpaceId: SPACE_A },
        d.tx,
      );
    });

    it('un equipo de otra organización es 404 uniforme', async () => {
      const d = equipmentOf();
      d.unitsRepo.findById.mockResolvedValue({ id: 'uB', tenantId: T2 });
      await expectOutOfScope(d.service.mwlStation('e1', actor));
    });
  });
});
