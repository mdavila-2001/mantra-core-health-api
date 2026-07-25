import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_context', tableName: 'context_agents' })
export class ContextAgents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'agent_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  agentTypeConceptId!: string;

  @Property({ fieldName: 'provider_id', type: 'uuid', nullable: true }) // FK → integrations.external_providers
  providerId?: string;

  @Property({
    fieldName: 'implementation_ref',
    columnType: 'varchar',
    nullable: true,
  })
  implementationRef?: string;

  @Property({ fieldName: 'owner_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  ownerTenantId?: string;

  @Property({
    fieldName: 'last_heartbeat_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastHeartbeatAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
