import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CrossStoreAdminController } from './cross-store-admin.controller';
import { CrossStoreWorkerController } from './cross-store-worker.controller';

const actor = { id: 'user-1', roles: ['PLATFORM_ADMIN'] } as any;
const ID = '11111111-1111-1111-1111-111111111111';

describe('CrossStoreAdminController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const projectionService = {
      registerProjection: mockFn(async () => ({ id: ID })),
      replayDeadLetter: mockFn(async () => ({ attemptId: ID })),
    };
    const reconciliationService = {
      runReconciliation: mockFn(async () => ({ id: ID })),
      repairDrift: mockFn(async () => ({ id: ID })),
    };
    const deletionService = {
      requestDeletion: mockFn(async () => ({ id: ID })),
      closeDeletionRequest: mockFn(async () => ({ id: ID })),
    };
    const maintenanceService = {
      moveData: mockFn(async () => ({ id: ID })),
      archiveData: mockFn(async () => ({ id: ID })),
    };
    return {
      controller: new CrossStoreAdminController(
        projectionService as any,
        reconciliationService as any,
        deletionService as any,
        maintenanceService as any,
      ),
      projectionService,
      reconciliationService,
      deletionService,
      maintenanceService,
    };
  }

  it('delega el registro de la proyección (UC-62-01)', async () => {
    const d = build();
    const dto = { code: 'p' } as any;

    await d.controller.registerProjection(dto, actor);

    expect(d.projectionService.registerProjection).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delega el reproceso con el id de ruta (UC-62-04)', async () => {
    const d = build();
    const dto = {} as any;

    await d.controller.replayDeadLetter(ID, dto, actor);

    expect(d.projectionService.replayDeadLetter).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la reconciliación (UC-62-05)', async () => {
    const d = build();
    const dto = { items: [] } as any;

    await d.controller.runReconciliation(dto, actor);

    expect(d.reconciliationService.runReconciliation).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delega la reparación con el id de deriva (UC-62-07)', async () => {
    const d = build();
    const dto = { repairAction: 'REPROJECT' } as any;

    await d.controller.repairDrift(ID, dto, actor);

    expect(d.reconciliationService.repairDrift).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la solicitud de borrado (UC-62-08)', async () => {
    const d = build();
    const dto = { subjectType: 'patient' } as any;

    await d.controller.requestDeletion(dto, actor);

    expect(d.deletionService.requestDeletion).toHaveBeenCalledWith(dto, actor);
  });

  it('delega el cierre con el id de solicitud (UC-62-11)', async () => {
    const d = build();
    const dto = {} as any;

    await d.controller.closeDeletionRequest(ID, dto, actor);

    expect(d.deletionService.closeDeletionRequest).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega el movimiento de datos (UC-62-13)', async () => {
    const d = build();
    const dto = { manifestHash: 'h' } as any;

    await d.controller.moveData(dto, actor);

    expect(d.maintenanceService.moveData).toHaveBeenCalledWith(dto, actor);
  });

  it('delega el archivado (UC-62-14)', async () => {
    const d = build();
    const dto = { archivedCount: '1' } as any;

    await d.controller.archiveData(dto, actor);

    expect(d.maintenanceService.archiveData).toHaveBeenCalledWith(dto, actor);
  });
});

describe('CrossStoreWorkerController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const projectionService = {
      processDelivery: mockFn(async () => ({ id: ID })),
      sendToDeadLetter: mockFn(async () => ({ id: ID })),
    };
    const deletionService = {
      expandDeletion: mockFn(async () => ({ deletionRequestId: ID })),
      executeDeletion: mockFn(async () => ({ id: ID })),
      verifyDeletion: mockFn(async () => ({ id: ID })),
      listPendingTargets: mockFn(async () => ({ targets: [] })),
      listExecutedTargets: mockFn(async () => ({ targets: [] })),
    };
    const maintenanceService = {
      invalidateCache: mockFn(async () => ({ id: ID })),
    };
    return {
      controller: new CrossStoreWorkerController(
        projectionService as any,
        deletionService as any,
        maintenanceService as any,
      ),
      projectionService,
      deletionService,
      maintenanceService,
    };
  }

  it('delega la entrega (UC-62-02 y 03)', async () => {
    const d = build();
    const dto = { outboxEventId: ID } as any;

    await d.controller.processDelivery(dto, actor);

    expect(d.projectionService.processDelivery).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delega el envío a la cola muerta (UC-62-04)', async () => {
    const d = build();
    const dto = { reasonCode: 'MAX_ATTEMPTS' } as any;

    await d.controller.sendToDeadLetter(dto, actor);

    expect(d.projectionService.sendToDeadLetter).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delega la expansión con el id de solicitud (UC-62-09)', async () => {
    const d = build();
    const dto = { targets: [] } as any;

    await d.controller.expandDeletion(ID, dto, actor);

    expect(d.deletionService.expandDeletion).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega el listado de objetivos pendientes (descubrimiento Fase 4)', async () => {
    const d = build();

    await d.controller.listPendingDeletionTargets(5);

    expect(d.deletionService.listPendingTargets).toHaveBeenCalledWith(5);
  });

  it('el listado de objetivos pendientes usa el límite por omisión sin query', async () => {
    const d = build();

    await d.controller.listPendingDeletionTargets();

    expect(d.deletionService.listPendingTargets).toHaveBeenCalledWith(
      undefined,
    );
  });

  it('delega el listado de objetivos ejecutados (descubrimiento Fase 4)', async () => {
    const d = build();

    await d.controller.listExecutedDeletionTargets(3);

    expect(d.deletionService.listExecutedTargets).toHaveBeenCalledWith(3);
  });

  it('delega la ejecución con el id de objetivo (UC-62-10)', async () => {
    const d = build();
    const dto = {} as any;

    await d.controller.executeDeletion(ID, dto, actor);

    expect(d.deletionService.executeDeletion).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la verificación con el id de objetivo (UC-62-11)', async () => {
    const d = build();
    const dto = { verifiedAbsent: true } as any;

    await d.controller.verifyDeletion(ID, dto, actor);

    expect(d.deletionService.verifyDeletion).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la invalidación de caché (UC-62-12)', async () => {
    const d = build();
    const dto = { cacheScope: 'ENTITY' } as any;

    await d.controller.invalidateCache(dto, actor);

    expect(d.maintenanceService.invalidateCache).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });
});
