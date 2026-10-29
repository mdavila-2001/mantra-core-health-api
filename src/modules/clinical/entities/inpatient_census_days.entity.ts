import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical', tableName: 'inpatient_census_days' })
export class InpatientCensusDays {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites (inferida)
  practiceSiteId!: string;

  @Property({ fieldName: 'clinical_unit_id', type: 'uuid' }) // FK → practice.clinical_units (inferida)
  clinicalUnitId!: string;

  @Property({ fieldName: 'census_date', columnType: 'date' })
  censusDate!: Date;

  @Property({ fieldName: 'cutoff_at', columnType: 'timestamptz' })
  cutoffAt!: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  @Property({
    fieldName: 'closed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  closedAt?: Date;

  @Property({ fieldName: 'closed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  closedByUserId?: string;

  @Property({ fieldName: 'beds_censable', columnType: 'int' })
  bedsCensable!: number;

  @Property({ fieldName: 'beds_available', columnType: 'int' })
  bedsAvailable!: number;

  @Property({ fieldName: 'beds_blocked', columnType: 'int' })
  bedsBlocked!: number;

  @Property({ fieldName: 'patients_at_cutoff', columnType: 'int' })
  patientsAtCutoff!: number;

  @Property({ columnType: 'int' })
  admissions!: number;

  @Property({ columnType: 'int' })
  discharges!: number;

  @Property({ columnType: 'int' })
  deaths!: number;

  @Property({ fieldName: 'transfers_in', columnType: 'int' })
  transfersIn!: number;

  @Property({ fieldName: 'transfers_out', columnType: 'int' })
  transfersOut!: number;

  @Property({ fieldName: 'same_day_stays', columnType: 'int' })
  sameDayStays!: number;

  @Property({ fieldName: 'patient_days', columnType: 'int' })
  patientDays!: number;

  @Property({ fieldName: 'discharge_stay_days', columnType: 'int' })
  dischargeStayDays!: number;

  @Property({
    fieldName: 'content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contentHash?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
