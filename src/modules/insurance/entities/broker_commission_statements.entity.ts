import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `broker_commission_statements`.
 */
@Entity({ schema: 'insurance', tableName: 'broker_commission_statements' })
export class BrokerCommissionStatements {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a insurance broker.
   */
  @Property({ fieldName: 'insurance_broker_id', type: 'uuid' }) // FK → insurance.insurance_brokers
  insuranceBrokerId!: string;

  /**
   * Identificador asociado a broker carrier agreement.
   */
  @Property({ fieldName: 'broker_carrier_agreement_id', type: 'uuid' }) // FK → insurance.broker_carrier_agreements
  brokerCarrierAgreementId!: string;

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
   * Valor de gross premium amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'gross_premium_amount',
    columnType: 'numeric',
    nullable: true,
  })
  grossPremiumAmount?: string;

  /**
   * Valor de commission amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'commission_amount',
    columnType: 'numeric',
    nullable: true,
  })
  commissionAmount?: string;

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
