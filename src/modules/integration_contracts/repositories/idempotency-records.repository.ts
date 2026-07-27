import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IntegrationIdempotencyRecords } from '../entities';

/** Datos para registrar una clave de idempotencia (UC-31-05). */
export interface CreateIdempotencyData {
  integrationContractId: string;
  idempotencyKey: string;
  operationConceptId: string;
  statusConceptId: string;
  requestHash?: string;
  firstExchangeRecordId?: string;
  responseReference?: string;
  expiresAt?: Date;
}

/** Acceso a datos de `integration_contracts.integration_idempotency_records`. */
@Injectable()
export class IdempotencyRecordsRepository {
  /** Busca un registro por (contrato, clave de idempotencia) o `null`. */
  findByKey(
    em: EntityManager,
    contractId: string,
    idempotencyKey: string,
  ): Promise<IntegrationIdempotencyRecords | null> {
    return em.findOne(IntegrationIdempotencyRecords, {
      integrationContractId: contractId,
      idempotencyKey,
    });
  }

  /** Crea la entidad de idempotencia en la unidad de trabajo (sin flush). */
  create(
    em: EntityManager,
    data: CreateIdempotencyData,
  ): IntegrationIdempotencyRecords {
    return em.create(
      IntegrationIdempotencyRecords,
      {
        integrationContractId: data.integrationContractId,
        idempotencyKey: data.idempotencyKey,
        operationConceptId: data.operationConceptId,
        requestHash: data.requestHash,
        firstExchangeRecordId: data.firstExchangeRecordId,
        responseReference: data.responseReference,
        expiresAt: data.expiresAt,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
