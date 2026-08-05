import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insurance_reconciliation_batches`.
 */
@Entity({ schema: 'insurance', tableName: 'insurance_reconciliation_batches' })
export class InsuranceReconciliationBatches {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a insurance carrier.
   */
  @Property({ fieldName: 'insurance_carrier_id', type: 'uuid' }) // FK → insurance.insurance_carriers
  insuranceCarrierId!: string;

  /**
   * Identificador asociado a provider type concept.
   */
  @Property({ fieldName: 'provider_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  providerTypeConceptId!: string;

  /**
   * Identificador asociado a provider entity.
   */
  @Property({ fieldName: 'provider_entity_id', type: 'uuid' })
  providerEntityId!: string;

  /**
   * Valor de period start mantenido por la instancia.
   */
  @Property({ fieldName: 'period_start', columnType: 'date' })
  periodStart!: Date;

  /**
   * Valor de period end mantenido por la instancia.
   */
  @Property({ fieldName: 'period_end', columnType: 'date' })
  periodEnd!: Date;

  /**
   * Valor de total claimed amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'total_claimed_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalClaimedAmount?: string;

  /**
   * Valor de total approved amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'total_approved_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalApprovedAmount?: string;

  /**
   * Valor de total paid amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'total_paid_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalPaidAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

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
