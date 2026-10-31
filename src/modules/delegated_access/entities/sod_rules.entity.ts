import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Regla de segregación de funciones. `tenant_id` nulo = regla de plataforma sembrada; la organización agrega las suyas o endurece una de plataforma.
 */
@Entity({ schema: 'delegated_access', tableName: 'sod_rules' })
export class SodRules {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Columna `tenant_id`. */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /** Columna `code`. */
  @Property({ fieldName: 'code', columnType: 'varchar' })
  code!: string;

  /** Columna `name`. */
  @Property({ fieldName: 'name', columnType: 'varchar' })
  name!: string;

  /** Columna `base_rule_id`. */
  @Property({ fieldName: 'base_rule_id', type: 'uuid', nullable: true }) // FK → delegated_access.sod_rules
  baseRuleId?: string;

  /** Columna `atoms_a_json`. */
  @Property({ fieldName: 'atoms_a_json', type: 'json', columnType: 'jsonb' })
  atomsAJson!: unknown;

  /** Columna `atoms_b_json`. */
  @Property({ fieldName: 'atoms_b_json', type: 'json', columnType: 'jsonb' })
  atomsBJson!: unknown;

  /** Columna `scope_concept_id`. */
  @Property({ fieldName: 'scope_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  scopeConceptId!: string;

  /** Columna `action_concept_id`. */
  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  /** Columna `is_hard`. */
  @Property({ fieldName: 'is_hard', type: 'boolean', default: false })
  isHard: boolean = false;

  /** Columna `max_exception_days`. */
  @Property({
    fieldName: 'max_exception_days',
    columnType: 'int',
    nullable: true,
  })
  maxExceptionDays?: number;

  /** Columna `rationale_text`. */
  @Property({ fieldName: 'rationale_text', columnType: 'text', nullable: true })
  rationaleText?: string;

  /** Columna `status_concept_id`. */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /** Columna `version_number`. */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /** Columna `created_at`. */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /** Columna `updated_at`. */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /** Columna `created_by_user_id`. */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /** Columna `updated_by_user_id`. */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /** Versión usada para controlar actualizaciones concurrentes. */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
