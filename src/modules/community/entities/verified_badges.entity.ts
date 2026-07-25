import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'verified_badges' })
export class VerifiedBadges {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'subject_type_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  subjectTypeConceptId!: string;

  @Property({ fieldName: 'subject_ref_id', type: 'uuid' })
  subjectRefId!: string;

  @Property({ fieldName: 'badge_type_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  badgeTypeConceptId!: string;

  @Property({ fieldName: 'verification_method_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  verificationMethodConceptId!: string;

  @Property({ fieldName: 'verified_by_user_id', type: 'uuid', nullable: true })  // FK → iam.users
  verifiedByUserId?: string;

  @Property({ fieldName: 'evidence_ref', columnType: 'varchar', nullable: true })
  evidenceRef?: string;

  @Property({ fieldName: 'valid_from', columnType: 'timestamptz', nullable: true })
  validFrom?: Date;

  @Property({ fieldName: 'valid_to', columnType: 'timestamptz', nullable: true })
  validTo?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })  // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })  // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

}
