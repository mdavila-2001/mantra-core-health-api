import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Geofences } from '../entities';
import { createdBy } from '../../../common';

/** Datos para definir un geofence. */
export interface CreateGeofenceData {
  tenantId: string;
  name: string;
  shapeTypeConceptId: string;
  geometryJson?: unknown;
  radiusM?: string;
  centerLat?: string;
  centerLng?: string;
  stateConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `geo.geofences`. Stateless: recibe el `EntityManager` activo.
 */
@Injectable()
export class GeofencesRepository {
  /** Busca un geofence por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<Geofences | null> {
    return em.findOne(Geofences, { id });
  }

  /** Busca un geofence por (tenant, nombre); sustenta la unicidad del nombre. */
  findByTenantAndName(em: EntityManager, tenantId: string, name: string): Promise<Geofences | null> {
    return em.findOne(Geofences, { tenantId, name });
  }

  /** Crea el geofence en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateGeofenceData): Geofences {
    return em.create(
      Geofences,
      {
        tenantId: data.tenantId,
        name: data.name,
        shapeTypeConceptId: data.shapeTypeConceptId,
        geometryJson: data.geometryJson,
        radiusM: data.radiusM,
        centerLat: data.centerLat,
        centerLng: data.centerLng,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
