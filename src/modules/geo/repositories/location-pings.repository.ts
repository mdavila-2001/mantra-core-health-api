import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { LocationPings } from '../entities';

/** Datos de un ping de ubicación append-only. */
export interface RecordPingData {
  trackedSubjectId: string;
  deviceId?: string;
  latitude: string;
  longitude: string;
  accuracyM?: string;
  altitudeM?: string;
  speedMps?: string;
  headingDeg?: string;
  batteryPct?: number;
  networkConceptId?: string;
  capturedAt?: Date;
  recordedByUserId?: string;
}

/**
 * Acceso a datos de `geo.location_pings`. Tabla append-only (`<<LOG>>`): sin
 * `row_version` ni `updated_at`, solo `recorded_at`. No se actualizan filas.
 */
@Injectable()
export class LocationPingsRepository {
  /** Registra un ping de ubicación en la unidad de trabajo (sin flush). */
  record(em: EntityManager, data: RecordPingData): LocationPings {
    return em.create(
      LocationPings,
      {
        trackedSubjectId: data.trackedSubjectId,
        deviceId: data.deviceId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracyM: data.accuracyM,
        altitudeM: data.altitudeM,
        speedMps: data.speedMps,
        headingDeg: data.headingDeg,
        batteryPct: data.batteryPct,
        networkConceptId: data.networkConceptId,
        capturedAt: data.capturedAt,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Última posición conocida del sujeto: el ping más reciente por `recorded_at`.
   * `null` si el sujeto no tiene pings.
   */
  findLastBySubject(em: EntityManager, trackedSubjectId: string): Promise<LocationPings | null> {
    return em.findOne(
      LocationPings,
      { trackedSubjectId },
      { orderBy: { recordedAt: 'DESC' } },
    );
  }
}
