import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'billing', tableName: 'patient_statements' })
export class PatientStatements {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'period_start', columnType: 'date' })
  periodStart!: Date;

  @Property({ fieldName: 'period_end', columnType: 'date' })
  periodEnd!: Date;

  @Property({
    fieldName: 'opening_balance',
    columnType: 'numeric',
    nullable: true,
  })
  openingBalance?: string;

  @Property({ columnType: 'numeric', nullable: true })
  charges?: string;

  @Property({ columnType: 'numeric', nullable: true })
  payments?: string;

  @Property({
    fieldName: 'closing_balance',
    columnType: 'numeric',
    nullable: true,
  })
  closingBalance?: string;

  @Property({
    fieldName: 'generated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  generatedAt?: Date;

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
