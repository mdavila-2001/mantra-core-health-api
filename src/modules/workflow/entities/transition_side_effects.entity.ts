import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `transition_side_effects`.
 */
@Entity({ schema: 'workflow', tableName: 'transition_side_effects' })
export class TransitionSideEffects {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a state transition definition.
   */
  @Property({ fieldName: 'state_transition_definition_id', type: 'uuid' }) // FK → workflow.state_transition_definitions
  stateTransitionDefinitionId!: string;

  /**
   * Valor de side effect code mantenido por la instancia.
   */
  @Property({ fieldName: 'side_effect_code', columnType: 'varchar' })
  sideEffectCode!: string;

  /**
   * Identificador asociado a side effect type concept.
   */
  @Property({ fieldName: 'side_effect_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sideEffectTypeConceptId!: string;

  /**
   * Identificador asociado a execution mode concept.
   */
  @Property({ fieldName: 'execution_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  executionModeConceptId!: string;

  /**
   * Valor de execution order mantenido por la instancia.
   */
  @Property({ fieldName: 'execution_order', columnType: 'int' })
  executionOrder!: number;

  /**
   * Valor de outbox event type mantenido por la instancia.
   */
  @Property({
    fieldName: 'outbox_event_type',
    columnType: 'varchar',
    nullable: true,
  })
  outboxEventType?: string;

  /**
   * Valor de action spec json mantenido por la instancia.
   */
  @Property({
    fieldName: 'action_spec_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  actionSpecJson?: unknown;

  /**
   * Valor de compensation spec json mantenido por la instancia.
   */
  @Property({
    fieldName: 'compensation_spec_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  compensationSpecJson?: unknown;

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
