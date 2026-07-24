import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'prestige_scores' })
export class PrestigeScores {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'subject_type_concept_id', type: 'uuid' })
  subjectTypeConceptId!: string;

  @Property({ fieldName: 'subject_ref_id', type: 'uuid' })
  subjectRefId!: string;

  @Property({ fieldName: 'public_profile_id', type: 'uuid', nullable: true })
  publicProfileId?: string;

  @Property({ fieldName: 'total_points', columnType: 'numeric' })
  totalPoints!: string;

  @Property({ fieldName: 'level_concept_id', type: 'uuid', nullable: true })
  levelConceptId?: string;

  @Property({ fieldName: 'rank_position', columnType: 'int', nullable: true })
  rankPosition?: number;

  @Property({ fieldName: 'last_award_id', type: 'uuid', nullable: true })
  lastAwardId?: string;

  @Property({
    fieldName: 'calculated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  calculatedAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' })
  statusConceptId!: string;

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
