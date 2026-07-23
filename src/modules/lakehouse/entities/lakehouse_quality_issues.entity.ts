import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'lakehouse_quality_issues' })
export class LakehouseQualityIssues {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'lakehouse_quality_run_id', type: 'uuid' })
  lakehouseQualityRunId!: string;

  @Property({ fieldName: 'lakehouse_quality_rule_id', type: 'uuid' })
  lakehouseQualityRuleId!: string;

  @Property({ fieldName: 'partition_id', type: 'uuid' })
  partitionId!: string;

  @Property({ fieldName: 'issue_count', type: 'bigint' })
  issueCount!: string;

  @Property({ fieldName: 'sample_object_manifest_id', type: 'uuid' })
  sampleObjectManifestId!: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'detected_at', columnType: 'timestamptz' })
  detectedAt!: Date;
}
