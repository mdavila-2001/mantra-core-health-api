import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'plan_prices' })
export class PlanPrices {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'plan_id', type: 'uuid' }) // FK → payments.subscription_plans
  planId!: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currencyConceptId!: string;

  @Property({ fieldName: 'billing_interval_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  billingIntervalConceptId!: string;

  @Property({ fieldName: 'interval_count', columnType: 'int', nullable: true })
  intervalCount?: number;

  @Property({ columnType: 'numeric' })
  amount!: string;

  @Property({ fieldName: 'region_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  regionConceptId?: string;

  @Property({ fieldName: 'tax_included', type: 'boolean', nullable: true })
  taxIncluded?: boolean;

  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
