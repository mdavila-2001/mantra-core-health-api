import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `claim_line_adjudications`.
 */
@Entity({ schema: 'insurance', tableName: 'claim_line_adjudications' })
export class ClaimLineAdjudications {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a claim adjudication version.
   */
  @Property({ fieldName: 'claim_adjudication_version_id', type: 'uuid' }) // FK → insurance.claim_adjudication_versions
  claimAdjudicationVersionId!: string;

  /**
   * Identificador asociado a insurance claim line.
   */
  @Property({ fieldName: 'insurance_claim_line_id', type: 'uuid' }) // FK → insurance.insurance_claim_lines
  insuranceClaimLineId!: string;

  /**
   * Identificador asociado a decision concept.
   */
  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  /**
   * Valor de approved amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'approved_amount',
    columnType: 'numeric',
    nullable: true,
  })
  approvedAmount?: string;

  /**
   * Valor de patient amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'patient_amount',
    columnType: 'numeric',
    nullable: true,
  })
  patientAmount?: string;

  /**
   * Valor de denied amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'denied_amount',
    columnType: 'numeric',
    nullable: true,
  })
  deniedAmount?: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
