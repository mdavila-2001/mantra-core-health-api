import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Marca de acceso de un paciente (VIP, confidencial, familiar del personal o protegido) puesta por la organización. No es un dato clínico.
 */
@Entity({ schema: 'delegated_access', tableName: 'patient_restriction_flags' })
export class PatientRestrictionFlags {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Columna `tenant_id`. */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /** Columna `patient_profile_id`. */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /** Columna `flag_concept_id`. */
  @Property({ fieldName: 'flag_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  flagConceptId!: string;

  /** Columna `reason_text`. */
  @Property({ fieldName: 'reason_text', columnType: 'text' })
  reasonText!: string;

  /** Columna `status_concept_id`. */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /** Columna `valid_from`. */
  @Property({ fieldName: 'valid_from', columnType: 'timestamptz' })
  validFrom!: Date;

  /** Columna `valid_to`. */
  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

  /** Columna `created_at`. */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /** Columna `updated_at`. */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /** Columna `created_by_user_id`. */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /** Columna `updated_by_user_id`. */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /** Versión usada para controlar actualizaciones concurrentes. */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
