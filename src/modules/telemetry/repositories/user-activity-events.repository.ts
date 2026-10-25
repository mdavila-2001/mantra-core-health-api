import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { UserActivityEvents } from '../entities';

/** Datos de un evento de actividad (UC-28-07, append-only). */
export interface CreateActivityEventData {
  /**
   * Identificador asociado a event schema definition.
   */
  eventSchemaDefinitionId: string;
  /**
   * Identificador asociado a analytics subject.
   */
  analyticsSubjectId?: string;
  /**
   * Identificador asociado a user.
   */
  userId?: string;
  /**
   * Identificador asociado a session.
   */
  sessionId?: string;
  /**
   * Identificador asociado a device.
   */
  deviceId?: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a portal type concept.
   */
  portalTypeConceptId: string;
  /**
   * Valor de event name mantenido por la instancia.
   */
  eventName: string;
  /**
   * Valor de event idempotency key mantenido por la instancia.
   */
  eventIdempotencyKey: string;
  /**
   * Valor de route template mantenido por la instancia.
   */
  routeTemplate?: string;
  /**
   * Valor de occurred at mantenido por la instancia.
   */
  occurredAt?: Date;
  /**
   * Valor de received at mantenido por la instancia.
   */
  receivedAt?: Date;
  /**
   * Identificador asociado a correlation.
   */
  correlationId?: string;
  /**
   * Identificador asociado a consent snapshot.
   */
  consentSnapshotId?: string;
}

/** Acceso a `telemetry.user_activity_events`. */
@Injectable()
export class UserActivityEventsRepository {
  /**
   * Busca un evento previo con la misma clave de idempotencia **del mismo usuario**.
   *
   * La clave la elige el cliente: sin acotarla por usuario, la clave de una
   * persona descartaría en silencio los eventos de otra.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param key - Clave de idempotencia.
   * @param userId - Usuario autenticado dueño de la clave.
   * @returns El evento previo, o `null`.
   */
  findByIdempotencyKey(
    em: EntityManager,
    key: string,
    userId: string,
  ): Promise<UserActivityEvents | null> {
    return em.findOne(UserActivityEvents, { eventIdempotencyKey: key, userId });
  }

  /**
   * Obtiene un evento por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del evento.
   * @returns El evento, o `null`.
   */
  findById(em: EntityManager, id: string): Promise<UserActivityEvents | null> {
    return em.findOne(UserActivityEvents, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `UserActivityEvents`.
   */
  create(em: EntityManager, data: CreateActivityEventData): UserActivityEvents {
    return em.create(
      UserActivityEvents,
      {
        eventSchemaDefinitionId: data.eventSchemaDefinitionId,
        analyticsSubjectId: data.analyticsSubjectId,
        userId: data.userId,
        sessionId: data.sessionId,
        deviceId: data.deviceId,
        tenantId: data.tenantId,
        portalTypeConceptId: data.portalTypeConceptId,
        eventName: data.eventName,
        eventIdempotencyKey: data.eventIdempotencyKey,
        routeTemplate: data.routeTemplate,
        occurredAt: data.occurredAt,
        receivedAt: data.receivedAt ?? new Date(),
        correlationId: data.correlationId,
        consentSnapshotId: data.consentSnapshotId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
