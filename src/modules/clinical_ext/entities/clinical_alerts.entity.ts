import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `clinical_alerts`.
 */
@Entity({ schema: 'clinical_ext', tableName: 'clinical_alerts' })
export class ClinicalAlerts {
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
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  /**
   * Identificador asociado a alert type concept.
   */
  @Property({ fieldName: 'alert_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  alertTypeConceptId!: string;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  /**
   * Valor de source resource type mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_resource_type',
    columnType: 'varchar',
    nullable: true,
  })
  sourceResourceType?: string;

  /**
   * Identificador asociado a source resource.
   */
  @Property({ fieldName: 'source_resource_id', type: 'uuid', nullable: true })
  sourceResourceId?: string;

  /**
   * Identificador asociado a trigger concept.
   */
  @Property({ fieldName: 'trigger_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  triggerConceptId?: string;

  /**
   * Identificador asociado a rule.
   */
  @Property({ fieldName: 'rule_id', type: 'uuid', nullable: true }) // FK → clinical_ext.cds_rules
  ruleId?: string;

  /**
   * Valor de detail text mantenido por la instancia.
   */
  @Property({ fieldName: 'detail_text', columnType: 'text', nullable: true })
  detailText?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a overridden by user.
   */
  @Property({
    fieldName: 'overridden_by_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users
  overriddenByUserId?: string;

  /**
   * Valor de override reason mantenido por la instancia.
   */
  @Property({
    fieldName: 'override_reason',
    columnType: 'text',
    nullable: true,
  })
  overrideReason?: string;

  /**
   * Valor de overridden at mantenido por la instancia.
   */
  @Property({
    fieldName: 'overridden_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  overriddenAt?: Date;

  /**
   * Valor de detected at mantenido por la instancia.
   */
  @Property({ fieldName: 'detected_at', columnType: 'timestamptz' })
  detectedAt!: Date;

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
