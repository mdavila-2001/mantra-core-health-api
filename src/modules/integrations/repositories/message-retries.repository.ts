import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { MessageRetries } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar un intento de reintento (UC-12-07 / UC-12-08). */
export interface CreateRetryData {
  /**
   * Identificador asociado a outbound message.
   */
  outboundMessageId: string;
  /**
   * Valor de attempt number mantenido por la instancia.
   */
  attemptNumber: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de payload version mantenido por la instancia.
   */
  payloadVersion: number;
  /**
   * Valor de error text mantenido por la instancia.
   */
  errorText?: string;
  /**
   * Valor de request snapshot json mantenido por la instancia.
   */
  requestSnapshotJson?: unknown;
  /**
   * Valor de attempted at mantenido por la instancia.
   */
  attemptedAt?: Date;
  /**
   * Valor de next retry at mantenido por la instancia.
   */
  nextRetryAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `integrations.message_retries`. */
@Injectable()
export class MessageRetriesRepository {
  /**
   * Mayor `attempt_number` registrado para un mensaje; 0 si no hay reintentos.
   * Base para el siguiente número de intento (unique(msg, attempt) en BD).
   */
  async maxAttempt(
    em: EntityManager,
    outboundMessageId: string,
  ): Promise<number> {
    const rows = await em.find(
      MessageRetries,
      { outboundMessageId },
      { orderBy: { attemptNumber: 'desc' }, limit: 1 },
    );
    return rows.length ? rows[0].attemptNumber : 0;
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `MessageRetries`.
   */
  create(em: EntityManager, data: CreateRetryData): MessageRetries {
    return em.create(
      MessageRetries,
      {
        outboundMessageId: data.outboundMessageId,
        attemptNumber: data.attemptNumber,
        statusConceptId: data.statusConceptId,
        payloadVersion: data.payloadVersion,
        errorText: data.errorText,
        requestSnapshotJson: data.requestSnapshotJson,
        attemptedAt: data.attemptedAt,
        nextRetryAt: data.nextRetryAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
