import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IntegrationIdempotencyRecords } from '../entities';

/** Datos para registrar una clave de idempotencia (UC-31-05). */
export interface CreateIdempotencyData {
  /**
   * Identificador asociado a integration contract.
   */
  integrationContractId: string;
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  idempotencyKey: string;
  /**
   * Identificador asociado a operation concept.
   */
  operationConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de request hash mantenido por la instancia.
   */
  requestHash?: string;
  /**
   * Identificador asociado a first exchange record.
   */
  firstExchangeRecordId?: string;
  /**
   * Valor de response reference mantenido por la instancia.
   */
  responseReference?: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
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
