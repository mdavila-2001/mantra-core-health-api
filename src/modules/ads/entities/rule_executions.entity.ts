import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `rule_executions`.
 */
@Entity({ schema: 'ads', tableName: 'rule_executions' })
export class RuleExecutions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a automated rule.
   */
  @Property({ fieldName: 'automated_rule_id', type: 'uuid' }) // FK → ads.automated_rules
  automatedRuleId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de entities evaluated mantenido por la instancia.
   */
  @Property({
    fieldName: 'entities_evaluated',
    columnType: 'int',
    nullable: true,
  })
  entitiesEvaluated?: number;

  /**
   * Valor de entities affected mantenido por la instancia.
   */
  @Property({
    fieldName: 'entities_affected',
    columnType: 'int',
    nullable: true,
  })
  entitiesAffected?: number;

  /**
   * Valor de actions json mantenido por la instancia.
   */
  @Property({
    fieldName: 'actions_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  actionsJson?: unknown;

  /**
   * Valor de error text mantenido por la instancia.
   */
  @Property({ fieldName: 'error_text', columnType: 'text', nullable: true })
  errorText?: string;

  /**
   * Valor de evaluated at mantenido por la instancia.
   */
  @Property({
    fieldName: 'evaluated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  evaluatedAt?: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
