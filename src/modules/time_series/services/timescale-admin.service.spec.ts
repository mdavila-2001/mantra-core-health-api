import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { TimescaleAdminService } from './timescale-admin.service';

const actor = { id: 'user-1', roles: ['DATA_PLATFORM_ADMIN'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const BATCH_ID = '22222222-2222-2222-2222-222222222222';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const timescaleRepo = {
    createHypertable: mockFn(async () => undefined),
    setChunkTimeInterval: mockFn(async () => undefined),
    addSpaceDimension: mockFn(async () => undefined),
    describeHypertable: mockFn(async () => ({
      num_chunks: 3,
      compression_enabled: false,
    })),
    enableCompression: mockFn(async () => undefined),
    listChunksOlderThan: mockFn(async () => []),
    compressChunk: mockFn(async () => undefined),
    dropChunksOlderThan: mockFn(async () => []),
    ensureContinuousAggregate: mockFn(async () => undefined),
    refreshContinuousAggregate: mockFn(async () => undefined),
    countRollupBuckets: mockFn(async () => 0),
  };
  const ingestRepo = { createPipelineMetric: mockFn() };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new TimescaleAdminService(
    em as any,
    timescaleRepo as any,
    ingestRepo as any,
    outbox as any,
    logger as any,
  );
  return { service, em, tx, timescaleRepo, ingestRepo, outbox, logger };
}

describe('TimescaleAdminService', () => {
  describe('configureHypertable (UC-58-04)', () => {
    it('convierte la tabla y devuelve el estado del catálogo', async () => {
      const d = build();

      const result = await d.service.configureHypertable(
        { table: 'device_raw_reading_series' },
        actor,
      );

      expect(d.timescaleRepo.createHypertable).toHaveBeenCalledWith(
        d.tx,
        'device_raw_reading_series',
      );
      expect(result.chunkCount).toBe(3);
      expect(result.spaceDimensionAdded).toBe(false);
    });

    it('aplica la anchura de chunk sólo si se pide', async () => {
      const d = build();

      await d.service.configureHypertable(
        { table: 'device_raw_reading_series' },
        actor,
      );
      expect(d.timescaleRepo.setChunkTimeInterval).not.toHaveBeenCalled();

      await d.service.configureHypertable(
        {
          table: 'device_raw_reading_series',
          chunkTimeInterval: '1 day',
        },
        actor,
      );
      expect(d.timescaleRepo.setChunkTimeInterval).toHaveBeenCalledWith(
        d.tx,
        'device_raw_reading_series',
        '1 day',
      );
    });

    it('añade la dimensión de espacio con las particiones pedidas', async () => {
      const d = build();

      const result = await d.service.configureHypertable(
        {
          table: 'device_raw_reading_series',
          spaceColumn: 'tenant_id',
          spacePartitions: 8,
        },
        actor,
      );

      expect(d.timescaleRepo.addSpaceDimension).toHaveBeenCalledWith(
        d.tx,
        'device_raw_reading_series',
        'tenant_id',
        8,
      );
      expect(result.spaceDimensionAdded).toBe(true);
    });
  });

  describe('updateHypertable (UC-58-04)', () => {
    it('ajusta la anchura del chunk', async () => {
      const d = build();

      await d.service.updateHypertable(
        'normalized_vital_series',
        { chunkTimeInterval: '7 days' },
        actor,
      );

      expect(d.timescaleRepo.setChunkTimeInterval).toHaveBeenCalledWith(
        d.tx,
        'normalized_vital_series',
        '7 days',
      );
    });

    it('rechaza ajustar una tabla que aún no es hypertable', async () => {
      const d = build();
      d.timescaleRepo.describeHypertable.mockResolvedValue(null);

      await expect(
        d.service.updateHypertable(
          'normalized_vital_series',
          { chunkTimeInterval: '7 days' } as any,
          actor,
        ),
      ).rejects.toThrow(/todavía no es una hypertable/);
    });
  });

  describe('runCompression (UC-58-05)', () => {
    const DTO = {
      table: 'device_raw_reading_series',
      olderThan: '30 days',
      batchId: BATCH_ID,
      tenantId: TENANT_ID,
    } as any;

    it('comprime los candidatos uno a uno', async () => {
      const d = build();
      d.timescaleRepo.listChunksOlderThan.mockResolvedValue(['c1', 'c2']);

      const result = await d.service.runCompression(DTO, actor);

      expect(d.timescaleRepo.compressChunk).toHaveBeenCalledTimes(2);
      expect(result.chunksCompressed).toBe(2);
      expect(result.remainingChunks).toEqual([]);
    });

    it('respeta el tope por pasada y deja el resto para la siguiente', async () => {
      const d = build();
      d.timescaleRepo.listChunksOlderThan.mockResolvedValue(['c1', 'c2', 'c3']);

      const result = await d.service.runCompression(
        { ...DTO, maxChunks: 2 },
        actor,
      );

      expect(result.chunksCompressed).toBe(2);
      expect(result.remainingChunks).toEqual(['c3']);
    });

    it('habilita la compresión con la segmentación declarada para la serie', async () => {
      const d = build();

      await d.service.runCompression(DTO, actor);

      expect(d.timescaleRepo.enableCompression).toHaveBeenCalledWith(
        d.tx,
        'device_raw_reading_series',
        'tenant_id, device_id, channel_code',
      );
    });

    it('no publica evento si no había nada que comprimir', async () => {
      const d = build();

      await d.service.runCompression(DTO, actor);

      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
      expect(d.ingestRepo.createPipelineMetric).toHaveBeenCalled();
    });
  });

  describe('applyRetention (UC-58-06)', () => {
    const DTO = {
      table: 'location_ping_series',
      olderThan: '7 days',
      batchId: BATCH_ID,
      tenantId: TENANT_ID,
    } as any;

    it('descarta los chunks fuera de ventana y los informa', async () => {
      const d = build();
      d.timescaleRepo.dropChunksOlderThan.mockResolvedValue(['c1', 'c2']);

      const result = await d.service.applyRetention(DTO, actor);

      expect(result.chunksDropped).toBe(2);
      expect(result.droppedChunks).toEqual(['c1', 'c2']);
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('emite la métrica de retención aunque no haya descartado nada', async () => {
      const d = build();

      const result = await d.service.applyRetention(DTO, actor);

      expect(result.chunksDropped).toBe(0);
      expect(d.ingestRepo.createPipelineMetric.mock.calls[0][1].stageCode).toBe(
        'retention',
      );
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });
  });

  describe('refreshRollup (UC-58-07 y 08)', () => {
    const DTO = {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-02T00:00:00.000Z',
      batchId: BATCH_ID,
      tenantId: TENANT_ID,
    } as any;

    it('crea el agregado y lo refresca antes de abrir la transacción', async () => {
      const d = build();
      d.timescaleRepo.countRollupBuckets.mockResolvedValue(24);

      const result = await d.service.refreshRollup(
        'continuous_sli_hourly',
        DTO,
        actor,
      );

      expect(d.timescaleRepo.ensureContinuousAggregate).toHaveBeenCalled();
      expect(d.timescaleRepo.refreshContinuousAggregate).toHaveBeenCalled();
      // El refresco recibe el EntityManager base, no el transaccional.
      expect(d.timescaleRepo.refreshContinuousAggregate.mock.calls[0][0]).toBe(
        d.em,
      );
      expect(result.bucketsMaterialized).toBe(24);
    });

    it('publica el evento del rollup de SLI', async () => {
      const d = build();

      await d.service.refreshRollup('continuous_sli_daily', DTO, actor);

      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'SliRollupMaterialized' }),
      );
    });

    it('publica el evento propio del rollup de auditoría', async () => {
      const d = build();

      await d.service.refreshRollup('continuous_audit_daily', DTO, actor);

      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'AuditDailyRollupRefreshed' }),
      );
      expect(
        d.ingestRepo.createPipelineMetric.mock.calls[0][1].metricCode,
      ).toBe('audit_buckets');
    });

    it('rechaza una ventana invertida antes de tocar el motor', async () => {
      const d = build();

      await expect(
        d.service.refreshRollup(
          'continuous_sli_hourly',
          { ...DTO, from: DTO.to, to: DTO.from },
          actor,
        ),
      ).rejects.toThrow(/antes de terminar/);
      expect(d.timescaleRepo.refreshContinuousAggregate).not.toHaveBeenCalled();
    });
  });
});
