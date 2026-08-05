import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `inventory_locations`.
 */
@Entity({ schema: 'pharmacy_inventory', tableName: 'inventory_locations' })
export class InventoryLocations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pharmacy site.
   */
  @Property({ fieldName: 'pharmacy_site_id', type: 'uuid' }) // FK → pharmacy.pharmacy_sites
  pharmacySiteId!: string;

  /**
   * Identificador asociado a parent location.
   */
  @Property({ fieldName: 'parent_location_id', type: 'uuid', nullable: true }) // FK → pharmacy_inventory.inventory_locations
  parentLocationId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a location type concept.
   */
  @Property({ fieldName: 'location_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  locationTypeConceptId!: string;

  /**
   * Identificador asociado a temperature zone concept.
   */
  @Property({
    fieldName: 'temperature_zone_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  temperatureZoneConceptId?: string;

  /**
   * Valor de controlled access mantenido por la instancia.
   */
  @Property({ fieldName: 'controlled_access', type: 'boolean', nullable: true })
  controlledAccess?: boolean;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
