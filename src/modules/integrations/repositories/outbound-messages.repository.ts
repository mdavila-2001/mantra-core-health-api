import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OutboundMessages } from '../entities';
import { createdBy } from '../../../common';

/** Datos para encolar un mensaje saliente (UC-12-05). */
export interface CreateOutboundData {
  /**
   * Identificador asociado a connection.
   */
  connectionId: string;
  /**
   * Identificador asociado a correlation.
   */
  correlationId: string;
  /**
   * Valor de request payload json mantenido por la instancia.
   */
  requestPayloadJson: unknown;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de payload version mantenido por la instancia.
   */
  payloadVersion: number;
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  idempotencyKey?: string;
  /**
   * Identificador asociado a endpoint.
   */
  endpointId?: string;
  /**
   * Valor de headers json mantenido por la instancia.
   */
  headersJson?: unknown;
  /**
   * Valor de scheduled at mantenido por la instancia.
   */
  scheduledAt?: Date;
  /**
   * Valor de source resource type mantenido por la instancia.
   */
  sourceResourceType?: string;
  /**
   * Identificador asociado a source resource.
   */
  sourceResourceId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `integrations.outbound_messages`. */
@Injectable()
export class OutboundMessagesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<OutboundMessages | null>`.
   */
  findById(em: EntityManager, id: string): Promise<OutboundMessages | null> {
    return em.findOne(OutboundMessages, { id });
  }

  /**
   * Igual que `findById` pero con `FOR UPDATE`: `dispatch()` decide si hacer
   * la llamada saliente real según `statusConceptId`, y dos ticks del worker
   * que se solapan (el mismo mensaje `QUEUED` descubierto dos veces antes de
   * que el primer despacho confirme) no deben poder pasar la comprobación a
   * la vez y despachar el mismo mensaje al proveedor externo dos veces.
   */
  findByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<OutboundMessages | null> {
    return em.findOne(
      OutboundMessages,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `OutboundMessages`.
   */
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

  /**
   * Descubrimiento para el worker de despacho (Fase 5 del plan de corrección
   * de workers, UC-12-06): mensajes `QUEUED` cuyo `scheduled_at` ya se
   * cumplió, del más antiguo al más nuevo. Lectura simple (sin lock): el
   * propio `dispatch()` valida de nuevo el estado `QUEUED` antes de despachar,
   * así que una carrera entre dos workers sólo hace que el segundo reciba una
   * `PreconditionFailedException` inofensiva.
   */
  findQueuedForDispatch(
    em: EntityManager,
    queuedStatusConceptId: string,
    now: Date,
    limit: number,
  ): Promise<OutboundMessages[]> {
    return em.find(
      OutboundMessages,
      {
        statusConceptId: queuedStatusConceptId,
        scheduledAt: { $lte: now },
      },
      { orderBy: { scheduledAt: 'ASC' }, limit },
    );
  }

  /**
   * Descubrimiento para el worker de reintentos (Fase 5, UC-12-07/08):
   * mensajes `FAILED` candidatos a un nuevo intento o a dead-letter, del más
   * antiguo al más nuevo.
   */
  findFailed(
    em: EntityManager,
    failedStatusConceptId: string,
    limit: number,
  ): Promise<OutboundMessages[]> {
    return em.find(
      OutboundMessages,
      { statusConceptId: failedStatusConceptId },
      { orderBy: { updatedAt: 'ASC' }, limit },
    );
  }
}
