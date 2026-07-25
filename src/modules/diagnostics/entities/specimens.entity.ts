import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'specimens' })
export class Specimens {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'service_request_id', type: 'uuid', nullable: true }) // FK → clinical.service_requests
  serviceRequestId?: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  @Property({ fieldName: 'specimen_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  specimenTypeConceptId!: string;

  @Property({
    fieldName: 'accession_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  accessionIdentifier?: string;

  @Property({ fieldName: 'body_site_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  bodySiteConceptId?: string;

  @Property({
    fieldName: 'collection_method_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  collectionMethodConceptId?: string;

  @Property({
    fieldName: 'collected_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  collectedAt?: Date;

  @Property({
    fieldName: 'received_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  receivedAt?: Date;

  @Property({ fieldName: 'collector_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  collectorProfileId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'container_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  containerTypeConceptId?: string;

  @Property({
    fieldName: 'quantity_decimal',
    columnType: 'numeric',
    nullable: true,
  })
  quantityDecimal?: string;

  @Property({
    fieldName: 'quantity_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  quantityUnitConceptId?: string;

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

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
