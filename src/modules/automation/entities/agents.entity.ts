import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'automation', tableName: 'agents' })
export class Agents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'agent_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  agentTypeConceptId!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({
    fieldName: 'default_model_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  defaultModelConceptId?: string;

  @Property({
    fieldName: 'system_service_component_id',
    type: 'uuid',
    nullable: true,
  }) // FK → platform_ops.service_components
  systemServiceComponentId?: string;

  @Property({ fieldName: 'autonomy_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  autonomyLevelConceptId!: string;

  @Property({ fieldName: 'acts_as_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  actsAsUserId?: string;

  @Property({ fieldName: 'current_version', columnType: 'int' })
  currentVersion!: number;

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
