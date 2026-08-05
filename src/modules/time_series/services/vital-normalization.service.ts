import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import { ObservationsRepository } from '../../clinical/repositories';
import { CLIN } from '../../clinical/clinical.concepts';
import { SeriesIngestRepository } from '../repositories';
import { METRIC_CODES, PIPELINE_CODE } from '../constants';
import { NormalizeReadingDto, NormalizeReadingResponseDto } from '../dto';

/**
 * Normalización de lecturas crudas y promoción al registro clínico (UC-58-03).
 *
 * Es el único punto del módulo que escribe fuera de `time_series`, y es
 * deliberado: el caso de uso declara `clinical.observations — INSERT` como parte
 * de la misma transacción. La medición y la observación clínica que la representa
 * tienen que confirmarse juntas; si no, quedaría una vital marcada como promovida
 * apuntando a una observación que no existe.
 */
@Injectable()
export class VitalNormalizationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ingestRepo - Valor de ingest repo requerido por la operación.
   * @param observationsRepo - Valor de observations repo requerido por la operación.
   * @param outbox - Valor de outbox requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly ingestRepo: SeriesIngestRepository,
    private readonly observationsRepo: ObservationsRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(VitalNormalizationService.name);
  }

  /**
   * Normaliza una lectura cruda a constante vital y, si procede, la promueve.
   *
   * La idempotencia es por `(serie, instante, código de observación)`: reprocesar
   * el mismo evento crudo —lo normal cuando el worker consume *at-least-once*—
   * crearía una segunda observación clínica del mismo hecho, y el historial del
   * paciente mostraría dos tomas de tensión donde hubo una.
   */
  async normalizeReading(
    dto: NormalizeReadingDto,
    actor: AuthenticatedUser,
  ): Promise<NormalizeReadingResponseDto> {
    return this.em.transactional(async (tx) => {
      const time = new Date(dto.time);

      const existing = await this.ingestRepo.findVital(
        tx,
        dto.seriesId,
        time,
        dto.observationCode,
      );
      if (existing) {
        return {
          seriesId: dto.seriesId,
          observationCode: dto.observationCode,
          validationState: existing.validationState,
          clinicallyPromotedObservationId:
            existing.clinicallyPromotedObservationId,
          duplicate: true,
        };
      }

      const raw = await this.ingestRepo.findDeviceReadingForUpdate(tx, {
        time,
        tenantId: dto.tenantId,
        seriesId: dto.seriesId,
      });
      if (!raw) {
        throw new ResourceNotFoundException(
          'No hay lectura cruda para ese instante y serie.',
          {
            seriesId: dto.seriesId,
            time: dto.time,
          },
        );
      }
      if (raw.qualityState === 'rejected') {
        throw new PreconditionFailedException(
          'La lectura cruda está marcada como rechazada; no se normaliza.',
          { seriesId: dto.seriesId, time: dto.time },
        );
      }
      // Sin valor numérico no hay constante vital que normalizar: una lectura
      // cuyo `raw_value` no se pudo interpretar no debe llegar al registro clínico
      // como si se hubiera medido algo.
      if (raw.numericValue === undefined || raw.numericValue === null) {
        throw new PreconditionFailedException(
          'La lectura cruda no tiene valor numérico; no se puede normalizar.',
          { seriesId: dto.seriesId, time: dto.time },
        );
      }

      const vital = this.ingestRepo.createVital(tx, {
        time,
        tenantId: dto.tenantId,
        seriesId: dto.seriesId,
        ingestionId: raw.ingestionId,
        sourceVersion: raw.sourceVersion,
        qualityState: 'validated',
        patientProfileId: dto.patientProfileId,
        observationCode: dto.observationCode,
        numericValue: raw.numericValue,
        unitCode: dto.unitCode,
        deviceId: raw.deviceId,
        encounterId: dto.encounterId,
        validationState: 'validated',
      });

      let promotedObservationId: string | undefined;
      if (dto.promoteToClinical === true) {
        const observation = this.observationsRepo.create(tx, {
          custodianTenantId: dto.tenantId,
          patientProfileId: dto.patientProfileId,
          encounterId: dto.encounterId,
          codeConceptId: dto.observationCodeConceptId,
          statusConceptId: CLIN.OBSERVATION_FINAL,
          valueTypeConceptId: CLIN.VALUE_TYPE_QUANTITY,
          quantityValue: String(raw.numericValue),
          quantityUnitConceptId: dto.unitConceptId,
          sourceDeviceId: raw.deviceId,
          effectiveStartAt: raw.observedAtDevice ?? time,
          issuedAt: new Date(),
          recordedByUserId: actor.id,
          actorUserId: actor.id,
        });
        promotedObservationId = observation.id;
        // El enlace se escribe en la misma transacción: la vital sabe qué
        // observación la representa, y la observación existe.
        vital.clinicallyPromotedObservationId = observation.id;
      }

      this.ingestRepo.createPipelineMetric(tx, {
        time: new Date(),
        tenantId: dto.tenantId,
        seriesId: `${PIPELINE_CODE}:normalize`,
        ingestionId: raw.ingestionId,
        sourceVersion: '1',
        qualityState: 'received',
        pipelineCode: PIPELINE_CODE,
        batchId: raw.ingestionId,
        stageCode: 'normalize',
        metricCode: METRIC_CODES.VITALS_NORMALIZED,
        metricValue: 1,
        dimensions: { promoted: promotedObservationId ? 1 : 0 },
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'VitalNormalizedAndPromoted',
        aggregateType: 'time_series.normalized_vital_series',
        aggregateId: dto.seriesId,
        payloadJson: {
          seriesId: dto.seriesId,
          observationCode: dto.observationCode,
          patientProfileId: dto.patientProfileId,
          clinicallyPromotedObservationId: promotedObservationId ?? null,
        },
        idempotencyKey: `ts-normalize:${dto.seriesId}:${time.toISOString()}:${dto.observationCode}`,
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'ts.normalize.vital',
          seriesId: dto.seriesId,
          observationCode: dto.observationCode,
          promoted: Boolean(promotedObservationId),
        },
        'Lectura normalizada a constante vital',
      );

      return {
        seriesId: dto.seriesId,
        observationCode: dto.observationCode,
        validationState: vital.validationState,
        clinicallyPromotedObservationId: promotedObservationId,
        duplicate: false,
      };
    });
  }
}
