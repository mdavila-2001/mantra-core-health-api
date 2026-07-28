import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `partition_specs`.
 */
@Entity({ schema: 'system_ops', tableName: 'partition_specs' })
export class PartitionSpecs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de schema name mantenido por la instancia.
   */
  @Property({ fieldName: 'schema_name', columnType: 'varchar' })
  schemaName!: string;

  /**
   * Valor de table name mantenido por la instancia.
   */
  @Property({ fieldName: 'table_name', columnType: 'varchar' })
  tableName!: string;

  /**
   * Identificador asociado a entity registry.
   */
  @Property({ fieldName: 'entity_registry_id', type: 'uuid', nullable: true }) // FK → system_ops.entity_registry
  entityRegistryId?: string;

  /**
   * Identificador asociado a partition strategy concept.
   */
  @Property({ fieldName: 'partition_strategy_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  partitionStrategyConceptId!: string;

  /**
   * Valor de partition key mantenido por la instancia.
   */
  @Property({
    fieldName: 'partition_key',
    columnType: 'varchar',
    nullable: true,
  })
  partitionKey?: string;

  /**
   * Identificador asociado a partition interval concept.
   */
  @Property({
    fieldName: 'partition_interval_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  partitionIntervalConceptId?: string;

  /**
   * Valor de subpartition key mantenido por la instancia.
   */
  @Property({
    fieldName: 'subpartition_key',
    columnType: 'varchar',
    nullable: true,
  })
  subpartitionKey?: string;

  /**
   * Valor de hot tier days mantenido por la instancia.
   */
  @Property({ fieldName: 'hot_tier_days', columnType: 'int', nullable: true })
  hotTierDays?: number;

  /**
   * Valor de warm tier days mantenido por la instancia.
   */
  @Property({ fieldName: 'warm_tier_days', columnType: 'int', nullable: true })
  warmTierDays?: number;

  /**
   * Valor de cold tier days mantenido por la instancia.
   */
  @Property({ fieldName: 'cold_tier_days', columnType: 'int', nullable: true })
  coldTierDays?: number;

  /**
   * Identificador asociado a archive target concept.
   */
  @Property({
    fieldName: 'archive_target_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  archiveTargetConceptId?: string;

  /**
   * Identificador asociado a retention policy.
   */
  @Property({ fieldName: 'retention_policy_id', type: 'uuid', nullable: true }) // FK → system_ops.retention_policies
  retentionPolicyId?: string;

  /**
   * Valor de is time series mantenido por la instancia.
   */
  @Property({ fieldName: 'is_time_series', type: 'boolean', nullable: true })
  isTimeSeries?: boolean;

  /**
   * Valor de enforces tenant isolation mantenido por la instancia.
   */
  @Property({
    fieldName: 'enforces_tenant_isolation',
    type: 'boolean',
    nullable: true,
  })
  enforcesTenantIsolation?: boolean;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
