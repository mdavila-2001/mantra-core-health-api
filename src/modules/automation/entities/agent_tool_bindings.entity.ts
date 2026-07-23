import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'automation', tableName: 'agent_tool_bindings' })
export class AgentToolBindings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'agent_version_id', type: 'uuid' }) // FK → automation.agent_versions
  agentVersionId!: string;

  @Property({ fieldName: 'agent_tool_id', type: 'uuid' }) // FK → automation.agent_tools
  agentToolId!: string;

  @Property({
    fieldName: 'scope_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  scopeJson?: unknown;

  @Property({
    fieldName: 'max_calls_per_run',
    columnType: 'int',
    nullable: true,
  })
  maxCallsPerRun?: number;

  @Property({ fieldName: 'permission_effect_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  permissionEffectConceptId!: string;

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
