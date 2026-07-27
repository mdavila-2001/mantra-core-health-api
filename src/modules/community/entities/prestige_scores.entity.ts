import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'prestige_scores' })
export class PrestigeScores {
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

  @Property({ fieldName: 'total_points', columnType: 'numeric' })
  totalPoints!: string;

  @Property({ fieldName: 'level_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  levelConceptId?: string;

  @Property({ fieldName: 'rank_position', columnType: 'int', nullable: true })
  rankPosition?: number;

  @Property({ fieldName: 'last_award_id', type: 'uuid', nullable: true }) // FK → community.prestige_awards
  lastAwardId?: string;

  @Property({
    fieldName: 'calculated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  calculatedAt?: Date;

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
