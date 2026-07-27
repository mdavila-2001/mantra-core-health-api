import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'prestige_awards' })
export class PrestigeAwards {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'subject_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  subjectTypeConceptId!: string;

  @Property({ fieldName: 'subject_ref_id', type: 'uuid' })
  subjectRefId!: string;

  @Property({ fieldName: 'public_profile_id', type: 'uuid', nullable: true }) // FK → community.public_profiles
  publicProfileId?: string;

  @Property({ fieldName: 'direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  directionConceptId!: string;

  @Property({ columnType: 'numeric' })
  points!: string;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reasonConceptId!: string;

  @Property({ columnType: 'varchar', nullable: true })
  note?: string;

  @Property({ fieldName: 'awarded_by_user_id', type: 'uuid' }) // FK → iam.users
  awardedByUserId!: string;

  @Property({ fieldName: 'source_type', columnType: 'varchar', nullable: true })
  sourceType?: string;

  @Property({ fieldName: 'source_ref_id', type: 'uuid', nullable: true })
  sourceRefId?: string;

  @Property({
    fieldName: 'balance_after',
    columnType: 'numeric',
    nullable: true,
  })
  balanceAfter?: string;

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
