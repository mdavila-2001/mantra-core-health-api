import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `governance_rules`.
 */
@Entity({ schema: 'delegated_access', tableName: 'governance_rules' })
export class GovernanceRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a rule kind concept.
   */
  @Property({ fieldName: 'rule_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  ruleKindConceptId!: string;

  /**
   * Valor de role template code mantenido por la instancia.
   */
  @Property({
    fieldName: 'role_template_code',
    columnType: 'varchar',
    nullable: true,
  })
  roleTemplateCode?: string;

  /**
   * Valor de permission pattern mantenido por la instancia.
   */
  @Property({ fieldName: 'permission_pattern', columnType: 'varchar' })
  permissionPattern!: string;

  /**
   * Valor de rule json mantenido por la instancia.
   */
  @Property({
    fieldName: 'rule_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  ruleJson?: unknown;

  /**
   * Valor de rule schema version mantenido por la instancia.
   */
  @Property({
    fieldName: 'rule_schema_version',
    columnType: 'int',
    nullable: true,
  })
  ruleSchemaVersion?: number;

  /**
   * Valor de message text mantenido por la instancia.
   */
  @Property({ fieldName: 'message_text', columnType: 'text', nullable: true })
  messageText?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

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
