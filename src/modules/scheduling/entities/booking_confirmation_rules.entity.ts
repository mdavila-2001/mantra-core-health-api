import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Nodo de la gramática mínima de condiciones (fail-closed). Una condición es o
 * bien una comparación hoja `{ field, op, value }`, o bien un combinador lógico
 * `{ all|any: Condition[] }` / `{ not: Condition }`. Cualquier forma que no encaje
 * se considera NO satisfecha (la regla no aplica).
 */
export type RuleCondition =
  | { field: string; op: string; value?: unknown }
  | { all: RuleCondition[] }
  | { any: RuleCondition[] }
  | { not: RuleCondition };

/**
 * Regla determinista del motor de confirmación automática de reservas (C-11).
 *
 * Las reglas no se borran en duro: se desactivan (`enabled=false`) y versionan
 * (`version`), de modo que el historial de qué regla decidió una reserva se
 * mantiene reproducible. La evaluación filtra por alcance y vigencia, ordena por
 * especificidad y prioridad, y aplica la primera regla concluyente.
 */
@Entity({ schema: 'scheduling', tableName: 'booking_confirmation_rules' })
export class BookingConfirmationRules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'scope_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (RULE_SCOPE_*)
  scopeTypeConceptId!: string;

  /** Alcance concreto (practice/resource/service). `undefined` = todo el tipo de alcance. */
  @Property({ fieldName: 'scope_id', type: 'uuid', nullable: true })
  scopeId?: string;

  /** Menor número = mayor prioridad al resolver empates de especificidad. */
  @Property({ fieldName: 'priority', columnType: 'int' })
  priority: number = 100;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({ fieldName: 'effective_to', columnType: 'timestamptz', nullable: true })
  effectiveTo?: Date;

  @Property({ fieldName: 'condition_json', type: 'json', columnType: 'jsonb' })
  conditionJson!: RuleCondition;

  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (AUTO_CONFIRM|AUTO_REJECT|MANUAL_REVIEW)
  decisionConceptId!: string;

  @Property({ fieldName: 'enabled', type: 'boolean' })
  enabled: boolean = true;

  @Property({ fieldName: 'version', columnType: 'int' })
  version: number = 1;

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
