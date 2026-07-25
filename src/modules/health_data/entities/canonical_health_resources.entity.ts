import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'canonical_health_resources' })
export class CanonicalHealthResources {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'resource_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resourceTypeConceptId!: string;

  @Property({ fieldName: 'logical_identifier', columnType: 'varchar' })
  logicalIdentifier!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true }) // FK → profiles.patient_profiles
  patientProfileId?: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  @Property({ fieldName: 'source_system_id', type: 'uuid', nullable: true }) // FK → health_data.health_source_systems
  sourceSystemId?: string;

  @Property({ fieldName: 'current_version_id', type: 'uuid', nullable: true }) // FK → health_data.canonical_health_resource_versions
  currentVersionId?: string;

  @Property({ fieldName: 'lifecycle_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  lifecycleStatusConceptId!: string;

  @Property({
    fieldName: 'security_labels_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  securityLabelsJson?: unknown;

  @Property({
    fieldName: 'purpose_restrictions_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  purposeRestrictionsJson?: unknown;

  @Property({ fieldName: 'retention_policy_id', type: 'uuid', nullable: true }) // FK → system_ops.retention_policies
  retentionPolicyId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
