import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `patient_identity_clusters`.
 */
@Entity({ schema: 'health_data', tableName: 'patient_identity_clusters' })
export class PatientIdentityClusters {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Valor de cluster identifier mantenido por la instancia.
   */
  @Property({ fieldName: 'cluster_identifier', columnType: 'varchar' })
  clusterIdentifier!: string;

  /**
   * Identificador asociado a master patient profile.
   */
  @Property({ fieldName: 'master_patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  masterPatientProfileId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @Property({
    fieldName: 'confidence_score',
    columnType: 'numeric(8,5)',
    nullable: true,
  })
  confidenceScore?: string;

  /**
   * Valor de last resolved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastResolvedAt?: Date;

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
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
