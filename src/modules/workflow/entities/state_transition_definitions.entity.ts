import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `state_transition_definitions`.
 */
@Entity({ schema: 'workflow', tableName: 'state_transition_definitions' })
export class StateTransitionDefinitions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a state machine definition.
   */
  @Property({ fieldName: 'state_machine_definition_id', type: 'uuid' }) // FK → workflow.state_machine_definitions
  stateMachineDefinitionId!: string;

  /**
   * Valor de transition code mantenido por la instancia.
   */
  @Property({ fieldName: 'transition_code', columnType: 'varchar' })
  transitionCode!: string;

  /**
   * Identificador asociado a from state concept.
   */
  @Property({ fieldName: 'from_state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  fromStateConceptId!: string;

  /**
   * Identificador asociado a to state concept.
   */
  @Property({ fieldName: 'to_state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toStateConceptId!: string;

  /**
   * Valor de command code mantenido por la instancia.
   */
  @Property({ fieldName: 'command_code', columnType: 'varchar' })
  commandCode!: string;

  /**
   * Identificador asociado a required permission.
   */
  @Property({ fieldName: 'required_permission_id', type: 'uuid' }) // FK → authz.permissions
  requiredPermissionId!: string;

  /**
   * Identificador asociado a purpose of use concept.
   */
  @Property({ fieldName: 'purpose_of_use_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  purposeOfUseConceptId!: string;

  /**
   * Valor de idempotency required mantenido por la instancia.
   */
  @Property({
    fieldName: 'idempotency_required',
    type: 'boolean',
    nullable: true,
  })
  idempotencyRequired?: boolean;

  /**
   * Valor de optimistic lock required mantenido por la instancia.
   */
  @Property({
    fieldName: 'optimistic_lock_required',
    type: 'boolean',
    nullable: true,
  })
  optimisticLockRequired?: boolean;

  /**
   * Valor de reason required mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_required', type: 'boolean', nullable: true })
  reasonRequired?: boolean;

  /**
   * Valor de transition timeout seconds mantenido por la instancia.
   */
  @Property({
    fieldName: 'transition_timeout_seconds',
    columnType: 'int',
    nullable: true,
  })
  transitionTimeoutSeconds?: number;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
