import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'health_lineage_edges' })
export class HealthLineageEdges {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'source_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceTypeConceptId!: string;

  @Property({ fieldName: 'source_id', type: 'uuid' })
  sourceId!: string;

  @Property({ fieldName: 'target_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetTypeConceptId!: string;

  @Property({ fieldName: 'target_id', type: 'uuid' })
  targetId!: string;

  @Property({ fieldName: 'transformation_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  transformationTypeConceptId!: string;

  @Property({
    fieldName: 'transformation_version',
    columnType: 'varchar',
    nullable: true,
  })
  transformationVersion?: string;

  @Property({ fieldName: 'job_run_id', type: 'uuid', nullable: true })
  jobRunId?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
