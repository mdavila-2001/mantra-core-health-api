import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryLocations } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una ubicación de inventario. */
export interface CreateLocationData {
  pharmacySiteId: string;
  parentLocationId?: string;
  code: string;
  name: string;
  locationTypeConceptId: string;
  temperatureZoneConceptId?: string;
  controlledAccess?: boolean;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `pharmacy_inventory.inventory_locations`. */
@Injectable()
export class LocationsRepository {
  findById(em: EntityManager, id: string): Promise<InventoryLocations | null> {
    return em.findOne(InventoryLocations, { id });
  }

  create(em: EntityManager, data: CreateLocationData): InventoryLocations {
    return em.create(
      InventoryLocations,
      {
        pharmacySiteId: data.pharmacySiteId,
        parentLocationId: data.parentLocationId,
        code: data.code,
        name: data.name,
        locationTypeConceptId: data.locationTypeConceptId,
        temperatureZoneConceptId: data.temperatureZoneConceptId,
        controlledAccess: data.controlledAccess,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
