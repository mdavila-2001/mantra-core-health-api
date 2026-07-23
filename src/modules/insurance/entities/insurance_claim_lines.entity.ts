import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'insurance_claim_lines' })
export class InsuranceClaimLines {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'insurance_claim_id', type: 'uuid' }) // FK → insurance.insurance_claims
  insuranceClaimId!: string;

  @Property({ fieldName: 'line_sequence', columnType: 'int' })
  lineSequence!: number;

  @Property({ fieldName: 'service_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  serviceConceptId?: string;

  @Property({
    fieldName: 'diagnostic_study_offering_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostic_units.diagnostic_study_offerings
  diagnosticStudyOfferingId?: string;

  @Property({
    fieldName: 'medication_dispensation_line_id',
    type: 'uuid',
    nullable: true,
  }) // FK → pharmacy_inventory.medication_dispensation_lines
  medicationDispensationLineId?: string;

  @Property({ columnType: 'numeric', nullable: true })
  quantity?: string;

  @Property({
    fieldName: 'billed_amount',
    columnType: 'numeric',
    nullable: true,
  })
  billedAmount?: string;

  @Property({
    fieldName: 'patient_responsibility_amount',
    columnType: 'numeric',
    nullable: true,
  })
  patientResponsibilityAmount?: string;

  @Property({
    fieldName: 'supporting_clinical_reference',
    columnType: 'varchar',
    nullable: true,
  })
  supportingClinicalReference?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
