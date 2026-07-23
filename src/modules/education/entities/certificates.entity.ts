import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'education', tableName: 'certificates' })
export class Certificates {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'enrollment_id', type: 'uuid' }) // FK → education.enrollments
  enrollmentId!: string;

  @Property({ fieldName: 'course_id', type: 'uuid' }) // FK → education.courses
  courseId!: string;

  @Property({ fieldName: 'certificate_number', columnType: 'varchar' })
  certificateNumber!: string;

  @Property({ fieldName: 'learner_ref_id', type: 'uuid', nullable: true })
  learnerRefId?: string;

  @Property({
    fieldName: 'cme_credits_awarded',
    columnType: 'numeric',
    nullable: true,
  })
  cmeCreditsAwarded?: string;

  @Property({
    fieldName: 'issued_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  issuedAt?: Date;

  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  @Property({
    fieldName: 'verification_code',
    columnType: 'varchar',
    nullable: true,
  })
  verificationCode?: string;

  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

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
