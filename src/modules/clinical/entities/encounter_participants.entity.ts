import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical', tableName: 'encounter_participants' })
export class EncounterParticipants {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'encounter_id', type: 'uuid' }) // FK → clinical.encounters
  encounterId!: string;

  @Property({ fieldName: 'practitioner_profile_id', type: 'uuid' }) // FK (destino no resuelto)
  practitionerProfileId!: string;

  @Property({ fieldName: 'participant_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  participantRoleConceptId!: string;

  @Property({
    fieldName: 'practitioner_role_assignment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.practitioner_role_assignments
  practitionerRoleAssignmentId?: string;

  @Property({
    fieldName: 'period_start',
    columnType: 'timestamptz',
    nullable: true,
  })
  periodStart?: Date;

  @Property({
    fieldName: 'period_end',
    columnType: 'timestamptz',
    nullable: true,
  })
  periodEnd?: Date;

  @Property({ fieldName: 'is_responsible', type: 'boolean', nullable: true })
  isResponsible?: boolean;

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
