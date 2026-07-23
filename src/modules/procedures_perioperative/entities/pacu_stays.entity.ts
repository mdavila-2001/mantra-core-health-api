import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'procedures_perioperative', tableName: 'pacu_stays' })
export class PacuStays {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'care_space_id', type: 'uuid' }) // FK → practice.care_spaces
  careSpaceId!: string;

  @Property({ fieldName: 'admitted_at', columnType: 'timestamptz' })
  admittedAt!: Date;

  @Property({
    fieldName: 'discharged_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  dischargedAt?: Date;

  @Property({
    fieldName: 'admitted_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  admittedByProfileId?: string;

  @Property({
    fieldName: 'discharged_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  dischargedByProfileId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'discharge_destination_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dischargeDestinationConceptId?: string;

  @Property({
    fieldName: 'discharge_criteria_met',
    type: 'boolean',
    nullable: true,
  })
  dischargeCriteriaMet?: boolean;

  @Property({ columnType: 'text', nullable: true })
  notes?: string;

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
