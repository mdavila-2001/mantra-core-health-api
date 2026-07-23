import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'automation', tableName: 'record_automations' })
export class RecordAutomations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'target_resource_type', columnType: 'varchar' })
  targetResourceType!: string;

  @Property({ fieldName: 'automation_action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  automationActionConceptId!: string;

  @Property({
    fieldName: 'field_mapping_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  fieldMappingJson?: unknown;

  @Property({
    fieldName: 'validation_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  validationJson?: unknown;

  @Property({ fieldName: 'agent_id', type: 'uuid', nullable: true }) // FK → automation.agents
  agentId?: string;

  @Property({ fieldName: 'workflow_id', type: 'uuid', nullable: true }) // FK → automation.workflows
  workflowId?: string;

  @Property({ fieldName: 'write_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  writeModeConceptId!: string;

  @Property({
    fieldName: 'dedupe_key_expr',
    columnType: 'varchar',
    nullable: true,
  })
  dedupeKeyExpr?: string;

  @Property({ fieldName: 'is_active', type: 'boolean' })
  isActive!: boolean;

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
