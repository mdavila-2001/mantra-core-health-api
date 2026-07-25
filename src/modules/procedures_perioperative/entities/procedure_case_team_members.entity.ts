import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_case_team_members',
})
export class ProcedureCaseTeamMembers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId!: string;

  @Property({ fieldName: 'team_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  teamRoleConceptId!: string;

  @Property({
    fieldName: 'assigned_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  assignedAt?: Date;

  @Property({
    fieldName: 'accepted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acceptedAt?: Date;

  @Property({
    fieldName: 'arrived_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  arrivedAt?: Date;

  @Property({
    fieldName: 'departed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  departedAt?: Date;

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
