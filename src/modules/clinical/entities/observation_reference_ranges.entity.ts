import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical', tableName: 'observation_reference_ranges' })
export class ObservationReferenceRanges {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'observation_id', type: 'uuid' }) // FK → clinical.observations
  observationId!: string;

  @Property({
    fieldName: 'observation_component_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.observation_components
  observationComponentId?: string;

  @Property({ fieldName: 'low_value', columnType: 'numeric', nullable: true })
  lowValue?: string;

  @Property({ fieldName: 'high_value', columnType: 'numeric', nullable: true })
  highValue?: string;

  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  @Property({ fieldName: 'type_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  typeConceptId?: string;

  @Property({
    fieldName: 'applies_to_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  appliesToConceptId?: string;

  @Property({
    fieldName: 'age_low_years',
    columnType: 'numeric',
    nullable: true,
  })
  ageLowYears?: string;

  @Property({
    fieldName: 'age_high_years',
    columnType: 'numeric',
    nullable: true,
  })
  ageHighYears?: string;

  @Property({ columnType: 'varchar', nullable: true })
  text?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
