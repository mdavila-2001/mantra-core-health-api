import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'diagnostic_provenance_links' })
export class DiagnosticProvenanceLinks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'target_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetTypeConceptId!: string;

  @Property({ fieldName: 'target_id', type: 'uuid' })
  targetId!: string;

  @Property({ fieldName: 'source_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceTypeConceptId!: string;

  @Property({ fieldName: 'source_id', type: 'uuid' })
  sourceId!: string;

  @Property({ fieldName: 'activity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  activityConceptId!: string;

  @Property({ fieldName: 'agent_profile_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  agentProfileId?: string;

  @Property({ fieldName: 'source_system_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  sourceSystemId?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
