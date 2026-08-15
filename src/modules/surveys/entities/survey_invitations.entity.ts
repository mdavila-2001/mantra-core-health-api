import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `survey_invitations`.
 *
 * Es el reparto del instrumento a una persona concreta por una atención
 * concreta. Existe como entidad propia —y no como un campo en la respuesta—
 * porque REDESA condiciona el derecho a responder: *«solo responden usuarios
 * con atención registrada y completada»*. La invitación **es** esa prueba: se
 * emite contra una reserva completada y no hay forma de responder sin una.
 *
 * También es lo que hace que un cuestionario sin responder sea visible para el
 * paciente. La corrección #9 del usuario —«se sigue sin poder ver
 * cuestionarios»— se contesta con esta tabla: sin ella no hay nada que listar.
 */
@Entity({ schema: 'surveys', tableName: 'survey_invitations' })
export class SurveyInvitations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a survey version.
   */
  @Property({ fieldName: 'survey_version_id', type: 'uuid' }) // FK → surveys.survey_versions
  surveyVersionId!: string;

  /**
   * Identificador asociado a survey assignment.
   */
  @Property({ fieldName: 'survey_assignment_id', type: 'uuid' }) // FK → surveys.survey_assignments
  surveyAssignmentId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Destinatario. Es la única persona que puede responder esta invitación.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * La atención completada que habilita la invitación.
   */
  @Property({ fieldName: 'appointment_booking_id', type: 'uuid' }) // FK → scheduling.appointment_bookings
  appointmentBookingId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Desde cuándo se puede responder.
   */
  @Property({ fieldName: 'issued_at', columnType: 'timestamptz' })
  issuedAt!: Date;

  /**
   * Hasta cuándo se puede responder. Derivado de `responseWindowDays` de la
   * versión en el momento de emitir, no calculado al vuelo: si alguien cambia
   * el plazo después, la ventana ya prometida al paciente no se mueve.
   */
  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;

  /**
   * Momento en que se envió la respuesta. Nulo mientras sigue pendiente.
   */
  @Property({
    fieldName: 'answered_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  answeredAt?: Date;

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
