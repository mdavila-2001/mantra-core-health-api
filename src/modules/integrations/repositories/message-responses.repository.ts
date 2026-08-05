import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { MessageResponses } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar la respuesta de un mensaje saliente (UC-12-06 / UC-12-10). */
export interface CreateResponseData {
  /**
   * Identificador asociado a outbound message.
   */
  outboundMessageId: string;
  /**
   * Valor de response payload json mantenido por la instancia.
   */
  responsePayloadJson: unknown;
  /**
   * Valor de http status mantenido por la instancia.
   */
  httpStatus?: number;
  /**
   * Valor de latency ms mantenido por la instancia.
   */
  latencyMs?: number;
  /**
   * Valor de is success mantenido por la instancia.
   */
  isSuccess?: boolean;
  /**
   * Valor de received at mantenido por la instancia.
   */
  receivedAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `integrations.message_responses`. */
@Injectable()
export class MessageResponsesRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `MessageResponses`.
   */
  create(em: EntityManager, data: CreateResponseData): MessageResponses {
    return em.create(
      MessageResponses,
      {
        outboundMessageId: data.outboundMessageId,
        responsePayloadJson: data.responsePayloadJson,
        httpStatus: data.httpStatus,
        latencyMs: data.latencyMs,
        isSuccess: data.isSuccess,
        receivedAt: data.receivedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
