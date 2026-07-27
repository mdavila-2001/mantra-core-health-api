import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  AdsDeliveryEventSeries,
  AiRuntimeMetricSeries,
  ApplicationTrackingSeries,
  AuditAccessMetricSeries,
  DeviceRawReadingSeries,
  IngestionPipelineMetricSeries,
  LabAnalyzerEventSeries,
  LocationPingSeries,
  NormalizedVitalSeries,
  PaymentGatewayMetricSeries,
  ServiceSliSeries,
  TelemetryEventSeries,
} from '../entities';
import type { TimeseriesTable } from '../constants';

/**
 * Correspondencia nombre de tabla → clase de entidad. Es lo que permite que el
 * dataset llegue como texto en la ruta sin que el texto acabe en una sentencia:
 * o está en el mapa, o la operación no existe.
 */
const ENTITY_BY_TABLE = {
  ads_delivery_event_series: AdsDeliveryEventSeries,
  ai_runtime_metric_series: AiRuntimeMetricSeries,
  application_tracking_series: ApplicationTrackingSeries,
  audit_access_metric_series: AuditAccessMetricSeries,
  device_raw_reading_series: DeviceRawReadingSeries,
  ingestion_pipeline_metric_series: IngestionPipelineMetricSeries,
  lab_analyzer_event_series: LabAnalyzerEventSeries,
  location_ping_series: LocationPingSeries,
  normalized_vital_series: NormalizedVitalSeries,
  payment_gateway_metric_series: PaymentGatewayMetricSeries,
  service_sli_series: ServiceSliSeries,
  telemetry_event_series: TelemetryEventSeries,
} as const;

/** Campos comunes a todo punto de cualquiera de las doce series. */
export interface SeriesPointBase {
  time: Date;
  tenantId: string;
  seriesId: string;
  ingestionId: string;
  sourceVersion: string;
  qualityState: string;
}

export interface CreateVitalData extends SeriesPointBase {
  patientProfileId: string;
  observationCode: string;
  numericValue: number;
  unitCode: string;
  deviceId?: string;
  encounterId?: string;
  validationState: string;
}

export interface CreatePipelineMetricData extends SeriesPointBase {
  pipelineCode: string;
  batchId: string;
  stageCode: string;
  metricCode: string;
  metricValue: number;
  dimensions?: unknown;
}

/**
 * Escritura append-only sobre las doce series de medición.
 *
 * No hay ningún `update*` ni `delete*` salvo el enlace de promoción clínica: una
 * serie temporal no se corrige en su sitio, se corrige insertando un evento nuevo
 * con `source_version` mayor (UC-58-12).
 */
@Injectable()
export class SeriesIngestRepository {
  /**
   * Inserta un lote en la serie indicada.
   *
   * `em.create` por fila y no `insertMany` a propósito: `insertMany` no pasa por
   * el ciclo de vida de la unidad de trabajo, y aquí la transacción es lo que
   * garantiza que el lote entra entero o no entra.
   */
  insertPoints(
    em: EntityManager,
    table: TimeseriesTable,
    rows: Record<string, unknown>[],
  ): number {
    const entity = ENTITY_BY_TABLE[table];
    for (const row of rows) {
      em.create(entity as never, row as never, { partial: true });
    }
    return rows.length;
  }

  /** Métrica de una etapa del pipeline; la emite casi toda operación del módulo. */
  createPipelineMetric(
    em: EntityManager,
    data: CreatePipelineMetricData,
  ): IngestionPipelineMetricSeries {
    return em.create(
      IngestionPipelineMetricSeries,
      {
        time: data.time,
        tenantId: data.tenantId,
        seriesId: data.seriesId,
        ingestionId: data.ingestionId,
        sourceVersion: data.sourceVersion,
        qualityState: data.qualityState,
        pipelineCode: data.pipelineCode,
        batchId: data.batchId,
        stageCode: data.stageCode,
        metricCode: data.metricCode,
        metricValue: data.metricValue,
        dimensions: data.dimensions as never,
      },
      { partial: true },
    );
  }

  // --- Lecturas crudas de dispositivo (UC-58-02, 03) ---

  /**
   * Duplicado del dispositivo: la clave natural del caso de uso es
   * `(tenant, dispositivo, canal, secuencia)`. Un dispositivo que reintenta el
   * envío manda la misma secuencia, y sin esta comprobación la lectura entraría
   * dos veces y falsearía cualquier media.
   */
  findDeviceReadingBySequence(
    em: EntityManager,
    tenantId: string,
    deviceId: string,
    channelCode: string,
    deviceSequence: string,
  ): Promise<DeviceRawReadingSeries | null> {
    return em.findOne(DeviceRawReadingSeries, {
      tenantId,
      deviceId,
      channelCode,
      deviceSequence,
    });
  }

  createDeviceReading(
    em: EntityManager,
    data: SeriesPointBase & {
      deviceId: string;
      patientProfileId?: string;
      channelCode: string;
      rawValue: unknown;
      numericValue?: number;
      unitCode?: string;
      deviceSequence?: string;
      observedAtDevice?: Date;
      receivedAt: Date;
    },
  ): DeviceRawReadingSeries {
    return em.create(DeviceRawReadingSeries, data as never, { partial: true });
  }

  /** La fila cruda que se va a normalizar, bloqueada para no promoverla dos veces. */
  findDeviceReadingForUpdate(
    em: EntityManager,
    key: { time: Date; tenantId: string; seriesId: string },
  ): Promise<DeviceRawReadingSeries | null> {
    return em.findOne(DeviceRawReadingSeries, key, {
      lockMode: LockMode.PESSIMISTIC_WRITE,
    });
  }

  // --- Constantes vitales normalizadas (UC-58-03) ---

  /**
   * Idempotencia de la normalización: `(serie, instante, código de observación)`.
   * Sin ella, reprocesar el mismo evento crudo crearía una segunda observación
   * clínica del mismo hecho.
   */
  findVital(
    em: EntityManager,
    seriesId: string,
    time: Date,
    observationCode: string,
  ): Promise<NormalizedVitalSeries | null> {
    return em.findOne(NormalizedVitalSeries, {
      seriesId,
      time,
      observationCode,
    });
  }

  createVital(em: EntityManager, data: CreateVitalData): NormalizedVitalSeries {
    return em.create(NormalizedVitalSeries, data as never, { partial: true });
  }

  // --- Eventos de publicidad (UC-58-10) ---

  /**
   * La clave `(tenant, cuenta, evento, nombre)` del caso de uso. El origen manda
   * su propio `event_id` precisamente para poder reenviar sin duplicar.
   */
  findAdsEvent(
    em: EntityManager,
    tenantId: string,
    adAccountId: string,
    eventId: string,
    eventName: string,
  ): Promise<AdsDeliveryEventSeries | null> {
    return em.findOne(AdsDeliveryEventSeries, {
      tenantId,
      adAccountId,
      eventId,
      eventName,
    });
  }

  createAdsEvent(
    em: EntityManager,
    data: Record<string, unknown>,
  ): AdsDeliveryEventSeries {
    return em.create(AdsDeliveryEventSeries, data as never, { partial: true });
  }

  // --- Pings de ubicación (UC-58-13) ---

  createLocationPing(
    em: EntityManager,
    data: Record<string, unknown>,
  ): LocationPingSeries {
    return em.create(LocationPingSeries, data as never, { partial: true });
  }
}
