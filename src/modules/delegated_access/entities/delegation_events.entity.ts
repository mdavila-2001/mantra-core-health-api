import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'delegated_access', tableName: 'delegation_events' })
export class DelegationEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practitioner_delegate_assignment_id', type: 'uuid' }) // FK → delegated_access.practitioner_delegate_assignments
  practitionerDelegateAssignmentId!: string;

  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  @Property({ fieldName: 'actor_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  actorUserId?: string;

  @Property({ fieldName: 'target_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  targetUserId?: string;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  @Property({
    fieldName: 'previous_state_hash',
    columnType: 'varchar',
    nullable: true,
  })
  previousStateHash?: string;

  @Property({
    fieldName: 'new_state_hash',
    columnType: 'varchar',
    nullable: true,
  })
  newStateHash?: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
