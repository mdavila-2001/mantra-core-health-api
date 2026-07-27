import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IntegrationExchangeAttempts } from '../entities';

/** Datos para registrar un intento de intercambio (UC-31-06 / UC-31-07). */
export interface CreateAttemptData {
  integrationExchangeRecordId: string;
  attemptNumber: number;
  outcomeConceptId: string;
  endpointId?: string;
  startedAt?: Date;
  completedAt?: Date;
  httpStatus?: number;
  providerErrorCode?: string;
  retryDecisionConceptId?: string;
  nextRetryAt?: Date;
  traceId?: string;
}

/** Acceso a datos de `integration_contracts.integration_exchange_attempts`. */
@Injectable()
export class ExchangeAttemptsRepository {
  /** Mayor `attempt_number` del registro (0 si no hay ninguno). */
  async maxAttemptNumber(em: EntityManager, recordId: string): Promise<number> {
    const rows = await em.find(
      IntegrationExchangeAttempts,
      { integrationExchangeRecordId: recordId },
      {
        fields: ['attemptNumber'],
        orderBy: { attemptNumber: 'desc' },
        limit: 1,
      },
    );
    return rows.length ? rows[0].attemptNumber : 0;
  }

  /** Último intento del registro (por número de intento) o `null`. */
  async lastAttempt(
    em: EntityManager,
    recordId: string,
  ): Promise<IntegrationExchangeAttempts | null> {
    const rows = await em.find(
      IntegrationExchangeAttempts,
      { integrationExchangeRecordId: recordId },
      { orderBy: { attemptNumber: 'desc' }, limit: 1 },
    );
    return rows.length ? rows[0] : null;
  }

  /** Crea la entidad de intento en la unidad de trabajo (sin flush). */
  create(
    em: EntityManager,
    data: CreateAttemptData,
  ): IntegrationExchangeAttempts {
    return em.create(
      IntegrationExchangeAttempts,
      {
        integrationExchangeRecordId: data.integrationExchangeRecordId,
        attemptNumber: data.attemptNumber,
        endpointId: data.endpointId,
        startedAt: data.startedAt,
        completedAt: data.completedAt,
        httpStatus: data.httpStatus,
        providerErrorCode: data.providerErrorCode,
        retryDecisionConceptId: data.retryDecisionConceptId,
        nextRetryAt: data.nextRetryAt,
        traceId: data.traceId,
        outcomeConceptId: data.outcomeConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
