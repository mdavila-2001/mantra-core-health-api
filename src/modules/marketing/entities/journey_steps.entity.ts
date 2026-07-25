import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'marketing', tableName: 'journey_steps' })
export class JourneySteps {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'journey_id', type: 'uuid' }) // FK → marketing.journeys
  journeyId!: string;

  @Property({ fieldName: 'step_code', columnType: 'varchar' })
  stepCode!: string;

  @Property({ fieldName: 'step_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stepTypeConceptId!: string;

  @Property({ fieldName: 'channel_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  channelConceptId?: string;

  @Property({ fieldName: 'content_template_id', type: 'uuid', nullable: true }) // FK → marketing.content_templates
  contentTemplateId?: string;

  @Property({
    fieldName: 'wait_duration_minutes',
    columnType: 'int',
    nullable: true,
  })
  waitDurationMinutes?: number;

  @Property({
    fieldName: 'condition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conditionJson?: unknown;

  @Property({ fieldName: 'next_step_id', type: 'uuid', nullable: true }) // FK → marketing.journey_steps
  nextStepId?: string;

  @Property({ fieldName: 'branch_step_id', type: 'uuid', nullable: true }) // FK → marketing.journey_steps
  branchStepId?: string;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
