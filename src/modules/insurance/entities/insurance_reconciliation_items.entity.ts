import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insurance_reconciliation_items`.
 */
@Entity({ schema: 'insurance', tableName: 'insurance_reconciliation_items' })
export class InsuranceReconciliationItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a insurance reconciliation batch.
   */
  @Property({ fieldName: 'insurance_reconciliation_batch_id', type: 'uuid' }) // FK → insurance.insurance_reconciliation_batches
  insuranceReconciliationBatchId!: string;

  /**
   * Identificador asociado a insurance claim.
   */
  @Property({ fieldName: 'insurance_claim_id', type: 'uuid' }) // FK → insurance.insurance_claims
  insuranceClaimId!: string;

  /**
   * Identificador asociado a claim adjudication version.
   */
  @Property({ fieldName: 'claim_adjudication_version_id', type: 'uuid' }) // FK → insurance.claim_adjudication_versions
  claimAdjudicationVersionId!: string;

  /**
   * Valor de expected amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'expected_amount',
    columnType: 'numeric',
    nullable: true,
  })
  expectedAmount?: string;

  /**
   * Valor de accepted amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'accepted_amount',
    columnType: 'numeric',
    nullable: true,
  })
  acceptedAmount?: string;

  /**
   * Valor de variance amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'variance_amount',
    columnType: 'numeric',
    nullable: true,
  })
  varianceAmount?: string;

  /**
   * Identificador asociado a variance reason concept.
   */
  @Property({
    fieldName: 'variance_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  varianceReasonConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
