import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SeriesController } from './series.controller';
import { TimescaleAdminController } from './timescale-admin.controller';

const actor = { id: 'user-1', roles: ['PLATFORM_ADMIN'] } as any;
const ID = '11111111-1111-1111-1111-111111111111';

describe('SeriesController', () => {
  function build() {
    const ingestService = {
      batchIngestPoints: mockFn(async () => ({ rowsIngested: 1 })),
      ingestDeviceReadings: mockFn(async () => ({ rowsIngested: 1 })),
      batchIngestAdsEvents: mockFn(async () => ({ rowsIngested: 1 })),
      batchIngestMetrics: mockFn(async () => ({ rowsIngested: 1 })),
      batchIngestLocationPings: mockFn(async () => ({ rowsIngested: 1 })),
      governedBackfill: mockFn(async () => ({ rowsBackfilled: 1 })),
    };
    const normalizationService = {
      normalizeReading: mockFn(async () => ({ duplicate: false })),
    };
    const queryService = { queryRange: mockFn(async () => ({ points: [] })) };
    return {
      controller: new SeriesController(
        ingestService as any,
        normalizationService as any,
        queryService as any,
      ),
      ingestService,
      normalizationService,
      queryService,
    };
  }

  it('delega la consulta de rango con la serie de la ruta (UC-58-09)', async () => {
    const d = build();
    const query = { dataset: 'normalized_vital_series' } as any;

    await d.controller.queryRange('serie-1', query);

    expect(d.queryService.queryRange).toHaveBeenCalledWith('serie-1', query);
  });

  it('delega la ingesta por lote (UC-58-01)', async () => {
    const d = build();
    const dto = { dataset: 'telemetry_event_series' } as any;

    await d.controller.batchIngestPoints('serie-1', dto, actor);

    expect(d.ingestService.batchIngestPoints).toHaveBeenCalledWith(
      'serie-1',
      dto,
      actor,
    );
  });

  it('delega el backfill gobernado (UC-58-12)', async () => {
    const d = build();
    const dto = { justification: 'x' } as any;

    await d.controller.governedBackfill('serie-1', dto, actor);

    expect(d.ingestService.governedBackfill).toHaveBeenCalledWith(
      'serie-1',
      dto,
      actor,
    );
  });

  it('delega las lecturas con el dispositivo de la ruta (UC-58-02)', async () => {
    const d = build();
    const dto = { readings: [] } as any;

    await d.controller.ingestDeviceReadings(ID, dto, actor);

    expect(d.ingestService.ingestDeviceReadings).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delega la normalización (UC-58-03)', async () => {
    const d = build();
    const dto = { observationCode: 'HR' } as any;

    await d.controller.normalizeReading(dto, actor);

    expect(d.normalizationService.normalizeReading).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delega los eventos de publicidad (UC-58-10)', async () => {
    const d = build();
    const dto = { events: [] } as any;

    await d.controller.batchIngestAdsEvents(dto, actor);

    expect(d.ingestService.batchIngestAdsEvents).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('valida el dataset de métricas contra la lista cerrada (UC-58-11)', async () => {
    const d = build();
    const dto = { points: [] } as any;

    await d.controller.batchIngestMetrics('service_sli_series', dto, actor);
    expect(d.ingestService.batchIngestMetrics).toHaveBeenCalledWith(
      'service_sli_series',
      dto,
      actor,
    );

    // El rechazo es síncrono: el controlador no llega a abrir nada.
    expect(() =>
      d.controller.batchIngestMetrics('clinical_observations', dto, actor),
    ).toThrow(/dataset de métricas/);
  });

  it('delega los pings de ubicación (UC-58-13)', async () => {
    const d = build();
    const dto = { pings: [] } as any;

    await d.controller.batchIngestLocationPings(dto, actor);

    expect(d.ingestService.batchIngestLocationPings).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });
});

describe('TimescaleAdminController', () => {
  function build() {
    const adminService = {
      configureHypertable: mockFn(async () => ({ table: 'x' })),
      updateHypertable: mockFn(async () => ({ table: 'x' })),
      runCompression: mockFn(async () => ({ chunksCompressed: 0 })),
      applyRetention: mockFn(async () => ({ chunksDropped: 0 })),
      refreshRollup: mockFn(async () => ({ bucketsMaterialized: 0 })),
    };
    return {
      controller: new TimescaleAdminController(adminService as any),
      adminService,
    };
  }

  it('delega la configuración de la hypertable (UC-58-04)', async () => {
    const d = build();
    const dto = { table: 'device_raw_reading_series' } as any;

    await d.controller.configureHypertable(dto, actor);

    expect(d.adminService.configureHypertable).toHaveBeenCalledWith(dto, actor);
  });

  it('valida la tabla de la ruta al ajustar el chunk (UC-58-04)', async () => {
    const d = build();
    const dto = { chunkTimeInterval: '1 day' } as any;

    await d.controller.updateHypertable('normalized_vital_series', dto, actor);
    expect(d.adminService.updateHypertable).toHaveBeenCalledWith(
      'normalized_vital_series',
      dto,
      actor,
    );

    expect(() => d.controller.updateHypertable('pg_class', dto, actor)).toThrow(
      /no pertenece al catálogo/,
    );
  });

  it('delega la compresión (UC-58-05)', async () => {
    const d = build();
    const dto = { table: 'device_raw_reading_series' } as any;

    await d.controller.runCompression(dto, actor);

    expect(d.adminService.runCompression).toHaveBeenCalledWith(dto, actor);
  });

  it('delega la retención (UC-58-06)', async () => {
    const d = build();
    const dto = { table: 'location_ping_series' } as any;

    await d.controller.applyRetention(dto, actor);

    expect(d.adminService.applyRetention).toHaveBeenCalledWith(dto, actor);
  });

  it('la ruta literal de auditoría fija su propio rollup (UC-58-08)', async () => {
    const d = build();
    const dto = { from: 'a', to: 'b' } as any;

    await d.controller.refreshAuditDaily(dto, actor);

    expect(d.adminService.refreshRollup).toHaveBeenCalledWith(
      'continuous_audit_daily',
      dto,
      actor,
    );
  });

  it('valida el nombre del rollup contra la lista cerrada (UC-58-07)', async () => {
    const d = build();
    const dto = { from: 'a', to: 'b' } as any;

    await d.controller.refreshRollup('continuous_sli_hourly', dto, actor);
    expect(d.adminService.refreshRollup).toHaveBeenCalledWith(
      'continuous_sli_hourly',
      dto,
      actor,
    );

    expect(() => d.controller.refreshRollup('lo_que_sea', dto, actor)).toThrow(
      /El rollup debe ser uno de/,
    );
  });
});
