import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `transition_guards`.
 */
@Entity({ schema: 'workflow', tableName: 'transition_guards' })
export class TransitionGuards {
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
   * Valor de guard code mantenido por la instancia.
   */
  @Property({ fieldName: 'guard_code', columnType: 'varchar' })
  guardCode!: string;

  /**
   * Identificador asociado a guard type concept.
   */
  @Property({ fieldName: 'guard_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  guardTypeConceptId!: string;

  /**
   * Valor de evaluation order mantenido por la instancia.
   */
  @Property({ fieldName: 'evaluation_order', columnType: 'int' })
  evaluationOrder!: number;

  /**
   * Valor de expression json mantenido por la instancia.
   */
  @Property({
    fieldName: 'expression_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  expressionJson?: unknown;

  /**
   * Valor de failure code mantenido por la instancia.
   */
  @Property({
    fieldName: 'failure_code',
    columnType: 'varchar',
    nullable: true,
  })
  failureCode?: string;

  /**
   * Valor de failure message key mantenido por la instancia.
   */
  @Property({
    fieldName: 'failure_message_key',
    columnType: 'varchar',
    nullable: true,
  })
  failureMessageKey?: string;

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
