import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { MessageResponses } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar la respuesta de un mensaje saliente (UC-12-06 / UC-12-10). */
export interface CreateResponseData {
  outboundMessageId: string;
  responsePayloadJson: unknown;
  httpStatus?: number;
  latencyMs?: number;
  isSuccess?: boolean;
  receivedAt?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `integrations.message_responses`. */
@Injectable()
export class MessageResponsesRepository {
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
