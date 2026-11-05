import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `received_services`.
 */
@Entity({ schema: 'clinical', tableName: 'received_services' })
export class ReceivedServices {
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
   * Identificador asociado a service type concept.
   */
  @Property({ fieldName: 'service_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  serviceTypeConceptId!: string;

  /**
   * Identificador asociado a service concept.
   */
  @Property({ fieldName: 'service_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  serviceConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a source procedure.
   */
  @Property({ fieldName: 'source_procedure_id', type: 'uuid', nullable: true }) // FK → clinical.procedures
  sourceProcedureId?: string;

  /**
   * Identificador asociado a source immunization.
   */
  @Property({
    fieldName: 'source_immunization_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.immunizations
  sourceImmunizationId?: string;

  /**
   * Identificador asociado a procedure case.
   */
  @Property({ fieldName: 'procedure_case_id', type: 'uuid', nullable: true }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId?: string;

  /**
   * Identificador asociado a service catalog.
   */
  @Property({ fieldName: 'service_catalog_id', type: 'uuid', nullable: true }) // FK → billing.service_catalog
  serviceCatalogId?: string;

  /**
   * Identificador asociado a invoice line.
   */
  @Property({ fieldName: 'invoice_line_id', type: 'uuid', nullable: true }) // FK → billing.invoice_lines
  invoiceLineId?: string;

  /**
   * Identificador asociado a insurance claim line.
   */
  @Property({
    fieldName: 'insurance_claim_line_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.insurance_claim_lines
  insuranceClaimLineId?: string;

  /**
   * Identificador asociado a performer profile.
   */
  @Property({ fieldName: 'performer_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  performerProfileId?: string;

  /**
   * Identificador asociado a practice site.
   */
  @Property({ fieldName: 'practice_site_id', type: 'uuid', nullable: true }) // FK → practice.practice_sites
  practiceSiteId?: string;

  /**
   * Valor de performed at mantenido por la instancia.
   */
  @Property({ fieldName: 'performed_at', columnType: 'timestamptz' })
  performedAt!: Date;

  /**
   * Identificador asociado a outcome concept.
   */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  outcomeConceptId?: string;

  /**
   * Valor de result text mantenido por la instancia.
   */
  @Property({ fieldName: 'result_text', columnType: 'text', nullable: true })
  resultText?: string;

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
