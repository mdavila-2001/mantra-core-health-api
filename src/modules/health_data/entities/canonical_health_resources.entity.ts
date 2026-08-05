import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `canonical_health_resources`.
 */
@Entity({ schema: 'health_data', tableName: 'canonical_health_resources' })
export class CanonicalHealthResources {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a custodian tenant.
   */
  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  /**
   * Identificador asociado a resource type concept.
   */
  @Property({ fieldName: 'resource_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resourceTypeConceptId!: string;

  /**
   * Valor de logical identifier mantenido por la instancia.
   */
  @Property({ fieldName: 'logical_identifier', columnType: 'varchar' })
  logicalIdentifier!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true }) // FK → profiles.patient_profiles
  patientProfileId?: string;

  /**
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  /**
   * Identificador asociado a source system.
   */
  @Property({ fieldName: 'source_system_id', type: 'uuid', nullable: true }) // FK → health_data.health_source_systems
  sourceSystemId?: string;

  /**
   * Identificador asociado a current version.
   */
  @Property({ fieldName: 'current_version_id', type: 'uuid', nullable: true }) // FK → health_data.canonical_health_resource_versions
  currentVersionId?: string;

  /**
   * Identificador asociado a lifecycle status concept.
   */
  @Property({ fieldName: 'lifecycle_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  lifecycleStatusConceptId!: string;

  /**
   * Valor de security labels json mantenido por la instancia.
   */
  @Property({
    fieldName: 'security_labels_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  securityLabelsJson?: unknown;

  /**
   * Valor de purpose restrictions json mantenido por la instancia.
   */
  @Property({
    fieldName: 'purpose_restrictions_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  purposeRestrictionsJson?: unknown;

  /**
   * Identificador asociado a retention policy.
   */
  @Property({ fieldName: 'retention_policy_id', type: 'uuid', nullable: true }) // FK → system_ops.retention_policies
  retentionPolicyId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
