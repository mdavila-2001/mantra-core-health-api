import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'promotions', tableName: 'referral_programs' })
export class ReferralPrograms {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'referrer_award_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  referrerAwardTypeConceptId!: string;

  @Property({
    fieldName: 'referrer_award_amount',
    columnType: 'numeric',
    nullable: true,
  })
  referrerAwardAmount?: string;

  @Property({ fieldName: 'referee_award_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  refereeAwardTypeConceptId!: string;

  @Property({
    fieldName: 'referee_award_amount',
    columnType: 'numeric',
    nullable: true,
  })
  refereeAwardAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'qualifying_event_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  qualifyingEventConceptId?: string;

  @Property({
    fieldName: 'max_referrals_per_user',
    columnType: 'int',
    nullable: true,
  })
  maxReferralsPerUser?: number;

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
