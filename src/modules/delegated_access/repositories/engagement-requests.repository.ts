import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { EngagementRequestItems, EngagementRequests } from '../entities';

/** Datos de una solicitud de vínculo de apoyo. */
export interface CreateEngagementRequestData {
  /** Organización a la que se pide o desde la que se invita. */
  readonly tenantId: string;
  /** Persona de apoyo implicada. */
  readonly requesterUserId: string;
  /** Concepto de dirección (solicitud o invitación). */
  readonly directionConceptId: string;
  /** Plantilla de rol pedida. */
  readonly roleTemplateId: string;
  /** Vínculo que se amplía, si es una ampliación. */
  readonly parentAssignmentId?: string;
  /** Mensaje de la persona. */
  readonly messageText?: string;
  /** Concepto de estado. */
  readonly statusConceptId: string;
  /** Vencimiento. */
  readonly expiresAt: Date;
}

/** Datos de un ítem de solicitud. */
export interface CreateEngagementItemData {
  /** Organización de la solicitud. */
  readonly tenantId: string;
  /** Solicitud a la que pertenece. */
  readonly engagementRequestId: string;
  /** Concepto del tipo de objetivo. */
  readonly targetKindConceptId: string;
  /** Doctor del objetivo. */
  readonly practitionerRoleAssignmentId?: string;
  /** Servicio del objetivo. */
  readonly healthcareServiceId?: string;
  /** Espacio del objetivo. */
  readonly careSpaceId?: string;
  /** Sede del objetivo. */
  readonly practiceSiteId?: string;
  /** Acciones propuestas. */
  readonly proposedActions: readonly string[];
  /** Concepto de decisión inicial. */
  readonly decisionConceptId: string;
}

let lastItemInstant = 0;

/**
 * Instante estrictamente creciente: los ítems de una solicitud se crean en el
 * mismo milisegundo y se leen por `created_at`, así que sin esto su orden (el
 * de la solicitud) sería el que el desempate por id quisiera.
 */
function monotonicNow(): Date {
  lastItemInstant = Math.max(Date.now(), lastItemInstant + 1);
  return new Date(lastItemInstant);
}

/** Acceso a datos de `engagement_requests` y `engagement_request_items`. */
@Injectable()
export class EngagementRequestsRepository {
  /**
   * Solicitud por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Id de la solicitud.
   * @returns La solicitud o `null`.
   */
  findById(em: EntityManager, id: string): Promise<EngagementRequests | null> {
    return em.findOne(EngagementRequests, { id });
  }

  /**
   * Ítems de una solicitud, en orden estable.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param requestId - Solicitud.
   * @returns Sus ítems.
   */
  findItems(
    em: EntityManager,
    requestId: string,
  ): Promise<EngagementRequestItems[]> {
    return em.find(
      EngagementRequestItems,
      { engagementRequestId: requestId },
      { orderBy: { createdAt: 'asc', id: 'asc' } },
    );
  }

  /**
   * Solicitudes de una organización, paginadas por cursor de fecha.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param statusConceptId - Estado, si se filtra.
   * @param limit - Tope de filas.
   * @param before - Cursor: solo las creadas antes de esta fecha.
   * @returns Las solicitudes, las más recientes primero.
   */
  findByTenant(
    em: EntityManager,
    tenantId: string,
    statusConceptId: string | undefined,
    limit: number,
    before?: Date,
  ): Promise<EngagementRequests[]> {
    return em.find(
      EngagementRequests,
      {
        tenantId,
        ...(statusConceptId ? { statusConceptId } : {}),
        ...(before ? { createdAt: { $lt: before } } : {}),
      },
      { orderBy: { createdAt: 'desc', id: 'desc' }, limit },
    );
  }

  /**
   * Solicitudes de una persona, las más recientes primero.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Persona que pidió.
   * @param limit - Tope de filas.
   * @returns Sus solicitudes.
   */
  findByRequester(
    em: EntityManager,
    userId: string,
    limit: number,
  ): Promise<EngagementRequests[]> {
    return em.find(
      EngagementRequests,
      { requesterUserId: userId },
      { orderBy: { createdAt: 'desc', id: 'desc' }, limit },
    );
  }

  /**
   * Solicitudes pendientes ya vencidas, de cualquier organización (barrido).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param pendingConceptId - Estado pendiente.
   * @param now - Instante del barrido.
   * @param limit - Tope de filas por pasada.
   * @returns Las solicitudes a vencer.
   */
  findOverduePending(
    em: EntityManager,
    pendingConceptId: string,
    now: Date,
    limit: number,
  ): Promise<EngagementRequests[]> {
    return em.find(
      EngagementRequests,
      { statusConceptId: pendingConceptId, expiresAt: { $lte: now } },
      { orderBy: { expiresAt: 'asc', id: 'asc' }, limit },
    );
  }

  /**
   * Crea una solicitud.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la solicitud.
   * @returns La solicitud creada (aún sin flush).
   */
  create(
    em: EntityManager,
    data: CreateEngagementRequestData,
  ): EngagementRequests {
    const now = new Date();
    return em.create(
      EngagementRequests,
      {
        tenantId: data.tenantId,
        requesterUserId: data.requesterUserId,
        directionConceptId: data.directionConceptId,
        roleTemplateId: data.roleTemplateId,
        parentAssignmentId: data.parentAssignmentId,
        messageText: data.messageText,
        statusConceptId: data.statusConceptId,
        expiresAt: data.expiresAt,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
  }

  /**
   * Crea un ítem de solicitud.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del ítem.
   * @returns El ítem creado (aún sin flush).
   */
  createItem(
    em: EntityManager,
    data: CreateEngagementItemData,
  ): EngagementRequestItems {
    return em.create(
      EngagementRequestItems,
      {
        tenantId: data.tenantId,
        engagementRequestId: data.engagementRequestId,
        targetKindConceptId: data.targetKindConceptId,
        practitionerRoleAssignmentId: data.practitionerRoleAssignmentId,
        healthcareServiceId: data.healthcareServiceId,
        careSpaceId: data.careSpaceId,
        practiceSiteId: data.practiceSiteId,
        proposedActionsJson: [...data.proposedActions],
        decisionConceptId: data.decisionConceptId,
        createdAt: monotonicNow(),
      },
      { partial: true },
    );
  }
}
