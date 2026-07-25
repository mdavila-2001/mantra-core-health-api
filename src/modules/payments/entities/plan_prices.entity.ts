import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'plan_prices' })
export class PlanPrices {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'plan_id', type: 'uuid' })
  planId!: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid' })
  currencyConceptId!: string;

  @Property({ fieldName: 'billing_interval_concept_id', type: 'uuid' })
  billingIntervalConceptId!: string;

  @Property({ fieldName: 'interval_count', columnType: 'int', nullable: true })
  intervalCount?: number;

  @Property({ columnType: 'numeric' })
  amount!: string;

  @Property({ fieldName: 'region_concept_id', type: 'uuid', nullable: true })
  regionConceptId?: string;

  @Property({ fieldName: 'tax_included', type: 'boolean', nullable: true })
  taxIncluded?: boolean;

  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: string;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: string;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' })
  stateConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
