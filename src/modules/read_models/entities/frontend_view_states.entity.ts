import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'read_models', tableName: 'frontend_view_states' })
export class FrontendViewStates {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'frontend_page_view_id', type: 'uuid' }) // FK → read_models.frontend_page_views
  frontendPageViewId!: string;

  @Property({ fieldName: 'state_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateTypeConceptId!: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({ columnType: 'varchar' })
  message!: string;

  @Property({
    fieldName: 'illustration_key',
    columnType: 'varchar',
    nullable: true,
  })
  illustrationKey?: string;

  @Property({
    fieldName: 'recovery_action_code',
    columnType: 'varchar',
    nullable: true,
  })
  recoveryActionCode?: string;

  @Property({
    fieldName: 'telemetry_event_code',
    columnType: 'varchar',
    nullable: true,
  })
  telemetryEventCode?: string;

  @Property({ fieldName: 'retry_allowed', type: 'boolean', nullable: true })
  retryAllowed?: boolean;

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
