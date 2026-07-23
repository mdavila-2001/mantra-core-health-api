import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'experiment_variants' })
export class ExperimentVariants {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_experiment_id', type: 'uuid' }) // FK → ads.ad_experiments
  adExperimentId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'variant_ref_type', columnType: 'varchar' })
  variantRefType!: string;

  @Property({ fieldName: 'variant_ref_id', type: 'uuid' })
  variantRefId!: string;

  @Property({
    fieldName: 'traffic_split_percent',
    columnType: 'numeric',
    nullable: true,
  })
  trafficSplitPercent?: string;

  @Property({ fieldName: 'is_control', type: 'boolean', nullable: true })
  isControl?: boolean;

  @Property({
    fieldName: 'result_metric_value',
    columnType: 'numeric',
    nullable: true,
  })
  resultMetricValue?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
