import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `inventory_count_sessions`.
 */
@Entity({ schema: 'pharmacy_inventory', tableName: 'inventory_count_sessions' })
export class InventoryCountSessions {
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
   * Identificador asociado a inventory location.
   */
  @Property({ fieldName: 'inventory_location_id', type: 'uuid' }) // FK → pharmacy_inventory.inventory_locations
  inventoryLocationId!: string;

  /**
   * Identificador asociado a count type concept.
   */
  @Property({ fieldName: 'count_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  countTypeConceptId!: string;

  /**
   * Identificador asociado a freeze mode concept.
   */
  @Property({
    fieldName: 'freeze_mode_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  freezeModeConceptId?: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /**
   * Valor de approved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'approved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedAt?: Date;

  /**
   * Identificador asociado a approved by user.
   */
  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  approvedByUserId?: string;

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
