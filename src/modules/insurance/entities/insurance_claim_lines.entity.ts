import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insurance_claim_lines`.
 */
@Entity({ schema: 'insurance', tableName: 'insurance_claim_lines' })
export class InsuranceClaimLines {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a insurance claim.
   */
  @Property({ fieldName: 'insurance_claim_id', type: 'uuid' }) // FK → insurance.insurance_claims
  insuranceClaimId!: string;

  /**
   * Valor de line sequence mantenido por la instancia.
   */
  @Property({ fieldName: 'line_sequence', columnType: 'int' })
  lineSequence!: number;

  /**
   * Identificador asociado a service concept.
   */
  @Property({ fieldName: 'service_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  serviceConceptId?: string;

  /**
   * Identificador asociado a diagnostic study offering.
   */
  @Property({
    fieldName: 'diagnostic_study_offering_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostic_units.diagnostic_study_offerings
  diagnosticStudyOfferingId?: string;

  /**
   * Identificador asociado a medication dispensation line.
   */
  @Property({
    fieldName: 'medication_dispensation_line_id',
    type: 'uuid',
    nullable: true,
  }) // FK → pharmacy_inventory.medication_dispensation_lines
  medicationDispensationLineId?: string;

  @Property({
    fieldName: 'inventory_reservation_line_id',
    type: 'uuid',
    nullable: true,
  }) // FK → pharmacy_inventory.inventory_reservation_lines
  inventoryReservationLineId?: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  quantity?: string;

  /**
   * Valor de billed amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'billed_amount',
    columnType: 'numeric',
    nullable: true,
  })
  billedAmount?: string;

  /**
   * Valor de patient responsibility amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'patient_responsibility_amount',
    columnType: 'numeric',
    nullable: true,
  })
  patientResponsibilityAmount?: string;

  /**
   * Valor de supporting clinical reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'supporting_clinical_reference',
    columnType: 'varchar',
    nullable: true,
  })
  supportingClinicalReference?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
