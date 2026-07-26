import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InboundMessages } from '../entities';
import { createdBy } from '../../../common';

/** Datos para registrar un mensaje entrante (UC-12-09). */
export interface CreateInboundData {
  connectionId: string;
  payloadJson: unknown;
  statusConceptId: string;
  payloadVersion: number;
  endpointId?: string;
  correlationId?: string;
  signature?: string;
  receivedAt?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `integrations.inbound_messages`. */
@Injectable()
export class InboundMessagesRepository {
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
