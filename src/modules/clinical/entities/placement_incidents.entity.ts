import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical', tableName: 'placement_incidents' })
export class PlacementIncidents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid' }) // FK → clinical.encounters (inferida)
  encounterId!: string;

  @Property({
    fieldName: 'encounter_location_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.encounter_locations (inferida)
  encounterLocationId?: string;

  @Property({ fieldName: 'care_space_id', type: 'uuid' }) // FK → practice.care_spaces (inferida)
  careSpaceId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles (inferida)
  patientProfileId!: string;

  @Property({ fieldName: 'violations_json', type: 'json', columnType: 'jsonb' })
  violationsJson!: unknown;

  @Property({ fieldName: 'justification_text', columnType: 'text' })
  justificationText!: string;

  @Property({ fieldName: 'authorized_by_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  authorizedByUserId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  @Property({ fieldName: 'reviewed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  reviewedByUserId?: string;

  @Property({
    fieldName: 'reviewed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  reviewedAt?: Date;

  @Property({ fieldName: 'review_note', columnType: 'text', nullable: true })
  reviewNote?: string;

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
