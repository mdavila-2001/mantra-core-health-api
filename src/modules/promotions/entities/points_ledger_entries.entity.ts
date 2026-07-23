import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'promotions', tableName: 'points_ledger_entries' })
export class PointsLedgerEntries {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'loyalty_membership_id', type: 'uuid' }) // FK → promotions.loyalty_memberships
  loyaltyMembershipId!: string;

  @Property({ fieldName: 'direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  directionConceptId!: string;

  @Property({ columnType: 'numeric' })
  points!: string;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reasonConceptId!: string;

  @Property({
    fieldName: 'balance_after',
    columnType: 'numeric',
    nullable: true,
  })
  balanceAfter?: string;

  @Property({ fieldName: 'source_type', columnType: 'varchar', nullable: true })
  sourceType?: string;

  @Property({ fieldName: 'source_ref_id', type: 'uuid', nullable: true })
  sourceRefId?: string;

  @Property({ fieldName: 'earning_rule_id', type: 'uuid', nullable: true }) // FK → promotions.earning_rules
  earningRuleId?: string;

  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
