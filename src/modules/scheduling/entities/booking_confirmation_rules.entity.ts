import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Nodo de la gramática mínima de condiciones (fail-closed). Una condición es o
 * bien una comparación hoja `{ field, op, value }`, o bien un combinador lógico
 * `{ all|any: Condition[] }` / `{ not: Condition }`. Cualquier forma que no encaje
 * se considera NO satisfecha (la regla no aplica).
 */
export type RuleCondition =
  | {
      /**
       * Valor de field mantenido por la instancia.
       */
      field: string; /**
       * Valor de op mantenido por la instancia.
       */
      op: string; /**
       * Valor de value mantenido por la instancia.
       */
      value?: unknown;
    }
  | {
      /**
       * Valor de all mantenido por la instancia.
       */
      all: RuleCondition[];
    }
  | {
      /**
       * Valor de any mantenido por la instancia.
       */
      any: RuleCondition[];
    }
  | {
      /**
       * Valor de not mantenido por la instancia.
       */
      not: RuleCondition;
    };

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
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a scope type concept.
   */
  @Property({ fieldName: 'scope_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (RULE_SCOPE_*)
  scopeTypeConceptId!: string;

  /** Alcance concreto (practice/resource/service). `undefined` = todo el tipo de alcance. */
  @Property({ fieldName: 'scope_id', type: 'uuid', nullable: true })
  scopeId?: string;

  /** Menor número = mayor prioridad al resolver empates de especificidad. */
  @Property({ fieldName: 'priority', columnType: 'int' })
  priority: number = 100;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  /**
   * Valor de condition json mantenido por la instancia.
   */
  @Property({ fieldName: 'condition_json', type: 'json', columnType: 'jsonb' })
  conditionJson!: RuleCondition;

  /**
   * Identificador asociado a decision concept.
   */
  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (AUTO_CONFIRM|AUTO_REJECT|MANUAL_REVIEW)
  decisionConceptId!: string;

  /**
   * Valor de enabled mantenido por la instancia.
   */
  @Property({ fieldName: 'enabled', type: 'boolean' })
  enabled: boolean = true;

  /**
   * Valor de version mantenido por la instancia.
   */
  @Property({ fieldName: 'version', columnType: 'int' })
  version: number = 1;

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
