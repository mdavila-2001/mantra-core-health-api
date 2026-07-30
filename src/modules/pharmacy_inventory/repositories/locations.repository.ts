import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryLocations } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una ubicación de inventario. */
export interface CreateLocationData {
  /**
   * Identificador asociado a pharmacy site.
   */
  pharmacySiteId: string;
  /**
   * Identificador asociado a parent location.
   */
  parentLocationId?: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a location type concept.
   */
  locationTypeConceptId: string;
  /**
   * Identificador asociado a temperature zone concept.
   */
  temperatureZoneConceptId?: string;
  /**
   * Valor de controlled access mantenido por la instancia.
   */
  controlledAccess?: boolean;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `pharmacy_inventory.inventory_locations`. */
@Injectable()
export class LocationsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<InventoryLocations | null>`.
   */
  findById(em: EntityManager, id: string): Promise<InventoryLocations | null> {
    return em.findOne(InventoryLocations, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `InventoryLocations`.
   */
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
