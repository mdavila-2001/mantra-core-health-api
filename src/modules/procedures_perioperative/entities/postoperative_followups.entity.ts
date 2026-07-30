import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `postoperative_followups`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'postoperative_followups',
})
export class PostoperativeFollowups {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a procedure case.
   */
  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  /**
   * Identificador asociado a followup type concept.
   */
  @Property({ fieldName: 'followup_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  followupTypeConceptId!: string;

  /**
   * Identificador asociado a appointment.
   */
  @Property({ fieldName: 'appointment_id', type: 'uuid', nullable: true }) // FK → clinical.appointments
  appointmentId?: string;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @Property({ fieldName: 'due_at', columnType: 'timestamptz', nullable: true })
  dueAt?: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /**
   * Identificador asociado a completed by profile.
   */
  @Property({
    fieldName: 'completed_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  completedByProfileId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a wound status concept.
   */
  @Property({
    fieldName: 'wound_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  woundStatusConceptId?: string;

  /**
   * Valor de pain score mantenido por la instancia.
   */
  @Property({
    fieldName: 'pain_score',
    columnType: 'numeric(8,3)',
    nullable: true,
  })
  painScore?: string;

  /**
   * Valor de complications present mantenido por la instancia.
   */
  @Property({
    fieldName: 'complications_present',
    type: 'boolean',
    nullable: true,
  })
  complicationsPresent?: boolean;

  /**
   * Valor de instructions text mantenido por la instancia.
   */
  @Property({
    fieldName: 'instructions_text',
    columnType: 'text',
    nullable: true,
  })
  instructionsText?: string;

  /**
   * Valor de next followup at mantenido por la instancia.
   */
  @Property({
    fieldName: 'next_followup_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextFollowupAt?: Date;

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
