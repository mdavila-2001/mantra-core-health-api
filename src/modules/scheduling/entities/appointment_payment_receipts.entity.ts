import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `appointment_payment_receipts`.
 */
@Entity({ schema: 'scheduling', tableName: 'appointment_payment_receipts' })
export class AppointmentPaymentReceipts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Identificador asociado a appointment booking.
   */
  @Property({ fieldName: 'appointment_booking_id', type: 'uuid' }) // FK → scheduling.appointment_bookings (inferida)
  appointmentBookingId!: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid' }) // FK → common.files (inferida)
  fileId!: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @Property({ columnType: 'numeric(12,2)', nullable: true })
  amount?: string;

  /**
   * Valor de paid at mantenido por la instancia.
   */
  @Property({ fieldName: 'paid_at', columnType: 'timestamptz', nullable: true })
  paidAt?: Date;

  /**
   * Valor de note mantenido por la instancia.
   */
  @Property({ columnType: 'varchar(500)', nullable: true })
  note?: string;

  /**
   * Identificador asociado a uploaded by user.
   */
  @Property({ fieldName: 'uploaded_by_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  uploadedByUserId!: string;

  /**
   * Valor de uploaded at mantenido por la instancia.
   */
  @Property({ fieldName: 'uploaded_at', columnType: 'timestamptz' })
  uploadedAt!: Date;

  /**
   * Identificador asociado a review status concept.
   */
  @Property({ fieldName: 'review_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  reviewStatusConceptId!: string;

  /**
   * Identificador asociado a reviewed by user.
   */
  @Property({ fieldName: 'reviewed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  reviewedByUserId?: string;

  /**
   * Valor de reviewed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'reviewed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  reviewedAt?: Date;

  /**
   * Valor de rejection reason mantenido por la instancia.
   */
  @Property({
    fieldName: 'rejection_reason',
    columnType: 'varchar(500)',
    nullable: true,
  })
  rejectionReason?: string;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
