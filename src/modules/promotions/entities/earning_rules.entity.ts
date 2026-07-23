import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'promotions', tableName: 'earning_rules' })
export class EarningRules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'loyalty_program_id', type: 'uuid' }) // FK → promotions.loyalty_programs
  loyaltyProgramId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  @Property({ fieldName: 'award_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  awardTypeConceptId!: string;

  @Property({
    fieldName: 'points_amount',
    columnType: 'numeric',
    nullable: true,
  })
  pointsAmount?: string;

  @Property({
    fieldName: 'credit_amount',
    columnType: 'numeric',
    nullable: true,
  })
  creditAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'condition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conditionJson?: unknown;

  @Property({ fieldName: 'cap_per_period', columnType: 'int', nullable: true })
  capPerPeriod?: number;

  @Property({ fieldName: 'period_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  periodConceptId?: string;

  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  @Property({ fieldName: 'is_active', type: 'boolean' })
  isActive!: boolean;

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
