import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lakehouse_quality_issues`.
 */
@Entity({ schema: 'lakehouse', tableName: 'lakehouse_quality_issues' })
export class LakehouseQualityIssues {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a lakehouse quality run.
   */
  @Property({ fieldName: 'lakehouse_quality_run_id', type: 'uuid' })
  lakehouseQualityRunId!: string;

  /**
   * Identificador asociado a lakehouse quality rule.
   */
  @Property({ fieldName: 'lakehouse_quality_rule_id', type: 'uuid' })
  lakehouseQualityRuleId!: string;

  /**
   * Identificador asociado a partition.
   */
  @Property({ fieldName: 'partition_id', type: 'uuid' })
  partitionId!: string;

  /**
   * Valor de issue count mantenido por la instancia.
   */
  @Property({ fieldName: 'issue_count', type: 'bigint' })
  issueCount!: string;

  /**
   * Identificador asociado a sample object manifest.
   */
  @Property({ fieldName: 'sample_object_manifest_id', type: 'uuid' })
  sampleObjectManifestId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de detected at mantenido por la instancia.
   */
  @Property({ fieldName: 'detected_at', columnType: 'timestamptz' })
  detectedAt!: Date;
}
