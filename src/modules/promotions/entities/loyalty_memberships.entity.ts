import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'promotions', tableName: 'loyalty_memberships' })
export class LoyaltyMemberships {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'loyalty_program_id', type: 'uuid' }) // FK → promotions.loyalty_programs
  loyaltyProgramId!: string;

  @Property({ fieldName: 'member_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberTypeConceptId!: string;

  @Property({ fieldName: 'member_ref_id', type: 'uuid' })
  memberRefId!: string;

  @Property({ fieldName: 'current_tier_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  currentTierId?: string;

  @Property({
    fieldName: 'points_balance',
    columnType: 'numeric',
    nullable: true,
  })
  pointsBalance?: string;

  @Property({
    fieldName: 'lifetime_points',
    columnType: 'numeric',
    nullable: true,
  })
  lifetimePoints?: string;

  @Property({
    fieldName: 'enrolled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  enrolledAt?: Date;

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
