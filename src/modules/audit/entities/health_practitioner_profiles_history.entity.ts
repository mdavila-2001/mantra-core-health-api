import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'audit', tableName: 'health_practitioner_profiles_history' })
export class HealthPractitionerProfilesHistory {
  @PrimaryKey({ fieldName: 'history_id', type: 'uuid' })
  historyId: string = randomUUID();

  @Property({ fieldName: 'health_practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  healthPractitionerProfileId!: string;

  @Property({ fieldName: 'revision_no', columnType: 'int' })
  revisionNo!: number;

  @Property({ fieldName: 'operation_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  operationConceptId!: string;

  @Property({ fieldName: 'valid_from', columnType: 'timestamptz' })
  validFrom!: Date;

  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  @Property({ fieldName: 'data_snapshot', type: 'json', columnType: 'jsonb' })
  dataSnapshot!: unknown;

  @Property({ fieldName: 'changed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  changedByUserId?: string;

  @Property({
    fieldName: 'change_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  changeReasonConceptId?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
