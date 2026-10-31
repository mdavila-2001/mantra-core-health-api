import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Regla de gobierno de la organización (L1): denegar un permiso, techo de plantilla, condición obligatoria o piso de visibilidad de campo. Solo restringe; nunca se borra (estado + valid_to).
 */
@Entity({ schema: 'delegated_access', tableName: 'governance_rules' })
export class GovernanceRules {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Columna `tenant_id`. */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `rule_kind_concept_id`. */
  @Property({ fieldName: 'rule_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  ruleKindConceptId!: string;

  /** Columna `role_template_code`. */
  @Property({
    fieldName: 'role_template_code',
    columnType: 'varchar',
    nullable: true,
  })
  roleTemplateCode?: string;

  /** Columna `permission_pattern`. */
  @Property({ fieldName: 'permission_pattern', columnType: 'varchar' })
  permissionPattern!: string;

  /** Columna `rule_json`. */
  @Property({
    fieldName: 'rule_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  ruleJson?: unknown;

  /** Columna `rule_schema_version`. */
  @Property({
    fieldName: 'rule_schema_version',
    columnType: 'int',
    nullable: true,
  })
  ruleSchemaVersion?: number;

  /** Columna `message_text`. */
  @Property({ fieldName: 'message_text', columnType: 'text', nullable: true })
  messageText?: string;

  /** Columna `status_concept_id`. */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /** Columna `valid_from`. */
  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  /** Columna `valid_to`. */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

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
