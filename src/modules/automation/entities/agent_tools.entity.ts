import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'automation', tableName: 'agent_tools' })
export class AgentTools {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'tool_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toolTypeConceptId!: string;

  @Property({
    fieldName: 'target_resource',
    columnType: 'varchar',
    nullable: true,
  })
  targetResource?: string;

  @Property({
    fieldName: 'input_schema_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  inputSchemaJson?: unknown;

  @Property({
    fieldName: 'output_schema_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  outputSchemaJson?: unknown;

  @Property({
    fieldName: 'integration_endpoint_id',
    type: 'uuid',
    nullable: true,
  }) // FK → integrations.integration_endpoints
  integrationEndpointId?: string;

  @Property({ fieldName: 'is_write', type: 'boolean', nullable: true })
  isWrite?: boolean;

  @Property({ fieldName: 'requires_approval', type: 'boolean', nullable: true })
  requiresApproval?: boolean;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
