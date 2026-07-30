import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `specimen_containers`.
 */
@Entity({ schema: 'diagnostics', tableName: 'specimen_containers' })
export class SpecimenContainers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a specimen.
   */
  @Property({ fieldName: 'specimen_id', type: 'uuid' }) // FK → diagnostics.specimens
  specimenId!: string;

  /**
   * Valor de container identifier mantenido por la instancia.
   */
  @Property({ fieldName: 'container_identifier', columnType: 'varchar' })
  containerIdentifier!: string;

  /**
   * Identificador asociado a container type concept.
   */
  @Property({ fieldName: 'container_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  containerTypeConceptId!: string;

  /**
   * Identificador asociado a additive concept.
   */
  @Property({ fieldName: 'additive_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  additiveConceptId?: string;

  /**
   * Valor de capacity decimal mantenido por la instancia.
   */
  @Property({
    fieldName: 'capacity_decimal',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  capacityDecimal?: string;

  /**
   * Identificador asociado a capacity unit concept.
   */
  @Property({
    fieldName: 'capacity_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  capacityUnitConceptId?: string;

  /**
   * Valor de specimen quantity decimal mantenido por la instancia.
   */
  @Property({
    fieldName: 'specimen_quantity_decimal',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  specimenQuantityDecimal?: string;

  /**
   * Identificador asociado a specimen quantity unit concept.
   */
  @Property({
    fieldName: 'specimen_quantity_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  specimenQuantityUnitConceptId?: string;

  /**
   * Identificador asociado a parent container.
   */
  @Property({ fieldName: 'parent_container_id', type: 'uuid', nullable: true }) // FK → diagnostics.specimen_containers
  parentContainerId?: string;

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
