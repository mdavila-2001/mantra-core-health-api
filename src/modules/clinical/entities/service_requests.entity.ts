import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `service_requests`.
 */
@Entity({ schema: 'clinical', tableName: 'service_requests' })
export class ServiceRequests {
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
   * Identificador asociado a code concept.
   */
  @Property({ fieldName: 'code_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  codeConceptId!: string;

  /**
   * Identificador asociado a category concept.
   */
  @Property({ fieldName: 'category_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  categoryConceptId?: string;

  /**
   * Identificador asociado a intent concept.
   */
  @Property({ fieldName: 'intent_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  intentConceptId?: string;

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
   * Identificador asociado a requester profile.
   */
  @Property({ fieldName: 'requester_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  requesterProfileId?: string;

  /**
   * Identificador asociado a performer tenant.
   */
  @Property({ fieldName: 'performer_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  performerTenantId?: string;

  /**
   * El informe diagnóstico previo que satisface este pedido (antiduplicación,
   * v4.2.17). Presente cuando el motor de duplicidad encontró un informe
   * liberado o final del mismo estudio dentro de la ventana: `null` significa
   * que no hubo duplicado, o que la orden es anterior a esta promoción.
   */
  @Property({
    fieldName: 'previous_diagnostic_report_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.diagnostic_reports
  previousDiagnosticReportId?: string;

  /**
   * Justificación clínica del médico para repetir un estudio duplicado
   * (v4.2.17). `null` cuando la orden reutiliza el informe previo
   * (`previous_diagnostic_report_id` sin justificación) o cuando no hubo
   * duplicado. Un CHECK de base impide el estado inverso: justificación sin
   * informe previo enlazado.
   */
  @Property({
    fieldName: 'duplicate_override_reason',
    columnType: 'text',
    nullable: true,
  })
  duplicateOverrideReason?: string;

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
