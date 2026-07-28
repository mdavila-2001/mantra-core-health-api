import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { GeofenceEvents } from '../entities';

/** Datos de un evento de geofence append-only. */
export interface RecordGeofenceEventData {
  /**
   * Identificador asociado a geofence.
   */
  geofenceId: string;
  /**
   * Identificador asociado a tracked subject.
   */
  trackedSubjectId: string;
  /**
   * Identificador asociado a event type concept.
   */
  eventTypeConceptId: string;
  /**
   * Identificador asociado a location ping.
   */
  locationPingId?: string;
  /**
   * Valor de occurred at mantenido por la instancia.
   */
  occurredAt?: Date;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/**
 * Acceso a datos de `geo.geofence_events`. Tabla append-only (`<<LOG>>`): sin
 * `row_version` ni `updated_at`, solo `recorded_at`.
 */
@Injectable()
export class GeofenceEventsRepository {
  /** Registra un evento de geofence en la unidad de trabajo (sin flush). */
  record(em: EntityManager, data: RecordGeofenceEventData): GeofenceEvents {
    return em.create(
      GeofenceEvents,
      {
        geofenceId: data.geofenceId,
        trackedSubjectId: data.trackedSubjectId,
        eventTypeConceptId: data.eventTypeConceptId,
        locationPingId: data.locationPingId,
        occurredAt: data.occurredAt,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Último evento (ENTER/EXIT) del par (geofence, sujeto). Sustenta la
   * idempotencia de la transición dentro/fuera. `null` si no hay eventos.
   */
  findLast(
    em: EntityManager,
    geofenceId: string,
    trackedSubjectId: string,
  ): Promise<GeofenceEvents | null> {
    return em.findOne(
      GeofenceEvents,
      { geofenceId, trackedSubjectId },
      { orderBy: { recordedAt: 'DESC' } },
    );
  }
}
