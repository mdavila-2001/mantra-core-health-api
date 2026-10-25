import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical', tableName: 'received_services' })
export class ReceivedServices {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  @Property({ fieldName: 'service_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  serviceTypeConceptId!: string;

  @Property({ fieldName: 'service_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  serviceConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'source_procedure_id', type: 'uuid', nullable: true }) // FK → clinical.procedures
  sourceProcedureId?: string;

  @Property({
    fieldName: 'source_immunization_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.immunizations
  sourceImmunizationId?: string;

  @Property({ fieldName: 'procedure_case_id', type: 'uuid', nullable: true }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId?: string;

  @Property({ fieldName: 'service_catalog_id', type: 'uuid', nullable: true }) // FK → billing.service_catalog
  serviceCatalogId?: string;

  @Property({ fieldName: 'invoice_line_id', type: 'uuid', nullable: true }) // FK → billing.invoice_lines
  invoiceLineId?: string;

  @Property({
    fieldName: 'insurance_claim_line_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.insurance_claim_lines
  insuranceClaimLineId?: string;

  @Property({ fieldName: 'performer_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  performerProfileId?: string;

  @Property({ fieldName: 'practice_site_id', type: 'uuid', nullable: true }) // FK → practice.practice_sites
  practiceSiteId?: string;

  @Property({ fieldName: 'performed_at', columnType: 'timestamptz' })
  performedAt!: Date;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  outcomeConceptId?: string;

  @Property({ fieldName: 'result_text', columnType: 'text', nullable: true })
  resultText?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
