import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DeliveryStatusTransitions } from '../entities';

/**
 * Acceso de solo lectura a la tabla de transiciones de estado de entrega de
 * `messaging.delivery_status_transitions`.
 *
 * Es una tabla de configuración de la máquina de estados de entrega (no un log
 * por entrega concreta): define qué transición `from → to` dispara cada tipo de
 * evento, opcionalmente acotada por tipo de canal. De ahí que las consultas sean
 * por canal y por el trío `from/evento/to`, no por un identificador de entrega.
 */
@Injectable()
export class DeliveryStatusTransitionsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<DeliveryStatusTransitions | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<DeliveryStatusTransitions | null> {
    return em.findOne(DeliveryStatusTransitions, { id });
  }

  /**
   * Transiciones definidas para un tipo de canal, por precedencia.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param channelTypeConceptId - Identificador de channel type concept.
   * @returns Resultado de list by channel type conforme al contrato `Promise<DeliveryStatusTransitions[]>`.
   */
  listByChannelType(
    em: EntityManager,
    channelTypeConceptId: string,
  ): Promise<DeliveryStatusTransitions[]> {
    return em.find(
      DeliveryStatusTransitions,
      { channelTypeConceptId },
      { orderBy: { precedence: 'ASC' } },
    );
  }

  /**
   * Transición aplicable a un evento dado el estado de origen y destino: la
   * regla que gobierna si el evento del proveedor mueve la entrega.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param eventTypeConceptId - Identificador de event type concept.
   * @param fromStatusConceptId - Identificador de from status concept (nulo si es el estado inicial).
   * @param toStatusConceptId - Identificador de to status concept.
   * @returns Resultado de find applicable transition conforme al contrato `Promise<DeliveryStatusTransitions | null>`.
   */
  findApplicableTransition(
    em: EntityManager,
    eventTypeConceptId: string,
    fromStatusConceptId: string | null,
    toStatusConceptId: string,
  ): Promise<DeliveryStatusTransitions | null> {
    return em.findOne(DeliveryStatusTransitions, {
      eventTypeConceptId,
      fromStatusConceptId: fromStatusConceptId ?? null,
      toStatusConceptId,
    });
  }
}
