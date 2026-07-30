import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `patient_match_candidates`.
 */
@Entity({ schema: 'health_data', tableName: 'patient_match_candidates' })
export class PatientMatchCandidates {
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
   * Identificador asociado a left patient profile.
   */
  @Property({ fieldName: 'left_patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  leftPatientProfileId!: string;

  /**
   * Identificador asociado a right patient profile.
   */
  @Property({ fieldName: 'right_patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  rightPatientProfileId!: string;

  /**
   * Valor de algorithm version mantenido por la instancia.
   */
  @Property({ fieldName: 'algorithm_version', columnType: 'varchar' })
  algorithmVersion!: string;

  /**
   * Valor de match score mantenido por la instancia.
   */
  @Property({ fieldName: 'match_score', columnType: 'numeric(8,5)' })
  matchScore!: string;

  /**
   * Valor de matching features json mantenido por la instancia.
   */
  @Property({
    fieldName: 'matching_features_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  matchingFeaturesJson?: unknown;

  /**
   * Valor de conflicting features json mantenido por la instancia.
   */
  @Property({
    fieldName: 'conflicting_features_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conflictingFeaturesJson?: unknown;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de generated at mantenido por la instancia.
   */
  @Property({ fieldName: 'generated_at', columnType: 'timestamptz' })
  generatedAt!: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
