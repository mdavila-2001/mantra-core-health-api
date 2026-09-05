import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * El estado de pago de una cita — TAREA-13, punto 5.
 *
 * **Una fila por reserva, y sólo si alguien la marcó.** Que no haya fila no es
 * un dato faltante: significa que todavía nadie dijo nada del pago. Por eso
 * `markedByUserId` y `markedAt` son obligatorios y no hay backfill — una fila
 * que nadie firmó sería una afirmación inventada sobre el dinero de alguien.
 *
 * El único `ux_appointment_payment_states_booking` es el que hace cierto el
 * «una por reserva»: sin él, dos peticiones concurrentes dejarían la misma cita
 * en dos estados a la vez y sin forma de decir cuál vale.
 *
 * El rastro de los cambios **no vive acá**. Cada marca agrega una revisión a
 * `audit.appointment_bookings_history`, que ya existía y que este módulo ya
 * escribe: dos líneas de tiempo para la misma cita serían dos verdades.
 */
@Entity({ schema: 'scheduling', tableName: 'appointment_payment_states' })
export class AppointmentPaymentStates {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a appointment booking.
   */
  @Property({ fieldName: 'appointment_booking_id', type: 'uuid' }) // FK → scheduling.appointment_bookings
  appointmentBookingId!: string;

  /**
   * El estado: pendiente de pago, parcialmente pagada o pagada.
   *
   * Es una lista cerrada, así que es un concepto de terminología y jamás un
   * enum de TypeScript.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Si se usó un seguro.
   *
   * Va **separado** del estado por decisión del propietario: una cita puede
   * estar parcialmente pagada con seguro o sin él, y meter el seguro dentro
   * del estado daría seis valores para responder dos preguntas distintas.
   * Booleano y no concepto porque no es un estado cerrado: es un sí o un no.
   */
  @Property({ fieldName: 'insurance_used', type: 'boolean' })
  insuranceUsed!: boolean;

  /**
   * Quién dejó la cita en este estado.
   */
  @Property({ fieldName: 'marked_by_user_id', type: 'uuid' }) // FK → iam.users
  markedByUserId!: string;

  /**
   * Cuándo. Junto con `markedByUserId` es el «quién y cuándo» de AC-13-10.
   */
  @Property({ fieldName: 'marked_at', columnType: 'timestamptz' })
  markedAt!: Date;

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
