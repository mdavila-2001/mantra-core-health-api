import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'event_subscriptions' })
export class EventSubscriptions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'subscriber_code', columnType: 'varchar' })
  subscriberCode!: string;

  @Property({ fieldName: 'event_type', columnType: 'varchar' })
  eventType!: string;

  @Property({ fieldName: 'event_version', columnType: 'int', nullable: true })
  eventVersion?: number;

  @Property({ fieldName: 'delivery_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  deliveryModeConceptId!: string;

  @Property({
    fieldName: 'target_queue',
    columnType: 'varchar',
    nullable: true,
  })
  targetQueue?: string;

  @Property({
    fieldName: 'filter_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  filterJson?: unknown;

  @Property({ fieldName: 'is_active', type: 'boolean' })
  isActive!: boolean;

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
