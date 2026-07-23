import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'pharmacy', tableName: 'pharmacy_sites' })
export class PharmacySites {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_id', type: 'uuid' }) // FK → pharmacy.pharmacies
  pharmacyId!: string;

  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites
  practiceSiteId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({
    fieldName: 'pharmacy_site_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  pharmacySiteTypeConceptId?: string;

  @Property({
    fieldName: 'dispensing_mode_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dispensingModeConceptId?: string;

  @Property({
    fieldName: 'controlled_substance_capability_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  controlledSubstanceCapabilityConceptId?: string;

  @Property({
    fieldName: 'home_delivery_available',
    type: 'boolean',
    nullable: true,
  })
  homeDeliveryAvailable?: boolean;

  @Property({ fieldName: 'pickup_available', type: 'boolean', nullable: true })
  pickupAvailable?: boolean;

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
