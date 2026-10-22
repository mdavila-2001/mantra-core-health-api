import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'scheduling', tableName: 'practitioner_service_offerings' })
export class PractitionerServiceOfferings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId!: string;

  @Property({ fieldName: 'service_catalog_id', type: 'uuid' }) // FK → billing.service_catalog (inferida)
  serviceCatalogId!: string;

  @Property({ fieldName: 'min_duration_minutes', columnType: 'int' })
  minDurationMinutes!: number;

  @Property({ fieldName: 'max_duration_minutes', columnType: 'int' })
  maxDurationMinutes!: number;

  @Property({ fieldName: 'prep_minutes', columnType: 'int', nullable: true })
  prepMinutes?: number;

  @Property({ fieldName: 'cleanup_minutes', columnType: 'int', nullable: true })
  cleanupMinutes?: number;

  @Property({ fieldName: 'is_patient_bookable', type: 'boolean' })
  isPatientBookable!: boolean;

  @Property({ fieldName: 'requires_approval', type: 'boolean' })
  requiresApproval!: boolean;

  @Property({ fieldName: 'channel_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  channelConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

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
