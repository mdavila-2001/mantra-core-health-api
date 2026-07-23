import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'recovery_objectives' })
export class RecoveryObjectives {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  serviceComponentId!: string;

  @Property({ fieldName: 'objective_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  objectiveTypeConceptId!: string;

  @Property({ fieldName: 'rto_seconds', type: 'bigint' })
  rtoSeconds!: string;

  @Property({ fieldName: 'rpo_seconds', type: 'bigint' })
  rpoSeconds!: string;

  @Property({
    fieldName: 'maximum_tolerable_downtime_seconds',
    type: 'bigint',
    nullable: true,
  })
  maximumTolerableDowntimeSeconds?: string;

  @Property({
    fieldName: 'recovery_tier_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  recoveryTierConceptId?: string;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
