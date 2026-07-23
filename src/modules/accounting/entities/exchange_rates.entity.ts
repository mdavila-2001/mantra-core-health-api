import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'exchange_rates' })
export class ExchangeRates {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'from_currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  fromCurrencyConceptId!: string;

  @Property({ fieldName: 'to_currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toCurrencyConceptId!: string;

  @Property({ columnType: 'numeric' })
  rate!: string;

  @Property({ fieldName: 'valid_on', columnType: 'date' })
  validOn!: Date;

  @Property({ columnType: 'varchar', nullable: true })
  source?: string;

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
