import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `journey_steps`.
 */
@Entity({ schema: 'marketing', tableName: 'journey_steps' })
export class JourneySteps {
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
   * Valor de step code mantenido por la instancia.
   */
  @Property({ fieldName: 'step_code', columnType: 'varchar' })
  stepCode!: string;

  /**
   * Identificador asociado a step type concept.
   */
  @Property({ fieldName: 'step_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stepTypeConceptId!: string;

  /**
   * Identificador asociado a channel concept.
   */
  @Property({ fieldName: 'channel_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  channelConceptId?: string;

  /**
   * Identificador asociado a content template.
   */
  @Property({ fieldName: 'content_template_id', type: 'uuid', nullable: true }) // FK → marketing.content_templates
  contentTemplateId?: string;

  /**
   * Valor de wait duration minutes mantenido por la instancia.
   */
  @Property({
    fieldName: 'wait_duration_minutes',
    columnType: 'int',
    nullable: true,
  })
  waitDurationMinutes?: number;

  /**
   * Valor de condition json mantenido por la instancia.
   */
  @Property({
    fieldName: 'condition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conditionJson?: unknown;

  /**
   * Identificador asociado a next step.
   */
  @Property({ fieldName: 'next_step_id', type: 'uuid', nullable: true }) // FK → marketing.journey_steps
  nextStepId?: string;

  /**
   * Identificador asociado a branch step.
   */
  @Property({ fieldName: 'branch_step_id', type: 'uuid', nullable: true }) // FK → marketing.journey_steps
  branchStepId?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
