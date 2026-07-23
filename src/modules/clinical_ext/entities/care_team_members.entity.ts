import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical_ext', tableName: 'care_team_members' })
export class CareTeamMembers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'care_team_id', type: 'uuid' }) // FK → clinical_ext.care_teams
  careTeamId!: string;

  @Property({
    fieldName: 'practitioner_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  practitionerProfileId?: string;

  @Property({ fieldName: 'related_person_id', type: 'uuid', nullable: true }) // FK → profiles.related_persons
  relatedPersonId?: string;

  @Property({ fieldName: 'member_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberRoleConceptId!: string;

  @Property({ fieldName: 'is_responsible', type: 'boolean', nullable: true })
  isResponsible?: boolean;

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
