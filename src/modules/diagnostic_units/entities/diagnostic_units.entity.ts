import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostic_units', tableName: 'diagnostic_units' })
export class DiagnosticUnits {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'practice_id', type: 'uuid', nullable: true }) // FK → practice.practices
  practiceId?: string;

  @Property({
    fieldName: 'primary_practice_site_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.practice_sites
  primaryPracticeSiteId?: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'diagnostic_unit_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  diagnosticUnitTypeConceptId!: string;

  @Property({
    fieldName: 'ownership_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  ownershipTypeConceptId?: string;

  @Property({ fieldName: 'public_profile_id', type: 'uuid', nullable: true }) // FK → community.public_profiles
  publicProfileId?: string;

  @Property({
    fieldName: 'accepts_external_orders',
    type: 'boolean',
    nullable: true,
  })
  acceptsExternalOrders?: boolean;

  @Property({ fieldName: 'walk_in_available', type: 'boolean', nullable: true })
  walkInAvailable?: boolean;

  @Property({
    fieldName: 'home_collection_available',
    type: 'boolean',
    nullable: true,
  })
  homeCollectionAvailable?: boolean;

  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

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
