import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `delegation_events`.
 */
@Entity({ schema: 'delegated_access', tableName: 'delegation_events' })
export class DelegationEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practitioner delegate assignment.
   */
  @Property({ fieldName: 'practitioner_delegate_assignment_id', type: 'uuid' }) // FK → delegated_access.practitioner_delegate_assignments
  practitionerDelegateAssignmentId!: string;

  /**
   * Identificador asociado a event type concept.
   */
  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  /**
   * Identificador asociado a actor user.
   */
  @Property({ fieldName: 'actor_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  actorUserId?: string;

  /**
   * Identificador asociado a target user.
   */
  @Property({ fieldName: 'target_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  targetUserId?: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  /**
   * Valor de previous state hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'previous_state_hash',
    columnType: 'varchar',
    nullable: true,
  })
  previousStateHash?: string;

  /**
   * Valor de new state hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'new_state_hash',
    columnType: 'varchar',
    nullable: true,
  })
  newStateHash?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
