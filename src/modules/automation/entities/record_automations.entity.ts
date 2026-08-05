import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `record_automations`.
 */
@Entity({ schema: 'automation', tableName: 'record_automations' })
export class RecordAutomations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de target resource type mantenido por la instancia.
   */
  @Property({ fieldName: 'target_resource_type', columnType: 'varchar' })
  targetResourceType!: string;

  /**
   * Identificador asociado a automation action concept.
   */
  @Property({ fieldName: 'automation_action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  automationActionConceptId!: string;

  /**
   * Valor de field mapping json mantenido por la instancia.
   */
  @Property({
    fieldName: 'field_mapping_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  fieldMappingJson?: unknown;

  /**
   * Valor de validation json mantenido por la instancia.
   */
  @Property({
    fieldName: 'validation_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  validationJson?: unknown;

  /**
   * Identificador asociado a agent.
   */
  @Property({ fieldName: 'agent_id', type: 'uuid', nullable: true }) // FK → automation.agents
  agentId?: string;

  /**
   * Identificador asociado a workflow.
   */
  @Property({ fieldName: 'workflow_id', type: 'uuid', nullable: true }) // FK → automation.workflows
  workflowId?: string;

  /**
   * Identificador asociado a write mode concept.
   */
  @Property({ fieldName: 'write_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  writeModeConceptId!: string;

  /**
   * Valor de dedupe key expr mantenido por la instancia.
   */
  @Property({
    fieldName: 'dedupe_key_expr',
    columnType: 'varchar',
    nullable: true,
  })
  dedupeKeyExpr?: string;

  /**
   * Valor de is active mantenido por la instancia.
   */
  @Property({ fieldName: 'is_active', type: 'boolean' })
  isActive!: boolean;

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
