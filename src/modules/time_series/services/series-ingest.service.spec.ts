import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SeriesIngestService } from './series-ingest.service';

const actor = { id: 'user-1', roles: ['INGEST_GATEWAY'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const INGESTION_ID = '22222222-2222-2222-2222-222222222222';
const DEVICE_ID = '33333333-3333-3333-3333-333333333333';
const BATCH_ID = '44444444-4444-4444-4444-444444444444';
const ACCOUNT_ID = '55555555-5555-5555-5555-555555555555';
const CAMPAIGN_ID = '66666666-6666-6666-6666-666666666666';

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const ingestRepo = {
    insertPoints: mockFn((_tx: any, _t: string, rows: any[]) => rows.length),
    createPipelineMetric: mockFn((_tx: any, data: any) => ({ ...data })),
    findDeviceReadingBySequence: mockFn(async () => null),
    createDeviceReading: mockFn((_tx: any, data: any) => ({ ...data })),
    findAdsEvent: mockFn(async () => null),
    createAdsEvent: mockFn((_tx: any, data: any) => ({ ...data })),
    createLocationPing: mockFn((_tx: any, data: any) => ({ ...data })),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new SeriesIngestService(
    em as any,
    ingestRepo as any,
    outbox as any,
    logger as any,
  );
  return { service, em, tx, ingestRepo, outbox, logger };
}

describe('SeriesIngestService', () => {
  describe('batchIngestPoints (UC-58-01)', () => {
    const DTO = {
      dataset: 'telemetry_event_series',
      tenantId: TENANT_ID,
      ingestionId: INGESTION_ID,
      points: [
        {
          time: '2026-01-01T00:00:00.000Z',
          values: { userId: 'u-1', eventCode: 'open' },
        },
        {
          time: '2026-01-01T00:01:00.000Z',
          values: { userId: 'u-2', eventCode: 'close' },
        },
      ],
    } as any;

    it('inserta el lote con la clave del punto y el estado recibido', async () => {
      const d = build();

      const result = await d.service.batchIngestPoints('serie-1', DTO, actor);

      const [, table, rows] = d.ingestRepo.insertPoints.mock.calls[0];
      expect(table).toBe('telemetry_event_series');
      expect(rows[0]).toMatchObject({
        tenantId: TENANT_ID,
        seriesId: 'serie-1',
        ingestionId: INGESTION_ID,
        qualityState: 'received',
        userId: 'u-1',
      });
      expect(result.rowsIngested).toBe(2);
    });

    it('emite la métrica de la etapa de ingesta', async () => {
      const d = build();

      await d.service.batchIngestPoints('serie-1', DTO, actor);

      const metric = d.ingestRepo.createPipelineMetric.mock.calls[0][1];
      expect(metric.stageCode).toBe('ingest');
      expect(metric.metricCode).toBe('rows_ingested');
      expect(metric.metricValue).toBe(2);
    });

    it('deduplica el lote por ingestionId en el outbox', async () => {
      const d = build();

      await d.service.batchIngestPoints('serie-1', DTO, actor);

      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'SeriesBatchIngested',
          idempotencyKey: `ts-batch:telemetry_event_series:${INGESTION_ID}`,
        }),
      );
    });
  });

  describe('ingestDeviceReadings (UC-58-02)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      ingestionId: INGESTION_ID,
      readings: [
        {
          time: '2026-01-01T00:00:00.000Z',
          channelCode: 'hr',
          rawValue: { v: 72 },
          numericValue: 72,
          deviceSequence: '10',
        },
      ],
    } as any;

    it('inserta la lectura y usa el dispositivo como serie por omisión', async () => {
      const d = build();

      const result = await d.service.ingestDeviceReadings(
        DEVICE_ID,
        DTO,
        actor,
      );

      expect(result.seriesId).toBe(DEVICE_ID);
      expect(result.rowsIngested).toBe(1);
      expect(d.ingestRepo.createDeviceReading.mock.calls[0][1].deviceId).toBe(
        DEVICE_ID,
      );
    });

    it('descarta el reenvío por secuencia sin contarlo como insertado', async () => {
      const d = build();
      d.ingestRepo.findDeviceReadingBySequence.mockResolvedValue({
        deviceSequence: '10',
      });

      const result = await d.service.ingestDeviceReadings(
        DEVICE_ID,
        DTO,
        actor,
      );

      expect(result.rowsIngested).toBe(0);
      expect(result.rowsSkipped).toBe(1);
      expect(d.ingestRepo.createDeviceReading).not.toHaveBeenCalled();
    });

    it('no publica evento si todo el lote era duplicado', async () => {
      const d = build();
      d.ingestRepo.findDeviceReadingBySequence.mockResolvedValue({
        deviceSequence: '10',
      });

      await d.service.ingestDeviceReadings(DEVICE_ID, DTO, actor);

      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('no comprueba duplicado si la lectura no trae secuencia', async () => {
      const d = build();

      await d.service.ingestDeviceReadings(
        DEVICE_ID,
        {
          ...DTO,
          readings: [
            {
              time: '2026-01-01T00:00:00.000Z',
              channelCode: 'hr',
              rawValue: {},
            },
          ],
        },
        actor,
      );

      expect(d.ingestRepo.findDeviceReadingBySequence).not.toHaveBeenCalled();
    });
  });

  describe('batchIngestAdsEvents (UC-58-10)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      ingestionId: INGESTION_ID,
      events: [
        {
          time: '2026-01-01T00:00:00.000Z',
          adAccountId: ACCOUNT_ID,
          campaignId: CAMPAIGN_ID,
          eventName: 'conversion',
          eventId: 'evt-1',
          value: 12.5,
        },
      ],
    } as any;

    it('inserta el evento nuevo', async () => {
      const d = build();

      const result = await d.service.batchIngestAdsEvents(DTO, actor);

      expect(result.rowsIngested).toBe(1);
      expect(d.ingestRepo.createAdsEvent).toHaveBeenCalled();
    });

    it('descarta el evento ya visto por su clave de origen', async () => {
      const d = build();
      d.ingestRepo.findAdsEvent.mockResolvedValue({ eventId: 'evt-1' });

      const result = await d.service.batchIngestAdsEvents(DTO, actor);

      expect(result.rowsIngested).toBe(0);
      expect(result.rowsSkipped).toBe(1);
      expect(d.ingestRepo.createAdsEvent).not.toHaveBeenCalled();
    });
  });

  describe('batchIngestMetrics (UC-58-11)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      ingestionId: INGESTION_ID,
      points: [
        {
          time: '2026-01-01T00:00:00.000Z',
          values: { metricCode: 'latency', metricValue: 12 },
        },
      ],
    } as any;

    it('ingiere en el dataset indicado', async () => {
      const d = build();

      await d.service.batchIngestMetrics(
        'ai_runtime_metric_series',
        DTO,
        actor,
      );

      expect(d.ingestRepo.insertPoints.mock.calls[0][1]).toBe(
        'ai_runtime_metric_series',
      );
    });

    it('no se mide a sí misma al ingerir en la tabla de métricas de pipeline', async () => {
      const d = build();

      await d.service.batchIngestMetrics(
        'ingestion_pipeline_metric_series',
        DTO,
        actor,
      );

      expect(d.ingestRepo.createPipelineMetric).not.toHaveBeenCalled();
    });
  });

  describe('batchIngestLocationPings (UC-58-13)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      ingestionId: INGESTION_ID,
      consentId: '77777777-7777-7777-7777-777777777777',
      pings: [
        {
          time: '2026-01-01T00:00:00.000Z',
          subjectType: 'courier',
          subjectId: DEVICE_ID,
          latitude: 40.4,
          longitude: -3.7,
        },
      ],
    } as any;

    it('inserta el ping', async () => {
      const d = build();

      const result = await d.service.batchIngestLocationPings(DTO, actor);

      expect(result.rowsIngested).toBe(1);
    });

    it('el consentimiento viaja en el evento publicado', async () => {
      const d = build();

      await d.service.batchIngestLocationPings(DTO, actor);

      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'LocationPingsIngested',
          payloadJson: expect.objectContaining({
            consentId: '77777777-7777-7777-7777-777777777777',
          }),
        }),
      );
    });
  });

  describe('governedBackfill (UC-58-12)', () => {
    const DTO = {
      dataset: 'device_raw_reading_series',
      tenantId: TENANT_ID,
      batchId: BATCH_ID,
      justification: 'el dispositivo mandó el canal equivocado',
      windowFrom: '2026-01-01T00:00:00.000Z',
      windowTo: '2026-01-02T00:00:00.000Z',
      corrections: [
        {
          time: '2026-01-01T10:00:00.000Z',
          values: { deviceId: DEVICE_ID, channelCode: 'hr', rawValue: {} },
        },
      ],
    } as any;

    it('inserta las correcciones como eventos nuevos marcados backfill', async () => {
      const d = build();

      const result = await d.service.governedBackfill('serie-1', DTO, actor);

      const rows = d.ingestRepo.insertPoints.mock.calls[0][2];
      expect(rows[0].qualityState).toBe('backfill');
      expect(result.rowsBackfilled).toBe(1);
    });

    it('rechaza una ventana invertida', async () => {
      const d = build();

      await expect(
        d.service.governedBackfill(
          'serie-1',
          { ...DTO, windowFrom: DTO.windowTo, windowTo: DTO.windowFrom },
          actor,
        ),
      ).rejects.toThrow(/antes de terminar/);
    });

    it('rechaza una corrección fuera de la ventana declarada', async () => {
      const d = build();

      await expect(
        d.service.governedBackfill(
          'serie-1',
          {
            ...DTO,
            corrections: [{ time: '2026-02-01T00:00:00.000Z', values: {} }],
          },
          actor,
        ),
      ).rejects.toThrow(/fuera de la ventana/);
    });

    it('emite la métrica de backfill y avisa en el log', async () => {
      const d = build();

      await d.service.governedBackfill('serie-1', DTO, actor);

      expect(d.ingestRepo.createPipelineMetric.mock.calls[0][1].stageCode).toBe(
        'backfill',
      );
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('la justificación viaja en el evento publicado', async () => {
      const d = build();

      await d.service.governedBackfill('serie-1', DTO, actor);

      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventType: 'GovernedBackfillApplied',
          payloadJson: expect.objectContaining({
            justification: DTO.justification,
          }),
        }),
      );
    });
  });
});
