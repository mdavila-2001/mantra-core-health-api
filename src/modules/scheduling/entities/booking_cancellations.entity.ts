import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `booking_cancellations`.
 */
@Entity({ schema: 'scheduling', tableName: 'booking_cancellations' })
export class BookingCancellations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a booking.
   */
  @Property({ fieldName: 'booking_id', type: 'uuid' }) // FK → scheduling.appointment_bookings
  bookingId!: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reasonConceptId!: string;

  /**
   * Identificador asociado a cancelled by user.
   */
  @Property({ fieldName: 'cancelled_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  cancelledByUserId?: string;

  /**
   * Valor de is no show mantenido por la instancia.
   */
  @Property({ fieldName: 'is_no_show', type: 'boolean', nullable: true })
  isNoShow?: boolean;

  /**
   * Valor de fee amount mantenido por la instancia.
   */
  @Property({ fieldName: 'fee_amount', columnType: 'numeric', nullable: true })
  feeAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a fee payment intent.
   */
  @Property({
    fieldName: 'fee_payment_intent_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_intents
  feePaymentIntentId?: string;

  /**
   * Valor de cancelled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'cancelled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancelledAt?: Date;

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
