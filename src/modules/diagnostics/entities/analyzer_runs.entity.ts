import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'analyzer_runs' })
export class AnalyzerRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'analyzer_device_id', type: 'uuid' }) // FK → iam.devices
  analyzerDeviceId!: string;

  @Property({ fieldName: 'run_identifier', columnType: 'varchar' })
  runIdentifier!: string;

  @Property({ fieldName: 'reagent_lot_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  reagentLotId?: string;

  @Property({
    fieldName: 'calibration_reference',
    columnType: 'varchar',
    nullable: true,
  })
  calibrationReference?: string;

  @Property({
    fieldName: 'quality_control_run_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  qualityControlRunId?: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'operator_profile_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  operatorProfileId?: string;

  @Property({
    fieldName: 'metadata_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  metadataJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
