import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Geofences } from '../entities';
import { createdBy } from '../../../common';

/** Datos para definir un geofence. */
export interface CreateGeofenceData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a shape type concept.
   */
  shapeTypeConceptId: string;
  /**
   * Valor de geometry json mantenido por la instancia.
   */
  geometryJson?: unknown;
  /**
   * Valor de radius m mantenido por la instancia.
   */
  radiusM?: string;
  /**
   * Valor de center lat mantenido por la instancia.
   */
  centerLat?: string;
  /**
   * Valor de center lng mantenido por la instancia.
   */
  centerLng?: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
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
  findByTenantAndName(
    em: EntityManager,
    tenantId: string,
    name: string,
  ): Promise<Geofences | null> {
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
