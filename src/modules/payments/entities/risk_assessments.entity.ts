import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'risk_assessments' })
export class RiskAssessments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'payment_intent_id', type: 'uuid' }) // FK → payments.payment_intents
  paymentIntentId!: string;

  @Property({ fieldName: 'risk_score', columnType: 'numeric' })
  riskScore!: string;

  @Property({ fieldName: 'risk_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  riskLevelConceptId!: string;

  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  @Property({
    fieldName: 'provider_ref',
    columnType: 'varchar',
    nullable: true,
  })
  providerRef?: string;

  @Property({
    fieldName: 'signals_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  signalsJson?: unknown;

  @Property({
    fieldName: 'three_ds_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  threeDsStatusConceptId?: string;

  @Property({ fieldName: 'reviewed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  reviewedByUserId?: string;

  @Property({
    fieldName: 'assessed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  assessedAt?: Date;

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
