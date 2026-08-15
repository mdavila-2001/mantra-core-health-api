import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `survey_responses`.
 *
 * La cabecera de lo que un paciente contestó. **No tiene ninguna columna de
 * visibilidad pública, y eso es deliberado**: la decisión D-08 del proyecto
 * establece que las respuestas individuales nunca son publicables, y la
 * calificación pública es otra entidad (`community.service_reviews`). Al no
 * existir el campo, no hay forma de que una respuesta termine expuesta por un
 * descuido de código.
 */
@Entity({ schema: 'surveys', tableName: 'survey_responses' })
export class SurveyResponses {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a survey invitation.
   */
  @Property({ fieldName: 'survey_invitation_id', type: 'uuid' }) // FK → surveys.survey_invitations
  surveyInvitationId!: string;

  /**
   * Identificador asociado a survey version.
   */
  @Property({ fieldName: 'survey_version_id', type: 'uuid' }) // FK → surveys.survey_versions
  surveyVersionId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Quién respondió. Redundante con la invitación a propósito: las lecturas del
   * profesional filtran por paciente sin tener que unir la invitación.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Momento del envío.
   */
  @Property({ fieldName: 'submitted_at', columnType: 'timestamptz' })
  submittedAt!: Date;

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
