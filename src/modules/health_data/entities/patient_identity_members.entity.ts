import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `patient_identity_members`.
 */
@Entity({ schema: 'health_data', tableName: 'patient_identity_members' })
export class PatientIdentityMembers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a patient identity cluster.
   */
  @Property({ fieldName: 'patient_identity_cluster_id', type: 'uuid' }) // FK → health_data.patient_identity_clusters
  patientIdentityClusterId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador asociado a source system.
   */
  @Property({ fieldName: 'source_system_id', type: 'uuid', nullable: true }) // FK → health_data.health_source_systems
  sourceSystemId?: string;

  /**
   * Valor de source patient identifier mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_patient_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  sourcePatientIdentifier?: string;

  /**
   * Identificador asociado a member role concept.
   */
  @Property({ fieldName: 'member_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberRoleConceptId!: string;

  /**
   * Identificador asociado a match status concept.
   */
  @Property({ fieldName: 'match_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  matchStatusConceptId!: string;

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
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
