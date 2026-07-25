import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'marketing', tableName: 'journey_enrollments' })
export class JourneyEnrollments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'journey_id', type: 'uuid' }) // FK → marketing.journeys
  journeyId!: string;

  @Property({ fieldName: 'member_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberTypeConceptId!: string;

  @Property({ fieldName: 'member_ref_id', type: 'uuid' })
  memberRefId!: string;

  @Property({ fieldName: 'current_step_id', type: 'uuid', nullable: true }) // FK → marketing.journey_steps
  currentStepId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'entered_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  enteredAt?: Date;

  @Property({
    fieldName: 'exited_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  exitedAt?: Date;

  @Property({
    fieldName: 'exit_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  exitReasonConceptId?: string;

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
