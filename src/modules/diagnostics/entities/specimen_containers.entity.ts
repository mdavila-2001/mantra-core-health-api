import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'specimen_containers' })
export class SpecimenContainers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'specimen_id', type: 'uuid' }) // FK → diagnostics.specimens
  specimenId!: string;

  @Property({ fieldName: 'container_identifier', columnType: 'varchar' })
  containerIdentifier!: string;

  @Property({ fieldName: 'container_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  containerTypeConceptId!: string;

  @Property({ fieldName: 'additive_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  additiveConceptId?: string;

  @Property({
    fieldName: 'capacity_decimal',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  capacityDecimal?: string;

  @Property({
    fieldName: 'capacity_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  capacityUnitConceptId?: string;

  @Property({
    fieldName: 'specimen_quantity_decimal',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  specimenQuantityDecimal?: string;

  @Property({
    fieldName: 'specimen_quantity_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  specimenQuantityUnitConceptId?: string;

  @Property({ fieldName: 'parent_container_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  parentContainerId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
