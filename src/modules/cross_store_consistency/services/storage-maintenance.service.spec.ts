import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { StorageMaintenanceService } from './storage-maintenance.service';

const actor = { id: 'user-1', roles: ['DATA_GOVERNANCE_ADMIN'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const DATASET_ID = '22222222-2222-2222-2222-222222222222';
const ENTITY_ID = '33333333-3333-3333-3333-333333333333';
const SOURCE_PLACEMENT = '44444444-4444-4444-4444-444444444444';
const TARGET_PLACEMENT = '55555555-5555-5555-5555-555555555555';
const MANIFEST_OBJECT = '66666666-6666-6666-6666-666666666666';

const PAST_CUTOFF = new Date(Date.now() - 30 * 86_400_000).toISOString();

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const deletionRepo = {
    findCacheJob: mockFn(async () => null),
    createCacheJob: mockFn((_tx: any, data: any) => ({
      id: 'cache-1',
      ...data,
    })),
    findMovementJob: mockFn(async () => null),
    createMovementJob: mockFn((_tx: any, data: any) => ({
      id: 'move-1',
      ...data,
    })),
    createSchemaMigrationJob: mockFn((_tx: any, data: any) => ({
      id: 'migration-1',
      ...data,
    })),
    findArchiveJob: mockFn(async () => null),
    createArchiveJob: mockFn((_tx: any, data: any) => ({
      id: 'archive-1',
      ...data,
    })),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new StorageMaintenanceService(
    em as any,
    deletionRepo as any,
    outbox as any,
    logger as any,
  );
  return { service, em, tx, deletionRepo, outbox, logger };
}

describe('StorageMaintenanceService', () => {
  describe('invalidateCache (UC-62-12)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      datasetId: DATASET_ID,
      entityId: ENTITY_ID,
      entityVersion: '5',
      cacheScope: 'ENTITY',
    } as any;

    it('encola la invalidación pendiente', async () => {
      const d = build();

      const result = await d.service.invalidateCache(DTO, actor);

      expect(result.status).toBe('PENDING');
      expect(result.duplicate).toBe(false);
    });

    it('no encola dos veces la misma versión y ámbito', async () => {
      const d = build();
      d.deletionRepo.findCacheJob.mockResolvedValue({
        id: 'cache-previo',
        status: 'PENDING',
      });

      const result = await d.service.invalidateCache(DTO, actor);

      expect(result.duplicate).toBe(true);
      expect(d.deletionRepo.createCacheJob).not.toHaveBeenCalled();
    });

    it('la versión forma parte de la clave', async () => {
      const d = build();

      await d.service.invalidateCache(DTO, actor);

      expect(d.deletionRepo.findCacheJob.mock.calls[0][1]).toEqual({
        tenantId: TENANT_ID,
        datasetId: DATASET_ID,
        entityId: ENTITY_ID,
        entityVersion: '5',
        cacheScope: 'ENTITY',
      });
    });
  });

  describe('moveData (UC-62-13)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      datasetId: DATASET_ID,
      sourcePlacementId: SOURCE_PLACEMENT,
      targetPlacementId: TARGET_PLACEMENT,
      movementMode: 'MOVE',
      manifestHash: 'mh-1',
    } as any;

    it('encola el movimiento y la invalidación de caché', async () => {
      const d = build();

      const result = await d.service.moveData(DTO, actor);

      expect(result.status).toBe('RUNNING');
      expect(result.cacheInvalidationJobId).toBe('cache-1');
      expect(d.deletionRepo.createCacheJob.mock.calls[0][1].cacheScope).toBe(
        'DATASET',
      );
    });

    it('rechaza mover al mismo emplazamiento', async () => {
      const d = build();

      await expect(
        d.service.moveData(
          { ...DTO, targetPlacementId: SOURCE_PLACEMENT },
          actor,
        ),
      ).rejects.toThrow(/no pueden ser el mismo/);
    });

    it('es idempotente por la huella del lote', async () => {
      const d = build();
      d.deletionRepo.findMovementJob.mockResolvedValue({
        id: 'move-previo',
        status: 'COMPLETED',
      });

      const result = await d.service.moveData(DTO, actor);

      expect(result.duplicate).toBe(true);
      expect(d.deletionRepo.createMovementJob).not.toHaveBeenCalled();
    });

    it('encola la migración de esquema si el destino lo cambia', async () => {
      const d = build();

      const result = await d.service.moveData(
        { ...DTO, toSchemaVersion: '2' },
        actor,
      );

      expect(result.schemaMigrationJobId).toBe('migration-1');
      expect(
        d.deletionRepo.createSchemaMigrationJob.mock.calls[0][1]
          .migrationStrategy,
      ).toBe('BACKFILL');
    });

    it('sin cambio de esquema no encola migración', async () => {
      const d = build();

      const result = await d.service.moveData(DTO, actor);

      expect(result.schemaMigrationJobId).toBeUndefined();
      expect(d.deletionRepo.createSchemaMigrationJob).not.toHaveBeenCalled();
    });
  });

  describe('archiveData (UC-62-14)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      datasetId: DATASET_ID,
      retentionCutoff: PAST_CUTOFF,
      archivedCount: '1000',
    } as any;

    it('archiva y encola la invalidación', async () => {
      const d = build();

      const result = await d.service.archiveData(DTO, actor);

      expect(result.status).toBe('COMPLETED');
      expect(result.cacheInvalidationJobId).toBe('cache-1');
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('no purga la copia caliente sin manifiesto frío confirmado', async () => {
      const d = build();

      await expect(
        d.service.archiveData({ ...DTO, deletedHotCount: '500' }, actor),
      ).rejects.toThrow(/manifiesto del archivo frío/);
    });

    it('purga la copia caliente con el manifiesto confirmado', async () => {
      const d = build();

      const result = await d.service.archiveData(
        {
          ...DTO,
          deletedHotCount: '500',
          archiveManifestObjectId: MANIFEST_OBJECT,
        },
        actor,
      );

      expect(result.deletedHotCount).toBe('500');
    });

    it('rechaza un corte de retención en el futuro', async () => {
      const d = build();

      await expect(
        d.service.archiveData(
          {
            ...DTO,
            retentionCutoff: new Date(Date.now() + 86_400_000).toISOString(),
          },
          actor,
        ),
      ).rejects.toThrow(/en el pasado/);
    });

    it('es idempotente por corte de retención', async () => {
      const d = build();
      d.deletionRepo.findArchiveJob.mockResolvedValue({
        id: 'archive-previo',
        status: 'COMPLETED',
        archivedCount: '1000',
        deletedHotCount: '0',
      });

      const result = await d.service.archiveData(DTO, actor);

      expect(result.duplicate).toBe(true);
      expect(d.deletionRepo.createArchiveJob).not.toHaveBeenCalled();
    });

    it('publica DataArchived', async () => {
      const d = build();

      await d.service.archiveData(DTO, actor);

      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'DataArchived' }),
      );
    });
  });
});
