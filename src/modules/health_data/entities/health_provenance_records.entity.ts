import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'health_provenance_records' })
export class HealthProvenanceRecords {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'activity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  activityConceptId!: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({
    fieldName: 'occurred_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredStartAt?: Date;

  @Property({
    fieldName: 'occurred_end_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredEndAt?: Date;

  @Property({ fieldName: 'source_system_id', type: 'uuid', nullable: true }) // FK → health_data.health_source_systems
  sourceSystemId?: string;

  @Property({
    fieldName: 'responsible_agent_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  responsibleAgentTypeConceptId?: string;

  @Property({ fieldName: 'responsible_agent_id', type: 'uuid', nullable: true })
  responsibleAgentId?: string;

  @Property({
    fieldName: 'on_behalf_of_organization_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  onBehalfOfOrganizationId?: string;

  @Property({
    fieldName: 'policy_uris_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  policyUrisJson?: unknown;

  @Property({ fieldName: 'signature_id', type: 'uuid', nullable: true }) // FK → chart.clinical_note_signatures
  signatureId?: string;

  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
