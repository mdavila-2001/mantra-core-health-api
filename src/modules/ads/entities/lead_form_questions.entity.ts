import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lead_form_questions`.
 */
@Entity({ schema: 'ads', tableName: 'lead_form_questions' })
export class LeadFormQuestions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a lead form.
   */
  @Property({ fieldName: 'lead_form_id', type: 'uuid' }) // FK → ads.lead_forms
  leadFormId!: string;

  /**
   * Valor de question key mantenido por la instancia.
   */
  @Property({ fieldName: 'question_key', columnType: 'varchar' })
  questionKey!: string;

  /**
   * Identificador asociado a question type concept.
   */
  @Property({ fieldName: 'question_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  questionTypeConceptId!: string;

  /**
   * Valor de label mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  label!: string;

  /**
   * Valor de options json mantenido por la instancia.
   */
  @Property({
    fieldName: 'options_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  optionsJson?: unknown;

  /**
   * Valor de display order mantenido por la instancia.
   */
  @Property({ fieldName: 'display_order', columnType: 'int' })
  displayOrder!: number;

  /**
   * Valor de is required mantenido por la instancia.
   */
  @Property({ fieldName: 'is_required', type: 'boolean' })
  isRequired!: boolean;

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
