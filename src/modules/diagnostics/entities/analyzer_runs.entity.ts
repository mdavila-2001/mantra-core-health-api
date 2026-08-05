import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `analyzer_runs`.
 */
@Entity({ schema: 'diagnostics', tableName: 'analyzer_runs' })
export class AnalyzerRuns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a custodian tenant.
   */
  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  /**
   * Identificador asociado a analyzer device.
   */
  @Property({ fieldName: 'analyzer_device_id', type: 'uuid' }) // FK → iam.devices
  analyzerDeviceId!: string;

  /**
   * Valor de run identifier mantenido por la instancia.
   */
  @Property({ fieldName: 'run_identifier', columnType: 'varchar' })
  runIdentifier!: string;

  /**
   * Identificador asociado a reagent lot.
   */
  @Property({ fieldName: 'reagent_lot_id', type: 'uuid', nullable: true }) // FK → pharmacy_inventory.inventory_lots
  reagentLotId?: string;

  /**
   * Valor de calibration reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'calibration_reference',
    columnType: 'varchar',
    nullable: true,
  })
  calibrationReference?: string;

  /**
   * Identificador asociado a quality control run.
   */
  @Property({
    fieldName: 'quality_control_run_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostics.analyzer_runs
  qualityControlRunId?: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  /**
   * Valor de ended at mantenido por la instancia.
   */
  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a operator profile.
   */
  @Property({ fieldName: 'operator_profile_id', type: 'uuid', nullable: true }) // FK → profiles.provider_operator_profiles
  operatorProfileId?: string;

  /**
   * Valor de metadata json mantenido por la instancia.
   */
  @Property({
    fieldName: 'metadata_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  metadataJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
