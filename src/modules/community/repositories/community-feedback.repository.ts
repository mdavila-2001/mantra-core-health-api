import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  FeedbackTickets,
  FeedbackTicketComments,
  FeedbackTicketEvents,
} from '../entities';

/**
 * Acceso a datos de tickets de feedback de `community` y sus hilos asociados:
 * el ticket (`feedback_tickets`), sus comentarios (`feedback_ticket_comments`)
 * y su historial de eventos (`feedback_ticket_events`).
 */
@Injectable()
export class CommunityFeedbackRepository {
  /**
   * Obtiene find ticket by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de ticket.
   * @returns Resultado de find ticket by id conforme al contrato `Promise<FeedbackTickets | null>`.
   */
  findTicketById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<FeedbackTickets | null> {
    return em.findOne(FeedbackTickets, { id, tenantId });
  }

  /**
   * Lista los comentarios de un ticket ordenados por antigüedad.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param feedbackTicketId - Identificador de feedback ticket.
   * @returns Resultado de list comments by ticket conforme al contrato `Promise<FeedbackTicketComments[]>`.
   */
  listCommentsByTicket(
    em: EntityManager,
    feedbackTicketId: string,
  ): Promise<FeedbackTicketComments[]> {
    return em.find(
      FeedbackTicketComments,
      { feedbackTicketId },
      { orderBy: { createdAt: 'asc' } },
    );
  }

  /**
   * Lista los eventos de historial de un ticket ordenados por revisión.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param feedbackTicketId - Identificador de feedback ticket.
   * @returns Resultado de list events by ticket conforme al contrato `Promise<FeedbackTicketEvents[]>`.
   */
  listEventsByTicket(
    em: EntityManager,
    feedbackTicketId: string,
  ): Promise<FeedbackTicketEvents[]> {
    return em.find(
      FeedbackTicketEvents,
      { feedbackTicketId },
      { orderBy: { revisionNo: 'asc' } },
    );
  }
}
