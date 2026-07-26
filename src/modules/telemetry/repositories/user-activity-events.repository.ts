import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { UserActivityEvents } from '../entities';

/** Datos de un evento de actividad (UC-28-07, append-only). */
export interface CreateActivityEventData {
  eventSchemaDefinitionId: string;
  analyticsSubjectId?: string;
  userId?: string;
  sessionId?: string;
  deviceId?: string;
  tenantId?: string;
  portalTypeConceptId: string;
  eventName: string;
  eventIdempotencyKey: string;
  routeTemplate?: string;
  occurredAt?: Date;
  receivedAt?: Date;
  correlationId?: string;
  consentSnapshotId?: string;
}

/** Acceso a `telemetry.user_activity_events`. */
@Injectable()
export class UserActivityEventsRepository {
  findByIdempotencyKey(em: EntityManager, key: string): Promise<UserActivityEvents | null> {
    return em.findOne(UserActivityEvents, { eventIdempotencyKey: key });
  }

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
