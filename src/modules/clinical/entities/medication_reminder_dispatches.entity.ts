import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea `clinical.medication_reminder_dispatches` (patch v4.2.35): una fila por
 * (receta, toma) ya avisada.
 *
 * El UNIQUE `(medication_request_id, dose_at)` es lo que deduplica el
 * recordatorio: el despacho la reclama con `INSERT … ON CONFLICT DO NOTHING
 * RETURNING` y sólo avisa quien la insertó (ver
 * `MedicationReminderDispatchesRepository.claim`).
 */
@Entity({ schema: 'clinical', tableName: 'medication_reminder_dispatches' })
export class MedicationReminderDispatches {
  /** Identificador único de la instancia. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Receta cuya toma se avisó. */
  @Property({ fieldName: 'medication_request_id', type: 'uuid' }) // FK → clinical.medication_requests
  medicationRequestId!: string;

  /** Instante de la toma (UTC). */
  @Property({ fieldName: 'dose_at', columnType: 'timestamptz' })
  doseAt!: Date;

  /** Solicitud in-app que se creó, si se llegó a emitir. */
  @Property({
    fieldName: 'notification_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → messaging.notification_requests
  notificationRequestId?: string;

  /** Cuándo se reclamó la toma. */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
