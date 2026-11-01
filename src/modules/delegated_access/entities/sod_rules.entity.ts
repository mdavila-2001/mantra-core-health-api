import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `sod_rules`.
 */
@Entity({ schema: 'delegated_access', tableName: 'sod_rules' })
export class SodRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants (inferida)
  tenantId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a base rule.
   */
  @Property({ fieldName: 'base_rule_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  baseRuleId?: string;

  /**
   * Valor de atoms ajson mantenido por la instancia.
   */
  @Property({ fieldName: 'atoms_a_json', type: 'json', columnType: 'jsonb' })
  atomsAJson!: unknown;

  /**
   * Valor de atoms bjson mantenido por la instancia.
   */
  @Property({ fieldName: 'atoms_b_json', type: 'json', columnType: 'jsonb' })
  atomsBJson!: unknown;

  /**
   * Identificador asociado a scope concept.
   */
  @Property({ fieldName: 'scope_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  scopeConceptId!: string;

  /**
   * Identificador asociado a action concept.
   */
  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  actionConceptId!: string;

  /**
   * Valor de is hard mantenido por la instancia.
   */
  @Property({ fieldName: 'is_hard', type: 'boolean', default: false })
  isHard!: boolean;

  /**
   * Valor de max exception days mantenido por la instancia.
   */
  @Property({
    fieldName: 'max_exception_days',
    columnType: 'int',
    nullable: true,
  })
  maxExceptionDays?: number;

  /**
   * Valor de rationale text mantenido por la instancia.
   */
  @Property({ fieldName: 'rationale_text', columnType: 'text', nullable: true })
  rationaleText?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
