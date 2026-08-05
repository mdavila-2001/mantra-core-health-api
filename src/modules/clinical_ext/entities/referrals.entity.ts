import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `referrals`.
 */
@Entity({ schema: 'clinical_ext', tableName: 'referrals' })
export class Referrals {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador asociado a source encounter.
   */
  @Property({ fieldName: 'source_encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  sourceEncounterId?: string;

  /**
   * Identificador asociado a referring profile.
   */
  @Property({ fieldName: 'referring_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  referringProfileId?: string;

  /**
   * Identificador asociado a target profile.
   */
  @Property({ fieldName: 'target_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  targetProfileId?: string;

  /**
   * Identificador asociado a target tenant.
   */
  @Property({ fieldName: 'target_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  targetTenantId?: string;

  /**
   * Identificador asociado a specialty concept.
   */
  @Property({ fieldName: 'specialty_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  specialtyConceptId?: string;

  /**
   * Identificador asociado a service request.
   */
  @Property({ fieldName: 'service_request_id', type: 'uuid', nullable: true }) // FK → clinical.service_requests
  serviceRequestId?: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  /**
   * Identificador asociado a priority concept.
   */
  @Property({ fieldName: 'priority_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  priorityConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de valid until mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_until', columnType: 'date', nullable: true })
  validUntil?: Date;

  /**
   * Valor de responded at mantenido por la instancia.
   */
  @Property({
    fieldName: 'responded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  respondedAt?: Date;

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
