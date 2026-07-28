import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `risk_assessments`.
 */
@Entity({ schema: 'payments', tableName: 'risk_assessments' })
export class RiskAssessments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a payment intent.
   */
  @Property({ fieldName: 'payment_intent_id', type: 'uuid' }) // FK → payments.payment_intents
  paymentIntentId!: string;

  /**
   * Valor de risk score mantenido por la instancia.
   */
  @Property({ fieldName: 'risk_score', columnType: 'numeric' })
  riskScore!: string;

  /**
   * Identificador asociado a risk level concept.
   */
  @Property({ fieldName: 'risk_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  riskLevelConceptId!: string;

  /**
   * Identificador asociado a decision concept.
   */
  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  /**
   * Valor de provider ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'provider_ref',
    columnType: 'varchar',
    nullable: true,
  })
  providerRef?: string;

  /**
   * Valor de signals json mantenido por la instancia.
   */
  @Property({
    fieldName: 'signals_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  signalsJson?: unknown;

  /**
   * Identificador asociado a three ds status concept.
   */
  @Property({
    fieldName: 'three_ds_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  threeDsStatusConceptId?: string;

  /**
   * Identificador asociado a reviewed by user.
   */
  @Property({ fieldName: 'reviewed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  reviewedByUserId?: string;

  /**
   * Valor de assessed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'assessed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  assessedAt?: Date;

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
