import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { UserActivityEvents } from '../../entities';

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
   * @param userId - Usuario autenticado dueño de la clave; `null` para los eventos
   *   de uso agregado, que se guardan sin usuario.
   * @returns El evento previo, o `null`.
   */
  findByIdempotencyKey(
    em: EntityManager,
    key: string,
    userId: string | null,
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

  /**
   * Inserta un evento **anónimo** (`user_id` nulo) con SQL directo dentro de un
   * SAVEPOINT. El índice único parcial
   * `ux_user_activity_events_anonymous_idempotency` (tenant, clave) WHERE
   * user_id IS NULL convierte la carrera de dos lotes concurrentes con la misma
   * clave en una violación de unicidad (23505): se revierte sólo el savepoint
   * —el resto del lote sigue— y el evento cuenta como duplicado. Con ORM no se
   * puede: una violación en `flush` aborta la transacción entera.
   *
   * Funciona igual si el índice todavía no existe (entonces nunca hay conflicto
   * y sólo rige la búsqueda previa).
   *
   * @returns El id del evento nuevo, o `null` si era un duplicado.
   */
  async insertAnonymous(
    tx: EntityManager,
    data: CreateActivityEventData,
  ): Promise<string | null> {
    const id = randomUUID();
    await tx.execute('SAVEPOINT anon_event', [], 'run');
    try {
      await tx.execute(
        `INSERT INTO telemetry.user_activity_events
           (id, event_schema_definition_id, tenant_id, portal_type_concept_id, event_name,
            event_idempotency_key, route_template, occurred_at, received_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.eventSchemaDefinitionId,
          data.tenantId ?? null,
          data.portalTypeConceptId,
          data.eventName,
          data.eventIdempotencyKey,
          data.routeTemplate ?? null,
          data.occurredAt ?? null,
          data.receivedAt ?? new Date(),
          new Date(),
        ],
        'run',
      );
      await tx.execute('RELEASE SAVEPOINT anon_event', [], 'run');
      return id;
    } catch (error) {
      await tx.execute('ROLLBACK TO SAVEPOINT anon_event', [], 'run');
      await tx.execute('RELEASE SAVEPOINT anon_event', [], 'run');
      if (isUniqueViolation(error)) return null;
      throw error;
    }
  }
}

/** SQLSTATE 23505 (o la excepción tipada del ORM) en el índice de idempotencia anónima. */
export function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; name?: string; constraint?: string } | null;
  if (!e) return false;
  return e.code === '23505' || e.name === 'UniqueConstraintViolationException';
}
