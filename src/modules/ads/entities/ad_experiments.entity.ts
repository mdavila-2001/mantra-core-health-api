import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'ad_experiments' })
export class AdExperiments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'experiment_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  experimentTypeConceptId!: string;

  @Property({ fieldName: 'objective_metric_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  objectiveMetricConceptId!: string;

  @Property({ columnType: 'text', nullable: true })
  hypothesis?: string;

  @Property({
    fieldName: 'holdout_percent',
    columnType: 'numeric',
    nullable: true,
  })
  holdoutPercent?: string;

  @Property({
    fieldName: 'start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startAt?: Date;

  @Property({ fieldName: 'end_at', columnType: 'timestamptz', nullable: true })
  endAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'winner_variant_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  winnerVariantId?: string;

  @Property({
    fieldName: 'confidence_level',
    columnType: 'numeric',
    nullable: true,
  })
  confidenceLevel?: string;

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
