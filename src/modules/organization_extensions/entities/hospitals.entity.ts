import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'organization_extensions', tableName: 'hospitals' })
export class Hospitals {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  @Property({
    fieldName: 'primary_practice_site_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.practice_sites
  primaryPracticeSiteId?: string;

  @Property({ fieldName: 'public_profile_id', type: 'uuid', nullable: true }) // FK → community.public_profiles
  publicProfileId?: string;

  @Property({ fieldName: 'hospital_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  hospitalTypeConceptId!: string;

  @Property({
    fieldName: 'care_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  careLevelConceptId?: string;

  @Property({
    fieldName: 'ownership_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  ownershipTypeConceptId?: string;

  @Property({
    fieldName: 'teaching_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  teachingStatusConceptId?: string;

  @Property({
    fieldName: 'emergency_capability_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  emergencyCapabilityConceptId?: string;

  @Property({
    fieldName: 'licensed_bed_capacity',
    columnType: 'int',
    nullable: true,
  })
  licensedBedCapacity?: number;

  @Property({
    fieldName: 'operational_bed_capacity',
    columnType: 'int',
    nullable: true,
  })
  operationalBedCapacity?: number;

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
