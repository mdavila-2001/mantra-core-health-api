import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'health_source_connections' })
export class HealthSourceConnections {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'health_source_system_id', type: 'uuid' }) // FK → health_data.health_source_systems
  healthSourceSystemId!: string;

  @Property({ fieldName: 'connection_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  connectionTypeConceptId!: string;

  @Property({ fieldName: 'endpoint_uri', columnType: 'varchar' })
  endpointUri!: string;

  @Property({ fieldName: 'credential_id', type: 'uuid', nullable: true }) // FK → integrations.provider_credentials
  credentialId?: string;

  @Property({ fieldName: 'network_policy_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  networkPolicyId?: string;

  @Property({ fieldName: 'format_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  formatConceptId?: string;

  @Property({
    fieldName: 'poll_schedule',
    columnType: 'varchar',
    nullable: true,
  })
  pollSchedule?: string;

  @Property({
    fieldName: 'cursor_strategy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  cursorStrategyConceptId?: string;

  @Property({
    fieldName: 'last_success_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastSuccessAt?: Date;

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
