import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical', tableName: 'observation_performers' })
export class ObservationPerformers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'observation_id', type: 'uuid' }) // FK → clinical.observations
  observationId!: string;

  @Property({ fieldName: 'performer_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  performerTypeConceptId!: string;

  @Property({ fieldName: 'performer_id', type: 'uuid' })
  performerId!: string;

  @Property({
    fieldName: 'performer_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  performerRoleConceptId?: string;

  @Property({ columnType: 'int' })
  ordinal!: number;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
