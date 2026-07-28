import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `journey_enrollments`.
 */
@Entity({ schema: 'marketing', tableName: 'journey_enrollments' })
export class JourneyEnrollments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a journey.
   */
  @Property({ fieldName: 'journey_id', type: 'uuid' }) // FK → marketing.journeys
  journeyId!: string;

  /**
   * Identificador asociado a member type concept.
   */
  @Property({ fieldName: 'member_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberTypeConceptId!: string;

  /**
   * Identificador asociado a member ref.
   */
  @Property({ fieldName: 'member_ref_id', type: 'uuid' })
  memberRefId!: string;

  /**
   * Identificador asociado a current step.
   */
  @Property({ fieldName: 'current_step_id', type: 'uuid', nullable: true }) // FK → marketing.journey_steps
  currentStepId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de entered at mantenido por la instancia.
   */
  @Property({
    fieldName: 'entered_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  enteredAt?: Date;

  /**
   * Valor de exited at mantenido por la instancia.
   */
  @Property({
    fieldName: 'exited_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  exitedAt?: Date;

  /**
   * Identificador asociado a exit reason concept.
   */
  @Property({
    fieldName: 'exit_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  exitReasonConceptId?: string;

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
