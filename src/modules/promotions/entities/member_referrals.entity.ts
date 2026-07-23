import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'promotions', tableName: 'member_referrals' })
export class MemberReferrals {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'referral_program_id', type: 'uuid' }) // FK → promotions.referral_programs
  referralProgramId!: string;

  @Property({ fieldName: 'referrer_user_id', type: 'uuid' }) // FK → iam.users
  referrerUserId!: string;

  @Property({ fieldName: 'referral_code', columnType: 'varchar' })
  referralCode!: string;

  @Property({ fieldName: 'referee_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  refereeUserId?: string;

  @Property({
    fieldName: 'referee_contact',
    columnType: 'varchar',
    nullable: true,
  })
  refereeContact?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'qualified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  qualifiedAt?: Date;

  @Property({
    fieldName: 'referrer_reward_ledger_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  referrerRewardLedgerId?: string;

  @Property({
    fieldName: 'referee_reward_ledger_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  refereeRewardLedgerId?: string;

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
