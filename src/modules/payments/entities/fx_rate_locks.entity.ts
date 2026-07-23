import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'fx_rate_locks' })
export class FxRateLocks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'payment_intent_id', type: 'uuid' }) // FK → payments.payment_intents
  paymentIntentId!: string;

  @Property({ fieldName: 'from_currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  fromCurrencyConceptId!: string;

  @Property({ fieldName: 'to_currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toCurrencyConceptId!: string;

  @Property({ fieldName: 'locked_rate', columnType: 'numeric' })
  lockedRate!: string;

  @Property({
    fieldName: 'provider_ref',
    columnType: 'varchar',
    nullable: true,
  })
  providerRef?: string;

  @Property({
    fieldName: 'locked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lockedAt?: Date;

  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
