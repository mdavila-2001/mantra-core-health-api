import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'health_ingestion_batches' })
export class HealthIngestionBatches {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'health_source_connection_id', type: 'uuid' }) // FK → health_data.health_source_connections
  healthSourceConnectionId!: string;

  @Property({ fieldName: 'batch_identifier', columnType: 'varchar' })
  batchIdentifier!: string;

  @Property({ fieldName: 'ingestion_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  ingestionModeConceptId!: string;

  @Property({ fieldName: 'received_at', columnType: 'timestamptz' })
  receivedAt!: Date;

  @Property({
    fieldName: 'source_period_start',
    columnType: 'timestamptz',
    nullable: true,
  })
  sourcePeriodStart?: Date;

  @Property({
    fieldName: 'source_period_end',
    columnType: 'timestamptz',
    nullable: true,
  })
  sourcePeriodEnd?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'records_received', type: 'bigint', nullable: true })
  recordsReceived?: string;

  @Property({ fieldName: 'records_accepted', type: 'bigint', nullable: true })
  recordsAccepted?: string;

  @Property({ fieldName: 'records_rejected', type: 'bigint', nullable: true })
  recordsRejected?: string;

  @Property({
    fieldName: 'payload_manifest_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  payloadManifestFileId?: string;

  @Property({
    fieldName: 'content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contentHash?: string;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
