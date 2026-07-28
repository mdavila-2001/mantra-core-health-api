import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `fx_rate_locks`.
 */
@Entity({ schema: 'payments', tableName: 'fx_rate_locks' })
export class FxRateLocks {
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
   * Identificador asociado a from currency concept.
   */
  @Property({ fieldName: 'from_currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  fromCurrencyConceptId!: string;

  /**
   * Identificador asociado a to currency concept.
   */
  @Property({ fieldName: 'to_currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toCurrencyConceptId!: string;

  /**
   * Valor de locked rate mantenido por la instancia.
   */
  @Property({ fieldName: 'locked_rate', columnType: 'numeric' })
  lockedRate!: string;

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
   * Valor de locked at mantenido por la instancia.
   */
  @Property({
    fieldName: 'locked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lockedAt?: Date;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

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
