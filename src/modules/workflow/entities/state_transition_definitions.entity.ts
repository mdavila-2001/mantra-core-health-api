import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'workflow', tableName: 'state_transition_definitions' })
export class StateTransitionDefinitions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'state_machine_definition_id', type: 'uuid' }) // FK → workflow.state_machine_definitions
  stateMachineDefinitionId!: string;

  @Property({ fieldName: 'transition_code', columnType: 'varchar' })
  transitionCode!: string;

  @Property({ fieldName: 'from_state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  fromStateConceptId!: string;

  @Property({ fieldName: 'to_state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toStateConceptId!: string;

  @Property({ fieldName: 'command_code', columnType: 'varchar' })
  commandCode!: string;

  @Property({ fieldName: 'required_permission_id', type: 'uuid' }) // FK → authz.permissions
  requiredPermissionId!: string;

  @Property({ fieldName: 'purpose_of_use_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  purposeOfUseConceptId!: string;

  @Property({
    fieldName: 'idempotency_required',
    type: 'boolean',
    nullable: true,
  })
  idempotencyRequired?: boolean;

  @Property({
    fieldName: 'optimistic_lock_required',
    type: 'boolean',
    nullable: true,
  })
  optimisticLockRequired?: boolean;

  @Property({ fieldName: 'reason_required', type: 'boolean', nullable: true })
  reasonRequired?: boolean;

  @Property({
    fieldName: 'transition_timeout_seconds',
    columnType: 'int',
    nullable: true,
  })
  transitionTimeoutSeconds?: number;

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
