import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IntegrationExchangeRecords } from '../entities';

/** Datos para registrar un intercambio (UC-31-05 / UC-31-09). */
export interface CreateExchangeRecordData {
  integrationContractVersionId: string;
  directionConceptId: string;
  messageTypeConceptId: string;
  outcomeConceptId: string;
  businessIdentifier?: string;
  idempotencyKey?: string;
  correlationId?: string;
  subjectTypeConceptId?: string;
  subjectEntityId?: string;
  requestHash?: string;
  payloadFileId?: string;
  receivedAt?: Date;
}

/** Acceso a datos de `integration_contracts.integration_exchange_records`. */
@Injectable()
export class ExchangeRecordsRepository {
  /** Busca un registro de intercambio por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<IntegrationExchangeRecords | null> {
    return em.findOne(IntegrationExchangeRecords, { id });
  }

  /** Crea la entidad de registro en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateExchangeRecordData): IntegrationExchangeRecords {
    return em.create(
      IntegrationExchangeRecords,
      {
        integrationContractVersionId: data.integrationContractVersionId,
        directionConceptId: data.directionConceptId,
        messageTypeConceptId: data.messageTypeConceptId,
        businessIdentifier: data.businessIdentifier,
        idempotencyKey: data.idempotencyKey,
        correlationId: data.correlationId,
        subjectTypeConceptId: data.subjectTypeConceptId,
        subjectEntityId: data.subjectEntityId,
        requestHash: data.requestHash,
        receivedAt: data.receivedAt,
        payloadFileId: data.payloadFileId,
        outcomeConceptId: data.outcomeConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
