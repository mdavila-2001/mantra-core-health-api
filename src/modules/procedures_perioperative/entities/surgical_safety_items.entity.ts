import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `surgical_safety_items`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'surgical_safety_items',
})
export class SurgicalSafetyItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a checklist type concept.
   */
  @Property({ fieldName: 'checklist_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  checklistTypeConceptId!: string;

  /**
   * Valor de checklist version mantenido por la instancia.
   */
  @Property({ fieldName: 'checklist_version', columnType: 'varchar' })
  checklistVersion!: string;

  /**
   * Identificador asociado a phase concept.
   */
  @Property({ fieldName: 'phase_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  phaseConceptId!: string;

  /**
   * Valor de item code mantenido por la instancia.
   */
  @Property({ fieldName: 'item_code', columnType: 'varchar' })
  itemCode!: string;

  /**
   * Valor de prompt text mantenido por la instancia.
   */
  @Property({ fieldName: 'prompt_text', columnType: 'text' })
  promptText!: string;

  /**
   * Identificador asociado a response type concept.
   */
  @Property({ fieldName: 'response_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  responseTypeConceptId!: string;

  /**
   * Valor de display order mantenido por la instancia.
   */
  @Property({ fieldName: 'display_order', columnType: 'int' })
  displayOrder!: number;

  /**
   * Valor de is mandatory mantenido por la instancia.
   */
  @Property({ fieldName: 'is_mandatory', type: 'boolean' })
  isMandatory!: boolean;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
