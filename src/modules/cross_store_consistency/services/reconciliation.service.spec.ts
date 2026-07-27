import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ReconciliationService } from './reconciliation.service';

const actor = { id: 'user-1', roles: ['SYSTEM'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const DATASET_ID = '22222222-2222-2222-2222-222222222222';
const ENTITY_A = '33333333-3333-3333-3333-333333333333';
const ENTITY_B = '44444444-4444-4444-4444-444444444444';
const DRIFT_ID = '55555555-5555-5555-5555-555555555555';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const reconciliationRepo = {
    createRun: mockFn((_tx: any, data: any) => ({ id: 'run-1', ...data })),
    createItem: mockFn((_tx: any, data: any) => ({ id: 'item-1', ...data })),
    findOpenDrift: mockFn(async () => null),
    createDrift: mockFn((_tx: any, data: any) => ({ id: DRIFT_ID, ...data })),
    findDriftForUpdate: mockFn(async () => null),
    findRepairJobByKey: mockFn(async () => null),
    createRepairJob: mockFn((_tx: any, data: any) => ({
      id: 'repair-1',
      ...data,
    })),
    createReindexJob: mockFn((_tx: any, data: any) => ({
      id: 'reindex-1',
      ...data,
    })),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new ReconciliationService(
    em as any,
    reconciliationRepo as any,
    outbox as any,
    logger as any,
  );
  return { service, em, tx, reconciliationRepo, outbox, logger };
}

function runDto(items: any[]) {
  return {
    tenantId: TENANT_ID,
    datasetId: DATASET_ID,
    sourceBackendCode: 'postgres',
    targetBackendCode: 'opensearch',
    items,
  } as any;
}

describe('ReconciliationService', () => {
  describe('runReconciliation (UC-62-05 y 06)', () => {
    it('cuenta las coincidencias sin abrir derivas', async () => {
      const d = build();

      const result = await d.service.runReconciliation(
        runDto([{ canonicalEntityId: ENTITY_A, result: 'MATCH' }]),
        actor,
      );

      expect(result.matched).toBe(1);
      expect(result.driftsOpened).toBe(0);
      expect(d.reconciliationRepo.createDrift).not.toHaveBeenCalled();
      expect(result.status).toBe('COMPLETED');
    });

    it('abre una deriva por cada divergencia', async () => {
      const d = build();

      const result = await d.service.runReconciliation(
        runDto([
          { canonicalEntityId: ENTITY_A, result: 'DIVERGENT' },
          { canonicalEntityId: ENTITY_B, result: 'MISSING' },
        ]),
        actor,
      );

      expect(result.driftsOpened).toBe(2);
      expect(result.driftsByType).toEqual({ DIVERGENT: 1, MISSING: 1 });
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('asigna la severidad según la clase de deriva', async () => {
      const d = build();

      await d.service.runReconciliation(
        runDto([{ canonicalEntityId: ENTITY_A, result: 'EXTRA' }]),
        actor,
      );

      expect(d.reconciliationRepo.createDrift.mock.calls[0][1].severity).toBe(
        'CRITICAL',
      );
    });

    it('no abre una deriva si ya hay una viva del mismo tipo', async () => {
      const d = build();
      d.reconciliationRepo.findOpenDrift.mockResolvedValue({
        id: 'drift-previa',
      });

      const result = await d.service.runReconciliation(
        runDto([{ canonicalEntityId: ENTITY_A, result: 'DIVERGENT' }]),
        actor,
      );

      expect(result.driftsOpened).toBe(0);
      expect(result.driftsSkipped).toBe(1);
      expect(d.reconciliationRepo.createDrift).not.toHaveBeenCalled();
    });

    it('rechaza la misma entidad dos veces en la corrida', async () => {
      const d = build();

      await expect(
        d.service.runReconciliation(
          runDto([
            { canonicalEntityId: ENTITY_A, result: 'MATCH' },
            { canonicalEntityId: ENTITY_A, result: 'DIVERGENT' },
          ]),
          actor,
        ),
      ).rejects.toThrow(/dos veces en la corrida/);
    });

    it('publica el evento de deriva con su severidad', async () => {
      const d = build();

      await d.service.runReconciliation(
        runDto([{ canonicalEntityId: ENTITY_A, result: 'MISSING' }]),
        actor,
      );

      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'ProjectionDriftDetected',
          payloadJson: expect.objectContaining({ severity: 'HIGH' }),
        }),
      );
    });
  });

  describe('repairDrift (UC-62-07)', () => {
    function withDrift(d: ReturnType<typeof build>, overrides: any = {}) {
      const drift = {
        id: DRIFT_ID,
        tenantId: TENANT_ID,
        datasetId: DATASET_ID,
        canonicalEntityId: ENTITY_A,
        driftType: 'DIVERGENT',
        status: 'OPEN',
        ...overrides,
      };
      d.reconciliationRepo.findDriftForUpdate.mockResolvedValue(drift);
      return drift;
    }

    it('encola la reparación y cierra la deriva', async () => {
      const d = build();
      const drift = withDrift(d);

      const result = await d.service.repairDrift(
        DRIFT_ID,
        { repairAction: 'REPROJECT' },
        actor,
      );

      expect(result.status).toBe('REQUESTED');
      expect(drift.status).toBe('RESOLVED');
    });

    it('crea el job de reindexado cuando la acción lo pide', async () => {
      const d = build();
      withDrift(d);

      const result = await d.service.repairDrift(
        DRIFT_ID,
        { repairAction: 'REINDEX', targetIndex: 'encounters-v2' },
        actor,
      );

      expect(result.reindexJobId).toBe('reindex-1');
    });

    it('no crea reindexado si la acción es reproyectar', async () => {
      const d = build();
      withDrift(d);

      const result = await d.service.repairDrift(
        DRIFT_ID,
        { repairAction: 'REPROJECT' },
        actor,
      );

      expect(result.reindexJobId).toBeUndefined();
      expect(d.reconciliationRepo.createReindexJob).not.toHaveBeenCalled();
    });

    it('borrar el huérfano sólo repara una deriva EXTRA', async () => {
      const d = build();
      withDrift(d, { driftType: 'MISSING' });

      await expect(
        d.service.repairDrift(
          DRIFT_ID,
          { repairAction: 'DELETE_ORPHAN' } as any,
          actor,
        ),
      ).rejects.toThrow(/tipo EXTRA/);
    });

    it('acepta borrar el huérfano sobre una deriva EXTRA', async () => {
      const d = build();
      withDrift(d, { driftType: 'EXTRA' });

      await expect(
        d.service.repairDrift(
          DRIFT_ID,
          { repairAction: 'DELETE_ORPHAN' } as any,
          actor,
        ),
      ).resolves.toBeDefined();
    });

    it('devuelve la reparación previa en vez de encolar otra', async () => {
      const d = build();
      withDrift(d);
      d.reconciliationRepo.findRepairJobByKey.mockResolvedValue({
        id: 'repair-previo',
        repairAction: 'REPROJECT',
        status: 'COMPLETED',
      });

      const result = await d.service.repairDrift(
        DRIFT_ID,
        { repairAction: 'REPROJECT' },
        actor,
      );

      expect(result.duplicate).toBe(true);
      expect(d.reconciliationRepo.createRepairJob).not.toHaveBeenCalled();
    });

    it('rechaza reparar una deriva ya cerrada', async () => {
      const d = build();
      withDrift(d, { status: 'RESOLVED' });

      await expect(
        d.service.repairDrift(
          DRIFT_ID,
          { repairAction: 'REPROJECT' } as any,
          actor,
        ),
      ).rejects.toThrow(/ya no está abierta/);
    });

    it('la clave de idempotencia depende de la acción', async () => {
      const d1 = build();
      withDrift(d1);
      await d1.service.repairDrift(
        DRIFT_ID,
        { repairAction: 'REPROJECT' },
        actor,
      );
      const key1 =
        d1.reconciliationRepo.createRepairJob.mock.calls[0][1].idempotencyKey;

      const d2 = build();
      withDrift(d2);
      await d2.service.repairDrift(
        DRIFT_ID,
        { repairAction: 'REINDEX' },
        actor,
      );
      const key2 =
        d2.reconciliationRepo.createRepairJob.mock.calls[0][1].idempotencyKey;

      expect(key1).not.toBe(key2);
    });
  });
});
