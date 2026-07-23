import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'event_deliveries' })
export class EventDeliveries {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'domain_event_id', type: 'uuid' }) // FK → messaging.domain_events
  domainEventId!: string;

  @Property({ fieldName: 'subscription_id', type: 'uuid' }) // FK → payments.subscriptions
  subscriptionId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  @Property({ fieldName: 'error_text', columnType: 'text', nullable: true })
  errorText?: string;

  @Property({
    fieldName: 'handled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  handledAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
