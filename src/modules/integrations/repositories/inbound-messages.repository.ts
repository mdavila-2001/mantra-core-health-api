import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InboundMessages } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar un mensaje entrante (UC-12-09). */
export interface CreateInboundData {
  /**
   * Identificador asociado a connection.
   */
  connectionId: string;
  /**
   * Valor de payload json mantenido por la instancia.
   */
  payloadJson: unknown;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de payload version mantenido por la instancia.
   */
  payloadVersion: number;
  /**
   * Identificador asociado a endpoint.
   */
  endpointId?: string;
  /**
   * Identificador asociado a correlation.
   */
  correlationId?: string;
  /**
   * Valor de signature mantenido por la instancia.
   */
  signature?: string;
  /**
   * Valor de received at mantenido por la instancia.
   */
  receivedAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `integrations.inbound_messages`. */
@Injectable()
export class InboundMessagesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<InboundMessages | null>`.
   */
  findById(em: EntityManager, id: string): Promise<InboundMessages | null> {
    return em.findOne(InboundMessages, { id });
  }

  /** De-duplica reentregas del proveedor por (connection_id, signature). */
  findByConnectionAndSignature(
    em: EntityManager,
    connectionId: string,
    signature: string,
  ): Promise<InboundMessages | null> {
    return em.findOne(InboundMessages, { connectionId, signature });
  }

  /**
   * Descubrimiento para el worker de correlación (Fase 5 del plan de
   * corrección de workers, UC-12-10): mensajes entrantes `RECEIVED` listos
   * para correlacionarse con su saliente, del más antiguo al más nuevo.
   */
  findReceived(
    em: EntityManager,
    receivedStatusConceptId: string,
    limit: number,
  ): Promise<InboundMessages[]> {
    return em.find(
      InboundMessages,
      { statusConceptId: receivedStatusConceptId },
      { orderBy: { receivedAt: 'ASC' }, limit },
    );
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `InboundMessages`.
   */
  create(em: EntityManager, data: CreateInboundData): InboundMessages {
    return em.create(
      InboundMessages,
      {
        connectionId: data.connectionId,
        payloadJson: data.payloadJson,
        statusConceptId: data.statusConceptId,
        payloadVersion: data.payloadVersion,
        endpointId: data.endpointId,
        correlationId: data.correlationId,
        signature: data.signature,
        receivedAt: data.receivedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
