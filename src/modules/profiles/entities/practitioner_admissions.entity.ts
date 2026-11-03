import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `practitioner_admissions`: la
 * solicitud de admisión de un profesional (alta de doctor), fuente de verdad
 * de su verificación (v4.2.67).
 */
@Entity({ schema: 'profiles', tableName: 'practitioner_admissions' })
export class PractitionerAdmissions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Profesional que pidió la admisión.
   */
  @Property({ fieldName: 'practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId!: string;

  /**
   * Tipo de admisión (hoy ALTA_DE_DOCTOR).
   */
  @Property({ fieldName: 'admission_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  admissionTypeConceptId!: string;

  /**
   * Estado vigente en la máquina de la admisión.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Cuándo se envió (o reenvió) la solicitud.
   */
  @Property({ fieldName: 'submitted_at', columnType: 'timestamptz' })
  submittedAt!: Date;

  /**
   * Vencimiento del plazo de respuesta (SLA).
   */
  @Property({ fieldName: 'due_at', columnType: 'timestamptz' })
  dueAt!: Date;

  /**
   * Revisor que tomó la solicitud.
   */
  @Property({ fieldName: 'assigned_to_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  assignedToUserId?: string;

  /**
   * Cuándo se resolvió por última vez (verificada, rechazada, suspendida).
   */
  @Property({
    fieldName: 'decided_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decidedAt?: Date;

  /**
   * Quién resolvió.
   */
  @Property({ fieldName: 'decided_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  decidedByUserId?: string;

  /**
   * Motivo de la última resolución (obligatorio al rechazar o suspender).
   */
  @Property({
    fieldName: 'decision_reason_text',
    columnType: 'text',
    nullable: true,
  })
  decisionReasonText?: string;

  /**
   * Código estructurado del motivo de la última resolución.
   */
  @Property({
    fieldName: 'decision_reason_code_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  decisionReasonCodeConceptId?: string;

  /**
   * Nota interna del personal: NUNCA se expone al solicitante.
   */
  @Property({ fieldName: 'internal_note', columnType: 'text', nullable: true })
  internalNote?: string;

  /**
   * Qué se le pidió corregir al médico.
   */
  @Property({
    fieldName: 'info_requested_text',
    columnType: 'text',
    nullable: true,
  })
  infoRequestedText?: string;

  /**
   * Plazo del solicitante para responder a la información pedida.
   */
  @Property({
    fieldName: 'info_due_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  infoDueAt?: Date;

  /**
   * Cuántas veces reenvió la solicitud.
   */
  @Property({ fieldName: 'resubmission_count', columnType: 'int' })
  resubmissionCount: number = 0;

  /**
   * Hasta cuándo vale la verificación.
   */
  @Property({ fieldName: 'valid_until', columnType: 'date', nullable: true })
  validUntil?: Date;

  /**
   * Si se resolvió sin segunda persona estando apagado el cuatro ojos.
   */
  @Property({ fieldName: 'four_eyes_waived', type: 'boolean', nullable: true })
  fourEyesWaived?: boolean;

  /**
   * Cuándo aceptó el solicitante la declaración al enviar.
   */
  @Property({
    fieldName: 'attested_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  attestedAt?: Date;

  /**
   * Versión del texto de la declaración que aceptó.
   */
  @Property({
    fieldName: 'attestation_text_version',
    columnType: 'varchar',
    nullable: true,
  })
  attestationTextVersion?: string;

  /**
   * Cuándo se cerró definitivamente (retirada); libera el lugar de la abierta.
   */
  @Property({
    fieldName: 'closed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  closedAt?: Date;

  /**
   * Foto del formulario tal como se envió o reenvió.
   */
  @Property({
    fieldName: 'submitted_snapshot',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  submittedSnapshot?: Record<string, unknown>;

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
