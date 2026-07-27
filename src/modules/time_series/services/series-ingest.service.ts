import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import { SeriesIngestRepository } from '../repositories';
import {
  METRIC_CODES,
  PIPELINE_CODE,
  type BackfillableDataset,
  type BatchIngestDataset,
  type MetricDataset,
} from '../constants';
import {
  BatchIngestPointsDto,
  BatchIngestResponseDto,
  IngestDeviceReadingsDto,
  BatchIngestAdsDto,
  BatchIngestMetricsDto,
  BatchIngestLocationDto,
  GovernedBackfillDto,
  GovernedBackfillResponseDto,
} from '../dto';

const DEFAULT_SOURCE_VERSION = '1';

/**
 * Ingesta append-only de alto volumen (UC-58-01, 02, 10, 11, 12, 13).
 *
 * Todas las operaciones comparten la misma forma: un lote entra entero o no entra,
 * cada punto lleva su `ingestion_id` y su `quality_state`, y la operación emite
 * una métrica de pipeline con lo que hizo. Ninguna actualiza una fila existente.
 */
@Injectable()
export class SeriesIngestService {
  constructor(
    private readonly em: EntityManager,
    private readonly ingestRepo: SeriesIngestRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SeriesIngestService.name);
  }

  /**
   * UC-58-01: ingerir un lote de puntos en una serie.
   *
   * El `ingestion_id` marca el lote, no el punto: un colector que reintenta manda
   * el mismo lote entero, y por eso la deduplicación es por lote y no por fila.
   */
  async batchIngestPoints(
    seriesId: string,
    dto: BatchIngestPointsDto,
    actor: AuthenticatedUser,
  ): Promise<BatchIngestResponseDto> {
    return this.em.transactional(async (tx) => {
      const now = new Date();
      const sourceVersion = dto.sourceVersion ?? DEFAULT_SOURCE_VERSION;

      const rows = dto.points.map((point) => ({
        time: new Date(point.time),
        tenantId: dto.tenantId,
        seriesId,
        ingestionId: dto.ingestionId,
        sourceVersion,
        qualityState: 'received',
        ...point.values,
      }));

      const inserted = this.ingestRepo.insertPoints(
        tx,
        dto.dataset as BatchIngestDataset,
        rows,
      );

      this.recordPipelineMetric(tx, {
        time: now,
        tenantId: dto.tenantId,
        seriesId,
        ingestionId: dto.ingestionId,
        batchId: dto.ingestionId,
        stageCode: 'ingest',
        metricCode: METRIC_CODES.ROWS_INGESTED,
        metricValue: inserted,
        dimensions: { dataset: dto.dataset },
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'SeriesBatchIngested',
        aggregateType: `time_series.${dto.dataset}`,
        aggregateId: dto.ingestionId,
        payloadJson: { seriesId, dataset: dto.dataset, rowsIngested: inserted },
        // El lote es la unidad de idempotencia: reenviarlo no debe volver a
        // disparar las proyecciones de los mismos puntos.
        idempotencyKey: `ts-batch:${dto.dataset}:${dto.ingestionId}`,
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'ts.ingest.batch',
          seriesId,
          dataset: dto.dataset,
          rows: inserted,
        },
        'Lote de puntos ingerido',
      );

      return {
        seriesId,
        ingestionId: dto.ingestionId,
        rowsIngested: inserted,
        rowsSkipped: 0,
      };
    });
  }

  /**
   * UC-58-02: ingerir lecturas de un dispositivo médico.
   *
   * La clave `(tenant, dispositivo, canal, secuencia)` descarta el reenvío. Un
   * dispositivo con conexión intermitente reenvía lo que no pudo confirmar, y sin
   * esto la misma lectura entraría dos veces y falsearía cualquier media.
   */
  async ingestDeviceReadings(
    deviceId: string,
    dto: IngestDeviceReadingsDto,
    actor: AuthenticatedUser,
  ): Promise<BatchIngestResponseDto> {
    return this.em.transactional(async (tx) => {
      const now = new Date();
      const seriesId = dto.seriesId ?? deviceId;
      let inserted = 0;
      let skipped = 0;

      for (const reading of dto.readings) {
        if (reading.deviceSequence) {
          const duplicate = await this.ingestRepo.findDeviceReadingBySequence(
            tx,
            dto.tenantId,
            deviceId,
            reading.channelCode,
            reading.deviceSequence,
          );
          if (duplicate) {
            skipped += 1;
            continue;
          }
        }

        this.ingestRepo.createDeviceReading(tx, {
          time: new Date(reading.time),
          tenantId: dto.tenantId,
          seriesId,
          ingestionId: dto.ingestionId,
          sourceVersion: DEFAULT_SOURCE_VERSION,
          qualityState: 'received',
          deviceId,
          patientProfileId: reading.patientProfileId,
          channelCode: reading.channelCode,
          rawValue: reading.rawValue,
          numericValue: reading.numericValue,
          unitCode: reading.unitCode,
          deviceSequence: reading.deviceSequence,
          observedAtDevice: reading.observedAtDevice
            ? new Date(reading.observedAtDevice)
            : undefined,
          receivedAt: now,
        });
        inserted += 1;
      }

      this.recordPipelineMetric(tx, {
        time: now,
        tenantId: dto.tenantId,
        seriesId,
        ingestionId: dto.ingestionId,
        batchId: dto.ingestionId,
        stageCode: 'ingest',
        metricCode: METRIC_CODES.DEVICE_ROWS,
        metricValue: inserted,
        dimensions: { deviceId, skipped },
      });

      if (inserted > 0) {
        await this.outbox.publishDomainEvent(tx, {
          tenantId: dto.tenantId,
          eventType: 'DeviceRawReadingReceived',
          aggregateType: 'time_series.device_raw_reading_series',
          aggregateId: deviceId,
          payloadJson: { seriesId, deviceId, rowsIngested: inserted },
          idempotencyKey: `ts-device:${deviceId}:${dto.ingestionId}`,
          actorUserId: actor.id,
        });
      }

      this.logger.info(
        { operation: 'ts.ingest.device', deviceId, rows: inserted, skipped },
        'Lecturas de dispositivo ingeridas',
      );

      return {
        seriesId,
        ingestionId: dto.ingestionId,
        rowsIngested: inserted,
        rowsSkipped: skipped,
      };
    });
  }

  /**
   * UC-58-10: ingerir eventos de entrega de publicidad.
   *
   * El origen manda su propio `event_id` justamente para poder reenviar: la clave
   * `(tenant, cuenta, evento, nombre)` colapsa el reenvío. Contar dos veces una
   * conversión falsea el coste por adquisición, que es lo que se factura.
   */
  async batchIngestAdsEvents(
    dto: BatchIngestAdsDto,
    actor: AuthenticatedUser,
  ): Promise<BatchIngestResponseDto> {
    return this.em.transactional(async (tx) => {
      const now = new Date();
      const seriesId = dto.seriesId ?? 'ads-delivery';
      let inserted = 0;
      let skipped = 0;

      for (const event of dto.events) {
        const duplicate = await this.ingestRepo.findAdsEvent(
          tx,
          dto.tenantId,
          event.adAccountId,
          event.eventId,
          event.eventName,
        );
        if (duplicate) {
          skipped += 1;
          continue;
        }

        this.ingestRepo.createAdsEvent(tx, {
          time: new Date(event.time),
          tenantId: dto.tenantId,
          seriesId,
          ingestionId: dto.ingestionId,
          sourceVersion: DEFAULT_SOURCE_VERSION,
          qualityState: 'received',
          adAccountId: event.adAccountId,
          campaignId: event.campaignId,
          adSetId: event.adSetId,
          adId: event.adId,
          eventName: event.eventName,
          eventId: event.eventId,
          value: event.value,
          currencyCode: event.currencyCode,
          dimensions: event.dimensions,
        });
        inserted += 1;
      }

      this.recordPipelineMetric(tx, {
        time: now,
        tenantId: dto.tenantId,
        seriesId,
        ingestionId: dto.ingestionId,
        batchId: dto.ingestionId,
        stageCode: 'ingest',
        metricCode: METRIC_CODES.ADS_ROWS,
        metricValue: inserted,
        dimensions: { skipped },
      });

      if (inserted > 0) {
        await this.outbox.publishDomainEvent(tx, {
          tenantId: dto.tenantId,
          eventType: 'AdsEventsIngested',
          aggregateType: 'time_series.ads_delivery_event_series',
          aggregateId: dto.ingestionId,
          payloadJson: { seriesId, rowsIngested: inserted },
          idempotencyKey: `ts-ads:${dto.ingestionId}`,
          actorUserId: actor.id,
        });
      }

      this.logger.info(
        { operation: 'ts.ingest.ads', rows: inserted, skipped },
        'Eventos de publicidad ingeridos',
      );

      return {
        seriesId,
        ingestionId: dto.ingestionId,
        rowsIngested: inserted,
        rowsSkipped: skipped,
      };
    });
  }

  /** UC-58-11: ingerir métricas de runtime de IA, de pipeline o de SLI. */
  async batchIngestMetrics(
    dataset: MetricDataset,
    dto: BatchIngestMetricsDto,
    actor: AuthenticatedUser,
  ): Promise<BatchIngestResponseDto> {
    return this.em.transactional(async (tx) => {
      const now = new Date();
      const seriesId = dto.seriesId ?? dataset;

      const rows = dto.points.map((point) => ({
        time: new Date(point.time),
        tenantId: dto.tenantId,
        seriesId,
        ingestionId: dto.ingestionId,
        sourceVersion: DEFAULT_SOURCE_VERSION,
        qualityState: 'received',
        ...point.values,
      }));

      const inserted = this.ingestRepo.insertPoints(tx, dataset, rows);

      // La métrica de la propia ingesta no se emite cuando el destino es la tabla
      // de métricas de pipeline: se estaría midiendo a sí misma y cada lote
      // generaría una fila más que a su vez habría que medir.
      if (dataset !== 'ingestion_pipeline_metric_series') {
        this.recordPipelineMetric(tx, {
          time: now,
          tenantId: dto.tenantId,
          seriesId,
          ingestionId: dto.ingestionId,
          batchId: dto.ingestionId,
          stageCode: 'ingest',
          metricCode: METRIC_CODES.ROWS_INGESTED,
          metricValue: inserted,
          dimensions: { dataset },
        });
      }

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'RuntimeMetricsIngested',
        aggregateType: `time_series.${dataset}`,
        aggregateId: dto.ingestionId,
        payloadJson: { seriesId, dataset, rowsIngested: inserted },
        idempotencyKey: `ts-metrics:${dataset}:${dto.ingestionId}`,
        actorUserId: actor.id,
      });

      this.logger.info(
        { operation: 'ts.ingest.metrics', dataset, rows: inserted },
        'Métricas de runtime ingeridas',
      );

      return {
        seriesId,
        ingestionId: dto.ingestionId,
        rowsIngested: inserted,
        rowsSkipped: 0,
      };
    });
  }

  /**
   * UC-58-13: ingerir pings de ubicación.
   *
   * Exige el consentimiento que ampara el registro. La ubicación de una persona es
   * el dato más fácil de recoger sin darse cuenta de que hace falta permiso, y por
   * eso el permiso es un campo obligatorio de la petición y no una comprobación
   * que se pueda olvidar.
   */
  async batchIngestLocationPings(
    dto: BatchIngestLocationDto,
    actor: AuthenticatedUser,
  ): Promise<BatchIngestResponseDto> {
    return this.em.transactional(async (tx) => {
      const now = new Date();
      const seriesId = dto.seriesId ?? 'location-tracking';

      for (const ping of dto.pings) {
        this.ingestRepo.createLocationPing(tx, {
          time: new Date(ping.time),
          tenantId: dto.tenantId,
          seriesId,
          ingestionId: dto.ingestionId,
          sourceVersion: DEFAULT_SOURCE_VERSION,
          qualityState: 'received',
          subjectType: ping.subjectType,
          subjectId: ping.subjectId,
          latitude: ping.latitude,
          longitude: ping.longitude,
          altitudeM: ping.altitudeM,
          accuracyM: ping.accuracyM,
          speedMps: ping.speedMps,
          geohash: ping.geohash,
        });
      }

      this.recordPipelineMetric(tx, {
        time: now,
        tenantId: dto.tenantId,
        seriesId,
        ingestionId: dto.ingestionId,
        batchId: dto.ingestionId,
        stageCode: 'ingest',
        metricCode: METRIC_CODES.LOCATION_ROWS,
        metricValue: dto.pings.length,
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'LocationPingsIngested',
        aggregateType: 'time_series.location_ping_series',
        aggregateId: dto.ingestionId,
        payloadJson: {
          seriesId,
          rowsIngested: dto.pings.length,
          // El consentimiento viaja en el evento: quien proyecte estos datos tiene
          // que poder comprobar bajo qué permiso llegaron, y revocarlo acelera el
          // descarte de los chunks correspondientes.
          consentId: dto.consentId,
        },
        idempotencyKey: `ts-location:${dto.ingestionId}`,
        actorUserId: actor.id,
      });

      this.logger.info(
        { operation: 'ts.ingest.location', rows: dto.pings.length },
        'Pings de ubicación ingeridos',
      );

      return {
        seriesId,
        ingestionId: dto.ingestionId,
        rowsIngested: dto.pings.length,
        rowsSkipped: 0,
      };
    });
  }

  /**
   * UC-58-12: backfill gobernado.
   *
   * **No se actualiza nada.** Las correcciones entran como eventos nuevos con
   * `source_version` incrementada y `quality_state = backfill`, y los originales se
   * quedan donde estaban. Un histórico que se puede reescribir deja de servir para
   * responder "qué se sabía en ese momento", que es la pregunta que justifica
   * guardarlo.
   *
   * La justificación es obligatoria: una corrección sin motivo declarado es
   * indistinguible de una manipulación.
   */
  async governedBackfill(
    seriesId: string,
    dto: GovernedBackfillDto,
    actor: AuthenticatedUser,
  ): Promise<GovernedBackfillResponseDto> {
    return this.em.transactional(async (tx) => {
      const from = new Date(dto.windowFrom);
      const to = new Date(dto.windowTo);
      if (from >= to) {
        throw new PreconditionFailedException(
          'La ventana de corrección tiene que empezar antes de terminar.',
          { windowFrom: dto.windowFrom, windowTo: dto.windowTo },
        );
      }

      // Una corrección fuera de la ventana declarada no es la corrección que se
      // aprobó, y aquí la ventana es lo único que acota el alcance de la operación.
      for (const correction of dto.corrections) {
        const time = new Date(correction.time);
        if (time < from || time >= to) {
          throw new PreconditionFailedException(
            'Una corrección cae fuera de la ventana declarada.',
            {
              time: correction.time,
              windowFrom: dto.windowFrom,
              windowTo: dto.windowTo,
            },
          );
        }
      }

      const now = new Date();
      const ingestionId = randomUUID();
      const sourceVersion = `${Date.parse(now.toISOString())}`;

      const rows = dto.corrections.map((correction) => ({
        time: new Date(correction.time),
        tenantId: dto.tenantId,
        seriesId,
        ingestionId,
        sourceVersion,
        qualityState: 'backfill',
        ...correction.values,
      }));

      const inserted = this.ingestRepo.insertPoints(
        tx,
        dto.dataset as BackfillableDataset,
        rows,
      );

      this.recordPipelineMetric(tx, {
        time: now,
        tenantId: dto.tenantId,
        seriesId,
        ingestionId,
        batchId: dto.batchId,
        stageCode: 'backfill',
        metricCode: METRIC_CODES.ROWS_BACKFILLED,
        metricValue: inserted,
        dimensions: { dataset: dto.dataset },
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'GovernedBackfillApplied',
        aggregateType: `time_series.${dto.dataset}`,
        aggregateId: dto.batchId,
        payloadJson: {
          seriesId,
          dataset: dto.dataset,
          rowsBackfilled: inserted,
          windowFrom: dto.windowFrom,
          windowTo: dto.windowTo,
          justification: dto.justification,
        },
        actorUserId: actor.id,
      });

      this.logger.warn(
        {
          operation: 'ts.backfill.governed',
          seriesId,
          dataset: dto.dataset,
          rows: inserted,
          batchId: dto.batchId,
        },
        'Backfill gobernado aplicado como eventos de corrección',
      );

      return { seriesId, rowsBackfilled: inserted, sourceVersion };
    });
  }

  /**
   * Métrica de la etapa. La emite casi toda operación del módulo: sin ella no hay
   * forma de saber si un pipeline dejó de ingerir, porque la ausencia de datos y
   * la ausencia de ingesta se parecen demasiado.
   */
  private recordPipelineMetric(
    tx: EntityManager,
    input: {
      time: Date;
      tenantId: string;
      seriesId: string;
      ingestionId: string;
      batchId: string;
      stageCode: string;
      metricCode: string;
      metricValue: number;
      dimensions?: unknown;
    },
  ): void {
    this.ingestRepo.createPipelineMetric(tx, {
      time: input.time,
      tenantId: input.tenantId,
      seriesId: `${PIPELINE_CODE}:${input.stageCode}`,
      ingestionId: input.ingestionId,
      sourceVersion: DEFAULT_SOURCE_VERSION,
      qualityState: 'received',
      pipelineCode: PIPELINE_CODE,
      batchId: input.batchId,
      stageCode: input.stageCode,
      metricCode: input.metricCode,
      metricValue: input.metricValue,
      dimensions: input.dimensions,
    });
  }
}
