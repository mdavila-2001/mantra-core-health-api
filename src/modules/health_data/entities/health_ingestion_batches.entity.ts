import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_ingestion_batches`.
 */
@Entity({ schema: 'health_data', tableName: 'health_ingestion_batches' })
export class HealthIngestionBatches {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a health source connection.
   */
  @Property({ fieldName: 'health_source_connection_id', type: 'uuid' }) // FK → health_data.health_source_connections
  healthSourceConnectionId!: string;

  /**
   * Valor de batch identifier mantenido por la instancia.
   */
  @Property({ fieldName: 'batch_identifier', columnType: 'varchar' })
  batchIdentifier!: string;

  /**
   * Identificador asociado a ingestion mode concept.
   */
  @Property({ fieldName: 'ingestion_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  ingestionModeConceptId!: string;

  /**
   * Valor de received at mantenido por la instancia.
   */
  @Property({ fieldName: 'received_at', columnType: 'timestamptz' })
  receivedAt!: Date;

  /**
   * Valor de source period start mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_period_start',
    columnType: 'timestamptz',
    nullable: true,
  })
  sourcePeriodStart?: Date;

  /**
   * Valor de source period end mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_period_end',
    columnType: 'timestamptz',
    nullable: true,
  })
  sourcePeriodEnd?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de records received mantenido por la instancia.
   */
  @Property({ fieldName: 'records_received', type: 'bigint', nullable: true })
  recordsReceived?: string;

  /**
   * Valor de records accepted mantenido por la instancia.
   */
  @Property({ fieldName: 'records_accepted', type: 'bigint', nullable: true })
  recordsAccepted?: string;

  /**
   * Valor de records rejected mantenido por la instancia.
   */
  @Property({ fieldName: 'records_rejected', type: 'bigint', nullable: true })
  recordsRejected?: string;

  /**
   * Identificador asociado a payload manifest file.
   */
  @Property({
    fieldName: 'payload_manifest_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  payloadManifestFileId?: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contentHash?: string;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
