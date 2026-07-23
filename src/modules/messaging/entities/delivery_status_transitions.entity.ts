import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'delivery_status_transitions' })
export class DeliveryStatusTransitions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({
    fieldName: 'from_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  fromStatusConceptId?: string;

  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  @Property({ fieldName: 'to_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toStatusConceptId!: string;

  @Property({
    fieldName: 'channel_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  channelTypeConceptId?: string;

  @Property({ fieldName: 'allow_late_event', type: 'boolean' })
  allowLateEvent!: boolean;

  @Property({ fieldName: 'allow_after_terminal', type: 'boolean' })
  allowAfterTerminal!: boolean;

  @Property({ columnType: 'int' })
  precedence!: number;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;
}
