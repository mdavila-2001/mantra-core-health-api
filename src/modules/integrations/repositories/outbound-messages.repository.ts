import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OutboundMessages } from '../entities';
import { createdBy } from '../../../common';

/** Datos para encolar un mensaje saliente (UC-12-05). */
export interface CreateOutboundData {
  connectionId: string;
  correlationId: string;
  requestPayloadJson: unknown;
  statusConceptId: string;
  payloadVersion: number;
  idempotencyKey?: string;
  endpointId?: string;
  headersJson?: unknown;
  scheduledAt?: Date;
  sourceResourceType?: string;
  sourceResourceId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `integrations.outbound_messages`. */
@Injectable()
export class OutboundMessagesRepository {
  findById(em: EntityManager, id: string): Promise<OutboundMessages | null> {
    return em.findOne(OutboundMessages, { id });
  }

  /** Idempotencia del productor: misma idempotency_key -> misma fila. */
  findByIdempotencyKey(
    em: EntityManager,
    idempotencyKey: string,
  ): Promise<OutboundMessages | null> {
    return em.findOne(OutboundMessages, { idempotencyKey });
  }

  /** Correlación de callbacks entrantes (UC-12-10). */
  findByCorrelationId(
    em: EntityManager,
    correlationId: string,
  ): Promise<OutboundMessages | null> {
    return em.findOne(OutboundMessages, { correlationId });
  }

  create(em: EntityManager, data: CreateOutboundData): OutboundMessages {
    return em.create(
      OutboundMessages,
      {
        connectionId: data.connectionId,
        correlationId: data.correlationId,
        requestPayloadJson: data.requestPayloadJson,
        statusConceptId: data.statusConceptId,
        payloadVersion: data.payloadVersion,
        idempotencyKey: data.idempotencyKey,
        endpointId: data.endpointId,
        headersJson: data.headersJson,
        scheduledAt: data.scheduledAt,
        sourceResourceType: data.sourceResourceType,
        sourceResourceId: data.sourceResourceId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Circuit breaker (UC-12-12): retiene en lote los mensajes QUEUED de una
   * conexión (QUEUED -> HELD). Devuelve el número de filas afectadas.
   */
  holdQueuedForConnection(
    em: EntityManager,
    connectionId: string,
    queuedStateConceptId: string,
    heldStateConceptId: string,
  ): Promise<number> {
    return em.nativeUpdate(
      OutboundMessages,
      { connectionId, statusConceptId: queuedStateConceptId },
      { statusConceptId: heldStateConceptId },
    );
  }
}
